import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostProcessPassConfig } from "../src/pipeline/post-process/types";

const fakes = vi.hoisted(() => ({
  drawPass: vi.fn(),
  passProgram: { kind: "pass-program" } as unknown as WebGLProgram,
  outputProgram: { kind: "output-program" } as unknown as WebGLProgram,
}));

vi.mock("../src/gl/framebuffer", () => ({
  Framebuffer: class {
    texture = {} as WebGLTexture;
    resize = vi.fn();
    dispose = vi.fn();
  },
}));

vi.mock("../src/pass/draw", () => ({
  drawPass: fakes.drawPass,
}));

vi.mock("../src/pipeline/post-process/programs", () => ({
  PostProcessPrograms: class {
    output = fakes.outputProgram;

    getPass() {
      return fakes.passProgram;
    }

    update() {
      return null;
    }

    dispose() {}
  },
}));

import { PostProcessPipeline } from "../src/pipeline/post-process";

const pass: PostProcessPassConfig = {
  name: "noise",
  description: "Adds grain.",
  path: "noise.frag",
  source: "noise",
  enabled: true,
  parameters: [
    {
      key: "amount",
      label: "Amount",
      uniform: "u_amount",
      min: 0,
      max: 0.3,
      step: 0.01,
      defaultValue: 0.08,
    },
  ],
};

describe("PostProcessPipeline parameters", () => {
  beforeEach(() => {
    fakes.drawPass.mockReset();
  });

  it("sends parameter updates to state observers and shader uniforms", () => {
    const onStateChange = vi.fn();
    const pipeline = new PostProcessPipeline(
      {} as WebGL2RenderingContext,
      { vertex: "vertex", output: "output" },
      [pass],
      onStateChange,
    );

    expect(pipeline.setParameter("noise", "amount", 0.21)).toEqual({
      passName: "noise",
      key: "amount",
      value: 0.21,
    });
    expect(onStateChange).toHaveBeenLastCalledWith({
      passes: [
        expect.objectContaining({
          name: "noise",
          parameters: [expect.objectContaining({ value: 0.21 })],
        }),
      ],
      selectedPassIndex: 0,
    });

    pipeline.render({
      inputTexture: {} as WebGLTexture,
      resolution: [800, 600],
      time: 1,
      debugMode: 2,
    });

    expect(fakes.drawPass).toHaveBeenCalledWith(
      {} as WebGL2RenderingContext,
      expect.objectContaining({
        program: fakes.passProgram,
        uniforms: expect.objectContaining({
          u_amount: { type: "1f", value: 0.21 },
        }),
      }),
    );
  });

  it("resets a pass to its configured defaults", () => {
    const onStateChange = vi.fn();
    const pipeline = new PostProcessPipeline(
      {} as WebGL2RenderingContext,
      { vertex: "vertex", output: "output" },
      [pass],
      onStateChange,
    );
    pipeline.setParameter("noise", "amount", 0.2);

    expect(pipeline.resetPassParameters("noise")).toBe(true);
    expect(pipeline.snapshot.passes[0].parameters?.[0].value).toBe(0.08);
  });

  it.each([4, 6])(
    "renders debug mode %i through the diagnostic output pass",
    (debugMode) => {
      const pipeline = new PostProcessPipeline(
        {} as WebGL2RenderingContext,
        { vertex: "vertex", output: "output" },
        [pass],
        vi.fn(),
      );
      const inputTexture = { kind: "scene" } as unknown as WebGLTexture;

      pipeline.render({
        inputTexture,
        resolution: [800, 600],
        time: 1,
        debugMode,
      });

      expect(fakes.drawPass).toHaveBeenCalledTimes(2);
      expect(fakes.drawPass).toHaveBeenNthCalledWith(
        1,
        {} as WebGL2RenderingContext,
        expect.objectContaining({
          program: fakes.passProgram,
          framebuffer: expect.anything(),
        }),
      );
      expect(fakes.drawPass).toHaveBeenNthCalledWith(
        2,
        {} as WebGL2RenderingContext,
        expect.objectContaining({
          program: fakes.outputProgram,
          framebuffer: null,
          uniforms: expect.objectContaining({
            u_debugMode: { type: "1i", value: debugMode },
          }),
          textures: expect.arrayContaining([
            { name: "u_originalScene", texture: inputTexture },
          ]),
        }),
      );
    },
  );
});
