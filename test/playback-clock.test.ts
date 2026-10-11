import { describe, expect, it, vi } from "vitest";
import { PlaybackClock } from "../src/time/playback-clock";

describe("PlaybackClock", () => {
  it("advances from requestAnimationFrame timestamps in seconds", () => {
    const clock = new PlaybackClock();

    expect(clock.tick(1_000)).toBe(0);
    expect(clock.tick(1_250)).toBeCloseTo(0.25);
  });

  it("applies playback speed to elapsed time", () => {
    const clock = new PlaybackClock();
    clock.tick(0);
    clock.setSpeed(2);

    expect(clock.tick(500)).toBe(1);
  });

  it("does not advance while paused or jump after resuming", () => {
    const clock = new PlaybackClock();
    clock.tick(0);
    clock.togglePaused();

    expect(clock.tick(1_000)).toBe(0);

    clock.togglePaused();
    expect(clock.tick(1_500)).toBe(0.5);
  });

  it("resets and steps by one 60 fps frame while paused", () => {
    const clock = new PlaybackClock();
    clock.tick(0);
    clock.tick(500);
    clock.reset();

    expect(clock.time).toBe(0);

    clock.stepForward();
    expect(clock.time).toBe(0);

    clock.togglePaused();
    clock.stepForward();
    expect(clock.time).toBeCloseTo(1 / 60);

    clock.stepBackward();
    expect(clock.time).toBe(0);

    clock.stepBackward();
    expect(clock.time).toBe(0);
  });

  it("publishes playback state and supports unsubscribe", () => {
    const clock = new PlaybackClock();
    const listener = vi.fn();
    const unsubscribe = clock.subscribe(listener);

    clock.togglePaused();
    clock.setSpeed(0.5);
    unsubscribe();
    clock.reset();

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith({
      elapsedSeconds: 0,
      paused: true,
      speed: 0.5,
    });
  });

  it("publishes elapsed time after ticking, resetting, and stepping", () => {
    const clock = new PlaybackClock();
    const elapsedTimes: number[] = [];
    clock.subscribe((state) => elapsedTimes.push(state.elapsedSeconds));

    clock.tick(0);
    clock.tick(250);
    clock.reset();
    clock.togglePaused();
    clock.stepForward();

    expect(elapsedTimes).toEqual([0, 0.25, 0, 0, 1 / 60]);
  });

  it("rejects invalid timestamps and speeds", () => {
    const clock = new PlaybackClock();

    expect(() => clock.tick(Number.NaN)).toThrow(TypeError);
    clock.tick(1);
    expect(() => clock.tick(0)).toThrow(RangeError);
    expect(() => clock.setSpeed(0)).toThrow(RangeError);
  });
});
