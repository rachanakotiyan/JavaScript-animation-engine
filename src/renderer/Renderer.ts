import type { ASCIIConverter } from "./ASCIIConverter";
import { CanvasRenderer, type CharacterColorGrid } from "./CanvasRenderer";
import type { ColorManager } from "./ColorManager";
import type { ResolutionManager } from "./ResolutionManager";

export interface RendererComponents {
  asciiConverter: ASCIIConverter;
  colorManager: ColorManager;
  resolutionManager: ResolutionManager;
  canvasRenderer: CanvasRenderer;
}

export class Renderer {
  constructor(private readonly components: RendererComponents) {}

  render(imageData: ImageData): void {
    const {
      asciiConverter,
      canvasRenderer,
      colorManager,
      resolutionManager,
    } = this.components;
    const resolutionInfo = resolutionManager.getResolutionInfo();
    const resolution = {
      columns: resolutionInfo.columns,
      rows: resolutionInfo.rows,
    };
    const characterGrid = asciiConverter.convert(imageData, resolution);
    const colorGrid = this.createColorGrid(
      imageData,
      resolution.columns,
      resolution.rows,
    );

    this.validateGridDimensions(characterGrid, colorGrid, resolution);
    canvasRenderer.resize(
      resolutionInfo.canvasWidth,
      resolutionInfo.canvasHeight,
    );
    canvasRenderer.draw(characterGrid, colorGrid);
  }

  private createColorGrid(
    imageData: ImageData,
    columns: number,
    rows: number,
  ): CharacterColorGrid {
    const { colorManager } = this.components;
    const colors: CharacterColorGrid = [];

    for (let row = 0; row < rows; row += 1) {
      const colorRow: (string | null)[] = [];

      for (let column = 0; column < columns; column += 1) {
        const x = Math.min(
          imageData.width - 1,
          Math.floor(((column + 0.5) * imageData.width) / columns),
        );
        const y = Math.min(
          imageData.height - 1,
          Math.floor(((row + 0.5) * imageData.height) / rows),
        );
        const rgb = colorManager.getPixelColor(imageData, x, y);
        colorRow.push(colorManager.formatRGB(rgb));
      }

      colors.push(colorRow);
    }

    return colors;
  }

  private validateGridDimensions(
    characterGrid: readonly (readonly string[])[],
    colorGrid: readonly (readonly (string | null)[])[],
    resolution: { columns: number; rows: number },
  ): void {
    if (
      characterGrid.length !== resolution.rows ||
      colorGrid.length !== resolution.rows ||
      characterGrid.some((row) => row.length !== resolution.columns) ||
      colorGrid.some((row) => row.length !== resolution.columns)
    ) {
      throw new RangeError(
        "Converted character and color grids must match the current resolution.",
      );
    }
  }
}
