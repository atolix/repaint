import { createProgram } from "./shader";
import vertexSource from "./shaders/fullscreen.vert?raw";
import postFragmentSource from "./shaders/post.frag?raw";
import { Framebuffer } from "./framebuffer";
import { resolveIncludes } from "./shader-loader";

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;
  private mouse = { x: 0, y: 0 };
  private debugMode = 0;

  private sceneFramebuffer: Framebuffer;
  private postProgram: WebGLProgram;

  private uResolution: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private uMouse: WebGLUniformLocation | null;
  private uDebugMode: WebGLUniformLocation | null;

  constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;

    this.program = createProgram(gl, vertexSource, fragmentSource);

    this.uResolution = gl.getUniformLocation(this.program, "u_resolution");
    this.uTime = gl.getUniformLocation(this.program, "u_time");

    this.uDebugMode = gl.getUniformLocation(this.program, "u_debugMode");
    window.addEventListener("keydown", (event) => {
      if (event.key === "d") {
        this.debugMode = (this.debugMode + 1) % 4;
        console.log("debug mode:", this.debugMode);
      }
    })

    this.sceneFramebuffer = new Framebuffer(gl);
    this.postProgram = createProgram(gl, vertexSource, resolveIncludes(
      postFragmentSource,
      "./shaders/post.frag"
    ));

    this.uMouse = gl.getUniformLocation(this.program, "u_mouse");
    this.canvas.addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect()

      this.mouse.x = (event.clientX - rect.left) * window.devicePixelRatio
      this.mouse.y = (rect.height - (event.clientY - rect.top)) * window.devicePixelRatio
    })
  }

  private createProgram(fragmentSource: string) {
    const program = createProgram(this.gl, vertexSource, fragmentSource)

    this.uResolution = this.gl.getUniformLocation(program, "u_resolution")
    this.uTime = this.gl.getUniformLocation(program, "u_time")
    this.uDebugMode = this.gl.getUniformLocation(program, "u_debugMode")

    return program
  }

  updateFragmentShader(fragmentSource: string): string | null {
    try {
      const nextProgram = this.createProgram(fragmentSource)

      this.gl.deleteProgram(this.program)
      this.program = nextProgram

      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(time: number) {
    this.resize();

    this.sceneFramebuffer.resize(this.canvas.width, this.canvas.height);

    this.sceneFramebuffer.bind();

    this.gl.useProgram(this.program);

    this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uTime, time * 0.001);
    this.gl.uniform1i(this.uDebugMode, this.debugMode);
    this.gl.uniform2f(this.uMouse, this.mouse.x, this.mouse.y);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    this.sceneFramebuffer.unbind();
    this.gl.useProgram(this.postProgram);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneFramebuffer.texture);

    const uScene = this.gl.getUniformLocation(this.postProgram, "u_scene");
    const uResolution = this.gl.getUniformLocation(this.postProgram, "u_resolution");
    const uTime = this.gl.getUniformLocation(this.postProgram, "u_time");

    this.gl.uniform1i(uScene, 0);
    this.gl.uniform2f(uResolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(uTime, time * 0.001);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}
