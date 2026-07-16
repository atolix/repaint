import { Framebuffer } from "../../gl/framebuffer";
import { createProgram } from "../../gl/program";
import { resolveIncludes } from "../../gl/include";
import { drawPass } from "../../pass/draw";
import vertexSource from "../../shaders/fullscreen.vert?raw";
import outputSource from "../../shaders/output.frag?raw";
import { logPipeline } from "../log";

export type PostProcessPassConfig = {
  name: string;
  path: string;
  source: string;
  enabled: boolean;
};

type PostProcessRenderOptions = {
  inputTexture: WebGLTexture;
  resolution: [number, number];
  time: number;
  debugMode: number;
};

type PostProcessPass = {
  name: string;
  enabled: boolean;
  program: WebGLProgram;
};

export class PostProcessPipeline {
  private readonly gl: WebGL2RenderingContext;
  private readonly outputProgram: WebGLProgram;
  private readonly framebuffers: [Framebuffer, Framebuffer];
  private readonly passes: PostProcessPass[];
  private selectedPassIndex = 0;

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
    const nextPasses: PostProcessPass[] = [];

    try {
      for (const passConfig of passConfigs) {
        try {
          nextPasses.push({
            name: passConfig.name,
            enabled: passConfig.enabled,
            program: createProgram(this.gl, vertexSource, passConfig.source),
          });
        } catch (error) {
          throw new Error(formatPassError(passConfig, error));
        }
      }

      for (const pass of this.passes) {
        this.gl.deleteProgram(pass.program);
      }

      this.passes.splice(0, this.passes.length, ...nextPasses);
      if (this.selectedPassIndex >= this.passes.length) {
        this.selectedPassIndex = Math.max(0, this.passes.length - 1);
      }
      this.log();
      return null;
    } catch (error) {
      for (const pass of nextPasses) {
        this.gl.deleteProgram(pass.program);
      }

      return error instanceof Error ? error.message : String(error);
    }
  }

  togglePassAt(index: number): { name: string; enabled: boolean } | null {
    const pass = this.passes[index];

    if (!pass) return null;

    pass.enabled = !pass.enabled;
    this.log();

    return {
      name: pass.name,
      enabled: pass.enabled,
    };
  }

  toggleSelectedPass(): { name: string; enabled: boolean; index: number } | null {
    const result = this.togglePassAt(this.selectedPassIndex);

    if (!result) return null;

    return {
      ...result,
      index: this.selectedPassIndex,
    };
  }

  selectPassAt(index: number): { name: string; index: number } | null {
    const pass = this.passes[index];

    if (!pass) return null;

    this.selectedPassIndex = index;
    this.log();

    return {
      name: pass.name,
      index,
    };
  }

  selectNextPass(): { name: string; index: number } | null {
    return this.selectPassByOffset(1);
  }

  selectPreviousPass(): { name: string; index: number } | null {
    return this.selectPassByOffset(-1);
  }

  selectFirstPass(): { name: string; index: number } | null {
    return this.selectPassAt(0);
  }

  selectLastPass(): { name: string; index: number } | null {
    return this.selectPassAt(this.passes.length - 1);
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
    logPipeline({
      postPasses: this.passes,
      selectedPostPassIndex: this.selectedPassIndex,
    });
  }

  private selectPassByOffset(offset: number): { name: string; index: number } | null {
    if (this.passes.length === 0) return null;

    const nextIndex = wrapIndex(this.selectedPassIndex + offset, this.passes.length);

    return this.selectPassAt(nextIndex);
  }
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function formatPassError(passConfig: PostProcessPassConfig, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return [
    `post-process shader error: ${passConfig.name}`,
    `path: ${passConfig.path}`,
    message,
  ].join("\n");
}
