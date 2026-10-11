export class DebugState {
  private currentMode = 0;
  private readonly listeners = new Set<(mode: number) => void>();

  get mode() {
    return this.currentMode;
  }

  cycle() {
    this.currentMode = (this.currentMode + 1) % 4;
    this.notify();
    return this.currentMode;
  }

  subscribe(listener: (mode: number) => void) {
    this.listeners.add(listener);
    listener(this.currentMode);

    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener(this.currentMode);
  }
}
