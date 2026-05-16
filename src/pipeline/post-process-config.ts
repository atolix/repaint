import { resolveIncludes } from "../gl/include";
import type { PostProcessPassConfig } from "./post-process";

export function createPostProcessPasses(invertSource: string): PostProcessPassConfig[] {
  return [
    {
      name: "invert",
      source: resolveIncludes(invertSource, "./shaders/effects/invert.frag"),
      enabled: true,
    },
  ];
}
