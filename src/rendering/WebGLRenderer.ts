import { Camera } from '../cameras/Camera';
import { Scene } from '../core/Scene';
import { Mesh } from '../objects/Mesh';

const vertexSource = `#version 300 es
in vec3 position;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
void main(){gl_Position=uProjection*uView*uModel*vec4(position,1.0);}`;
const fragmentSource = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main(){outColor=uColor;}`;

export class WebGLRenderer {
  readonly gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionLocation: number;
  private modelLocation: WebGLUniformLocation;
  private viewLocation: WebGLUniformLocation;
  private projectionLocation: WebGLUniformLocation;
  private colorLocation: WebGLUniformLocation;

  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('Mini3DEngine requires WebGL2');
    this.gl = gl;
    this.program = this.createProgram(vertexSource, fragmentSource);
    this.positionLocation = gl.getAttribLocation(this.program, 'position');
    this.modelLocation = gl.getUniformLocation(this.program, 'uModel')!;
    this.viewLocation = gl.getUniformLocation(this.program, 'uView')!;
    this.projectionLocation = gl.getUniformLocation(this.program, 'uProjection')!;
    this.colorLocation = gl.getUniformLocation(this.program, 'uColor')!;
    gl.enable(gl.DEPTH_TEST);
  }

  private createProgram(vertexSourceCode: string, fragmentSourceCode: string) {
    const gl = this.gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to create WebGL shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSourceCode);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSourceCode);
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create WebGL program');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    return program;
  }

  setSize(width: number, height: number, dpr = globalThis.devicePixelRatio || 1) {
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(scene: Scene, camera: Camera) {
    const gl = this.gl;
    gl.clearColor(0.06, 0.08, 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    scene.updateWorldMatrix();
    camera.updateViewMatrix();
    gl.uniformMatrix4fv(this.viewLocation, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(this.projectionLocation, false, camera.projectionMatrix);
    scene.traverse((node) => {
      if (!(node instanceof Mesh) || !node.visible) return;
      const geometry = node.geometry;
      const buffer = geometry.gpuBuffer || gl.createBuffer();
      if (!buffer) throw new Error('Unable to create geometry buffer');
      geometry.gpuBuffer = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(this.modelLocation, false, node.worldMatrix.elements);
      gl.uniform4fv(this.colorLocation, node.material.color);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.positions.length / 3);
    });
  }

  dispose() {
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
