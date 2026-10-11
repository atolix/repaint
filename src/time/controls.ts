export type PlaybackControls = {
  togglePaused(): void;
};

type PlaybackShortcutEvent = Pick<KeyboardEvent, "code" | "repeat">;

export function getPlaybackCommand(event: PlaybackShortcutEvent) {
  if (event.repeat || event.code !== "Space") return null;
  return "toggle-paused" as const;
}

export function bindPlaybackShortcut(
  controls: PlaybackControls,
  target: Window = window,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!getPlaybackCommand(event)) return;

    event.preventDefault();
    controls.togglePaused();
  };

  target.addEventListener("keydown", handleKeyDown);
  return () => target.removeEventListener("keydown", handleKeyDown);
}
