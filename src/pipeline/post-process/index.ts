import { Framebuffer } from "../../gl/framebuffer";
import { debugModeRequiresFinalTexture } from "../../debug/modes";
import { drawPass } from "../../pass/draw";
import { PostProcessState } from "./state";
import { PostProcessPrograms } from "./programs";
import type {
  PostProcessPassConfig,
  PostProcessShaderSources,
  PostProcessSnapshot,
} from "./types";
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

export class PostProcessPipeline {
  private readonly gl: WebGL2RenderingContext;
  private readonly programs: PostProcessPrograms;
  private readonly framebuffers: [Framebuffer, Framebuffer];
  private readonly state: PostProcessState;
  private readonly onStateChange: (snapshot: PostProcessSnapshot) => void;

  constructor(
    gl: WebGL2RenderingContext,
    shaderSources: PostProcessShaderSources,
    passConfigs: PostProcessPassConfig[],
    onStateChange: (snapshot: PostProcessSnapshot) => void,
  ) {
    const state = new PostProcessState(passConfigs);
    const programs = new PostProcessPrograms(gl, shaderSources, passConfigs);
    const framebuffers: Framebuffer[] = [];

    try {
      framebuffers.push(new Framebuffer(gl), new Framebuffer(gl));
    } catch (error) {
      for (const framebuffer of framebuffers) framebuffer.dispose();
      programs.dispose();

      throw error;
    }

    this.gl = gl;
    this.programs = programs;
    this.framebuffers = [framebuffers[0], framebuffers[1]];
    this.state = state;
    this.onStateChange = onStateChange;

    this.notifyStateChange();
  }

  updatePasses(passConfigs: PostProcessPassConfig[]): string | null {
    try {
      new PostProcessState(passConfigs);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }

    const error = this.programs.update(passConfigs);
    if (error) return error;

    this.state.reconcile(passConfigs);
    this.notifyStateChange();
    return null;
  }

  setParameter(passName: string, key: string, value: number) {
    const result = this.state.setParameter(passName, key, value);
    if (result) this.notifyStateChange();

    return result;
  }

  resetPassParameters(passName: string) {
    const reset = this.state.resetPassParameters(passName);
    if (reset) this.notifyStateChange();

    return reset;
  }

  togglePassAt(index: number): { name: string; enabled: boolean } | null {
    const result = this.state.togglePassAt(index);
    if (!result) return null;

    this.notifyStateChange();

    return {
      name: result.name,
      enabled: result.enabled,
    };
  }

  toggleSelectedPass(): { name: string; enabled: boolean; index: number } | null {
    const result = this.state.toggleSelectedPass();

    if (!result) return null;

    this.notifyStateChange();

    return result;
  }

  selectPassAt(index: number): { name: string; index: number } | null {
    const result = this.state.selectPassAt(index);
    if (!result) return null;

    this.notifyStateChange();

    return result;
  }

  selectNextPass(): { name: string; index: number } | null {
    const result = this.state.selectNextPass();
    if (result) this.notifyStateChange();

    return result;
  }

  selectPreviousPass(): { name: string; index: number } | null {
    const result = this.state.selectPreviousPass();
    if (result) this.notifyStateChange();

    return result;
  }

  selectFirstPass(): { name: string; index: number } | null {
    const result = this.state.selectFirstPass();
    if (result) this.notifyStateChange();

    return result;
  }

  selectLastPass(): { name: string; index: number } | null {
    const result = this.state.selectLastPass();
    if (result) this.notifyStateChange();

    return result;
  }

  getPassStates() {
    return this.state.enabledByName;
  }

  get snapshot() {
    return {
      passes: this.state.snapshot,
      selectedPassIndex: this.state.selectedPassIndex,
    };
  }

  render(options: PostProcessRenderOptions) {
    const {
      inputTexture,
      resolution,
      time,
      debugMode,
    } = options;
    const renderFinalToTexture = debugModeRequiresFinalTexture(debugMode);
    const plan = buildPostProcessRenderPlan(
      this.state.snapshot,
      renderFinalToTexture,
    );

    if (plan.length === 0) {
      this.renderOutput(inputTexture, inputTexture, resolution, debugMode);
      return;
    }

    for (const step of plan) {
      const passState = this.state.snapshot[step.passIndex];
      const outputFramebuffer = this.resolveDestination(step.output);

      if (outputFramebuffer) {
        outputFramebuffer.resize(resolution[0], resolution[1]);
      }

      drawPass(this.gl, {
        program: this.programs.getPass(step.passIndex),
        framebuffer: outputFramebuffer,
        uniforms: {
          u_time: { type: "1f", value: time },
          u_debugMode: { type: "1i", value: debugMode },
          u_resolution: { type: "2f", value: resolution },
          ...Object.fromEntries(
            (passState.parameters ?? []).map((parameter) => [
              parameter.uniform,
              { type: "1f" as const, value: parameter.value },
            ]),
          ),
        },
        textures: [
          {
            name: "u_scene",
            texture: this.resolveTexture(step.input, inputTexture),
          },
        ],
      });
    }

    if (renderFinalToTexture) {
      const lastOutput = plan.at(-1)?.output;
      if (lastOutput?.kind === "framebuffer") {
        this.renderOutput(
          this.framebuffers[lastOutput.index].texture,
          inputTexture,
          resolution,
          debugMode,
        );
      }
    }
  }

  private renderOutput(
    inputTexture: WebGLTexture,
    originalTexture: WebGLTexture,
    resolution: [number, number],
    debugMode: number,
  ) {
    drawPass(this.gl, {
      program: this.programs.output,
      framebuffer: null,
      uniforms: {
        u_resolution: { type: "2f", value: resolution },
        u_debugMode: { type: "1i", value: debugMode },
      },
      textures: [
        {
          name: "u_scene",
          texture: inputTexture,
        },
        {
          name: "u_originalScene",
          texture: originalTexture,
        },
      ],
    });
  }

  private notifyStateChange() {
    this.onStateChange(this.snapshot);
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
    this.programs.dispose();

    for (const framebuffer of this.framebuffers) {
      framebuffer.dispose();
    }
  }
}
