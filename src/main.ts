import mainSource from "./shaders/main.frag?raw";
import invertSource from "./shaders/effects/invert.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./gl/include";
import { reloadShader } from "./hmr";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const fragmentSource = resolveIncludes(mainSource, "./shaders/main.frag");
const invertFragmentSource = resolveIncludes(invertSource, "./shaders/effects/invert.frag.frag");
const renderer = new Renderer(canvas, fragmentSource, invertFragmentSource);
const errorElement = document.querySelector("#error") as HTMLDivElement;

if (import.meta.hot) {
  import.meta.hot.accept("./shaders/main.frag?raw", (module) => {
    if (!module) return;

    reloadShader(
      "./shaders/main.frag",
      module.default,
      (source) => renderer.updateFragmentShader(source),
      showError,
      clearError
    );
  });
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

function showError(message: string) {
  errorElement.textContent = message
  errorElement.style.display = "block"
}

function clearError() {
  errorElement.textContent = ""
  errorElement.style.display = "none"
}

requestAnimationFrame(frame);
