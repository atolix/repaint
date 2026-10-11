import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostProcessPassConfig } from "../src/pipeline/post-process/types";

type ResourceInstance = {
  controls: { select: ReturnType<typeof vi.fn> };
  dispose: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  states: Map<string, boolean>;
  passes: PostProcessPassConfig[];
  sources: { vertex: string; scene: string; output: string };
};

const fakes = vi.hoisted(() => ({
  instances: [] as ResourceInstance[],
  throwMessage: null as string | null,
}));

vi.mock("../src/renderer/resources", () => ({
  RenderResources: class {
    controls = { select: vi.fn() };
    dispose = vi.fn();
    render = vi.fn();
    states: Map<string, boolean>;

    constructor(
      _gl: WebGL2RenderingContext,
      sources: ResourceInstance["sources"],
      passes: PostProcessPassConfig[],
    ) {
      if (fakes.throwMessage) throw new Error(fakes.throwMessage);

      this.states = new Map(
        passes.map((pass) => [pass.name, pass.enabled]),
      );
      fakes.instances.push({
        controls: this.controls,
        dispose: this.dispose,
        render: this.render,
        states: this.states,
        passes,
        sources,
      });
    }

    updateSceneShader() {
      return null;
    }

    updatePostProcessPasses() {
      return null;
    }

    get postProcessControls() {
      return this.controls;
    }

    get postProcessStates() {
      return new Map(this.states);
    }
  },
}));

import { Renderer } from "../src/renderer";

class FakeCanvas extends EventTarget {
  width = 1;
  height = 1;
  clientWidth = 640;
  clientHeight = 360;

  readonly gl = {
    MAX_TEXTURE_SIZE: 0x0d33,
    getParameter: vi.fn(() => 4096),
    viewport: vi.fn(),
  };

  getContext(contextId: string) {
    return contextId === "webgl2" ? this.gl : null;
  }
}

const sources = {
  vertex: "vertex",
  scene: "scene",
  output: "output",
};

const passes: PostProcessPassConfig[] = [
  {
    name: "first",
    path: "./shaders/post/first.frag",
    source: "first",
    enabled: false,
  },
];

function createRenderer(canvas = new FakeCanvas()) {
  const onPostProcessStateChange = vi.fn();
  const onResolutionChange = vi.fn();
  const renderer = new Renderer(
    canvas as unknown as HTMLCanvasElement,
    sources,
    passes,
    { onPostProcessStateChange, onResolutionChange },
    { mode: 2 },
  );

  return { canvas, renderer, onResolutionChange };
}

describe("Renderer resource lifecycle", () => {
  beforeEach(() => {
    fakes.instances.length = 0;
    fakes.throwMessage = null;
    vi.stubGlobal("window", { devicePixelRatio: 1 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the active resources when an atomic shader update fails", () => {
    const { renderer } = createRenderer();
    const current = fakes.instances[0];
    current.states.set("first", true);
    fakes.throwMessage = "compile failed";

    expect(
      renderer.updateShaders(
        { ...sources, scene: "broken" },
        [{ ...passes[0], enabled: false }],
      ),
    ).toBe("compile failed");
    expect(current.dispose).not.toHaveBeenCalled();
    expect(renderer.postProcessControls).toBe(current.controls);
  });

  it("preserves pass state and disposes old resources after a successful swap", () => {
    const { renderer } = createRenderer();
    const current = fakes.instances[0];
    current.states.set("first", true);

    expect(
      renderer.updateShaders(
        { ...sources, scene: "updated" },
        [{ ...passes[0], enabled: false }],
      ),
    ).toBeNull();

    const replacement = fakes.instances[1];
    expect(replacement.sources.scene).toBe("updated");
    expect(replacement.passes[0].enabled).toBe(true);
    expect(current.dispose).toHaveBeenCalledOnce();
    expect(renderer.postProcessControls).toBe(replacement.controls);
  });

  it("pauses rendering while the context is lost and rebuilds on restore", () => {
    const { canvas, renderer } = createRenderer();
    const previous = fakes.instances[0];
    previous.states.set("first", true);
    const lostEvent = new Event("webglcontextlost", { cancelable: true });

    canvas.dispatchEvent(lostEvent);
    renderer.render(1_000);

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(previous.render).not.toHaveBeenCalled();

    canvas.dispatchEvent(new Event("webglcontextrestored"));
    renderer.render(2_000);

    const restored = fakes.instances[1];
    expect(restored.passes[0].enabled).toBe(true);
    expect(previous.dispose).toHaveBeenCalledOnce();
    expect(restored.render).toHaveBeenCalledWith({
      resolution: [640, 360],
      time: 2,
      debugMode: 2,
    });
  });

  it("detaches context listeners and disposes only once", () => {
    const { canvas, renderer } = createRenderer();
    const resources = fakes.instances[0];

    renderer.dispose();
    renderer.dispose();
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    renderer.render(1_000);

    expect(resources.dispose).toHaveBeenCalledOnce();
    expect(resources.render).not.toHaveBeenCalled();
    expect(fakes.instances).toHaveLength(1);
  });
});
