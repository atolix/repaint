export class DebugState {
  private currentMode = 0;

  constructor(target: Window = window) {
    target.addEventListener("keydown", (event) => {
      if (event.key !== "d") return;

      this.currentMode = (this.currentMode + 1) % 4;
      console.log("debug mode:", this.currentMode);
    });
  }

  get mode() {
    return this.currentMode;
  }
}
