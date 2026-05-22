import invertSource from "../../shaders/effects/invert.frag?raw";
import noiseSource from "../../shaders/effects/noise.frag?raw";
import { resolveIncludes } from "../../gl/include";
import type { PostProcessPassConfig } from ".";

export function createPostProcessPasses(): PostProcessPassConfig[] {
  return [
    createPostProcessPass("invert", invertSource, "./shaders/effects/invert.frag", false),
    createPostProcessPass("noise", noiseSource, "./shaders/effects/noise.frag", false),
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
    path,
    source: resolveIncludes(source, path),
    enabled,
  };
}
