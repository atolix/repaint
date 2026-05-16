const shaderModules = import.meta.glob("./shaders/**/*.glsl", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export function resolveIncludes(source: string, from = "./shaders/main.frag"): string {
  return source.replace(
    /#include\s+"(.+?)"/g,
    (_, includePath: string) => {
      const baseDir = from.split("/").slice(0, -1).join("/");
      const resolvedPath = normalizePath(`${baseDir}/${includePath}`);

      const included = shaderModules[resolvedPath];

      if (!included) {
        throw new Error(`shader include not found: ${includePath} from ${from}`);
      }

      return resolveIncludes(included, resolvedPath);
    }
  );
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
