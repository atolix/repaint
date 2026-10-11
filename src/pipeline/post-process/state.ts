import type {
  PostProcessNumberParameterConfig,
  PostProcessNumberParameterState,
  PostProcessPassState,
  SelectedPass,
  ToggledPass,
} from "./types";

type InitialPassState = Omit<PostProcessPassState, "parameters"> & {
  parameters?: readonly PostProcessNumberParameterConfig[];
};

type MutablePassState = Omit<PostProcessPassState, "parameters"> & {
  parameters: PostProcessNumberParameterState[];
};

export class PostProcessState {
  private passes: MutablePassState[];
  private selectedIndex = 0;

  constructor(passes: readonly InitialPassState[]) {
    validatePasses(passes);
    this.passes = createPasses(passes);
  }

  reconcile(passes: readonly InitialPassState[]) {
    validatePasses(passes);

    const enabledByName = new Map(
      this.passes.map((pass) => [pass.name, pass.enabled]),
    );
    const parameterValues = new Map(
      this.passes.flatMap((pass) =>
        pass.parameters.map((parameter) => [
          parameterId(pass.name, parameter.key),
          parameter.value,
        ] as const),
      ),
    );
    const selectedName = this.passes[this.selectedIndex]?.name;

    this.passes = createPasses(passes).map((pass) => ({
      ...pass,
      enabled: enabledByName.get(pass.name) ?? pass.enabled,
      parameters: pass.parameters.map((parameter) => ({
        ...parameter,
        value: parameterValues.get(parameterId(pass.name, parameter.key))
          ?? parameter.value,
      })),
    }));

    const selectedIndex = this.passes.findIndex(
      (pass) => pass.name === selectedName,
    );
    this.selectedIndex = selectedIndex >= 0
      ? selectedIndex
      : Math.min(this.selectedIndex, Math.max(0, this.passes.length - 1));
  }

  togglePassAt(index: number): ToggledPass | null {
    const pass = this.passes[index];
    if (!pass) return null;

    pass.enabled = !pass.enabled;

    return {
      name: pass.name,
      enabled: pass.enabled,
      index,
    };
  }

  toggleSelectedPass(): ToggledPass | null {
    return this.togglePassAt(this.selectedIndex);
  }

  selectPassAt(index: number): SelectedPass | null {
    const pass = this.passes[index];
    if (!pass) return null;

    this.selectedIndex = index;
    return { name: pass.name, index };
  }

  selectNextPass(): SelectedPass | null {
    return this.selectPassByOffset(1);
  }

  selectPreviousPass(): SelectedPass | null {
    return this.selectPassByOffset(-1);
  }

  selectFirstPass(): SelectedPass | null {
    return this.selectPassAt(0);
  }

  selectLastPass(): SelectedPass | null {
    return this.selectPassAt(this.passes.length - 1);
  }

  get selectedPassIndex() {
    return this.selectedIndex;
  }

  get snapshot(): readonly PostProcessPassState[] {
    return this.passes.map(({ name, enabled, parameters }) => ({
      name,
      enabled,
      ...(parameters.length > 0
        ? { parameters: parameters.map((parameter) => ({ ...parameter })) }
        : {}),
    }));
  }

  get enabledByName() {
    return new Map(this.passes.map((pass) => [pass.name, pass.enabled]));
  }

  setParameter(passName: string, key: string, value: number) {
    if (!Number.isFinite(value)) return null;

    const pass = this.passes.find((candidate) => candidate.name === passName);
    const parameter = pass?.parameters.find((candidate) => candidate.key === key);
    if (!pass || !parameter) return null;

    parameter.value = clamp(value, parameter.min, parameter.max);
    return { passName, key, value: parameter.value };
  }

  resetPassParameters(passName: string) {
    const pass = this.passes.find((candidate) => candidate.name === passName);
    if (!pass) return false;

    for (const parameter of pass.parameters) {
      parameter.value = parameter.defaultValue;
    }

    return true;
  }

  private selectPassByOffset(offset: number): SelectedPass | null {
    if (this.passes.length === 0) return null;

    return this.selectPassAt(
      wrapIndex(this.selectedIndex + offset, this.passes.length),
    );
  }
}

function createPasses(passes: readonly InitialPassState[]): MutablePassState[] {
  return passes.map((pass) => ({
    name: pass.name,
    enabled: pass.enabled,
    parameters: (pass.parameters ?? []).map((parameter) => ({
      ...parameter,
      value: parameter.defaultValue,
    })),
  }));
}

function validatePasses(passes: readonly InitialPassState[]) {
  const names = new Set<string>();

  for (const pass of passes) {
    if (names.has(pass.name)) {
      throw new Error(`duplicate post-process pass: ${pass.name}`);
    }

    names.add(pass.name);

    const parameterKeys = new Set<string>();
    for (const parameter of pass.parameters ?? []) {
      if (parameterKeys.has(parameter.key)) {
        throw new Error(
          `duplicate post-process parameter: ${pass.name}.${parameter.key}`,
        );
      }
      if (
        parameter.min > parameter.max
        || parameter.defaultValue < parameter.min
        || parameter.defaultValue > parameter.max
        || parameter.step <= 0
      ) {
        throw new Error(`invalid post-process parameter: ${pass.name}.${parameter.key}`);
      }

      parameterKeys.add(parameter.key);
    }
  }
}

function parameterId(passName: string, key: string) {
  return `${passName}\0${key}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
