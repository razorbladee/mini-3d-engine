import { Camera } from '../cameras/Camera';
import { Scene } from '../core/Scene';
import { Node } from '../core/Node';
import { Mesh } from '../objects/Mesh';
import { AmbientLight, DirectionalLight, PointLight } from '../lights/Light';
import { StandardMaterial } from '../materials/StandardMaterial';

const vertexSource = `#version 300 es
in vec3 position;
in vec3 normal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vWorldPosition;
out vec3 vWorldNormal;
void main(){vec4 worldPosition=uModel*vec4(position,1.0);vWorldPosition=worldPosition.xyz;vWorldNormal=normalize(mat3(uModel)*normal);gl_Position=uProjection*uView*worldPosition;}`;
const basicFragmentSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main(){outColor=uColor;}`;
const litFragmentSource = `#version 300 es
precision highp float;
#define MAX_LIGHTS 4
uniform vec4 uColor; uniform float uRoughness; uniform float uMetalness; uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor; uniform float uAmbientIntensity;
uniform int uDirectionalCount; uniform vec3 uDirectionalColor[MAX_LIGHTS]; uniform vec3 uDirectionalDirection[MAX_LIGHTS]; uniform float uDirectionalIntensity[MAX_LIGHTS];
uniform int uPointCount; uniform vec3 uPointColor[MAX_LIGHTS]; uniform vec3 uPointPosition[MAX_LIGHTS]; uniform float uPointIntensity[MAX_LIGHTS]; uniform float uPointDistance[MAX_LIGHTS];
in vec3 vWorldPosition; in vec3 vWorldNormal; out vec4 outColor;
void main(){
  vec3 n=normalize(vWorldNormal); vec3 v=normalize(uCameraPosition-vWorldPosition); vec3 base=uColor.rgb;
  vec3 lighting=uAmbientColor*uAmbientIntensity; float shininess=mix(8.0,96.0,1.0-uRoughness);
  for(int i=0;i<MAX_LIGHTS;i++){if(i>=uDirectionalCount) break; vec3 l=normalize(-uDirectionalDirection[i]); float d=max(dot(n,l),0.0); vec3 h=normalize(l+v); float s=pow(max(dot(n,h),0.0),shininess)*(1.0-uRoughness)*mix(0.04,1.0,uMetalness); lighting+=(d*base+s)*uDirectionalColor[i]*uDirectionalIntensity[i];}
  for(int i=0;i<MAX_LIGHTS;i++){if(i>=uPointCount) break; vec3 toLight=uPointPosition[i]-vWorldPosition; float distanceToLight=length(toLight); vec3 l=toLight/max(distanceToLight,0.0001); float attenuation=uPointDistance[i]>0.0?max(1.0-distanceToLight/uPointDistance[i],0.0):1.0/(1.0+0.08*distanceToLight*distanceToLight); float d=max(dot(n,l),0.0); vec3 h=normalize(l+v); float s=pow(max(dot(n,h),0.0),shininess)*(1.0-uRoughness)*mix(0.04,1.0,uMetalness); lighting+=(d*base+s)*uPointColor[i]*uPointIntensity[i]*attenuation;}
  outColor=vec4(clamp(base*lighting,0.0,1.0),uColor.a);
}`;

type ProgramState = { program: WebGLProgram; positionLocation: number; normalLocation: number; modelLocation: WebGLUniformLocation; viewLocation: WebGLUniformLocation; projectionLocation: WebGLUniformLocation; colorLocation: WebGLUniformLocation; roughnessLocation?: WebGLUniformLocation | null; metalnessLocation?: WebGLUniformLocation | null; cameraPositionLocation?: WebGLUniformLocation | null; ambientColorLocation?: WebGLUniformLocation | null; ambientIntensityLocation?: WebGLUniformLocation | null; directionalCountLocation?: WebGLUniformLocation | null; directionalColorLocation?: WebGLUniformLocation | null; directionalDirectionLocation?: WebGLUniformLocation | null; directionalIntensityLocation?: WebGLUniformLocation | null; pointCountLocation?: WebGLUniformLocation | null; pointColorLocation?: WebGLUniformLocation | null; pointPositionLocation?: WebGLUniformLocation | null; pointIntensityLocation?: WebGLUniformLocation | null; pointDistanceLocation?: WebGLUniformLocation | null };
type LightState = { ambient: number[]; directional: { color: number[]; direction: number[]; intensity: number }[]; point: { color: number[]; position: number[]; intensity: number; distance: number }[] };

export class WebGLRenderer {
  readonly gl: WebGL2RenderingContext;
  private basic: ProgramState;
  private lit: ProgramState;
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('Mini3DEngine requires WebGL2');
    this.gl = gl;
    this.basic = this.createProgram(vertexSource, basicFragmentSource, false);
    this.lit = this.createProgram(vertexSource, litFragmentSource, true);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.CULL_FACE); gl.frontFace(gl.CCW);
  }
  private createProgram(vs: string, fs: string, lit: boolean) {
    const gl = this.gl;
    const compile = (type: number, source: string) => { const shader = gl.createShader(type); if (!shader) throw new Error('Unable to create WebGL shader'); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed'; gl.deleteShader(shader); throw new Error(message); } return shader; };
    const vertexShader = compile(gl.VERTEX_SHADER, vs); const fragmentShader = compile(gl.FRAGMENT_SHADER, fs); const program = gl.createProgram();
    if (!program) throw new Error('Unable to create WebGL program'); gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader); gl.linkProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    const state: ProgramState = { program, positionLocation: gl.getAttribLocation(program, 'position'), normalLocation: gl.getAttribLocation(program, 'normal'), modelLocation: gl.getUniformLocation(program, 'uModel')!, viewLocation: gl.getUniformLocation(program, 'uView')!, projectionLocation: gl.getUniformLocation(program, 'uProjection')!, colorLocation: gl.getUniformLocation(program, 'uColor')! };
    if (lit) { state.roughnessLocation = gl.getUniformLocation(program, 'uRoughness'); state.metalnessLocation = gl.getUniformLocation(program, 'uMetalness'); state.cameraPositionLocation = gl.getUniformLocation(program, 'uCameraPosition'); state.ambientColorLocation = gl.getUniformLocation(program, 'uAmbientColor'); state.ambientIntensityLocation = gl.getUniformLocation(program, 'uAmbientIntensity'); state.directionalCountLocation = gl.getUniformLocation(program, 'uDirectionalCount'); state.directionalColorLocation = gl.getUniformLocation(program, 'uDirectionalColor[0]'); state.directionalDirectionLocation = gl.getUniformLocation(program, 'uDirectionalDirection[0]'); state.directionalIntensityLocation = gl.getUniformLocation(program, 'uDirectionalIntensity[0]'); state.pointCountLocation = gl.getUniformLocation(program, 'uPointCount'); state.pointColorLocation = gl.getUniformLocation(program, 'uPointColor[0]'); state.pointPositionLocation = gl.getUniformLocation(program, 'uPointPosition[0]'); state.pointIntensityLocation = gl.getUniformLocation(program, 'uPointIntensity[0]'); state.pointDistanceLocation = gl.getUniformLocation(program, 'uPointDistance[0]'); }
    return state;
  }
  private color(value: string) { const hex = value.replace('#', ''); const number = parseInt(hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex, 16); return [(number >> 16 & 255) / 255, (number >> 8 & 255) / 255, (number & 255) / 255]; }
  private collectLights(scene: Scene): LightState { const ambient = [0, 0, 0]; const directional: LightState['directional'] = []; const point: LightState['point'] = []; scene.traverse((node: Node) => { if (node instanceof AmbientLight) { const color = this.color(node.color); ambient[0] += color[0] * node.intensity; ambient[1] += color[1] * node.intensity; ambient[2] += color[2] * node.intensity; } else if (node instanceof DirectionalLight && directional.length < 4) directional.push({ color: this.color(node.color), direction: [node.direction.x, node.direction.y, node.direction.z], intensity: node.intensity }); else if (node instanceof PointLight && point.length < 4) { const world = node.worldMatrix.elements; point.push({ color: this.color(node.color), position: [world[12], world[13], world[14]], intensity: node.intensity, distance: node.distance }); } }); return { ambient, directional, point }; }
  private setCommonUniforms(state: ProgramState, camera: Camera) { const gl = this.gl; gl.uniformMatrix4fv(state.viewLocation, false, camera.viewMatrix.elements); gl.uniformMatrix4fv(state.projectionLocation, false, camera.projectionMatrix); }
  private setLights(state: ProgramState, camera: Camera, lights: LightState) { const gl = this.gl; const cameraWorld = camera.worldMatrix.elements; gl.uniform3fv(state.cameraPositionLocation!, cameraWorld.slice(12, 15)); gl.uniform3fv(state.ambientColorLocation!, lights.ambient); gl.uniform1f(state.ambientIntensityLocation!, 1); gl.uniform1i(state.directionalCountLocation!, lights.directional.length); gl.uniform3fv(state.directionalColorLocation!, lights.directional.flatMap((light) => light.color)); gl.uniform3fv(state.directionalDirectionLocation!, lights.directional.flatMap((light) => light.direction)); gl.uniform1fv(state.directionalIntensityLocation!, lights.directional.map((light) => light.intensity)); gl.uniform1i(state.pointCountLocation!, lights.point.length); gl.uniform3fv(state.pointColorLocation!, lights.point.flatMap((light) => light.color)); gl.uniform3fv(state.pointPositionLocation!, lights.point.flatMap((light) => light.position)); gl.uniform1fv(state.pointIntensityLocation!, lights.point.map((light) => light.intensity)); gl.uniform1fv(state.pointDistanceLocation!, lights.point.map((light) => light.distance)); }
  setSize(width: number, height: number, dpr = globalThis.devicePixelRatio || 1) { this.canvas.width = Math.max(1, Math.floor(width * dpr)); this.canvas.height = Math.max(1, Math.floor(height * dpr)); this.canvas.style.width = `${width}px`; this.canvas.style.height = `${height}px`; this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); }
  render(scene: Scene, camera: Camera) { const gl = this.gl; gl.clearColor(0.06, 0.08, 0.13, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); scene.updateWorldMatrix(); camera.updateViewMatrix(); const lights = this.collectLights(scene); scene.traverse((node) => { if (!(node instanceof Mesh) || !node.visible) return; const state = node.material instanceof StandardMaterial ? this.lit : this.basic; gl.useProgram(state.program); this.setCommonUniforms(state, camera); gl.uniformMatrix4fv(state.modelLocation, false, node.worldMatrix.elements); gl.uniform4fv(state.colorLocation, node.material.color); if (state === this.lit) { this.setLights(state, camera, lights); const litMaterial = node.material as StandardMaterial; gl.uniform1f(state.roughnessLocation!, litMaterial.roughness); gl.uniform1f(state.metalnessLocation!, litMaterial.metalness); } const positionBuffer = node.geometry.gpuBuffer || gl.createBuffer(); const normalBuffer = node.geometry.normalBuffer || gl.createBuffer(); if (!positionBuffer || !normalBuffer) throw new Error('Unable to create geometry buffers'); node.geometry.gpuBuffer = positionBuffer; node.geometry.normalBuffer = normalBuffer; gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); gl.bufferData(gl.ARRAY_BUFFER, node.geometry.positions, gl.STATIC_DRAW); gl.enableVertexAttribArray(state.positionLocation); gl.vertexAttribPointer(state.positionLocation, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer); gl.bufferData(gl.ARRAY_BUFFER, node.geometry.normals, gl.STATIC_DRAW); gl.enableVertexAttribArray(state.normalLocation); gl.vertexAttribPointer(state.normalLocation, 3, gl.FLOAT, false, 0, 0); if (node.material.doubleSided) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE); gl.drawArrays(gl.TRIANGLES, 0, node.geometry.positions.length / 3); }); }
  dispose() { this.gl.deleteProgram(this.basic.program); this.gl.deleteProgram(this.lit.program); this.gl.getExtension('WEBGL_lose_context')?.loseContext(); }
}
