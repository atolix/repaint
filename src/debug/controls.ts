import type { DebugState } from "./state";

export function bindDebugShortcut(
  state: DebugState,
  target: Window = window,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || event.key !== "d") return;
    state.cycle();
  };

  target.addEventListener("keydown", handleKeyDown);

  return () => target.removeEventListener("keydown", handleKeyDown);
}
