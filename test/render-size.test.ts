import { describe, expect, it } from "vitest";
import { calculateRenderSize } from "../src/renderer/size";

const defaults = {
  clientWidth: 800,
  clientHeight: 600,
  devicePixelRatio: 1,
  maxDevicePixelRatio: 2,
  maxTextureSize: 8192,
};

describe("calculateRenderSize", () => {
  it("uses CSS size at DPR 1", () => {
    expect(calculateRenderSize(defaults)).toEqual({
      width: 800,
      height: 600,
      dpr: 1,
    });
  });

  it("caps device pixel ratio", () => {
    expect(
      calculateRenderSize({ ...defaults, devicePixelRatio: 3 }),
    ).toEqual({
      width: 1600,
      height: 1200,
      dpr: 2,
    });
  });

  it("scales both dimensions to the GPU texture limit", () => {
    expect(
      calculateRenderSize({
        ...defaults,
        clientWidth: 5000,
        clientHeight: 2500,
        devicePixelRatio: 2,
        maxTextureSize: 4000,
      }),
    ).toEqual({
      width: 4000,
      height: 2000,
      dpr: 0.8,
    });
  });

  it("preserves a zero-sized dimension without dividing by zero", () => {
    expect(
      calculateRenderSize({
        ...defaults,
        clientWidth: 0,
        devicePixelRatio: 2,
      }),
    ).toEqual({
      width: 0,
      height: 1200,
      dpr: 2,
    });
  });

  it("floors fractional backing dimensions", () => {
    expect(
      calculateRenderSize({
        ...defaults,
        clientWidth: 100.5,
        clientHeight: 50.5,
        devicePixelRatio: 1.5,
      }),
    ).toEqual({
      width: 150,
      height: 75,
      dpr: 1.5,
    });
  });
});
