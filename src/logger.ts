type PipelineLogPass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
}

export function sendLogPipeline(passes: PipelineLogPass[]) {
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("pipeline", { passes })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}
