import { describe, expect, it } from "vitest";
import { DebugState } from "../src/debug/state";

describe("DebugState", () => {
  it("cycles through four modes", () => {
    const state = new DebugState();

    expect([state.cycle(), state.cycle(), state.cycle(), state.cycle()]).toEqual([
      1,
      2,
      3,
      0,
    ]);
    expect(state.mode).toBe(0);
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
