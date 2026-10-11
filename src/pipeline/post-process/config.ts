import barrelDistortionSource from "../../shaders/effects/barrel-distortion.frag?raw";
import chromaticAberrationSource from "../../shaders/effects/chromatic-aberration.frag?raw";
import contrastSource from "../../shaders/effects/contrast.frag?raw";
import duotoneSource from "../../shaders/effects/duotone.frag?raw";
import edgeDetectSource from "../../shaders/effects/edge-detect.frag?raw";
import embossSource from "../../shaders/effects/emboss.frag?raw";
import glitchSource from "../../shaders/effects/glitch.frag?raw";
import grayscaleSource from "../../shaders/effects/grayscale.frag?raw";
import invertSource from "../../shaders/effects/invert.frag?raw";
import mirrorSource from "../../shaders/effects/mirror.frag?raw";
import noiseSource from "../../shaders/effects/noise.frag?raw";
import pixelateSource from "../../shaders/effects/pixelate.frag?raw";
import posterizeSource from "../../shaders/effects/posterize.frag?raw";
import scanlinesSource from "../../shaders/effects/scanlines.frag?raw";
import sepiaSource from "../../shaders/effects/sepia.frag?raw";
import swirlSource from "../../shaders/effects/swirl.frag?raw";
import thresholdSource from "../../shaders/effects/threshold.frag?raw";
import vignetteSource from "../../shaders/effects/vignette.frag?raw";
import waveDistortionSource from "../../shaders/effects/wave-distortion.frag?raw";
import { resolveIncludes, type ShaderIncludeRoot } from "../../gl/include";
import type { PostProcessPassConfig } from "./types";

type IncludeResolver = typeof resolveIncludes;

const postProcessDefinitions = [
  {
    name: "invert",
    description: "Reverses every color channel for a photographic negative look.",
    source: invertSource,
    path: "./shaders/effects/invert.frag",
    enabled: false,
  },
  {
    name: "noise",
    description: "Adds animated monochrome grain across the image.",
    source: noiseSource,
    path: "./shaders/effects/noise.frag",
    enabled: false,
    parameters: [
      {
        key: "amount",
        label: "Amount",
        uniform: "u_amount",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.08,
      },
    ],
  },
  {
    name: "vignette",
    description: "Darkens the image toward its edges with a soft circular mask.",
    source: vignetteSource,
    path: "./shaders/effects/vignette.frag",
    enabled: false,
    parameters: [
      {
        key: "radius",
        label: "Radius",
        uniform: "u_radius",
        min: 0.2,
        max: 1.4,
        step: 0.01,
        defaultValue: 0.806,
      },
      {
        key: "softness",
        label: "Softness",
        uniform: "u_softness",
        min: 0.01,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.382,
      },
    ],
  },
  {
    name: "chromatic-aberration",
    description: "Separates red and blue channels outward from the image center.",
    source: chromaticAberrationSource,
    path: "./shaders/effects/chromatic-aberration.frag",
    enabled: false,
    parameters: [
      {
        key: "amount",
        label: "Amount",
        uniform: "u_amount",
        min: 0,
        max: 0.05,
        step: 0.001,
        defaultValue: 0.012,
      },
    ],
  },
  {
    name: "pixelate",
    description: "Reduces detail by sampling the image in square pixel blocks.",
    source: pixelateSource,
    path: "./shaders/effects/pixelate.frag",
    enabled: false,
    parameters: [
      {
        key: "size",
        label: "Pixel size",
        uniform: "u_pixelSize",
        min: 1,
        max: 64,
        step: 1,
        defaultValue: 8,
      },
    ],
  },
  {
    name: "scanlines",
    description: "Applies alternating horizontal brightness like a CRT display.",
    source: scanlinesSource,
    path: "./shaders/effects/scanlines.frag",
    enabled: false,
  },
  {
    name: "posterize",
    description: "Quantizes color channels into a small number of tonal levels.",
    source: posterizeSource,
    path: "./shaders/effects/posterize.frag",
    enabled: false,
  },
  {
    name: "sepia",
    description: "Blends the image toward warm, vintage brown tones.",
    source: sepiaSource,
    path: "./shaders/effects/sepia.frag",
    enabled: false,
  },
  {
    name: "edge-detect",
    description: "Highlights luminance edges using a Sobel-style filter.",
    source: edgeDetectSource,
    path: "./shaders/effects/edge-detect.frag",
    enabled: false,
  },
  {
    name: "grayscale",
    description: "Converts the image to luminance-based monochrome.",
    source: grayscaleSource,
    path: "./shaders/effects/grayscale.frag",
    enabled: false,
  },
  {
    name: "threshold",
    description: "Reduces luminance to hard black and white regions.",
    source: thresholdSource,
    path: "./shaders/effects/threshold.frag",
    enabled: false,
  },
  {
    name: "glitch",
    description: "Adds animated horizontal displacement, channel splits, and static.",
    source: glitchSource,
    path: "./shaders/effects/glitch.frag",
    enabled: false,
  },
  {
    name: "barrel-distortion",
    description: "Bends the image outward with a lens-like barrel distortion.",
    source: barrelDistortionSource,
    path: "./shaders/effects/barrel-distortion.frag",
    enabled: false,
  },
  {
    name: "wave-distortion",
    description: "Offsets texture coordinates with animated horizontal and vertical waves.",
    source: waveDistortionSource,
    path: "./shaders/effects/wave-distortion.frag",
    enabled: false,
  },
  {
    name: "contrast",
    description: "Expands the difference between dark and bright colors.",
    source: contrastSource,
    path: "./shaders/effects/contrast.frag",
    enabled: false,
  },
  {
    name: "duotone",
    description: "Maps luminance between deep blue shadows and warm highlights.",
    source: duotoneSource,
    path: "./shaders/effects/duotone.frag",
    enabled: false,
  },
  {
    name: "swirl",
    description: "Rotates pixels around the center with a radial falloff.",
    source: swirlSource,
    path: "./shaders/effects/swirl.frag",
    enabled: false,
  },
  {
    name: "mirror",
    description: "Mirrors the left half of the image across its center.",
    source: mirrorSource,
    path: "./shaders/effects/mirror.frag",
    enabled: false,
  },
  {
    name: "emboss",
    description: "Uses neighboring luminance differences to create raised relief.",
    source: embossSource,
    path: "./shaders/effects/emboss.frag",
    enabled: false,
  },
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
  const { name, description, source, path, enabled } = definition;
  const parameters = "parameters" in definition ? definition.parameters : [];

  return {
    name,
    description,
    path,
    source: includeResolver(source, path),
    enabled,
    ...(parameters.length > 0
      ? { parameters: parameters.map((parameter) => ({ ...parameter })) }
      : {}),
  };
}
