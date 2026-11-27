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
  frameRate?: number;
  autoResize?: boolean;
}

export type EngineConfigOverrides = Partial<EngineConfig>;

export type EngineLifecycleState =
  | "idle"
  | "running"
  | "paused"
  | "stopped"
  | "disposed";
