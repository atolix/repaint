import { PostProcessPipeline, type PostProcessPassConfig } from "./pipeline/post-process";
import { DebugState } from "./debug/state";
import { ScenePass } from "./pipeline/scene";
import { logResolution } from "./pipeline/log";
import { bindPostProcessShortcuts } from "./pipeline/post-process/controls";

const maxRenderDevicePixelRatio = 2;

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private maxTextureSize: number;

  private scenePass: ScenePass;
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
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

    this.scenePass = new ScenePass(gl, sceneSource);
    this.postProcessPipeline = new PostProcessPipeline(gl, postPasses);
    this.debugState = new DebugState();

    bindPostProcessShortcuts(this.postProcessPipeline);
  }

  updateFragmentShader(fragmentSource: string): string | null {
    return this.scenePass.updateShader(fragmentSource);
  }

  updatePostProcessPasses(postPasses: PostProcessPassConfig[]): string | null {
    return this.postProcessPipeline.updatePasses(postPasses);
  }

  resize(): [number, number] | null {
    const clientWidth = this.canvas.clientWidth;
    const clientHeight = this.canvas.clientHeight;
    const requestedDpr = window.devicePixelRatio || 1;
    const dpr = Math.min(
      requestedDpr,
      maxRenderDevicePixelRatio,
      clientWidth > 0 ? this.maxTextureSize / clientWidth : requestedDpr,
      clientHeight > 0 ? this.maxTextureSize / clientHeight : requestedDpr,
    );
    const width = Math.floor(clientWidth * dpr);
    const height = Math.floor(clientHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.gl.viewport(0, 0, width, height);
      logResolution({ width, height, dpr });
    }

    return width > 0 && height > 0 ? [width, height] : null;
  }

  render(time: number) {
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
}
