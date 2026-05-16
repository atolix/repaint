import { createProgram } from "./gl/program";
import vertexSource from "./shaders/fullscreen.vert?raw";
import { Framebuffer } from "./framebuffer";
import { drawPass } from "./pass/draw";
import { PostProcessPipeline, type PostProcessPassConfig } from "./pipeline/post-process";
import { DebugState } from "./debug/state";

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;

  private sceneFramebuffer: Framebuffer;
  private postProcessPipeline: PostProcessPipeline;
  private debugState: DebugState;

  constructor(
    canvas: HTMLCanvasElement,
    sceneSource: string,
    postPasses: PostProcessPassConfig[]
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;

    this.program = createProgram(gl, vertexSource, sceneSource);

    this.sceneFramebuffer = new Framebuffer(gl);
    this.postProcessPipeline = new PostProcessPipeline(gl, postPasses);
    this.debugState = new DebugState();
  }

  private createProgram(fragmentSource: string) {
    return createProgram(this.gl, vertexSource, fragmentSource)
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

  updatePostShader(name: string, fragmentSource: string): string | null {
    return this.postProcessPipeline.updatePostShader(name, fragmentSource);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }


  setPostPassEnabled(name: string, enabled: boolean) {
    this.postProcessPipeline.setPassEnabled(name, enabled);
  }

  render(time: number) {
    this.resize();

    this.sceneFramebuffer.resize(
      this.canvas.width,
      this.canvas.height
    );

    const t = time * 0.001;
    const resolution: [number, number] = [
      this.canvas.width,
      this.canvas.height,
    ];

    drawPass(this.gl, {
      program: this.program,
      framebuffer: this.sceneFramebuffer,
      uniforms: {
        u_time: { type: "1f", value: t },
        u_debugMode: { type: "1i", value: this.debugState.mode },
        u_resolution: { type: "2f", value: resolution },
      },
    });

    this.postProcessPipeline.render({
      inputTexture: this.sceneFramebuffer.texture,
      resolution,
      time: t,
      debugMode: this.debugState.mode,
    });
  }
}
