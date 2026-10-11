import type { PostProcessControls } from "../pipeline/post-process/controls";
import type {
  PostProcessNumberParameterState,
  PostProcessSnapshot,
} from "../pipeline/post-process/types";

type ParameterInputs = {
  range: HTMLInputElement;
  number: HTMLInputElement;
};

export class ParameterPanel {
  private readonly getControls: () => PostProcessControls;
  private readonly root: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly parameterInputs = new Map<string, ParameterInputs>();
  private structureSignature = "";
  private open = true;

  constructor(getControls: () => PostProcessControls) {
    this.getControls = getControls;
    this.root = document.createElement("aside");
    this.root.className = "parameter-panel";
    this.root.setAttribute("aria-label", "Effect inspector");
    this.root.addEventListener("keydown", (event) => event.stopPropagation());

    this.toggle = document.createElement("button");
    this.toggle.type = "button";
    this.toggle.className = "parameter-panel-toggle";
    this.toggle.textContent = "Controls";
    this.toggle.addEventListener("click", this.toggleOpen);

    document.body.append(this.root, this.toggle);
    window.addEventListener("keydown", this.handleWindowKeyDown);
    this.updateVisibility();
  }

  render(snapshot: PostProcessSnapshot) {
    const signature = createStructureSignature(snapshot);
    if (signature === this.structureSignature) {
      this.syncParameterValues(snapshot);
      return;
    }

    this.structureSignature = signature;
    this.parameterInputs.clear();
    this.root.replaceChildren(
      this.createHeader(),
      this.createPassList(snapshot),
      this.createParameterSection(snapshot),
    );
  }

  dispose() {
    window.removeEventListener("keydown", this.handleWindowKeyDown);
    this.toggle.removeEventListener("click", this.toggleOpen);
    this.root.remove();
    this.toggle.remove();
  }

  private createHeader() {
    const header = document.createElement("header");
    const title = document.createElement("h1");
    const hint = document.createElement("span");
    title.textContent = "Effects";
    hint.textContent = "P to hide";
    header.append(title, hint);
    return header;
  }

  private createPassList(snapshot: PostProcessSnapshot) {
    const list = document.createElement("div");
    list.className = "parameter-panel-passes";

    snapshot.passes.forEach((pass, index) => {
      const row = document.createElement("div");
      const select = document.createElement("button");
      const enabled = document.createElement("input");

      row.className = "parameter-panel-pass";
      select.type = "button";
      select.textContent = `${String(index + 1).padStart(2, "0")} ${pass.name}`;
      select.className = index === snapshot.selectedPassIndex ? "selected" : "";
      select.setAttribute("aria-pressed", String(index === snapshot.selectedPassIndex));
      select.addEventListener("click", () => {
        this.getControls().selectPassAt(index);
      });

      enabled.type = "checkbox";
      enabled.checked = pass.enabled;
      enabled.setAttribute("aria-label", `Enable ${pass.name}`);
      enabled.addEventListener("change", () => {
        this.getControls().togglePassAt(index);
      });

      row.append(select, enabled);
      list.append(row);
    });

    return list;
  }

  private createParameterSection(snapshot: PostProcessSnapshot) {
    const section = document.createElement("section");
    const selectedPass = snapshot.passes[snapshot.selectedPassIndex];
    const heading = document.createElement("div");
    const title = document.createElement("h2");

    section.className = "parameter-panel-parameters";
    heading.className = "parameter-panel-heading";
    title.textContent = selectedPass?.name ?? "No effect selected";
    heading.append(title);
    section.append(heading);

    if (!selectedPass || !selectedPass.parameters?.length) {
      const empty = document.createElement("p");
      empty.className = "parameter-panel-empty";
      empty.textContent = "No adjustable parameters";
      section.append(empty);
      return section;
    }

    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset";
    reset.addEventListener("click", () => {
      this.getControls().resetPassParameters(selectedPass.name);
    });
    heading.append(reset);

    for (const parameter of selectedPass.parameters) {
      section.append(this.createParameterControl(selectedPass.name, parameter));
    }

    return section;
  }

  private createParameterControl(
    passName: string,
    parameter: PostProcessNumberParameterState,
  ) {
    const label = document.createElement("label");
    const name = document.createElement("span");
    const controls = document.createElement("span");
    const range = document.createElement("input");
    const number = document.createElement("input");

    label.className = "parameter-panel-control";
    name.textContent = parameter.label;
    controls.className = "parameter-panel-control-inputs";
    configureNumberInput(range, parameter, "range");
    configureNumberInput(number, parameter, "number");

    range.addEventListener("input", () => {
      this.getControls().setParameter(passName, parameter.key, range.valueAsNumber);
    });
    number.addEventListener("change", () => {
      this.getControls().setParameter(passName, parameter.key, number.valueAsNumber);
    });

    controls.append(range, number);
    label.append(name, controls);
    this.parameterInputs.set(parameterId(passName, parameter.key), { range, number });
    return label;
  }

  private syncParameterValues(snapshot: PostProcessSnapshot) {
    for (const pass of snapshot.passes) {
      for (const parameter of pass.parameters ?? []) {
        const inputs = this.parameterInputs.get(parameterId(pass.name, parameter.key));
        if (!inputs) continue;

        const value = String(parameter.value);
        inputs.range.value = value;
        inputs.number.value = value;
      }
    }
  }

  private toggleOpen = () => {
    this.open = !this.open;
    this.updateVisibility();
  };

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || event.code !== "KeyP") return;

    event.preventDefault();
    this.toggleOpen();
  };

  private updateVisibility() {
    this.root.hidden = !this.open;
    this.toggle.setAttribute("aria-expanded", String(this.open));
    this.toggle.textContent = this.open ? "Hide controls" : "Show controls";
  }
}

function configureNumberInput(
  input: HTMLInputElement,
  parameter: PostProcessNumberParameterState,
  type: "range" | "number",
) {
  input.type = type;
  input.min = String(parameter.min);
  input.max = String(parameter.max);
  input.step = String(parameter.step);
  input.value = String(parameter.value);
}

function createStructureSignature(snapshot: PostProcessSnapshot) {
  return JSON.stringify({
    selectedPassIndex: snapshot.selectedPassIndex,
    passes: snapshot.passes.map((pass) => ({
      name: pass.name,
      enabled: pass.enabled,
      parameters: pass.parameters?.map(({ value: _value, ...parameter }) => parameter),
    })),
  });
}

function parameterId(passName: string, key: string) {
  return `${passName}\0${key}`;
}
