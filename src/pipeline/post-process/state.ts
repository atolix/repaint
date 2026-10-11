import type {
  PostProcessPassState,
  SelectedPass,
  ToggledPass,
} from "./types";

export class PostProcessState {
  private passes: PostProcessPassState[];
  private selectedIndex = 0;

  constructor(passes: readonly PostProcessPassState[]) {
    assertUniqueNames(passes);
    this.passes = copyPasses(passes);
  }

  reconcile(passes: readonly PostProcessPassState[]) {
    assertUniqueNames(passes);

    const enabledByName = new Map(
      this.passes.map((pass) => [pass.name, pass.enabled]),
    );
    const selectedName = this.passes[this.selectedIndex]?.name;

    this.passes = passes.map((pass) => ({
      name: pass.name,
      enabled: enabledByName.get(pass.name) ?? pass.enabled,
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
    return this.passes;
  }

  get enabledByName() {
    return new Map(this.passes.map((pass) => [pass.name, pass.enabled]));
  }

  private selectPassByOffset(offset: number): SelectedPass | null {
    if (this.passes.length === 0) return null;

    return this.selectPassAt(
      wrapIndex(this.selectedIndex + offset, this.passes.length),
    );
  }
}

function copyPasses(passes: readonly PostProcessPassState[]) {
  return passes.map((pass) => ({ ...pass }));
}

function assertUniqueNames(passes: readonly PostProcessPassState[]) {
  const names = new Set<string>();

  for (const pass of passes) {
    if (names.has(pass.name)) {
      throw new Error(`duplicate post-process pass: ${pass.name}`);
    }

    names.add(pass.name);
  }
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
