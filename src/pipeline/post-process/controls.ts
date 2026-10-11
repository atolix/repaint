import type { SelectedPass, ToggledPass } from "./types";

export type PostProcessControls = {
  selectNextPass(): SelectedPass | null;
  selectPreviousPass(): SelectedPass | null;
  selectFirstPass(): SelectedPass | null;
  selectLastPass(): SelectedPass | null;
  selectPassAt(index: number): SelectedPass | null;
  toggleSelectedPass(): ToggledPass | null;
  togglePassAt(index: number): Pick<ToggledPass, "name" | "enabled"> | null;
};

export type PostProcessCommand =
  | { type: "select-next" }
  | { type: "select-previous" }
  | { type: "select-first" }
  | { type: "select-last" }
  | { type: "toggle-selected" }
  | { type: "select-at"; index: number }
  | { type: "toggle-at"; index: number };

type ShortcutEvent = Pick<
  KeyboardEvent,
  "code" | "key" | "repeat" | "shiftKey"
>;

export function getPostProcessCommand(
  event: ShortcutEvent,
): PostProcessCommand | null {
  if (event.repeat) return null;

  if (event.key === "ArrowDown" || event.key === "]") {
    return { type: "select-next" };
  }

  if (event.key === "ArrowUp" || event.key === "[") {
    return { type: "select-previous" };
  }

  if (event.key === "Home") return { type: "select-first" };
  if (event.key === "End") return { type: "select-last" };

  if (event.key === " " || event.key === "Enter") {
    return { type: "toggle-selected" };
  }

  const digitMatch = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
  if (!digitMatch) return null;

  const index = Number(digitMatch[1]) - 1;
  return event.shiftKey
    ? { type: "toggle-at", index }
    : { type: "select-at", index };
}

export function bindPostProcessShortcuts(
  getControls: () => PostProcessControls,
  target: Window = window,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    const command = getPostProcessCommand(event);
    if (!command) return;

    event.preventDefault();
    executePostProcessCommand(getControls(), command);
  };

  target.addEventListener("keydown", handleKeyDown);

  return () => target.removeEventListener("keydown", handleKeyDown);
}

function executePostProcessCommand(
  controls: PostProcessControls,
  command: PostProcessCommand,
) {
  switch (command.type) {
    case "select-next":
      controls.selectNextPass();
      break;
    case "select-previous":
      controls.selectPreviousPass();
      break;
    case "select-first":
      controls.selectFirstPass();
      break;
    case "select-last":
      controls.selectLastPass();
      break;
    case "toggle-selected":
      controls.toggleSelectedPass();
      break;
    case "select-at":
      controls.selectPassAt(command.index);
      break;
    case "toggle-at":
      controls.togglePassAt(command.index);
      break;
  }
}
