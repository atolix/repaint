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
  shortcut?: string;
}

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
      shortcut: String(index + 1),
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
