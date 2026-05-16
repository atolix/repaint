type PipelineLogPass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
}

export function sendLogPipeline(passes: PipelineLogPass[]) {
  if (!import.meta.hot) return;

  import.meta.hot.send("pipeline", { passes })
}
