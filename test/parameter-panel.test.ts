import { describe, expect, it } from "vitest";
import { getParameterPanelCommand } from "../src/ui/parameter-panel";

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
