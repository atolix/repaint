import { Framebuffer } from "../../gl/framebuffer";
import { createProgram } from "../../gl/program";
import { resolveIncludes } from "../../gl/include";
import { drawPass } from "../../pass/draw";
import vertexSource from "../../shaders/fullscreen.vert?raw";
import outputSource from "../../shaders/output.frag?raw";
import { logPipeline } from "../log";
import { PostProcessState } from "./state";
import type { PostProcessPassConfig } from "./types";
import {
  buildPostProcessRenderPlan,
  type RenderDestination,
  type TextureSource,
} from "./plan";

export type { PostProcessPassConfig } from "./types";

type PostProcessRenderOptions = {
  inputTexture: WebGLTexture;
  resolution: [number, number];
  time: number;
  debugMode: number;
};

type PostProcessPass = {
  name: string;
  program: WebGLProgram;
};

export class PostProcessPipeline {
  private readonly gl: WebGL2RenderingContext;
  private readonly outputProgram: WebGLProgram;
  private readonly framebuffers: [Framebuffer, Framebuffer];
  private readonly passes: PostProcessPass[];
  private readonly state: PostProcessState;

  constructor(gl: WebGL2RenderingContext, passConfigs: PostProcessPassConfig[]) {
    const state = new PostProcessState(passConfigs);
    let outputProgram: WebGLProgram | null = null;
    const framebuffers: Framebuffer[] = [];
    const passes: PostProcessPass[] = [];

    try {
      outputProgram = createProgram(
        gl,
        vertexSource,
        resolveIncludes(outputSource, "./shaders/output.frag")
      );
      framebuffers.push(new Framebuffer(gl), new Framebuffer(gl));

      for (const passConfig of passConfigs) {
        try {
          passes.push({
            name: passConfig.name,
            program: createProgram(gl, vertexSource, passConfig.source),
          });
        } catch (error) {
          throw new Error(formatPassError(passConfig, error));
        }
      }
    } catch (error) {
      if (outputProgram) gl.deleteProgram(outputProgram);

      for (const framebuffer of framebuffers) framebuffer.dispose();
      for (const pass of passes) gl.deleteProgram(pass.program);

      throw error;
    }

    this.gl = gl;
    this.outputProgram = outputProgram;
    this.framebuffers = [framebuffers[0], framebuffers[1]];
    this.passes = passes;
    this.state = state;

    this.log();
  }

  updatePasses(passConfigs: PostProcessPassConfig[]): string | null {
    const nextPasses: PostProcessPass[] = [];

    try {
      new PostProcessState(passConfigs);

      for (const passConfig of passConfigs) {
        try {
          nextPasses.push({
            name: passConfig.name,
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
      this.state.reconcile(passConfigs);
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
    const result = this.state.togglePassAt(index);
    if (!result) return null;

    this.log();

    return {
      name: result.name,
      enabled: result.enabled,
    };
  }

  toggleSelectedPass(): { name: string; enabled: boolean; index: number } | null {
    const result = this.state.toggleSelectedPass();

    if (!result) return null;

    this.log();

    return result;
  }

  selectPassAt(index: number): { name: string; index: number } | null {
    const result = this.state.selectPassAt(index);
    if (!result) return null;

    this.log();

    return result;
  }

  selectNextPass(): { name: string; index: number } | null {
    const result = this.state.selectNextPass();
    if (result) this.log();

    return result;
  }

  selectPreviousPass(): { name: string; index: number } | null {
    const result = this.state.selectPreviousPass();
    if (result) this.log();

    return result;
  }

  selectFirstPass(): { name: string; index: number } | null {
    const result = this.state.selectFirstPass();
    if (result) this.log();

    return result;
  }

  selectLastPass(): { name: string; index: number } | null {
    const result = this.state.selectLastPass();
    if (result) this.log();

    return result;
  }

  getPassStates() {
    return this.state.enabledByName;
  }

  render(options: PostProcessRenderOptions) {
    const {
      inputTexture,
      resolution,
      time,
      debugMode,
    } = options;
    const plan = buildPostProcessRenderPlan(this.state.snapshot);

    if (plan.length === 0) {
      this.renderOutput(inputTexture, resolution);
      return;
    }

    for (const step of plan) {
      const pass = this.passes[step.passIndex];
      const outputFramebuffer = this.resolveDestination(step.output);

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
            texture: this.resolveTexture(step.input, inputTexture),
          },
        ],
      });
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
      postPasses: this.state.snapshot,
      selectedPostPassIndex: this.state.selectedPassIndex,
    });
  }

  private resolveTexture(source: TextureSource, sceneTexture: WebGLTexture) {
    return source.kind === "scene"
      ? sceneTexture
      : this.framebuffers[source.index].texture;
  }

  private resolveDestination(destination: RenderDestination) {
    return destination.kind === "screen"
      ? null
      : this.framebuffers[destination.index];
  }

  dispose() {
    this.gl.deleteProgram(this.outputProgram);

    for (const pass of this.passes) {
      this.gl.deleteProgram(pass.program);
    }

    for (const framebuffer of this.framebuffers) {
      framebuffer.dispose();
    }
  }
}

function formatPassError(passConfig: PostProcessPassConfig, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return [
    `post-process shader error: ${passConfig.name}`,
    `path: ${passConfig.path}`,
    message,
  ].join("\n");
}
