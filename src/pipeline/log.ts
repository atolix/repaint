type PipelineLogOptions = {
  postPasses: {
    name: string;
    enabled: boolean;
  }[];
};

type PipelineLogPass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
}

type ResolutionLogOptions = {
  width: number;
  height: number;
  dpr: number;
};

export function logPipeline({ postPasses }: PipelineLogOptions) {
  send([
    {
      name: "scene",
      enabled: true,
      input: "main.frag",
      output: "sceneFramebuffer",
    },
    ...postPasses.map((pass, index) => ({
      name: pass.name,
      enabled: pass.enabled,
      input: index === 0 ? "sceneFramebuffer.texture" : "previousPost.texture",
      output: pass.enabled ? "nextPost/screen" : "skipped",
    })),
    {
      name: "output",
      enabled: true,
      input: "finalTexture",
      output: "screen",
    },
  ]);
}

export function logResolution({ width, height, dpr }: ResolutionLogOptions) {
  if (!import.meta.hot) return;

  import.meta.hot.send("resolution", { width, height, dpr });
}

function send(passes: PipelineLogPass[]) {
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("pipeline", { passes })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}
