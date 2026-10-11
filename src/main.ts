import mainSource from "./shaders/main.frag?raw";
import outputSource from "./shaders/output.frag?raw";
import vertexSource from "./shaders/fullscreen.vert?raw";
import { Renderer } from "./renderer";
import { collectIncludeGraph, resolveIncludes, type ShaderIncludeRoot } from "./gl/include";
import { logIncludeGraph, logShaderCompiled, logShaderError, reloadShader } from "./hmr";
import {
  createPostProcessIncludeRoots,
  createPostProcessPasses,
} from "./pipeline/post-process/config";
import { logPipeline, logResolution } from "./pipeline/log";
import { bindPostProcessShortcuts } from "./pipeline/post-process/controls";
import { bindDebugShortcut } from "./debug/controls";
import { DebugState } from "./debug/state";
import { ParameterPanel } from "./ui/parameter-panel";
import { DebugIndicator } from "./ui/debug-indicator";
import { PlaybackClock } from "./time/playback-clock";
import { PlaybackControls } from "./ui/playback-controls";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
if (!canvas) throw new Error("canvas element not found");

const sceneSource = resolveIncludes(mainSource, "./shaders/main.frag");
const resolvedOutputSource = resolveIncludes(
  outputSource,
  "./shaders/output.frag",
);
const debugState = new DebugState();
const playbackClock = new PlaybackClock();
const playbackControls = new PlaybackControls(playbackClock);
const debugIndicator = new DebugIndicator();
const unsubscribeDebugIndicator = debugState.subscribe((mode) => {
  debugIndicator.render(mode);
});
let parameterPanel: ParameterPanel | null = null;
const renderer = new Renderer(
  canvas,
  {
    vertex: vertexSource,
    scene: sceneSource,
    output: resolvedOutputSource,
  },
  createPostProcessPasses(),
  {
    onPostProcessStateChange: (snapshot) => {
      logPipeline(snapshot);
      parameterPanel?.render(snapshot);
    },
    onResolutionChange: logResolution,
  },
  debugState,
);
parameterPanel = new ParameterPanel(() => renderer.postProcessControls);
parameterPanel.render(renderer.postProcessSnapshot);
const unbindPostProcessShortcuts = bindPostProcessShortcuts(
  () => renderer.postProcessControls,
);
const unbindDebugShortcut = bindDebugShortcut(debugState);
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
      const error = renderer.updateShaders(
        {
          vertex: vertexSource,
          scene: module.resolveIncludes(mainSource, "./shaders/main.frag"),
          output: module.resolveIncludes(outputSource, "./shaders/output.frag"),
        },
        createPostProcessPasses(module.resolveIncludes),
      );

      logIncludeGraph(createIncludeGraph(module.collectIncludeGraph));

      if (error) {
        console.error(error);
        logShaderError("./shaders/lib/*.glsl", error);
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

  renderer.render(playbackClock.tick(time));

  animationFrameId = requestAnimationFrame(frame);
}

function dispose() {
  if (disposed) return;
  disposed = true;

  cancelAnimationFrame(animationFrameId);
  unbindPostProcessShortcuts();
  unbindDebugShortcut();
  unsubscribeDebugIndicator();
  debugIndicator.dispose();
  parameterPanel?.dispose();
  playbackControls.dispose();
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
    { path: "./shaders/output.frag", source: outputSource },
    ...createPostProcessIncludeRoots(),
  ];
}
