import { Framebuffer } from "../../framebuffer";
import { createProgram } from "../../gl/program";
import { resolveIncludes } from "../../gl/include";
import { drawPass } from "../../pass/draw";
import type { ShaderPass } from "../../pass/types";
import vertexSource from "../../shaders/fullscreen.vert?raw";
import outputSource from "../../shaders/output.frag?raw";
import { logPipeline } from "../log";

export type PostProcessPassConfig = {
  name: string;
  source: string;
  enabled: boolean;
};

type PostProcessRenderOptions = {
  inputTexture: WebGLTexture;
  resolution: [number, number];
  time: number;
  debugMode: number;
};

export class PostProcessPipeline {
  private readonly gl: WebGL2RenderingContext;
  private readonly outputProgram: WebGLProgram;
  private readonly framebuffers: [Framebuffer, Framebuffer];
  private readonly passes: ShaderPass[];

  constructor(gl: WebGL2RenderingContext, passConfigs: PostProcessPassConfig[]) {
    this.gl = gl;
    this.outputProgram = createProgram(
      gl,
      vertexSource,
      resolveIncludes(outputSource, "./shaders/output.frag")
    );
    this.framebuffers = [
      new Framebuffer(gl),
      new Framebuffer(gl),
    ];
    this.passes = passConfigs.map((pass) => ({
      name: pass.name,
      enabled: pass.enabled,
      program: createProgram(gl, vertexSource, pass.source),
    }));

    this.log();
  }

  updatePasses(passConfigs: PostProcessPassConfig[]): string | null {
    const nextPasses: ShaderPass[] = [];

    try {
      for (const passConfig of passConfigs) {
        nextPasses.push({
          name: passConfig.name,
          enabled: passConfig.enabled,
          program: createProgram(this.gl, vertexSource, passConfig.source),
        });
      }

      for (const pass of this.passes) {
        this.gl.deleteProgram(pass.program);
      }

      this.passes.splice(0, this.passes.length, ...nextPasses);
      this.log();
      return null;
    } catch (error) {
      for (const pass of nextPasses) {
        this.gl.deleteProgram(pass.program);
      }

      return error instanceof Error ? error.message : String(error);
    }
  }

  setPassEnabled(name: string, enabled: boolean) {
    const pass = this.passes.find((pass) => pass.name === name);

    if (!pass) return;

    pass.enabled = enabled;
    this.log();
  }

  render(options: PostProcessRenderOptions) {
    const {
      inputTexture,
      resolution,
      time,
      debugMode,
    } = options;
    const enabledPasses = this.passes.filter((pass) => pass.enabled);

    if (enabledPasses.length === 0) {
      this.renderOutput(inputTexture, resolution);
      return;
    }

    let currentTexture = inputTexture;

    for (let i = 0; i < enabledPasses.length; i++) {
      const pass = enabledPasses[i];
      const isLast = i === enabledPasses.length - 1;
      const outputFramebuffer = isLast ? null : this.framebuffers[i % 2];

      if (outputFramebuffer) {
        outputFramebuffer.resize(resolution[0], resolution[1]);
      }

      drawPass(this.gl, {
        program: pass.program,
        framebuffer: outputFramebuffer,
        uniforms: {
          u_time: { type: "1f", value: time },
          u_debugMode: { type: "1i", value: debugMode },
          u_resolution: { type: "2f", value: resolution },
        },
        textures: [
          {
            name: "u_scene",
            texture: currentTexture,
          },
        ],
      });

      if (outputFramebuffer) currentTexture = outputFramebuffer.texture;
    }
  }

  private renderOutput(inputTexture: WebGLTexture, resolution: [number, number]) {
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
  }

  private log() {
    logPipeline({ postPasses: this.passes });
  }
}
