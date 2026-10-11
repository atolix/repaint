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
});
