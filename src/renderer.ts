import { createProgram } from "./gl/program";
import vertexSource from "./shaders/fullscreen.vert?raw";
import { Framebuffer } from "./framebuffer";
import { resolveIncludes } from "./gl/include";
import outputSource from "./shaders/output.frag?raw";
import { drawPass } from "./pass/draw";
import type { RenderPass } from "./pass/render";
import { logPipeline } from "./pipeline/log";

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private canvas: HTMLCanvasElement;
  private debugMode = 0;

  private sceneFramebuffer: Framebuffer;
  private outputProgram: WebGLProgram;

  private postPasses: RenderPass[];
  private postFramebuffers: [Framebuffer, Framebuffer];

  constructor(
    canvas: HTMLCanvasElement,
    fragmentSource: string,
    postFragmentSource: string
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;

    this.program = createProgram(gl, vertexSource, fragmentSource);

    window.addEventListener("keydown", (event) => {
      if (event.key === "d") {
        this.debugMode = (this.debugMode + 1) % 4;
        console.log("debug mode:", this.debugMode);
      }
    })

    this.sceneFramebuffer = new Framebuffer(gl);
    this.outputProgram = createProgram(gl, vertexSource, resolveIncludes(
      outputSource, "./shaders/output.frag"
    ))

    this.postPasses = [
      {
        name: "post",
        enabled: true,
        program: createProgram(gl, vertexSource, postFragmentSource)
      }
    ]

    this.postFramebuffers = [
      new Framebuffer(gl),
      new Framebuffer(gl)
    ]

    logPipeline({ postPasses: this.postPasses });
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

  updatePostShader(fragmentSource: string): string | null {
    try {
      const pass = this.postPasses.find((pass) => pass.name === "post");

      if (!pass) throw new Error("post pass not found");


      const nextProgram = createProgram(
        this.gl,
        vertexSource,
        resolveIncludes(fragmentSource, "./shaders/post.frag")
      );

      this.gl.deleteProgram(pass.program);
      pass.program = nextProgram;

      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }


  setPostPassEnabled(name: string, enabled: boolean) {
    const pass = this.postPasses.find((pass) => pass.name === name);

    if (!pass) return;

    pass.enabled = enabled;
    logPipeline({ postPasses: this.postPasses });
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
        u_debugMode: { type: "1i", value: this.debugMode },
        u_resolution: { type: "2f", value: resolution },
      },
    });

    let inputTexture = this.sceneFramebuffer.texture;

    const enabledPostPasses = this.postPasses.filter((pass) => pass.enabled);

    if (enabledPostPasses.length === 0) {
      drawPass(this.gl, {
        program: this.outputProgram,
        framebuffer: null,
        uniforms: {
          u_resolution: { type: "2f", value: resolution },
        },
        textures: [
          {
            name: "u_scene",
            texture: inputTexture,
          },
        ],
      });
    } else {
      for (let i = 0; i < enabledPostPasses.length; i++) {
        const pass = enabledPostPasses[i];
        const isLast = i === enabledPostPasses.length - 1;

        const outputFramebuffer = isLast ? null : this.postFramebuffers[i % 2];

        if (outputFramebuffer) outputFramebuffer.resize(this.canvas.width, this.canvas.height);

        drawPass(this.gl, {
          program: pass.program,
          framebuffer: outputFramebuffer,
          uniforms: {
            u_time: { type: "1f", value: t },
            u_debugMode: { type: "1i", value: this.debugMode },
            u_resolution: { type: "2f", value: resolution },
          },
          textures: [
            {
              name: "u_scene",
              texture: inputTexture,
            },
          ],
        })

        if (outputFramebuffer) inputTexture = outputFramebuffer.texture;
      }
    }
  }
}
