import invertSource from "../../shaders/effects/invert.frag?raw";
import { resolveIncludes } from "../../gl/include";
import type { PostProcessPassConfig } from ".";

export function createPostProcessPasses(): PostProcessPassConfig[] {
  return [
    createPostProcessPass("invert", invertSource, "./shaders/effects/invert.frag"),
  ];
}

function createPostProcessPass(
  name: string,
  source: string,
  path: string,
  enabled = true
): PostProcessPassConfig {
  return {
    name,
    source: resolveIncludes(source, path),
    enabled,
  };
}
