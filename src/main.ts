import mainSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";
import { collectIncludeGraph, resolveIncludes, type ShaderIncludeRoot } from "./gl/include";
import { logIncludeGraph, logShaderCompiled, logShaderError, reloadShader } from "./hmr";
import {
  createPostProcessIncludeRoots,
  createPostProcessPasses,
} from "./pipeline/post-process/config";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
if (!canvas) throw new Error("canvas element not found");

const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const renderer = new Renderer(canvas, sceneSource, createPostProcessPasses());
logShaderCompiled("./shaders/main.frag");
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

let animationFrameId = requestAnimationFrame(frame);
let disposed = false;

function frame(time: number) {
  if (disposed) return;

  renderer.render(time);

  animationFrameId = requestAnimationFrame(frame);
}

function dispose() {
  if (disposed) return;
  disposed = true;

  cancelAnimationFrame(animationFrameId);
  renderer.dispose();
}

window.addEventListener("beforeunload", dispose, { once: true });
import.meta.hot?.dispose(dispose);

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
