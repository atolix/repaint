const includeGraphPreviewLineLimit = 8;

export type PipelinePass = {
  name: string;
  enabled: boolean;
  input: string;
  output: string;
  selected?: boolean;
};

export type ResolutionState = {
  width: number;
  height: number;
  dpr: number;
};

export type ShaderEventState = {
  status: "compiled" | "error";
  path: string;
  error?: string;
};

export type DashboardState = {
  passes: PipelinePass[];
  resolution: ResolutionState | null;
  shader: ShaderEventState | null;
  includeGraph: Record<string, string[]> | null;
};

export function renderDashboard(state: DashboardState) {
  const lines = [
    "repaint dev",
    "",
    ...renderResolution(state.resolution),
    "",
    ...renderPipeline(state.passes),
    "",
    ...renderShader(state.shader),
    "",
    ...renderIncludeGraph(state.includeGraph),
  ];

  return lines.join("\n");
}

function renderResolution(resolution: ResolutionState | null) {
  return [
    "resolution",
    resolution
      ? `  ${resolution.width}x${resolution.height} @${resolution.dpr}x`
      : "  waiting for first frame",
  ];
}

function renderPipeline(passes: PipelinePass[]) {
  if (passes.length === 0) {
    return [
      "scene",
      "  waiting for pipeline state",
      "",
      "post-process",
      "  waiting for pipeline state",
      "",
      "output",
      "  waiting for pipeline state",
    ];
  }

  const scenePass = passes.find((pass) => pass.name === "scene");
  const outputPass = passes.find((pass) => pass.name === "output");
  const postPasses = passes.filter(
    (pass) => pass.name !== "scene" && pass.name !== "output"
  );
  const enabledPostPasses = postPasses.filter((pass) => pass.enabled);
  const selectedPostPass = postPasses.find((pass) => pass.selected);
  const nameWidth = Math.max(4, ...postPasses.map((pass) => pass.name.length));

  return [
    "scene",
    scenePass ? `  ${scenePass.input} -> ${scenePass.output}` : "  none",
    "",
    "post-process",
    `  enabled: ${formatEnabledChain(enabledPostPasses)}`,
    `  selected: ${selectedPostPass ? `[${selectedPostPass.name}]` : "none"}`,
    "",
    ...postPasses.map((pass, index) =>
      renderPostProcessPass(pass, index, nameWidth)
    ),
    "",
    "output",
    outputPass?.enabled
      ? `  ${outputPass.input} -> ${outputPass.output}`
      : "  bypassed; last enabled post-process pass writes to screen",
  ];
}

function renderPostProcessPass(
  pass: PipelinePass,
  index: number,
  nameWidth: number
) {
  const marker = pass.selected ? ">" : " ";
  const status = pass.enabled ? color("on ", "cyan") : color("off", "gray");
  const number = String(index + 1).padStart(2, " ");
  const name = pass.name.padEnd(nameWidth, " ");

  return `${marker} ${number}. [${status}] ${name}  ${pass.input} -> ${pass.output}`;
}

function renderShader(shader: ShaderEventState | null) {
  if (!shader) {
    return ["shader", "  waiting for compile status"];
  }

  const status = shader.status === "compiled"
    ? color("[compiled]", "cyan")
    : color("[error]", "red");
  const lines = ["shader", `  last: ${status} ${shader.path}`];

  if (shader.error) {
    lines.push(...shader.error.split("\n").map((line) => `  ${line}`));
  }

  return lines;
}

function renderIncludeGraph(graph: Record<string, string[]> | null) {
  if (!graph) {
    return ["include graph", "  waiting for include graph"];
  }

  const treeLines = formatIncludeTree(graph);
  const previewLines = treeLines.slice(0, includeGraphPreviewLineLimit);
  const hiddenLineCount = treeLines.length - previewLines.length;
  const rootCount = listIncludeRoots(graph).length;
  const edgeCount = Object.values(graph).reduce(
    (total, includes) => total + includes.length,
    0
  );

  return [
    "include graph",
    `  ${rootCount} roots, ${edgeCount} includes`,
    ...previewLines.map((line) => `  ${line}`),
    ...(hiddenLineCount > 0 ? [`  ... ${hiddenLineCount} more lines hidden`] : []),
  ];
}

function formatEnabledChain(passes: PipelinePass[]) {
  return passes.length > 0
    ? passes.map((pass) => `[${pass.name}]`).join(" -> ")
    : "none";
}

function formatIncludeTree(graph: Record<string, string[]>) {
  const lines: string[] = [];

  for (const root of listIncludeRoots(graph)) {
    lines.push(root);
    formatIncludeChildren(graph, root, "", lines);
  }

  return lines;
}

function listIncludeRoots(graph: Record<string, string[]>) {
  const included = new Set(Object.values(graph).flat());

  return Object.keys(graph).filter((path) => !included.has(path));
}

function formatIncludeChildren(
  graph: Record<string, string[]>,
  path: string,
  prefix: string,
  lines: string[],
  stack = [path]
) {
  const includes = graph[path] ?? [];

  includes.forEach((includePath, index) => {
    const isLast = index === includes.length - 1;
    const branch = isLast ? "└─" : "├─";
    const childPrefix = `${prefix}${isLast ? "  " : "│ "}`;

    lines.push(`${prefix}${branch} ${includePath}`);

    if (stack.includes(includePath)) {
      lines.push(`${childPrefix}└─ (cycle)`);
      return;
    }

    formatIncludeChildren(
      graph,
      includePath,
      childPrefix,
      lines,
      [...stack, includePath]
    );
  });
}

function color(value: string, colorName: "cyan" | "gray" | "red") {
  const colors = {
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    red: "\x1b[31m",
  };

  return `${colors[colorName]}${value}\x1b[0m`;
}
