import { defineConfig, type Plugin } from "vite";
import {
  renderDashboard,
  type DashboardState,
} from "./src/dev/dashboard.ts";

function dashboardPlugin(): Plugin {
  return {
    name: "dashboard",
    configureServer(server) {
      const state: DashboardState = {
        passes: [],
        resolution: null,
        shader: null,
        includeGraph: null,
      };
      const writeDashboard = createDashboardWriter();
      const render = () => writeDashboard(renderDashboard(state));

      scheduleInitialDashboardRender(server.httpServer, render);

      server.ws.on("pipeline", (payload) => {
        state.passes = payload.passes;
        render();
      });

      server.ws.on("resolution", (payload) => {
        state.resolution = payload;
        render();
      });

      server.ws.on("shader:compiled", (payload) => {
        state.shader = {
          status: "compiled",
          path: payload.path,
        };
        render();
      });

      server.ws.on("shader:error", (payload) => {
        state.shader = {
          status: "error",
          path: payload.path,
          error: payload.error,
        };
        render();
      });

      server.ws.on("shader:include-graph", (payload) => {
        state.includeGraph = payload.graph;
        render();
      });
    },
  };
}

function scheduleInitialDashboardRender(
  httpServer: { once: (event: "listening", listener: () => void) => void } | null,
  render: () => void,
) {
  if (!httpServer) {
    setTimeout(render, 0);
    return;
  }

  httpServer.once("listening", () => {
    setTimeout(render, 50);
  });
}

function createDashboardWriter() {
  const canRepaint = Boolean(process.stdout.isTTY && !process.env.CI);
  let previousLineCount = 0;

  return (dashboard: string) => {
    if (!canRepaint) {
      console.log(dashboard);
      return;
    }

    if (previousLineCount > 0) {
      process.stdout.write(`\x1b[${previousLineCount}F\x1b[0J`);
    }

    process.stdout.write(`${dashboard}\n`);
    previousLineCount = dashboard.split("\n").length;
  };
}

export default defineConfig({
  plugins: process.env.VITEST ? [] : [dashboardPlugin()],
});
