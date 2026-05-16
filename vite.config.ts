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
          const status = pass.enabled ? "on " : "off";
          console.log(
            `${index + 1}. [${status}] ${pass.name}  ${pass.input} -> ${pass.output}`
          );
        }

        console.log("");
      })
    }
  }
}

export default defineConfig({
  plugins: [logger()],
})
