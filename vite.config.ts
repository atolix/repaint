import { defineConfig, type Plugin } from "vite";

function logger(): Plugin {
  return {
    name: "logger",
    configureServer(server) {
      console.log("repaint logger plugin loaded");

      server.ws.on("pipeline", (payload) => {
        console.log("");
        console.log("current:")

        for (const [index, pass] of payload.passes.entries()) {
          const status = pass.enabled ? "on" : "off";
          const shortcut = pass.shortcut ? ` key:${pass.shortcut}` : "";
          console.log(
            `${index + 1}. [${status}]${shortcut} ${pass.name}  ${pass.input} -> ${pass.output}`
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
