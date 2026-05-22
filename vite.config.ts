import { defineConfig, type Plugin } from "vite";

function logger(): Plugin {
  return {
    name: "logger",
    configureServer(server) {
      console.log("repaint logger plugin loaded");

      server.ws.on("pipeline", (payload) => {
        console.log("");
        console.log("current:")

        let shortcutIndex = 1;

        for (const pass of payload.passes) {
          const status = pass.enabled
            ? "\x1b[36mon\x1b[0m"
            : "\x1b[90moff\x1b[0m";
          const isFixedPass = pass.name === "scene" || pass.name === "output";

          if (isFixedPass) {
            console.log(`   ${pass.name}  ${pass.input} -> ${pass.output}`);
            continue;
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
