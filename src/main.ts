import mainSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./gl/include";
import { logShaderCompiled, logShaderError, reloadShader } from "./hmr";
import { createPostProcessPasses } from "./pipeline/post-process/config";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const renderer = new Renderer(canvas, sceneSource, createPostProcessPasses());

if (import.meta.hot) {
  import.meta.hot.accept("./shaders/main.frag?raw", (module) => {
    if (!module) return;

    reloadShader(
      "./shaders/main.frag",
      module.default,
      (source) => renderer.updateFragmentShader(source),
    );
  });

  import.meta.hot.accept("./pipeline/post-process/config", (module) => {
    if (!module) return;

    try {
      const error = renderer.updatePostProcessPasses(module.createPostProcessPasses());

      if (error) {
        console.error(error);
        logShaderError("./pipeline/post-process/config", error);
      } else {
        logShaderCompiled("./pipeline/post-process/config");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(message);
      logShaderError("./pipeline/post-process/config", message);
    }
  });
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
