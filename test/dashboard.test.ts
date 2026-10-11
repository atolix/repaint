import { describe, expect, it } from "vitest";
import {
  renderDashboard,
  type DashboardState,
} from "../src/dev-dashboard/dashboard";

function state(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    passes: [],
    resolution: null,
    shader: null,
    includeGraph: null,
    ...overrides,
  };
}

describe("renderDashboard", () => {
  it("renders explicit waiting states", () => {
    const dashboard = renderDashboard(state());

    expect(dashboard).toContain("waiting for first frame");
    expect(dashboard).toContain("waiting for pipeline state");
    expect(dashboard).toContain("waiting for compile status");
    expect(dashboard).toContain("waiting for include graph");
  });

  it("renders enabled order, selection, and bypassed output", () => {
    const dashboard = renderDashboard(state({
      passes: [
        { name: "scene", enabled: true, input: "main", output: "scene" },
        {
          name: "first",
          enabled: true,
          input: "scene",
          output: "post0",
          selected: true,
        },
        {
          name: "second",
          enabled: true,
          input: "post0",
          output: "screen",
        },
        { name: "output", enabled: false, input: "scene", output: "bypassed" },
      ],
    }));

    expect(dashboard).toContain("enabled: [first] -> [second]");
    expect(dashboard).toContain("selected: [first]");
    expect(dashboard).toContain(
      "bypassed; last enabled post-process pass writes to screen",
    );
  });

  it("renders shader errors on separate indented lines", () => {
    const dashboard = renderDashboard(state({
      shader: {
        status: "error",
        path: "main.frag",
        error: "line one\nline two",
      },
    }));

    expect(dashboard).toContain("[error]");
    expect(dashboard).toContain("  line one\n  line two");
  });

  it("summarizes and truncates a large include graph", () => {
    const children = Array.from({ length: 10 }, (_, index) => `./lib/${index}.glsl`);
    const includeGraph = Object.fromEntries([
      ["./main.frag", children],
      ...children.map((child) => [child, []]),
    ]);
    const dashboard = renderDashboard(state({ includeGraph }));

    expect(dashboard).toContain("1 roots, 10 includes");
    expect(dashboard).toContain("more lines hidden");
  });
});
