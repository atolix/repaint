import {
  createShaderIncludeResolver,
  type ShaderIncludeGraph,
  type ShaderIncludeRoot,
} from "./include-resolver";

export { createShaderIncludeResolver } from "./include-resolver";
export type {
  ShaderIncludeGraph,
  ShaderIncludeRoot,
  ShaderModuleMap,
} from "./include-resolver";

const rawShaderModules = import.meta.glob("../shaders/**/*.glsl", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const shaderModules = Object.fromEntries(
  Object.entries(rawShaderModules).map(([path, source]) => [
    path.replace("../shaders/", "./shaders/"),
    source,
  ])
);

const shaderIncludeResolver = createShaderIncludeResolver(shaderModules);

export function resolveIncludes(
  source: string,
  from = "./shaders/main.frag",
  stack = [from]
): string {
  return shaderIncludeResolver.resolveIncludes(source, from, stack);
}

export function collectIncludeGraph(roots: ShaderIncludeRoot[]): ShaderIncludeGraph {
  return shaderIncludeResolver.collectIncludeGraph(roots);
}
