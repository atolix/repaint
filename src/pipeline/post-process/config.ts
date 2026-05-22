import invertSource from "../../shaders/effects/invert.frag?raw";
import noiseSource from "../../shaders/effects/noise.frag?raw";
import { resolveIncludes, type ShaderIncludeRoot } from "../../gl/include";
import type { PostProcessPassConfig } from ".";

type IncludeResolver = typeof resolveIncludes;

export function createPostProcessPasses(
  includeResolver: IncludeResolver = resolveIncludes
): PostProcessPassConfig[] {
  return [
    createPostProcessPass(
      "invert",
      invertSource,
      "./shaders/effects/invert.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "noise",
      noiseSource,
      "./shaders/effects/noise.frag",
      includeResolver,
      false
    ),
  ];
}

export function createPostProcessIncludeRoots(): ShaderIncludeRoot[] {
  return [
    { path: "./shaders/effects/invert.frag", source: invertSource },
    { path: "./shaders/effects/noise.frag", source: noiseSource },
  ];
}

function createPostProcessPass(
  name: string,
  source: string,
  path: string,
  includeResolver: IncludeResolver,
  enabled = true
): PostProcessPassConfig {
  return {
    name,
    path,
    source: includeResolver(source, path),
    enabled,
  };
}
