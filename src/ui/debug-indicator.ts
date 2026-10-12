const debugModeLabels = new Map([
  [1, "UV coordinates"],
  [2, "Radial distance"],
  [3, "UV grid"],
  [4, "Luminance heatmap"],
  [5, "Invalid color"],
  [6, "Before / after"],
]);

export class DebugIndicator {
  private readonly root: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "debug-indicator";
    this.root.setAttribute("aria-label", "Debug mode");
    this.root.setAttribute("role", "status");
    document.body.append(this.root);
    this.render(0);
  }

  render(mode: number) {
    const label = getDebugModeLabel(mode);
    this.root.hidden = label === null;
    this.root.textContent = label ? `DEBUG ${mode} · ${label}` : "";
  }

  dispose() {
    this.root.remove();
  }
}

export function getDebugModeLabel(mode: number) {
  return debugModeLabels.get(mode) ?? null;
}
