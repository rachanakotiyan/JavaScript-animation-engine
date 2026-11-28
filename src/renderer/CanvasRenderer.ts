export interface CanvasRendererConfig {
  fontFamily: string;
  fontSize: number;
  foregroundColor: string;
  backgroundColor: string;
  cellWidth: number;
  cellHeight: number;
}

export type CharacterColorGrid = (string | null)[][];

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly config: CanvasRendererConfig,
  ) {
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("A valid HTML canvas element is required.");
    }

    this.validateConfig(config);

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Unable to acquire a 2D context from the canvas.");
    }

    this.context = context;
  }

  draw(
    characterGrid: readonly (readonly string[])[],
    colorGrid?: readonly (readonly (string | null)[])[],
  ): void {
    this.validateGrid(characterGrid, colorGrid);

    const { context, canvas, config } = this;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = config.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `${config.fontSize}px ${config.fontFamily}`;
    context.textBaseline = "top";
    context.textAlign = "left";

    for (let row = 0; row < characterGrid.length; row += 1) {
      for (let column = 0; column < characterGrid[row].length; column += 1) {
        const color = colorGrid?.[row][column];
        context.fillStyle = color ?? config.foregroundColor;
        context.fillText(
          characterGrid[row][column],
          column * config.cellWidth,
          row * config.cellHeight,
        );
      }
    }
  }

  resize(width: number, height: number): void {
    this.validateDimension(width, "Canvas width");
    this.validateDimension(height, "Canvas height");

    if (this.canvas.width !== width) {
      this.canvas.width = width;
    }

    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }
  }

  private validateConfig(config: CanvasRendererConfig): void {
    if (config === null || typeof config !== "object") {
      throw new TypeError("Canvas renderer configuration is required.");
    }

    if (
      typeof config.fontFamily !== "string" ||
      config.fontFamily.trim().length === 0
    ) {
      throw new TypeError("Font family must be a non-empty string.");
    }

    this.validatePositiveFinite(config.fontSize, "Font size");
    this.validatePositiveFinite(config.cellWidth, "Character cell width");
    this.validatePositiveFinite(config.cellHeight, "Character cell height");
    this.validateColor(config.foregroundColor, "Foreground");
    this.validateColor(config.backgroundColor, "Background");
  }

  private validateGrid(
    characterGrid: readonly (readonly string[])[],
    colorGrid?: readonly (readonly (string | null)[])[],
  ): void {
    if (characterGrid.length === 0 || characterGrid[0].length === 0) {
      throw new RangeError("Character grid must contain at least one cell.");
    }

    const columns = characterGrid[0].length;
    for (const row of characterGrid) {
      if (row.length !== columns) {
        throw new RangeError("Character grid rows must have equal lengths.");
      }
    }

    if (colorGrid !== undefined) {
      if (colorGrid.length !== characterGrid.length) {
        throw new RangeError(
          "Color grid dimensions must match the character grid.",
        );
      }

      for (let row = 0; row < colorGrid.length; row += 1) {
        if (colorGrid[row].length !== columns) {
          throw new RangeError(
            "Color grid dimensions must match the character grid.",
          );
        }

        for (const color of colorGrid[row]) {
          if (color !== null) {
            this.validateColor(color, "Character");
          }
        }
      }
    }
  }

  private validateDimension(value: number, label: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError(`${label} must be a positive integer.`);
    }
  }

  private validatePositiveFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${label} must be a positive finite number.`);
    }
  }

  private validateColor(color: string, label: string): void {
    if (typeof color !== "string" || color.trim().length === 0) {
      throw new TypeError(`${label} color must be a non-empty string.`);
    }
  }
}
