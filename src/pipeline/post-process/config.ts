// import barrelDistortionSource from "../../shaders/effects/barrel-distortion.frag?raw";
import chromaticAberrationSource from "../../shaders/effects/chromatic-aberration.frag?raw";
// import contrastSource from "../../shaders/effects/contrast.frag?raw";
import edgeDetectSource from "../../shaders/effects/edge-detect.frag?raw";
// import glitchSource from "../../shaders/effects/glitch.frag?raw";
// import grayscaleSource from "../../shaders/effects/grayscale.frag?raw";
import invertSource from "../../shaders/effects/invert.frag?raw";
import noiseSource from "../../shaders/effects/noise.frag?raw";
import pixelateSource from "../../shaders/effects/pixelate.frag?raw";
import posterizeSource from "../../shaders/effects/posterize.frag?raw";
import scanlinesSource from "../../shaders/effects/scanlines.frag?raw";
import sepiaSource from "../../shaders/effects/sepia.frag?raw";
// import thresholdSource from "../../shaders/effects/threshold.frag?raw";
import vignetteSource from "../../shaders/effects/vignette.frag?raw";
// import waveDistortionSource from "../../shaders/effects/wave-distortion.frag?raw";
import { resolveIncludes, type ShaderIncludeRoot } from "../../gl/include";
import type { PostProcessPassConfig } from ".";

type IncludeResolver = typeof resolveIncludes;

const postProcessDefinitions = [
  {
    name: "invert",
    source: invertSource,
    path: "./shaders/effects/invert.frag",
    enabled: false,
  },
  {
    name: "noise",
    source: noiseSource,
    path: "./shaders/effects/noise.frag",
    enabled: false,
  },
  {
    name: "vignette",
    source: vignetteSource,
    path: "./shaders/effects/vignette.frag",
    enabled: false,
  },
  {
    name: "chromatic-aberration",
    source: chromaticAberrationSource,
    path: "./shaders/effects/chromatic-aberration.frag",
    enabled: false,
  },
  {
    name: "pixelate",
    source: pixelateSource,
    path: "./shaders/effects/pixelate.frag",
    enabled: false,
  },
  {
    name: "scanlines",
    source: scanlinesSource,
    path: "./shaders/effects/scanlines.frag",
    enabled: false,
  },
  {
    name: "posterize",
    source: posterizeSource,
    path: "./shaders/effects/posterize.frag",
    enabled: false,
  },
  {
    name: "sepia",
    source: sepiaSource,
    path: "./shaders/effects/sepia.frag",
    enabled: false,
  },
  {
    name: "edge-detect",
    source: edgeDetectSource,
    path: "./shaders/effects/edge-detect.frag",
    enabled: false,
  },
  // {
  //   name: "grayscale",
  //   source: grayscaleSource,
  //   path: "./shaders/effects/grayscale.frag",
  //   enabled: false,
  // },
  // {
  //   name: "threshold",
  //   source: thresholdSource,
  //   path: "./shaders/effects/threshold.frag",
  //   enabled: false,
  // },
  // {
  //   name: "glitch",
  //   source: glitchSource,
  //   path: "./shaders/effects/glitch.frag",
  //   enabled: false,
  // },
  // {
  //   name: "barrel-distortion",
  //   source: barrelDistortionSource,
  //   path: "./shaders/effects/barrel-distortion.frag",
  //   enabled: false,
  // },
  // {
  //   name: "wave-distortion",
  //   source: waveDistortionSource,
  //   path: "./shaders/effects/wave-distortion.frag",
  //   enabled: false,
  // },
  // {
  //   name: "contrast",
  //   source: contrastSource,
  //   path: "./shaders/effects/contrast.frag",
  //   enabled: false,
  // },
] as const;

export function createPostProcessPasses(
  includeResolver: IncludeResolver = resolveIncludes
): PostProcessPassConfig[] {
  return postProcessDefinitions.map((definition) =>
    createPostProcessPass(definition, includeResolver)
  );
}

export function createPostProcessIncludeRoots(): ShaderIncludeRoot[] {
  return postProcessDefinitions.map(({ path, source }) => ({ path, source }));
}

function createPostProcessPass(
  definition: typeof postProcessDefinitions[number],
  includeResolver: IncludeResolver
): PostProcessPassConfig {
  const { name, source, path, enabled } = definition;

  return {
    name,
    path,
    source: includeResolver(source, path),
    enabled,
  };
}
