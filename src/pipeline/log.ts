import { sendHotEvent } from "../hmr";

type PipelineLogOptions = {
  postPasses: {
    name: string;
    enabled: boolean;
  }[];
  selectedPostPassIndex?: number;
};

type PipelineLogPass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
  selected?: boolean;
}

type ResolutionLogOptions = {
  width: number;
  height: number;
  dpr: number;
};

export function logPipeline({ postPasses, selectedPostPassIndex }: PipelineLogOptions) {
  const enabledPasses = postPasses.filter((pass) => pass.enabled);
  let previousOutput = "sceneFramebuffer.texture";
  let enabledPassIndex = 0;
  const passes: PipelineLogPass[] = [
    {
      name: "scene",
      enabled: true,
      input: "main.frag",
      output: "sceneFramebuffer",
    },
    ...postPasses.map((pass, index) => {
      const input = pass.enabled ? previousOutput : "-";
      const isLastEnabled = enabledPassIndex === enabledPasses.length - 1;
      const output = pass.enabled
        ? isLastEnabled
          ? "screen"
          : `postFramebuffer${enabledPassIndex % 2}.texture`
        : "skipped";

      if (pass.enabled) {
        previousOutput = output;
        enabledPassIndex += 1;
      }

      return {
        name: pass.name,
        enabled: pass.enabled,
        input,
        output,
        selected: index === selectedPostPassIndex,
      };
    }),
    {
      name: "output",
      enabled: enabledPasses.length === 0,
      input: "sceneFramebuffer.texture",
      output: enabledPasses.length === 0 ? "screen" : "bypassed",
    },
  ];

  sendHotEvent("pipeline", { passes });
}

export function logResolution({ width, height, dpr }: ResolutionLogOptions) {
  sendHotEvent("resolution", { width, height, dpr }, 0);
}
