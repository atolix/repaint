import { PostProcessPipeline } from "../pipeline/post-process";
import type { PostProcessControls } from "../pipeline/post-process/controls";
import type {
  PostProcessPassConfig,
  PostProcessSnapshot,
} from "../pipeline/post-process/types";
import { ScenePass } from "../pipeline/scene";

export type RendererShaderSources = {
  vertex: string;
  scene: string;
  output: string;
};

type RenderOptions = {
  resolution: [number, number];
  time: number;
  debugMode: number;
};

export class RenderResources {
  private readonly scenePass: ScenePass;
  private readonly postProcessPipeline: PostProcessPipeline;

  constructor(
    gl: WebGL2RenderingContext,
    shaderSources: RendererShaderSources,
    postPasses: PostProcessPassConfig[],
    onPostProcessStateChange: (snapshot: PostProcessSnapshot) => void,
  ) {
    const scenePass = new ScenePass(
      gl,
      shaderSources.vertex,
      shaderSources.scene,
    );
    let postProcessPipeline: PostProcessPipeline;

    try {
      postProcessPipeline = new PostProcessPipeline(
        gl,
        shaderSources,
        postPasses,
        onPostProcessStateChange,
      );
    } catch (error) {
      scenePass.dispose();
      throw error;
    }

    this.scenePass = scenePass;
    this.postProcessPipeline = postProcessPipeline;
  }

  updateSceneShader(fragmentSource: string) {
    return this.scenePass.updateShader(fragmentSource);
  }

  updatePostProcessPasses(postPasses: PostProcessPassConfig[]) {
    return this.postProcessPipeline.updatePasses(postPasses);
  }

  get postProcessControls(): PostProcessControls {
    return this.postProcessPipeline;
  }

  get postProcessStates() {
    return this.postProcessPipeline.getPassStates();
  }

  render({ resolution, time, debugMode }: RenderOptions) {
    const sceneTexture = this.scenePass.render({
      resolution,
      time,
      debugMode,
    });

    this.postProcessPipeline.render({
      inputTexture: sceneTexture,
      resolution,
      time,
      debugMode,
    });
  }

  dispose() {
    this.scenePass.dispose();
    this.postProcessPipeline.dispose();
  }
}
