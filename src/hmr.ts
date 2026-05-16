import { resolveIncludes } from "./gl/include";

export function reloadShader(
  path: string,
  source: string,
  update: (source: string) => string | null,
) {
  const resolvedSource = resolveIncludes(source, path);
  const error = update(resolvedSource);

  if (!error) sendSuccessLog(path)
  else sendErrorLog(path, error)
}

function sendSuccessLog(path: string) {
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("shader:compiled", { path: path })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}

function sendErrorLog(path: string, error: string) {
  if (!import.meta.hot) return;

  window.setTimeout(() => {
    try {
      import.meta.hot?.send("shader:error", { path: path, error: error })
    } catch {
      console.log('websocket not ready.')
    }
  }, 100);
}
