import { resolveIncludes } from "./gl/include";

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
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("shader:compiled", { path: path })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}

export function logShaderError(path: string, error: string) {
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("shader:error", { path: path, error: error })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}
