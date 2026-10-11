import { describe, expect, it } from "vitest";
import { getPostProcessCommand } from "../src/pipeline/post-process/controls";

function event(
  overrides: Partial<Parameters<typeof getPostProcessCommand>[0]> = {},
) {
  return {
    code: "",
    key: "",
    repeat: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("getPostProcessCommand", () => {
  it.each([
    ["ArrowDown", "select-next"],
    ["]", "select-next"],
    ["ArrowUp", "select-previous"],
    ["[", "select-previous"],
    ["Home", "select-first"],
    ["End", "select-last"],
    ["Enter", "toggle-selected"],
  ])("maps %s to %s", (key, type) => {
    expect(getPostProcessCommand(event({ key }))).toEqual({ type });
  });

  it("maps physical digit and numpad codes to pass indexes", () => {
    expect(getPostProcessCommand(event({ code: "Digit3", key: "#" }))).toEqual({
      type: "select-at",
      index: 2,
    });
    expect(getPostProcessCommand(event({ code: "Numpad9", key: "9" }))).toEqual({
      type: "select-at",
      index: 8,
    });
  });

  it("uses shift to toggle a numbered pass", () => {
    expect(
      getPostProcessCommand(event({ code: "Digit2", key: "@", shiftKey: true })),
    ).toEqual({ type: "toggle-at", index: 1 });
  });

  it("does not infer digits from event.key", () => {
    expect(getPostProcessCommand(event({ key: "1" }))).toBeNull();
  });

  it("ignores repeated and unrelated keys", () => {
    expect(
      getPostProcessCommand(event({ key: "ArrowDown", repeat: true })),
    ).toBeNull();
    expect(getPostProcessCommand(event({ key: "x", code: "KeyX" }))).toBeNull();
    expect(getPostProcessCommand(event({ key: " ", code: "Space" }))).toBeNull();
  });
});
