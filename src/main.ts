import mainSource from "./shaders/main.frag?raw";
import postSource from "./shaders/post.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./shader-loader";
import { reloadShader } from "./hmr";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const fragmentSource = resolveIncludes(mainSource, "./shaders/main.frag");
const postFragmentSource = resolveIncludes(postSource, "./shaders/post.frag");
const renderer = new Renderer(canvas, fragmentSource, postFragmentSource);
const errorElement = document.querySelector("#error") as HTMLCanvasElement;

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

  import.meta.hot.accept("./shaders/post.frag?raw", (module) => {
    if (!module) return;

    reloadShader(
      "./shaders/post.frag",
      module.default,
      (source) => renderer.updatePostShader(source),
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
