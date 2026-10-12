import type { PostProcessPassState } from "./types";

export type TextureSource =
  | { kind: "scene" }
  | { kind: "framebuffer"; index: 0 | 1 };

export type RenderDestination =
  | { kind: "screen" }
  | { kind: "framebuffer"; index: 0 | 1 };

export type PostProcessRenderStep = {
  passIndex: number;
  name: string;
  input: TextureSource;
  output: RenderDestination;
};

export function buildPostProcessRenderPlan(
  passes: readonly PostProcessPassState[],
  renderFinalToTexture = false,
): PostProcessRenderStep[] {
  const enabledPasses = passes
    .map((pass, passIndex) => ({ ...pass, passIndex }))
    .filter((pass) => pass.enabled);

  return enabledPasses.map((pass, enabledIndex) => ({
    passIndex: pass.passIndex,
    name: pass.name,
    input: enabledIndex === 0
      ? { kind: "scene" }
      : { kind: "framebuffer", index: framebufferIndex(enabledIndex - 1) },
    output: enabledIndex === enabledPasses.length - 1 && !renderFinalToTexture
      ? { kind: "screen" }
      : { kind: "framebuffer", index: framebufferIndex(enabledIndex) },
  }));
}

function framebufferIndex(index: number): 0 | 1 {
  return index % 2 === 0 ? 0 : 1;
}
