export type ResolutionState = {
  width: number;
  height: number;
  dpr: number;
};

export type RenderSizeOptions = {
  clientWidth: number;
  clientHeight: number;
  devicePixelRatio: number;
  maxDevicePixelRatio: number;
  maxTextureSize: number;
};

export function calculateRenderSize({
  clientWidth,
  clientHeight,
  devicePixelRatio,
  maxDevicePixelRatio,
  maxTextureSize,
}: RenderSizeOptions): ResolutionState {
  const dpr = Math.min(
    devicePixelRatio,
    maxDevicePixelRatio,
    clientWidth > 0 ? maxTextureSize / clientWidth : devicePixelRatio,
    clientHeight > 0 ? maxTextureSize / clientHeight : devicePixelRatio,
  );

  return {
    width: Math.floor(clientWidth * dpr),
    height: Math.floor(clientHeight * dpr),
    dpr,
  };
}
