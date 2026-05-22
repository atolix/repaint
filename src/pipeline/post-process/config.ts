import chromaticAberrationSource from "../../shaders/effects/chromatic-aberration.frag?raw";
import glitchSource from "../../shaders/effects/glitch.frag?raw";
import invertSource from "../../shaders/effects/invert.frag?raw";
import noiseSource from "../../shaders/effects/noise.frag?raw";
import pixelateSource from "../../shaders/effects/pixelate.frag?raw";
import posterizeSource from "../../shaders/effects/posterize.frag?raw";
import scanlinesSource from "../../shaders/effects/scanlines.frag?raw";
import vignetteSource from "../../shaders/effects/vignette.frag?raw";
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
    createPostProcessPass(
      "vignette",
      vignetteSource,
      "./shaders/effects/vignette.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "chromatic-aberration",
      chromaticAberrationSource,
      "./shaders/effects/chromatic-aberration.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "pixelate",
      pixelateSource,
      "./shaders/effects/pixelate.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "scanlines",
      scanlinesSource,
      "./shaders/effects/scanlines.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "posterize",
      posterizeSource,
      "./shaders/effects/posterize.frag",
      includeResolver,
      false
    ),
    createPostProcessPass(
      "glitch",
      glitchSource,
      "./shaders/effects/glitch.frag",
      includeResolver,
      false
    ),
  ];
}

export function createPostProcessIncludeRoots(): ShaderIncludeRoot[] {
  return [
    { path: "./shaders/effects/invert.frag", source: invertSource },
    { path: "./shaders/effects/noise.frag", source: noiseSource },
    { path: "./shaders/effects/vignette.frag", source: vignetteSource },
    {
      path: "./shaders/effects/chromatic-aberration.frag",
      source: chromaticAberrationSource,
    },
    { path: "./shaders/effects/pixelate.frag", source: pixelateSource },
    { path: "./shaders/effects/scanlines.frag", source: scanlinesSource },
    { path: "./shaders/effects/posterize.frag", source: posterizeSource },
    { path: "./shaders/effects/glitch.frag", source: glitchSource },
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
