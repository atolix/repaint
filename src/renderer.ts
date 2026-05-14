import { createProgram } from "./shader";
import vertexSource from "./shaders/fullscreen.vert?raw";

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;

  private uResolution: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;

  constructor(
    canvas: HTMLCanvasElement,
    fragmentSource: string
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) {
      throw new Error("webgl2 not supported");
    }

    this.gl = gl;
    this.canvas = canvas;

    this.program = createProgram(
      gl,
      vertexSource,
      fragmentSource
    );

    this.uResolution = gl.getUniformLocation(
      this.program,
      "u_resolution"
    );

    this.uTime = gl.getUniformLocation(
      this.program,
      "u_time"
    );
  }

  private createProgram(fragmentSource: string) {
    const program = createProgram(
      this.gl,
      vertexSource,
      fragmentSource
    )

    this.uResolution = this.gl.getUniformLocation(
      program,
      "u_resolution"
    )

    this.uTime = this.gl.getUniformLocation(
      program,
      "u_time"
    )

    return program
  }

  updateFragmentShader(fragmentSource: string) {
    try {
      const nextProgram = this.createProgram(fragmentSource)

      this.gl.deleteProgram(this.program)
      this.program = nextProgram

      console.clear()
      console.log('shader compiled')
    } catch (error) {
      console.error(error)
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width =
      this.canvas.clientWidth * dpr;

    this.canvas.height =
      this.canvas.clientHeight * dpr;

    this.gl.viewport(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  render(time: number) {
    this.resize();

    this.gl.useProgram(this.program);

    this.gl.uniform2f(
      this.uResolution,
      this.canvas.width,
      this.canvas.height
    );

    this.gl.uniform1f(
      this.uTime,
      time * 0.001
    );

    this.gl.drawArrays(
      this.gl.TRIANGLES,
      0,
      3
    );
  }
}
