import mainSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./gl/include";
import { reloadShader } from "./hmr";
import { createPostProcessPasses } from "./pipeline/post-process-config";

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

  import.meta.hot.accept("./pipeline/post-process-config", (module) => {
    if (!module) return;

    const error = renderer.updatePostProcessPasses(module.createPostProcessPasses());
    if (error) console.error(error);
  });
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
