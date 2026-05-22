import mainSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";
import { collectIncludeGraph, resolveIncludes, type ShaderIncludeRoot } from "./gl/include";
import { logIncludeGraph, logShaderCompiled, logShaderError, reloadShader } from "./hmr";
import {
  createPostProcessIncludeRoots,
  createPostProcessPasses,
} from "./pipeline/post-process/config";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const renderer = new Renderer(canvas, sceneSource, createPostProcessPasses());
logIncludeGraph(createIncludeGraph());

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

  import.meta.hot.accept("./gl/include", (module) => {
    if (!module) return;

    try {
      const sceneError = renderer.updateFragmentShader(
        module.resolveIncludes(mainSource, "./shaders/main.frag")
      );
      const postProcessError = renderer.updatePostProcessPasses(
        createPostProcessPasses(module.resolveIncludes)
      );

      logIncludeGraph(createIncludeGraph(module.collectIncludeGraph));

      if (sceneError) {
        console.error(sceneError);
        logShaderError("./shaders/main.frag", sceneError);
      } else if (postProcessError) {
        console.error(postProcessError);
        logShaderError("./pipeline/post-process/config", postProcessError);
      } else {
        logShaderCompiled("./shaders/lib/*.glsl");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(message);
      logShaderError("./shaders/lib/*.glsl", message);
    }
  });
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function createIncludeGraph(
  collector: typeof collectIncludeGraph = collectIncludeGraph
) {
  return collector(createIncludeRoots());
}

function createIncludeRoots(): ShaderIncludeRoot[] {
  return [
    { path: "./shaders/main.frag", source: mainSource },
    ...createPostProcessIncludeRoots(),
  ];
}
