import type { EngineConfig } from "../core/Types";

export const DefaultConfig: EngineConfig = {
  canvas: null,
  resolution: {
    columns: 80,
    rows: 40,
  },
  characterPalette: " .:-=+*#%@",
  backgroundColor: "#000000",
  foregroundColor: "#ffffff",
  frameRate: 30,
  autoResize: true,
};
