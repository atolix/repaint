import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  throwOnPostConstruction: false,
  sceneDispose: vi.fn(),
  sceneRender: vi.fn(() => ({ kind: "scene-texture" })),
  postDispose: vi.fn(),
  postRender: vi.fn(),
}));

vi.mock("../src/pipeline/scene", () => ({
  ScenePass: class {
    updateShader() {
      return null;
    }

    render = fakes.sceneRender;
    dispose = fakes.sceneDispose;
  },
}));

vi.mock("../src/pipeline/post-process", () => ({
  PostProcessPipeline: class {
    constructor() {
      if (fakes.throwOnPostConstruction) throw new Error("post failed");
    }

    updatePasses() {
      return null;
    }

    getPassStates() {
      return new Map<string, boolean>();
    }

    render = fakes.postRender;
    dispose = fakes.postDispose;
  },
}));

import { RenderResources } from "../src/renderer/resources";

const sources = {
  vertex: "vertex",
  scene: "scene",
  output: "output",
};

describe("RenderResources", () => {
  beforeEach(() => {
    fakes.throwOnPostConstruction = false;
    vi.clearAllMocks();
  });

  it("releases the scene pass if post-process construction fails", () => {
    fakes.throwOnPostConstruction = true;

    expect(() =>
      new RenderResources(
        {} as WebGL2RenderingContext,
        sources,
        [],
        vi.fn(),
      ),
    ).toThrow("post failed");
    expect(fakes.sceneDispose).toHaveBeenCalledOnce();
  });

  it("passes the scene texture into post-processing", () => {
    const resources = new RenderResources(
      {} as WebGL2RenderingContext,
      sources,
      [],
      vi.fn(),
    );

    resources.render({
      resolution: [800, 600],
      time: 1,
      debugMode: 2,
    });

    expect(fakes.postRender).toHaveBeenCalledWith({
      inputTexture: { kind: "scene-texture" },
      resolution: [800, 600],
      time: 1,
      debugMode: 2,
    });
  });

  it("disposes both render passes", () => {
    const resources = new RenderResources(
      {} as WebGL2RenderingContext,
      sources,
      [],
      vi.fn(),
    );

    resources.dispose();

    expect(fakes.sceneDispose).toHaveBeenCalledOnce();
    expect(fakes.postDispose).toHaveBeenCalledOnce();
  });
});
