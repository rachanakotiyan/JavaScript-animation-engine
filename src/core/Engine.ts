import { DefaultConfig } from "../config/DefaultConfig";
import type {
  EngineConfig,
  EngineConfigOverrides,
  EngineLifecycleState,
} from "./Types";

export class ASCIIEngine {
  readonly config: EngineConfig;

  private state: EngineLifecycleState = "idle";

  constructor(overrides: EngineConfigOverrides = {}) {
    this.config = {
      ...DefaultConfig,
      ...overrides,
      resolution: {
        ...DefaultConfig.resolution,
        ...overrides.resolution,
      },
    };

    this.validateConfig();
  }

  getState(): EngineLifecycleState {
    return this.state;
  }

  start(): void {
    if (this.state === "disposed") {
      throw new Error("Cannot start an ASCIIEngine after it has been destroyed.");
    }

    this.state = "running";
  }

  pause(): void {
    if (this.state === "running") {
      this.state = "paused";
    }
  }

  stop(): void {
    if (this.state !== "disposed") {
      this.state = "stopped";
    }
  }

  destroy(): void {
    this.state = "disposed";
  }

  private validateConfig(): void {
    const { columns, rows } = this.config.resolution;

    if (!Number.isInteger(columns) || columns <= 0) {
      throw new Error("Resolution columns must be a positive integer.");
    }

    if (!Number.isInteger(rows) || rows <= 0) {
      throw new Error("Resolution rows must be a positive integer.");
    }

    if (!Number.isFinite(this.config.frameRate) || this.config.frameRate <= 0) {
      throw new Error("Frame rate must be a positive finite number.");
    }

    if (this.config.characterPalette.length === 0) {
      throw new Error("Character palette must not be empty.");
    }
  }
}
