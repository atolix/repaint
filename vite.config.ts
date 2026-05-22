import { defineConfig, type Plugin } from "vite";

function logger(): Plugin {
  return {
    name: "logger",
    configureServer(server) {
      console.log("repaint logger plugin loaded");

      server.ws.on("pipeline", (payload) => {
        console.log("");
        console.log("scene:");

        let shortcutIndex = 1;
        const enabledPostPasses = payload.passes.filter(
          (pass) => pass.name !== "scene" && pass.name !== "output" && pass.enabled
        );

        for (const pass of payload.passes) {
          const status = pass.enabled
            ? "\x1b[36mon\x1b[0m"
            : "\x1b[90moff\x1b[0m";

          if (pass.name === "scene") {
            console.log(`   ${pass.input} -> ${pass.output}`);
            continue;
          }

          if (pass.name === "output") {
            console.log("");
            console.log("output:");
            console.log(`   ${pass.input} -> ${pass.output}`);
            continue;
          }

          if (shortcutIndex === 1) {
            console.log("");
            console.log("post-process:");
            console.log(
              `   enabled: ${
                enabledPostPasses.length > 0
                  ? enabledPostPasses.map((pass) => `[${pass.name}]`).join(" -> ")
                  : "none"
              }`
            );
          }

          console.log(
            `${shortcutIndex++}. [${status}] ${pass.name}  ${pass.input} -> ${pass.output}`
          );
        }

        console.log("");
      })

      server.ws.on("resolution", (payload) => {
        console.log(
          `[render] resolution ${payload.width}x${payload.height} @${payload.dpr}x`
        );
      });

      server.ws.on("shader:compiled", (payload) => {
        console.log(`[shader] \x1b[36m[compiled]\x1b[0m ${payload.path}`);
      });

      server.ws.on("shader:error", (payload) => {
        console.log(`[shader] \x1b[31m[error]\x1b[0m ${payload.path}`);
        console.log(payload.error);
      });

      server.ws.on("shader:include-graph", (payload) => {
        console.log("");
        console.log("[shader] include graph:");

        logIncludeTree(payload.graph);

        console.log("");
      });
    }
  }
}

function logIncludeTree(graph: Record<string, string[]>) {
  const included = new Set(Object.values(graph).flat());
  const roots = Object.keys(graph).filter((path) => !included.has(path));

  for (const root of roots) {
    console.log(`   ${root}`);
    logIncludeChildren(graph, root, "   ");
  }
}

function logIncludeChildren(
  graph: Record<string, string[]>,
  path: string,
  prefix: string,
  stack = [path]
) {
  const includes = graph[path] ?? [];

  includes.forEach((includePath, index) => {
    const isLast = index === includes.length - 1;
    const branch = isLast ? "└─" : "├─";
    const childPrefix = `${prefix}${isLast ? "  " : "│ "}`;

    console.log(`${prefix}${branch} ${includePath}`);

    if (stack.includes(includePath)) {
      console.log(`${childPrefix}└─ (cycle)`);
      return;
    }

    logIncludeChildren(graph, includePath, childPrefix, [...stack, includePath]);
  });
}

export default defineConfig({
  plugins: [logger()],
})
