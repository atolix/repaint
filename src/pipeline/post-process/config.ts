import invertSource from "../../shaders/effects/invert.frag?raw";
import { resolveIncludes } from "../../gl/include";
import type { PostProcessPassConfig } from ".";

export function createPostProcessPasses(): PostProcessPassConfig[] {
  return [
    {
      name: "invert",
      source: resolveIncludes(invertSource, "./shaders/effects/invert.frag"),
      enabled: true,
    },
  ];
}
