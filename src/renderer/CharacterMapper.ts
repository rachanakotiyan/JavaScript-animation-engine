/** Maps normalized brightness to a darkest-to-brightest character palette. */
export class CharacterMapper {
  constructor(private readonly palette: string) {
    if (typeof palette !== "string" || palette.length === 0) {
      throw new TypeError("Character palette must be a non-empty string.");
    }
  }

  mapBrightness(brightness: number): string {
    if (typeof brightness !== "number" || !Number.isFinite(brightness)) {
      throw new TypeError("Brightness must be a valid number.");
    }

    const clampedBrightness = Math.min(1, Math.max(0, brightness));
    const paletteIndex = Math.round(
      clampedBrightness * (this.palette.length - 1),
    );

    return this.palette[paletteIndex];
  }
}
