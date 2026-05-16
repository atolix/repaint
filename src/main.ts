import mainSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";
import { resolveIncludes } from "./shader-loader";

const fragmentSource = resolveIncludes(mainSource, "./shaders/main.frag");
const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const renderer = new Renderer(canvas, fragmentSource);
const errorElement = document.querySelector("#error") as HTMLCanvasElement;

if (import.meta.hot) {
  import.meta.hot.accept(
    "./shaders/main.frag?raw",
    (module) => {
      if (!module) return;

      const error = renderer.updateFragmentShader(
        resolveIncludes(module.default, "./shaders/main.frag")
      )

      if (error) {
        console.log("error")
        showError(error)
      } else {
        clearError()
      }
    }
  )
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
