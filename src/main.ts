import mainSource from "./shaders/main.frag?raw";
import invertSource from "./shaders/effects/invert.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./gl/include";
import { reloadShader } from "./hmr";
import { createPostProcessPasses } from "./pipeline/post-process-config";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const renderer = new Renderer(canvas, sceneSource, createPostProcessPasses(invertSource));

if (import.meta.hot) {
  import.meta.hot.accept("./shaders/main.frag?raw", (module) => {
    if (!module) return;

    reloadShader(
      "./shaders/main.frag",
      module.default,
      (source) => renderer.updateFragmentShader(source),
    );
  });

  import.meta.hot.accept("./shaders/effects/invert.frag?raw", (module) => {
    if (!module) return;

    reloadShader(
      "./shaders/effects/invert.frag",
      module.default,
      (source) => renderer.updatePostShader("invert", source),
    );
  });
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
