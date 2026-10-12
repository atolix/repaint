import { sendHotEvent } from "./shader-hmr";
import {
  buildPostProcessRenderPlan,
  type RenderDestination,
  type TextureSource,
} from "../pipeline/post-process/plan";
import type { PostProcessSnapshot } from "../pipeline/post-process/types";
import type { ResolutionState } from "../renderer/size";

type PipelineLogPass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
  selected?: boolean;
}

export function logPipeline({
  passes: postPasses,
  selectedPassIndex: selectedPostPassIndex,
}: PostProcessSnapshot) {
  const plan = buildPostProcessRenderPlan(postPasses);
  const stepsByPassIndex = new Map(plan.map((step) => [step.passIndex, step]));
  const passes: PipelineLogPass[] = [
    {
      name: "scene",
      enabled: true,
      input: "main.frag",
      output: "sceneFramebuffer",
    },
    ...postPasses.map((pass, index) => {
      const step = stepsByPassIndex.get(index);

      return {
        name: pass.name,
        enabled: pass.enabled,
        input: step ? formatTextureSource(step.input) : "-",
        output: step ? formatRenderDestination(step.output) : "skipped",
        selected: index === selectedPostPassIndex,
      };
    }),
    {
      name: "output",
      enabled: plan.length === 0,
      input: "sceneFramebuffer.texture",
      output: plan.length === 0 ? "screen" : "bypassed",
    },
  ];

  sendHotEvent("pipeline", { passes });
}

function formatTextureSource(source: TextureSource) {
  return source.kind === "scene"
    ? "sceneFramebuffer.texture"
    : `postFramebuffer${source.index}.texture`;
}

function formatRenderDestination(destination: RenderDestination) {
  return destination.kind === "screen"
    ? "screen"
    : `postFramebuffer${destination.index}.texture`;
}

export function logResolution({ width, height, dpr }: ResolutionState) {
  sendHotEvent("resolution", { width, height, dpr });
}
