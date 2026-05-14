import fragmentSource from "./shaders/main.frag?raw";
import { Renderer } from "./renderer";

const canvas = document.querySelector(
  "#canvas"
) as HTMLCanvasElement;

const renderer = new Renderer(
  canvas,
  fragmentSource
);

if (import.meta.hot) {
  import.meta.hot.accept(
    "./shaders/main.frag?raw",
    (module) => {
      if (!module) return;

      renderer.updateFragmentShader(module.default)
    }
  )
}

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
