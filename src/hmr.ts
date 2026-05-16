import { resolveIncludes } from "./gl/include";

export function reloadShader(
  path: string,
  source: string,
  update: (source: string) => string | null,
  onError: (message: string) => void,
  onSuccess: () => void
) {
  const resolvedSource = resolveIncludes(source, path);
  const error = update(resolvedSource);

  if (error) onError(error);
  else onSuccess();
}
