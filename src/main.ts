import fragmentSource from "./shaders/main.frag?raw";

import { Renderer } from "./renderer";

const canvas = document.querySelector(
  "#canvas"
) as HTMLCanvasElement;

const renderer = new Renderer(
  canvas,
  fragmentSource
);

function frame(time: number) {
  renderer.render(time);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
