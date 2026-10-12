import { describe, expect, it } from "vitest";
import { DEBUG_MODE } from "../src/debug/modes";
import { DebugState } from "../src/debug/state";

describe("DebugState", () => {
  it("cycles through all seven modes", () => {
    const state = new DebugState();

    expect(Array.from({ length: 7 }, () => state.cycle())).toEqual([
      DEBUG_MODE.uvCoordinates,
      DEBUG_MODE.radialDistance,
      DEBUG_MODE.uvGrid,
      DEBUG_MODE.luminanceHeatmap,
      DEBUG_MODE.nonFiniteValues,
      DEBUG_MODE.beforeAfter,
      DEBUG_MODE.normal,
    ]);
    expect(state.mode).toBe(DEBUG_MODE.normal);
  });

  it("notifies subscribers immediately and after changes", () => {
    const state = new DebugState();
    const modes: number[] = [];
    const unsubscribe = state.subscribe((mode) => modes.push(mode));

    state.cycle();
    state.cycle();
    unsubscribe();
    state.cycle();

    expect(modes).toEqual([0, 1, 2]);
  });
});
