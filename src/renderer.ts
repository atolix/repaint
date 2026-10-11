import { PostProcessPipeline, type PostProcessPassConfig } from "./pipeline/post-process";
import type { PostProcessSnapshot } from "./pipeline/post-process/types";
import { DebugState } from "./debug/state";
import { ScenePass } from "./pipeline/scene";
import type { PostProcessControls } from "./pipeline/post-process/controls";
import {
  calculateRenderSize,
  type ResolutionState,
} from "./renderer/size";

const maxRenderDevicePixelRatio = 2;

export type RendererCallbacks = {
  onPostProcessStateChange: (snapshot: PostProcessSnapshot) => void;
  onResolutionChange: (resolution: ResolutionState) => void;
};

export type RendererShaderSources = {
  vertex: string;
  scene: string;
  output: string;
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private maxTextureSize: number;

  private scenePass: ScenePass;
  private postProcessPipeline: PostProcessPipeline;
  private debugState: DebugState;
  private shaderSources: RendererShaderSources;
  private postPasses: PostProcessPassConfig[];
  private callbacks: RendererCallbacks;
  private contextLost = false;
  private disposed = false;
  private passStatesBeforeContextLoss = new Map<string, boolean>();

  constructor(
    canvas: HTMLCanvasElement,
    shaderSources: RendererShaderSources,
    postPasses: PostProcessPassConfig[],
    callbacks: RendererCallbacks,
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    this.shaderSources = shaderSources;
    this.postPasses = postPasses;
    this.callbacks = callbacks;

    this.scenePass = new ScenePass(
      gl,
      shaderSources.vertex,
      shaderSources.scene,
    );
    this.postProcessPipeline = new PostProcessPipeline(
      gl,
      shaderSources,
      postPasses,
      callbacks.onPostProcessStateChange,
    );
    this.debugState = new DebugState();

    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
  }

  updateFragmentShader(fragmentSource: string): string | null {
    const error = this.scenePass.updateShader(fragmentSource);
    if (!error) this.shaderSources.scene = fragmentSource;

    return error;
  }

  updatePostProcessPasses(postPasses: PostProcessPassConfig[]): string | null {
    const error = this.postProcessPipeline.updatePasses(postPasses);

    if (!error) {
      const states = this.postProcessPipeline.getPassStates();
      this.postPasses = postPasses.map((pass) => ({
        ...pass,
        enabled: states.get(pass.name) ?? pass.enabled,
      }));
    }

    return error;
  }

  resize(): [number, number] | null {
    const { width, height, dpr } = calculateRenderSize({
      clientWidth: this.canvas.clientWidth,
      clientHeight: this.canvas.clientHeight,
      devicePixelRatio: window.devicePixelRatio,
      maxDevicePixelRatio: maxRenderDevicePixelRatio,
      maxTextureSize: this.maxTextureSize,
    });

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.gl.viewport(0, 0, width, height);
      this.callbacks.onResolutionChange({ width, height, dpr });
    }

    return width > 0 && height > 0 ? [width, height] : null;
  }

  render(time: number) {
    if (this.contextLost || this.disposed) return;

    const resolution = this.resize();
    if (!resolution) return;

    const t = time * 0.001;
    const debugMode = this.debugState.mode;
    const sceneTexture = this.scenePass.render({
      resolution,
      time: t,
      debugMode,
    });

    this.postProcessPipeline.render({
      inputTexture: sceneTexture,
      resolution,
      time: t,
      debugMode,
    });
  }

  get postProcessControls(): PostProcessControls {
    return this.postProcessPipeline;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.debugState.dispose();
    this.scenePass.dispose();
    this.postProcessPipeline.dispose();
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.passStatesBeforeContextLoss = this.postProcessPipeline.getPassStates();
  };

  private handleContextRestored = () => {
    if (this.disposed) return;

    const restoredPasses = this.postPasses.map((pass) => ({
      ...pass,
      enabled: this.passStatesBeforeContextLoss.get(pass.name) ?? pass.enabled,
    }));
    let nextScenePass: ScenePass | null = null;
    let nextPostProcessPipeline: PostProcessPipeline | null = null;

    try {
      nextScenePass = new ScenePass(
        this.gl,
        this.shaderSources.vertex,
        this.shaderSources.scene,
      );
      nextPostProcessPipeline = new PostProcessPipeline(
        this.gl,
        this.shaderSources,
        restoredPasses,
        this.callbacks.onPostProcessStateChange,
      );
    } catch (error) {
      nextScenePass?.dispose();
      nextPostProcessPipeline?.dispose();
      console.error("failed to restore WebGL resources", error);
      return;
    }

    this.scenePass.dispose();
    this.postProcessPipeline.dispose();

    this.scenePass = nextScenePass;
    this.postProcessPipeline = nextPostProcessPipeline;
    this.maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
    this.contextLost = false;
  };
}
