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

export function resolveIncludes(
  source: string,
  from = "./shaders/main.frag",
  stack = [from]
): string {
  return source.replace(
    /#include\s+"(.+?)"/g,
    (_, includePath: string) => {
      const resolvedPath = resolveIncludePath(from, includePath);

      if (stack.includes(resolvedPath)) {
        throw new Error(`shader include cycle: ${[...stack, resolvedPath].join(" -> ")}`);
      }

      const included = shaderModules[resolvedPath];

      if (!included) {
        throw new Error(`shader include not found: ${includePath} from ${from}`);
      }

      return resolveIncludes(included, resolvedPath, [...stack, resolvedPath]);
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
  const includes = [...source.matchAll(/#include\s+"(.+?)"/g)].map((match) =>
    resolveIncludePath(from, match[1])
  );

  graph[from] = includes;

  for (const includePath of includes) {
    if (stack.includes(includePath)) {
      throw new Error(`shader include cycle: ${[...stack, includePath].join(" -> ")}`);
    }

    const included = shaderModules[includePath];

    if (!included) {
      throw new Error(`shader include not found: ${includePath} from ${from}`);
    }

    collectIncludes(included, includePath, graph, [...stack, includePath]);
  }
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
