export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export class ColorManager {
  constructor(
    private readonly configuredForegroundColor: string,
    private readonly configuredBackgroundColor: string,
  ) {
    this.validateColor(configuredForegroundColor, "Foreground");
    this.validateColor(configuredBackgroundColor, "Background");
  }

  get foregroundColor(): string {
    return this.configuredForegroundColor;
  }

  get backgroundColor(): string {
    return this.configuredBackgroundColor;
  }

  getPixelColor(imageData: ImageData, x: number, y: number): RGBColor {
    this.validateImageData(imageData);

    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= imageData.width ||
      y >= imageData.height
    ) {
      throw new RangeError("Pixel coordinates must be integers within the image bounds.");
    }

    const pixelIndex = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[pixelIndex],
      g: imageData.data[pixelIndex + 1],
      b: imageData.data[pixelIndex + 2],
    };
  }

  formatRGB(color: RGBColor): string {
    const red = this.clampChannel(color.r, "Red");
    const green = this.clampChannel(color.g, "Green");
    const blue = this.clampChannel(color.b, "Blue");

    return `rgb(${red}, ${green}, ${blue})`;
  }

  private validateColor(color: string, label: string): void {
    if (typeof color !== "string" || color.trim().length === 0) {
      throw new TypeError(`${label} color must be a non-empty string.`);
    }
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
      throw new RangeError("Image pixel data length does not match its dimensions.");
    }
  }

  private clampChannel(channel: number, label: string): number {
    if (typeof channel !== "number" || !Number.isFinite(channel)) {
      throw new TypeError(`${label} channel must be a finite number.`);
    }

    return Math.round(Math.min(255, Math.max(0, channel)));
  }
}
