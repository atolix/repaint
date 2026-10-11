import { describe, expect, it, vi } from "vitest";
import {
  bindPlaybackShortcut,
  getPlaybackCommand,
} from "../src/time/controls";

describe("getPlaybackCommand", () => {
  it("maps Space to pause/resume", () => {
    expect(getPlaybackCommand({ code: "Space", repeat: false })).toBe(
      "toggle-paused",
    );
  });

  it("ignores repeats and unrelated keys", () => {
    expect(getPlaybackCommand({ code: "Space", repeat: true })).toBeNull();
    expect(getPlaybackCommand({ code: "Enter", repeat: false })).toBeNull();
  });
});

describe("bindPlaybackShortcut", () => {
  it("prevents the default Space action and toggles playback", () => {
    const target = new EventTarget();
    const controls = { togglePaused: vi.fn() };
    const unbind = bindPlaybackShortcut(
      controls,
      target as unknown as Window,
    );
    const event = keyboardEvent("Space", true);

    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(controls.togglePaused).toHaveBeenCalledOnce();

    unbind();
    target.dispatchEvent(keyboardEvent("Space"));
    expect(controls.togglePaused).toHaveBeenCalledOnce();
  });
});

function keyboardEvent(code: string, cancelable = false) {
  const event = new Event("keydown", { cancelable });
  Object.defineProperties(event, {
    code: { value: code },
    repeat: { value: false },
  });
  return event;
}
