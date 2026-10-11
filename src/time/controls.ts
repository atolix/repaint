export type PlaybackControls = {
  readonly snapshot: { readonly paused: boolean };
  togglePaused(): void;
  stepForward(): void;
  stepBackward(): void;
};

type PlaybackShortcutEvent = Pick<KeyboardEvent, "code" | "repeat">;

export function getPlaybackCommand(event: PlaybackShortcutEvent) {
  if (event.code === "Space") {
    return event.repeat ? null : "toggle-paused" as const;
  }
  if (event.code === "ArrowRight") return "step-forward" as const;
  if (event.code === "ArrowLeft") return "step-backward" as const;
  return null;
}

export function bindPlaybackShortcut(
  controls: PlaybackControls,
  target: Window = window,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    const command = getPlaybackCommand(event);
    if (!command) return;

    if (command !== "toggle-paused" && !controls.snapshot.paused) return;

    event.preventDefault();
    if (command === "toggle-paused") controls.togglePaused();
    if (command === "step-forward") controls.stepForward();
    if (command === "step-backward") controls.stepBackward();
  };

  target.addEventListener("keydown", handleKeyDown);
  return () => target.removeEventListener("keydown", handleKeyDown);
}
