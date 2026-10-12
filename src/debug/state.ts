import {
  DEBUG_MODE,
  getNextDebugMode,
  type DebugMode,
} from "./modes";

export class DebugState {
  private currentMode: DebugMode = DEBUG_MODE.normal;
  private readonly listeners = new Set<(mode: DebugMode) => void>();

  get mode() {
    return this.currentMode;
  }

  cycle() {
    this.currentMode = getNextDebugMode(this.currentMode);
    this.notify();
    return this.currentMode;
  }

  subscribe(listener: (mode: DebugMode) => void) {
    this.listeners.add(listener);
    listener(this.currentMode);

    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener(this.currentMode);
  }
}
