import { PostProcessPipeline, type PostProcessPassConfig } from "./pipeline/post-process";
import { DebugState } from "./debug/state";
import { ScenePass } from "./pipeline/scene";

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;

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

    this.scenePass = new ScenePass(gl, sceneSource);
    this.postProcessPipeline = new PostProcessPipeline(gl, postPasses);
    this.debugState = new DebugState();

    this.bindEffectShortcuts();
  }

  updateFragmentShader(fragmentSource: string): string | null {
    return this.scenePass.updateShader(fragmentSource);
  }

  updatePostProcessPasses(postPasses: PostProcessPassConfig[]): string | null {
    return this.postProcessPipeline.updatePasses(postPasses);
  }

  resize(): [number, number] {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(this.canvas.clientWidth * dpr);
    const height = Math.floor(this.canvas.clientHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.gl.viewport(0, 0, width, height);
    }

    return [width, height];
  }

  render(time: number) {
    const resolution = this.resize();
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

  private bindEffectShortcuts(target: Window = window) {
    target.addEventListener("keydown", (event) => {
      if (event.repeat) return;

      const passIndex = Number(event.key) - 1;
      if (!Number.isInteger(passIndex) || passIndex < 0) return;

      const result = this.postProcessPipeline.togglePassAt(passIndex);
      if (!result) {
        console.warn(`post-process pass not found: ${event.key}`);
        return;
      }

      console.log(`post-process ${result.name}: ${result.enabled ? "on" : "off"}`);
    });
  }
}
