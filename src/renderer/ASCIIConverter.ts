import type { RenderResolution } from "../core/Types";
import { CharacterMapper } from "./CharacterMapper";

export class ASCIIConverter {
  constructor(private readonly characterMapper: CharacterMapper) {}

  convert(imageData: ImageData, resolution: RenderResolution): string[][] {
    this.validateImageData(imageData);
    this.validateResolution(resolution);

    const output: string[][] = [];

    for (let row = 0; row < resolution.rows; row += 1) {
      const sourceYStart = Math.floor(
        (row * imageData.height) / resolution.rows,
      );
      const sourceYEnd = Math.max(
        sourceYStart + 1,
        Math.floor(((row + 1) * imageData.height) / resolution.rows),
      );
      const outputRow: string[] = [];

      for (let column = 0; column < resolution.columns; column += 1) {
        const sourceXStart = Math.floor(
          (column * imageData.width) / resolution.columns,
        );
        const sourceXEnd = Math.max(
          sourceXStart + 1,
          Math.floor(((column + 1) * imageData.width) / resolution.columns),
        );
        let luminanceSum = 0;
        let sampleCount = 0;

        for (let y = sourceYStart; y < sourceYEnd; y += 1) {
          for (let x = sourceXStart; x < sourceXEnd; x += 1) {
            const pixelIndex = (y * imageData.width + x) * 4;
            const red = imageData.data[pixelIndex];
            const green = imageData.data[pixelIndex + 1];
            const blue = imageData.data[pixelIndex + 2];

            luminanceSum +=
              0.2126 * red + 0.7152 * green + 0.0722 * blue;
            sampleCount += 1;
          }
        }

        const averageLuminance = luminanceSum / sampleCount;
        outputRow.push(
          this.characterMapper.mapBrightness(averageLuminance / 255),
        );
      }

      output.push(outputRow);
    }

    return output;
  }

  private validateImageData(imageData: ImageData): void {
    if (
      !Number.isSafeInteger(imageData.width) ||
      imageData.width <= 0 ||
      !Number.isSafeInteger(imageData.height) ||
      imageData.height <= 0
    ) {
      throw new RangeError("Image dimensions must be positive integers.");
    }

    const expectedDataLength = imageData.width * imageData.height * 4;
    if (
      !Number.isSafeInteger(expectedDataLength) ||
      imageData.data.length !== expectedDataLength
    ) {
      throw new RangeError(
        "Image pixel data length does not match its dimensions.",
      );
    }
  }

  private validateResolution(resolution: RenderResolution): void {
    if (
      !Number.isSafeInteger(resolution.columns) ||
      resolution.columns <= 0 ||
      !Number.isSafeInteger(resolution.rows) ||
      resolution.rows <= 0
    ) {
      throw new RangeError(
        "Resolution columns and rows must be positive integers.",
      );
    }
  }
}
