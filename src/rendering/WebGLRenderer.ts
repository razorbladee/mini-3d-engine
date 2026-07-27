import { Camera } from '../cameras/Camera';
import { Scene } from '../core/Scene';
import type { BufferGeometry } from '../geometry/BufferGeometry';
import { AmbientLight, DirectionalLight, HemisphereLight, PointLight, SpotLight } from '../lights/Light';
import { StandardMaterial } from '../materials/StandardMaterial';
import { parseHexColor } from '../math/Color';
import { Mesh } from '../objects/Mesh';
import { createProgram, MAX_LIGHTS, PROGRAM_SOURCES, type ProgramState } from './programs';
import type { Renderer } from './Renderer';
import { ResourceCache } from './ResourceCache';
import type { Texture2D } from './Texture2D';

type DirectionalEntry = { color: number[]; direction: number[]; intensity: number };
type PointEntry = { color: number[]; position: number[]; intensity: number; distance: number };
type SpotEntry = PointEntry & { direction: number[]; cosAngle: number; penumbra: number };
type LightState = { ambient: number[]; directional: DirectionalEntry[]; point: PointEntry[]; spot: SpotEntry[] };

/** Reusable per-frame scratch, so a steady-state frame allocates nothing. */
const normalMatrixScratch = new Float32Array(9);
const cameraPositionScratch = new Float32Array(3);

function writeNormalMatrix(elements: Float32Array, out: Float32Array) {
  const a = elements[0];
  const b = elements[1];
  const c = elements[2];
  const d = elements[4];
  const e = elements[5];
  const f = elements[6];
  const g = elements[8];
  const h = elements[9];
  const i = elements[10];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

  if (Math.abs(det) < 1e-8) {
    out.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    return out;
  }
  // Inverse transpose, so non-uniform scale does not skew lighting normals.
  out[0] = (e * i - f * h) / det;
  out[1] = (c * h - b * i) / det;
  out[2] = (b * f - c * e) / det;
  out[3] = (f * g - d * i) / det;
  out[4] = (a * i - c * g) / det;
  out[5] = (d * c - a * f) / det;
  out[6] = (d * h - e * g) / det;
  out[7] = (b * g - a * h) / det;
  out[8] = (a * e - b * d) / det;
  return out;
}

export class WebGLRenderer implements Renderer {
  readonly gl: WebGL2RenderingContext;
  private readonly resources: ResourceCache;
  private readonly basic: ProgramState;
  private readonly lit: ProgramState;
  private disposed = false;

  /** Reused across frames to keep the draw loop allocation-free. */
  private readonly drawList: { mesh: Mesh; depth: number; transparent: boolean }[] = [];
  private readonly lights: LightState = { ambient: [0, 0, 0], directional: [], point: [], spot: [] };
  private readonly directionalColor = new Float32Array(MAX_LIGHTS * 3);
  private readonly directionalDirection = new Float32Array(MAX_LIGHTS * 3);
  private readonly directionalIntensity = new Float32Array(MAX_LIGHTS);
  private readonly pointColor = new Float32Array(MAX_LIGHTS * 3);
  private readonly pointPosition = new Float32Array(MAX_LIGHTS * 3);
  private readonly pointIntensity = new Float32Array(MAX_LIGHTS);
  private readonly pointDistance = new Float32Array(MAX_LIGHTS);
  private readonly spotColor = new Float32Array(MAX_LIGHTS * 3);
  private readonly spotPosition = new Float32Array(MAX_LIGHTS * 3);
  private readonly spotDirection = new Float32Array(MAX_LIGHTS * 3);
  private readonly spotIntensity = new Float32Array(MAX_LIGHTS);
  private readonly spotDistance = new Float32Array(MAX_LIGHTS);
  private readonly spotCosAngle = new Float32Array(MAX_LIGHTS);
  private readonly spotPenumbra = new Float32Array(MAX_LIGHTS);

  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('Mini3DEngine requires WebGL2');
    this.gl = gl;
    this.resources = new ResourceCache(gl);

    const basic = createProgram(gl, PROGRAM_SOURCES.basic.vertex, PROGRAM_SOURCES.basic.fragment, false);
    const lit = createProgram(gl, PROGRAM_SOURCES.lit.vertex, PROGRAM_SOURCES.lit.fragment, true);
    this.basic = { ...basic, program: this.resources.program(basic.program) };
    this.lit = { ...lit, program: this.resources.program(lit.program) };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.clearDepth(1);
  }

  setSize(width: number, height: number, dpr = globalThis.devicePixelRatio || 1) {
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    // jsdom canvases have no style object; guard so tests can drive resizing.
    if (this.canvas.style) {
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private collectLights(scene: Scene) {
    const state = this.lights;
    state.ambient[0] = 0;
    state.ambient[1] = 0;
    state.ambient[2] = 0;
    state.directional.length = 0;
    state.point.length = 0;
    state.spot.length = 0;

    scene.traverse((node) => {
      if (node instanceof AmbientLight) {
        // Colours are parsed once and cached on the light rather than re-parsed
        // from a hex string for every light on every frame (AUDIT-TZ P2-5).
        const color = parseHexColor(node.color);
        state.ambient[0] += color[0] * node.intensity;
        state.ambient[1] += color[1] * node.intensity;
        state.ambient[2] += color[2] * node.intensity;
      } else if (node instanceof HemisphereLight) {
        const sky = parseHexColor(node.color);
        const ground = parseHexColor(node.groundColor);
        state.ambient[0] += (sky[0] + ground[0]) * 0.5 * node.intensity;
        state.ambient[1] += (sky[1] + ground[1]) * 0.5 * node.intensity;
        state.ambient[2] += (sky[2] + ground[2]) * 0.5 * node.intensity;
      } else if (node instanceof SpotLight) {
        // A real cone, positioned in the world. Spot lights used to be pushed
        // into the directional list, discarding position, angle, penumbra and
        // distance entirely (AUDIT-TZ P2-4).
        if (state.spot.length >= MAX_LIGHTS) return;
        const color = parseHexColor(node.color);
        const e = node.worldMatrix.elements;
        state.spot.push({
          color: [color[0], color[1], color[2]],
          position: [e[12], e[13], e[14]],
          direction: [node.direction.x, node.direction.y, node.direction.z],
          intensity: node.intensity,
          distance: node.distance,
          cosAngle: Math.cos(node.angle),
          penumbra: node.penumbra,
        });
      } else if (node instanceof DirectionalLight) {
        if (state.directional.length >= MAX_LIGHTS) return;
        const color = parseHexColor(node.color);
        state.directional.push({
          color: [color[0], color[1], color[2]],
          direction: [node.direction.x, node.direction.y, node.direction.z],
          intensity: node.intensity,
        });
      } else if (node instanceof PointLight) {
        if (state.point.length >= MAX_LIGHTS) return;
        const color = parseHexColor(node.color);
        const e = node.worldMatrix.elements;
        state.point.push({
          color: [color[0], color[1], color[2]],
          position: [e[12], e[13], e[14]],
          intensity: node.intensity,
          distance: node.distance,
        });
      }
    });
    return state;
  }

  private uploadLights(state: ProgramState, camera: Camera) {
    const gl = this.gl;
    const uniforms = state.litUniforms;
    if (!uniforms) return;

    const world = camera.worldMatrix.elements;
    cameraPositionScratch[0] = world[12];
    cameraPositionScratch[1] = world[13];
    cameraPositionScratch[2] = world[14];
    gl.uniform3fv(uniforms.cameraPosition, cameraPositionScratch);
    gl.uniform3fv(uniforms.ambientColor, this.lights.ambient);

    const { directional, point } = this.lights;
    for (let i = 0; i < directional.length; i += 1) {
      this.directionalColor.set(directional[i].color, i * 3);
      this.directionalDirection.set(directional[i].direction, i * 3);
      this.directionalIntensity[i] = directional[i].intensity;
    }
    gl.uniform1i(uniforms.directionalCount, directional.length);
    gl.uniform3fv(uniforms.directionalColor, this.directionalColor);
    gl.uniform3fv(uniforms.directionalDirection, this.directionalDirection);
    gl.uniform1fv(uniforms.directionalIntensity, this.directionalIntensity);

    for (let i = 0; i < point.length; i += 1) {
      this.pointColor.set(point[i].color, i * 3);
      this.pointPosition.set(point[i].position, i * 3);
      this.pointIntensity[i] = point[i].intensity;
      this.pointDistance[i] = point[i].distance;
    }
    gl.uniform1i(uniforms.pointCount, point.length);
    gl.uniform3fv(uniforms.pointColor, this.pointColor);
    gl.uniform3fv(uniforms.pointPosition, this.pointPosition);
    gl.uniform1fv(uniforms.pointIntensity, this.pointIntensity);
    gl.uniform1fv(uniforms.pointDistance, this.pointDistance);

    const { spot } = this.lights;
    for (let i = 0; i < spot.length; i += 1) {
      this.spotColor.set(spot[i].color, i * 3);
      this.spotPosition.set(spot[i].position, i * 3);
      this.spotDirection.set(spot[i].direction, i * 3);
      this.spotIntensity[i] = spot[i].intensity;
      this.spotDistance[i] = spot[i].distance;
      this.spotCosAngle[i] = spot[i].cosAngle;
      this.spotPenumbra[i] = spot[i].penumbra;
    }
    gl.uniform1i(uniforms.spotCount, spot.length);
    gl.uniform3fv(uniforms.spotColor, this.spotColor);
    gl.uniform3fv(uniforms.spotPosition, this.spotPosition);
    gl.uniform3fv(uniforms.spotDirection, this.spotDirection);
    gl.uniform1fv(uniforms.spotIntensity, this.spotIntensity);
    gl.uniform1fv(uniforms.spotDistance, this.spotDistance);
    gl.uniform1fv(uniforms.spotCosAngle, this.spotCosAngle);
    gl.uniform1fv(uniforms.spotPenumbra, this.spotPenumbra);
  }

  render(scene: Scene, camera: Camera) {
    if (this.disposed) throw new Error('WebGLRenderer has been disposed');
    const gl = this.gl;

    gl.clearColor(0.06, 0.08, 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    scene.updateWorldMatrix();
    camera.updateViewMatrix();
    this.collectLights(scene);

    // Depth along the camera forward axis. The previous code differenced world
    // Z, which is only meaningful while the camera looks down -Z; once orbited,
    // transparent ordering became arbitrary (AUDIT-TZ P2-6).
    const view = camera.viewMatrix.elements;
    this.drawList.length = 0;
    scene.traverse((node) => {
      if (!(node instanceof Mesh) || !node.visible) return;
      const world = node.worldMatrix.elements;
      const x = world[12];
      const y = world[13];
      const z = world[14];
      const viewZ = view[2] * x + view[6] * y + view[10] * z + view[14];
      this.drawList.push({ mesh: node, depth: viewZ, transparent: node.material.transparent });
    });

    this.drawList.sort((a, b) => {
      if (a.transparent !== b.transparent) return a.transparent ? 1 : -1;
      // Opaque front-to-back to exploit early-Z, transparent back-to-front.
      return a.transparent ? a.depth - b.depth : b.depth - a.depth;
    });

    for (const { mesh } of this.drawList) {
      const state = mesh.material instanceof StandardMaterial ? this.lit : this.basic;
      const { uniforms, attributes } = state;
      gl.useProgram(state.program);

      gl.uniformMatrix4fv(uniforms.view, false, camera.viewMatrix.elements);
      gl.uniformMatrix4fv(uniforms.projection, false, camera.projectionMatrix);
      gl.uniformMatrix4fv(uniforms.model, false, mesh.worldMatrix.elements);
      gl.uniformMatrix3fv(
        uniforms.normalMatrix,
        false,
        writeNormalMatrix(mesh.worldMatrix.elements, normalMatrixScratch),
      );
      gl.uniform4fv(uniforms.color, mesh.material.color);

      const texture = mesh.material.map ? this.resources.texture(mesh.material.map) : null;
      gl.uniform1i(uniforms.hasMap, texture ? 1 : 0);
      if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.map, 0);
      }

      if (state === this.lit) {
        this.uploadLights(state, camera);
        const material = mesh.material as StandardMaterial;
        gl.uniform1f(state.litUniforms!.roughness, material.roughness);
        gl.uniform1f(state.litUniforms!.metalness, material.metalness);
      }

      const buffers = this.resources.geometry(mesh.geometry);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(attributes.position);
      gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.enableVertexAttribArray(attributes.normal);
      gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
      gl.enableVertexAttribArray(attributes.uv);
      gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 0, 0);

      if (mesh.material.doubleSided) gl.disable(gl.CULL_FACE);
      else gl.enable(gl.CULL_FACE);

      if (mesh.material.transparent) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      } else {
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }

      if (mesh.material.wireframe) {
        // WebGL has no polygon mode. Drawing each triangle as a line loop keeps
        // BasicMaterial.wireframe useful without duplicating edge geometry.
        for (let offset = 0; offset < buffers.vertexCount; offset += 3) gl.drawArrays(gl.LINE_LOOP, offset, 3);
      } else gl.drawArrays(gl.TRIANGLES, 0, buffers.vertexCount);
    }

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /** GPU cache diagnostics used by profiling tools and the examples browser. */
  get resourceStats() {
    return this.resources.stats;
  }

  releaseGeometry(geometry: BufferGeometry) {
    this.resources.releaseGeometry(geometry);
  }

  releaseTexture(texture: Texture2D) {
    this.resources.releaseTexture(texture);
  }

  dispose() {
    if (this.disposed) return;
    this.resources.dispose();
    this.disposed = true;
  }
}
