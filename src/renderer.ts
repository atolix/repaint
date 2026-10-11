import type {
  PostProcessPassConfig,
  PostProcessSnapshot,
} from "./pipeline/post-process/types";
import type { PostProcessControls } from "./pipeline/post-process/controls";
import {
  calculateRenderSize,
  type ResolutionState,
} from "./renderer/size";
import {
  RenderResources,
  type RendererShaderSources,
} from "./renderer/resources";

export type { RendererShaderSources } from "./renderer/resources";

const maxRenderDevicePixelRatio = 2;

export type RendererCallbacks = {
  onPostProcessStateChange: (snapshot: PostProcessSnapshot) => void;
  onResolutionChange: (resolution: ResolutionState) => void;
};

export type DebugModeState = {
  readonly mode: number;
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private maxTextureSize: number;

  private resources: RenderResources;
  private debugState: DebugModeState;
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
    debugState: DebugModeState,
  ) {
    const gl = canvas.getContext("webgl2");

    if (!gl) throw new Error("webgl2 not supported");

    this.gl = gl;
    this.canvas = canvas;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    this.shaderSources = { ...shaderSources };
    this.postPasses = postPasses.map((pass) => ({ ...pass }));
    this.callbacks = callbacks;

    this.resources = new RenderResources(
      gl,
      shaderSources,
      postPasses,
      callbacks.onPostProcessStateChange,
    );
    this.debugState = debugState;

    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
  }

  updateFragmentShader(fragmentSource: string): string | null {
    const error = this.resources.updateSceneShader(fragmentSource);
    if (!error) this.shaderSources.scene = fragmentSource;

    return error;
  }

  updatePostProcessPasses(postPasses: PostProcessPassConfig[]): string | null {
    const error = this.resources.updatePostProcessPasses(postPasses);

    if (!error) {
      const states = this.resources.postProcessStates;
      this.postPasses = postPasses.map((pass) => ({
        ...pass,
        enabled: states.get(pass.name) ?? pass.enabled,
      }));
    }

    return error;
  }

  updateShaders(
    shaderSources: RendererShaderSources,
    postPasses: PostProcessPassConfig[],
  ): string | null {
    const states = this.resources.postProcessStates;
    const restoredPasses = postPasses.map((pass) => ({
      ...pass,
      enabled: states.get(pass.name) ?? pass.enabled,
    }));
    let nextResources: RenderResources;

    try {
      nextResources = new RenderResources(
        this.gl,
        shaderSources,
        restoredPasses,
        this.callbacks.onPostProcessStateChange,
      );
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }

    this.resources.dispose();

    this.resources = nextResources;
    this.shaderSources = { ...shaderSources };
    this.postPasses = restoredPasses;

    return null;
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
    this.resources.render({
      resolution,
      time: t,
      debugMode,
    });
  }

  get postProcessControls(): PostProcessControls {
    return this.resources.postProcessControls;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.resources.dispose();
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.passStatesBeforeContextLoss = this.resources.postProcessStates;
  };

  private handleContextRestored = () => {
    if (this.disposed) return;

    const passes = this.postPasses.map((pass) => ({
      ...pass,
      enabled: this.passStatesBeforeContextLoss.get(pass.name) ?? pass.enabled,
    }));
    const error = this.updateShaders(this.shaderSources, passes);

    if (error) {
      console.error("failed to restore WebGL resources", error);
      return;
    }

    this.maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
    this.contextLost = false;
  };
}
