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

export type ShaderIncludeRoot = {
  path: string;
  source: string;
};

export type ShaderIncludeGraph = Record<string, string[]>;

const includePattern = /#include\s+"(.+?)"/g;

export function resolveIncludes(
  source: string,
  from = "./shaders/main.frag",
  stack = [from]
): string {
  return source.replace(
    includePattern,
    (_, includePath: string) => {
      const { path, source } = readInclude(from, includePath, stack);

      return resolveIncludes(source, path, [...stack, path]);
    }
  );
}

export function collectIncludeGraph(roots: ShaderIncludeRoot[]): ShaderIncludeGraph {
  const graph: ShaderIncludeGraph = {};

  for (const root of roots) {
    collectIncludes(root.source, root.path, graph, [root.path]);
  }

  return graph;
}

function collectIncludes(
  source: string,
  from: string,
  graph: ShaderIncludeGraph,
  stack: string[]
) {
  const includes = listIncludePaths(source, from);

  graph[from] = includes;

  for (const includePath of includes) {
    const included = readIncludeByPath(from, includePath, stack);

    collectIncludes(included, includePath, graph, [...stack, includePath]);
  }
}

function listIncludePaths(source: string, from: string) {
  return [...source.matchAll(includePattern)].map((match) =>
    resolveIncludePath(from, match[1])
  );
}

function readInclude(from: string, includePath: string, stack: string[]) {
  const path = resolveIncludePath(from, includePath);
  const source = readIncludeByPath(from, path, stack, includePath);

  return { path, source };
}

function readIncludeByPath(
  from: string,
  path: string,
  stack: string[],
  displayPath = path
) {
  if (stack.includes(path)) {
    throw new Error(`shader include cycle: ${[...stack, path].join(" -> ")}`);
  }

  const source = shaderModules[path];

  if (!source) {
    throw new Error(`shader include not found: ${displayPath} from ${from}`);
  }

  return source;
}

function resolveIncludePath(from: string, includePath: string) {
  const baseDir = from.split("/").slice(0, -1).join("/");

  return normalizePath(`${baseDir}/${includePath}`);
}

function normalizePath(path: string): string {
  const parts: string[] = [];

  for (const part of path.split("/")) {
    if (!part || part === ".") continue;

    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  return `./${parts.join("/")}`;
}
