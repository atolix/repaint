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
          }

          console.log(
            `${shortcutIndex++}. [${status}] ${pass.name}  ${pass.input} -> ${pass.output}`
          );
        }

        console.log("");
      })

      server.ws.on("shader:compiled", (payload) => {
        console.log(`[shader] \x1b[36m[compiled]\x1b[0m ${payload.path}`);
      });

      server.ws.on("shader:error", (payload) => {
        console.log(`[shader] \x1b[31m[error]\x1b[0m ${payload.path}`);
        console.log(payload.error);
      });
    }
  }
}

export default defineConfig({
  plugins: [logger()],
})
