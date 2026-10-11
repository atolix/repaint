export class DebugState {
  private currentMode = 0;
  private target: Window;
  private handleKeyDown: (event: KeyboardEvent) => void;

  constructor(target: Window = window) {
    this.target = target;
    this.handleKeyDown = (event) => {
      if (event.key !== "d") return;

      this.currentMode = (this.currentMode + 1) % 4;
      console.log("debug mode:", this.currentMode);
    };

    target.addEventListener("keydown", this.handleKeyDown);
  }

  get mode() {
    return this.currentMode;
  }

  dispose() {
    this.target.removeEventListener("keydown", this.handleKeyDown);
  }
}
