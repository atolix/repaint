export type PlaybackState = Readonly<{
  paused: boolean;
  speed: number;
}>;

type PlaybackListener = (state: PlaybackState) => void;

const frameDurationSeconds = 1 / 60;

export class PlaybackClock {
  private elapsedSeconds = 0;
  private lastTimestampMilliseconds: number | null = null;
  private paused = false;
  private speed = 1;
  private readonly listeners = new Set<PlaybackListener>();

  tick(timestampMilliseconds: number) {
    if (!Number.isFinite(timestampMilliseconds)) {
      throw new TypeError("playback timestamp must be finite");
    }

    const previousTimestamp = this.lastTimestampMilliseconds;
    if (
      previousTimestamp !== null
      && timestampMilliseconds < previousTimestamp
    ) {
      throw new RangeError("playback timestamp must not move backwards");
    }
    this.lastTimestampMilliseconds = timestampMilliseconds;

    if (previousTimestamp !== null && !this.paused) {
      const deltaSeconds = (timestampMilliseconds - previousTimestamp) * 0.001;
      this.elapsedSeconds += deltaSeconds * this.speed;
    }

    return this.elapsedSeconds;
  }

  togglePaused() {
    this.paused = !this.paused;
    this.notify();
  }

  reset() {
    this.elapsedSeconds = 0;
  }

  step() {
    if (!this.paused) return;

    this.elapsedSeconds += frameDurationSeconds;
  }

  setSpeed(speed: number) {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new RangeError("playback speed must be a positive finite number");
    }
    if (speed === this.speed) return;

    this.speed = speed;
    this.notify();
  }

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => this.listeners.delete(listener);
  }

  get snapshot(): PlaybackState {
    return { paused: this.paused, speed: this.speed };
  }

  get time(): number {
    return this.elapsedSeconds;
  }

  private notify() {
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
