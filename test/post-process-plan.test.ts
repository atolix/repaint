import { describe, expect, it } from "vitest";
import { buildPostProcessRenderPlan } from "../src/pipeline/post-process/plan";

describe("buildPostProcessRenderPlan", () => {
  it("returns no post-process steps when every pass is disabled", () => {
    expect(
      buildPostProcessRenderPlan([
        { name: "first", enabled: false },
        { name: "second", enabled: false },
      ]),
    ).toEqual([]);
  });

  it("routes one enabled pass directly from the scene to the screen", () => {
    expect(
      buildPostProcessRenderPlan([
        { name: "disabled", enabled: false },
        { name: "enabled", enabled: true },
      ]),
    ).toEqual([
      {
        passIndex: 1,
        name: "enabled",
        input: { kind: "scene" },
        output: { kind: "screen" },
      },
    ]);
  });

  it("ping-pongs intermediate output and finishes on screen", () => {
    expect(
      buildPostProcessRenderPlan([
        { name: "first", enabled: true },
        { name: "skipped", enabled: false },
        { name: "second", enabled: true },
        { name: "third", enabled: true },
        { name: "fourth", enabled: true },
      ]),
    ).toEqual([
      {
        passIndex: 0,
        name: "first",
        input: { kind: "scene" },
        output: { kind: "framebuffer", index: 0 },
      },
      {
        passIndex: 2,
        name: "second",
        input: { kind: "framebuffer", index: 0 },
        output: { kind: "framebuffer", index: 1 },
      },
      {
        passIndex: 3,
        name: "third",
        input: { kind: "framebuffer", index: 1 },
        output: { kind: "framebuffer", index: 0 },
      },
      {
        passIndex: 4,
        name: "fourth",
        input: { kind: "framebuffer", index: 0 },
        output: { kind: "screen" },
      },
    ]);
  });
});
