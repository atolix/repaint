import type { PostProcessPipeline } from ".";

export function bindPostProcessShortcuts(
  pipeline: PostProcessPipeline,
  target: Window = window
) {
  target.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    if (event.key === "ArrowDown" || event.key === "]") {
      event.preventDefault();
      logSelected(pipeline.selectNextPass());
      return;
    }

    if (event.key === "ArrowUp" || event.key === "[") {
      event.preventDefault();
      logSelected(pipeline.selectPreviousPass());
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      logSelected(pipeline.selectFirstPass());
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      logSelected(pipeline.selectLastPass());
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      logToggled(pipeline.toggleSelectedPass());
      return;
    }

    const passIndex = getDigitShortcutIndex(event);
    if (!Number.isInteger(passIndex) || passIndex < 0) return;

    if (event.shiftKey) {
      const result = pipeline.togglePassAt(passIndex);
      if (!result) {
        console.warn(`post-process pass not found: ${passIndex + 1}`);
        return;
      }

      console.log(`post-process ${result.name}: ${result.enabled ? "on" : "off"}`);
      return;
    }

    const result = pipeline.selectPassAt(passIndex);
    if (!result) {
      console.warn(`post-process pass not found: ${event.key}`);
      return;
    }

    console.log(`post-process selected ${result.index + 1}: ${result.name}`);
  });
}

function getDigitShortcutIndex(event: KeyboardEvent) {
  const digitMatch = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
  const digit = digitMatch ? digitMatch[1] : event.key;

  return Number(digit) - 1;
}

function logSelected(result: { name: string; index: number } | null) {
  if (!result) {
    console.warn("post-process pass not found");
    return;
  }

  console.log(`post-process selected ${result.index + 1}: ${result.name}`);
}

function logToggled(result: { name: string; enabled: boolean } | null) {
  if (!result) {
    console.warn("post-process pass not found");
    return;
  }

  console.log(`post-process ${result.name}: ${result.enabled ? "on" : "off"}`);
}
