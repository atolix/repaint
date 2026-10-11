import type {
  PlaybackClock,
  PlaybackState,
} from "../time/playback-clock";

const playbackSpeeds = [0.25, 0.5, 1, 2];

export class PlaybackControls {
  private readonly clock: PlaybackClock;
  private readonly root: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly step: HTMLButtonElement;
  private readonly reset: HTMLButtonElement;
  private readonly speed: HTMLSelectElement;
  private readonly time: HTMLOutputElement;
  private readonly unsubscribe: () => void;

  constructor(clock: PlaybackClock) {
    this.clock = clock;
    this.root = document.createElement("aside");
    this.root.className = "playback-controls";
    this.root.setAttribute("aria-label", "Playback controls");
    this.root.addEventListener("keydown", stopPropagation);

    this.toggle = createButton("Pause", () => this.clock.togglePaused());
    this.step = createButton("Step", () => this.clock.step());
    this.reset = createButton("Reset", () => this.clock.reset());
    this.speed = createSpeedSelect();
    this.time = document.createElement("output");
    this.time.setAttribute("aria-label", "Elapsed time");
    this.speed.addEventListener("change", this.handleSpeedChange);

    const timeSection = document.createElement("span");
    const timeLabel = document.createElement("span");
    timeSection.className = "playback-controls-time";
    timeLabel.textContent = "Time";
    timeSection.append(timeLabel, this.time);

    const speedLabel = document.createElement("label");
    const speedText = document.createElement("span");
    speedText.textContent = "Speed";
    speedLabel.append(speedText, this.speed);

    this.root.append(timeSection, this.toggle, this.step, this.reset, speedLabel);
    document.body.append(this.root);
    this.unsubscribe = this.clock.subscribe((state) => this.render(state));
  }

  dispose() {
    this.unsubscribe();
    this.speed.removeEventListener("change", this.handleSpeedChange);
    this.root.removeEventListener("keydown", stopPropagation);
    this.root.remove();
  }

  private render(state: PlaybackState) {
    this.time.value = formatElapsedTime(state.elapsedSeconds);
    this.toggle.textContent = state.paused ? "Resume" : "Pause";
    this.toggle.setAttribute(
      "aria-label",
      state.paused ? "Resume playback" : "Pause playback",
    );
    this.toggle.setAttribute("aria-pressed", String(state.paused));
    this.step.disabled = !state.paused;
    this.speed.value = String(state.speed);
  }

  private handleSpeedChange = () => {
    this.clock.setSpeed(Number(this.speed.value));
  };
}

export function formatElapsedTime(elapsedSeconds: number) {
  const totalCentiseconds = Math.floor(elapsedSeconds * 100);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const time = [minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  const fraction = String(centiseconds).padStart(2, "0");

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${time}.${fraction}`
    : `${time}.${fraction}`;
}

function createButton(label: string, action: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function createSpeedSelect() {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Playback speed");

  for (const speed of playbackSpeeds) {
    const option = document.createElement("option");
    option.value = String(speed);
    option.textContent = `${speed}×`;
    select.append(option);
  }

  return select;
}

function stopPropagation(event: KeyboardEvent) {
  event.stopPropagation();
}
