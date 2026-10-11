export class DebugState {
  private currentMode = 0;

  get mode() {
    return this.currentMode;
  }

  cycle() {
    this.currentMode = (this.currentMode + 1) % 4;
    return this.currentMode;
  }
}
