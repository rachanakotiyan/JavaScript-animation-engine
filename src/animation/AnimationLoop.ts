export type AnimationUpdateCallback = (
  deltaTime: number,
  elapsedTime: number,
) => void;

type AnimationLoopState = "stopped" | "running" | "paused" | "destroyed";

export class AnimationLoop {
  private readonly frameInterval: number | null;
  private readonly update: AnimationUpdateCallback;
  private state: AnimationLoopState = "stopped";
  private frameId: number | null = null;
  private lastUpdateTimestamp: number | null = null;
  private elapsedTime = 0;

  constructor(update: AnimationUpdateCallback, targetFrameRate?: number) {
    if (
      targetFrameRate !== undefined &&
      (!Number.isFinite(targetFrameRate) || targetFrameRate <= 0)
    ) {
      throw new Error("Target frame rate must be a positive finite number.");
    }

    this.update = update;
    this.frameInterval =
      targetFrameRate === undefined ? null : 1000 / targetFrameRate;
  }

  start(): void {
    this.ensureNotDestroyed();

    if (this.state !== "stopped") {
      return;
    }

    this.elapsedTime = 0;
    this.lastUpdateTimestamp = null;
    this.state = "running";
    this.scheduleFrame();
  }

  pause(): void {
    if (this.state !== "running") {
      return;
    }

    this.state = "paused";
    this.cancelScheduledFrame();
    this.lastUpdateTimestamp = null;
  }

  resume(): void {
    this.ensureNotDestroyed();

    if (this.state !== "paused") {
      return;
    }

    this.lastUpdateTimestamp = null;
    this.state = "running";
    this.scheduleFrame();
  }

  stop(): void {
    if (this.state === "destroyed") {
      return;
    }

    this.state = "stopped";
    this.cancelScheduledFrame();
    this.lastUpdateTimestamp = null;
    this.elapsedTime = 0;
  }

  destroy(): void {
    if (this.state === "destroyed") {
      return;
    }

    this.state = "destroyed";
    this.cancelScheduledFrame();
    this.lastUpdateTimestamp = null;
  }

  private scheduleFrame(): void {
    if (this.state === "running" && this.frameId === null) {
      this.frameId = requestAnimationFrame(this.handleFrame);
    }
  }

  private cancelScheduledFrame(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private readonly handleFrame = (timestamp: number): void => {
    this.frameId = null;

    if (this.state !== "running") {
      return;
    }

    try {
      if (this.lastUpdateTimestamp === null) {
        this.lastUpdateTimestamp = timestamp;
        this.update(0, this.elapsedTime);
        return;
      }

      const deltaMilliseconds = Math.max(
        0,
        timestamp - this.lastUpdateTimestamp,
      );

      if (
        this.frameInterval === null ||
        deltaMilliseconds >= this.frameInterval
      ) {
        const deltaTime = deltaMilliseconds / 1000;
        this.lastUpdateTimestamp = timestamp;
        this.elapsedTime += deltaTime;
        this.update(deltaTime, this.elapsedTime);
      }
    } finally {
      this.scheduleFrame();
    }
  };

  private ensureNotDestroyed(): void {
    if (this.state === "destroyed") {
      throw new Error("Cannot start or resume an AnimationLoop after destruction.");
    }
  }
}
