import mainSource from "./shaders/main.frag?raw";
import invertSource from "./shaders/effects/invert.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./gl/include";
import { reloadShader } from "./hmr";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const invertFragmentSource = resolveIncludes(invertSource, "./shaders/effects/invert.frag");

const postPasses = [
  {
    name: "invert",
    source: invertFragmentSource,
    enabled: true,
  },
]

const renderer = new Renderer(canvas, sceneSource, postPasses);

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
