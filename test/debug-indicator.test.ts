import { describe, expect, it } from "vitest";
import { getDebugModeLabel } from "../src/ui/debug-indicator";

describe("getDebugModeLabel", () => {
  it.each([
    [1, "UV coordinates"],
    [2, "Radial distance"],
    [3, "UV grid"],
    [4, "Luminance heatmap"],
    [5, "Invalid color"],
    [6, "Before / after"],
  ])("describes debug mode %i", (mode, label) => {
    expect(getDebugModeLabel(mode)).toBe(label);
  });

  it("hides normal and unknown modes", () => {
    expect(getDebugModeLabel(0)).toBeNull();
    expect(getDebugModeLabel(7)).toBeNull();
  });
});
