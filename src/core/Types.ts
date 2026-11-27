export interface RenderResolution {
  columns: number;
  rows: number;
}

export interface EngineConfig {
  canvas: HTMLCanvasElement | null;
  resolution: RenderResolution;
  characterPalette: string;
  backgroundColor: string;
  foregroundColor: string;
  frameRate: number;
  autoResize: boolean;
}

export type EngineConfigOverrides = Partial<Omit<EngineConfig, "resolution">> & {
  resolution?: Partial<RenderResolution>;
};

export type EngineLifecycleState =
  /** Created but not currently running. */
  | "idle"
  /** Actively advancing and rendering animation frames. */
  | "running"
  /** Temporarily suspended and able to resume. */
  | "paused"
  /** Stopped and able to start again. */
  | "stopped"
  /** Permanently shut down and no longer reusable. */
  | "disposed";
