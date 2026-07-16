import type { PostProcessPipeline } from ".";

export function bindPostProcessShortcuts(
  pipeline: PostProcessPipeline,
  target: Window = window
) {
  target.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    const passIndex = getDigitShortcutIndex(event);
    if (!Number.isInteger(passIndex) || passIndex < 0) return;

    if (event.shiftKey) {
      const result = pipeline.selectPassAt(passIndex);
      if (!result) {
        console.warn(`post-process pass not found: ${passIndex + 1}`);
        return;
      }

      console.log(`post-process selected ${result.index + 1}: ${result.name}`);
      return;
    }

    const result = pipeline.togglePassAt(passIndex);
    if (!result) {
      console.warn(`post-process pass not found: ${event.key}`);
      return;
    }

    console.log(`post-process ${result.name}: ${result.enabled ? "on" : "off"}`);
  });
}

function getDigitShortcutIndex(event: KeyboardEvent) {
  const digitMatch = event.code.match(/^Digit([1-9])$/);
  const digit = digitMatch ? digitMatch[1] : event.key;

  return Number(digit) - 1;
}
