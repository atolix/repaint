import type { ShaderIncludeGraph } from "./gl/include-resolver";
import { resolveIncludes } from "./gl/include";

type HotEventPayload = Record<string, unknown>;

export function reloadShader(
  path: string,
  source: string,
  update: (source: string) => string | null,
) {
  try {
    const resolvedSource = resolveIncludes(source, path);
    const error = update(resolvedSource);

    if (!error) logShaderCompiled(path);
    else logShaderError(path, error);
  } catch (error) {
    logShaderError(path, error instanceof Error ? error.message : String(error));
  }
}

export function logShaderCompiled(path: string) {
  sendHotEvent("shader:compiled", { path });
}

export function logShaderError(path: string, error: string) {
  sendHotEvent("shader:error", { path, error });
}

export function logIncludeGraph(graph: ShaderIncludeGraph) {
  sendHotEvent("shader:include-graph", { graph });
}

export function sendHotEvent(
  event: string,
  payload: HotEventPayload,
) {
  import.meta.hot?.send(event, payload);
}
