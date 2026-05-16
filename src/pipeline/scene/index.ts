import { Framebuffer } from "../../gl/framebuffer";
import { createProgram } from "../../gl/program";
import { drawPass } from "../../pass/draw";
import vertexSource from "../../shaders/fullscreen.vert?raw";

type ScenePassRenderOptions = {
  resolution: [number, number];
  time: number;
  debugMode: number;
};

export class ScenePass {
  private readonly gl: WebGL2RenderingContext;
  private readonly framebuffer: Framebuffer;
  private program: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, fragmentSource: string) {
    this.gl = gl;
    this.framebuffer = new Framebuffer(gl);
    this.program = createProgram(gl, vertexSource, fragmentSource);
  }

  updateShader(fragmentSource: string): string | null {
    try {
      const nextProgram = createProgram(this.gl, vertexSource, fragmentSource);

      this.gl.deleteProgram(this.program);
      this.program = nextProgram;

      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  render(options: ScenePassRenderOptions): WebGLTexture {
    const {
      resolution,
      time,
      debugMode,
    } = options;

    this.framebuffer.resize(resolution[0], resolution[1]);

    drawPass(this.gl, {
      program: this.program,
      framebuffer: this.framebuffer,
      uniforms: {
        u_time: { type: "1f", value: time },
        u_debugMode: { type: "1i", value: debugMode },
        u_resolution: { type: "2f", value: resolution },
      },
    });

    return this.framebuffer.texture;
  }
}
