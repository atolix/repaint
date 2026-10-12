import { describe, expect, it, vi } from "vitest";
import {
  bindPlaybackShortcut,
  getPlaybackCommand,
} from "../src/time/controls";
import { formatElapsedTime } from "../src/ui/playback-controls";
import { createPngFilename } from "../src/ui/png-export";

describe("getPlaybackCommand", () => {
  it("maps Space to pause/resume", () => {
    expect(getPlaybackCommand({ code: "Space", repeat: false })).toBe(
      "toggle-paused",
    );
  });

  it("maps horizontal arrows to frame stepping, including repeats", () => {
    expect(getPlaybackCommand({ code: "ArrowRight", repeat: false })).toBe(
      "step-forward",
    );
    expect(getPlaybackCommand({ code: "ArrowLeft", repeat: true })).toBe(
      "step-backward",
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
    const controls = createControls(false);
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

  it("steps with horizontal arrows only while paused", () => {
    const target = new EventTarget();
    const controls = createControls(true);
    bindPlaybackShortcut(controls, target as unknown as Window);
    const forward = keyboardEvent("ArrowRight", true);
    const backward = keyboardEvent("ArrowLeft", true, true);

    target.dispatchEvent(forward);
    target.dispatchEvent(backward);

    expect(forward.defaultPrevented).toBe(true);
    expect(backward.defaultPrevented).toBe(true);
    expect(controls.stepForward).toHaveBeenCalledOnce();
    expect(controls.stepBackward).toHaveBeenCalledOnce();
  });

  it("leaves horizontal arrows untouched while playing", () => {
    const target = new EventTarget();
    const controls = createControls(false);
    bindPlaybackShortcut(controls, target as unknown as Window);
    const event = keyboardEvent("ArrowRight", true);

    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(controls.stepForward).not.toHaveBeenCalled();
  });
});

describe("formatElapsedTime", () => {
  it("formats centiseconds and expands to hours when needed", () => {
    expect(formatElapsedTime(0)).toBe("00:00.00");
    expect(formatElapsedTime(65.439)).toBe("01:05.43");
    expect(formatElapsedTime(3_661.2)).toBe("01:01:01.20");
  });
});

describe("createPngFilename", () => {
  it("creates a portable timestamped filename", () => {
    expect(createPngFilename(new Date("2026-10-12T03:04:05.678Z"))).toBe(
      "repaint-2026-10-12T03-04-05Z.png",
    );
  });
});

function createControls(paused: boolean) {
  return {
    snapshot: { paused },
    togglePaused: vi.fn(),
    stepForward: vi.fn(),
    stepBackward: vi.fn(),
  };
}

function keyboardEvent(code: string, cancelable = false, repeat = false) {
  const event = new Event("keydown", { cancelable });
  Object.defineProperties(event, {
    code: { value: code },
    repeat: { value: repeat },
  });
  return event;
}
