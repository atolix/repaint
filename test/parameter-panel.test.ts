import { describe, expect, it } from "vitest";
import {
  calculateScrollAdjustment,
  getParameterPanelCommand,
} from "../src/ui/parameter-panel";

describe("getParameterPanelCommand", () => {
  it("opens with P and closes with Q", () => {
    expect(getParameterPanelCommand({ code: "KeyP", repeat: false })).toBe("open");
    expect(getParameterPanelCommand({ code: "KeyQ", repeat: false })).toBe("close");
  });

  it("ignores repeats and unrelated keys", () => {
    expect(getParameterPanelCommand({ code: "KeyP", repeat: true })).toBeNull();
    expect(getParameterPanelCommand({ code: "Escape", repeat: false })).toBeNull();
  });
});

describe("calculateScrollAdjustment", () => {
  it("scrolls only enough to reveal an item beyond either edge", () => {
    expect(calculateScrollAdjustment(10, 100, 0, 20)).toBe(-10);
    expect(calculateScrollAdjustment(10, 100, 90, 115)).toBe(15);
  });

  it("does not scroll an already visible item", () => {
    expect(calculateScrollAdjustment(10, 100, 20, 90)).toBe(0);
  });
});
