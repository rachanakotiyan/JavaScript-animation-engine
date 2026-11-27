import type { RenderResolution } from "../core/Types";

export interface ResolutionInfo {
  readonly columns: number;
  readonly rows: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
}

export class ResolutionManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly fontSize: number;
  private readonly autoResize: boolean;
  /** Character cell width divided by its height. */
  private readonly characterAspectRatio: number;
  private configuredResolution: RenderResolution;
  private currentResolutionInfo!: ResolutionInfo;

  constructor(
    resolution: RenderResolution,
    fontSize: number,
    canvas: HTMLCanvasElement,
    autoResize: boolean,
    characterAspectRatio = 0.6,
  ) {
    this.validateResolution(resolution);
    this.validatePositiveFinite(fontSize, "Font size");
    this.validatePositiveFinite(
      characterAspectRatio,
      "Character aspect ratio",
    );

    this.configuredResolution = { ...resolution };
    this.fontSize = fontSize;
    this.canvas = canvas;
    this.autoResize = autoResize;
    this.characterAspectRatio = characterAspectRatio;

    this.recalculateDimensions();
  }

  getResolutionInfo(): ResolutionInfo {
    return { ...this.currentResolutionInfo };
  }

  updateResolution(resolution: RenderResolution): void {
    this.validateResolution(resolution);
    this.configuredResolution = { ...resolution };
    this.recalculateDimensions();
  }

  recalculateDimensions(): ResolutionInfo {
    const cellWidth = this.fontSize * this.characterAspectRatio;
    const cellHeight = this.fontSize;
    this.validatePositiveFinite(cellWidth, "Character cell width");
    let { columns, rows } = this.configuredResolution;

    if (this.autoResize) {
      const availableSize = this.getAvailableCanvasSize(cellWidth, cellHeight);
      columns = Math.max(1, Math.floor(availableSize.width / cellWidth));
      rows = Math.max(1, Math.floor(availableSize.height / cellHeight));
    }

    this.validateResolution({ columns, rows });
    const canvasWidth = Math.max(1, Math.ceil(columns * cellWidth));
    const canvasHeight = Math.max(1, Math.ceil(rows * cellHeight));
    this.validateCanvasDimensions(canvasWidth, canvasHeight);

    if (this.canvas.width !== canvasWidth) {
      this.canvas.width = canvasWidth;
    }

    if (this.canvas.height !== canvasHeight) {
      this.canvas.height = canvasHeight;
    }
    this.currentResolutionInfo = {
      columns,
      rows,
      cellWidth,
      cellHeight,
      canvasWidth,
      canvasHeight,
    };

    return this.getResolutionInfo();
  }

  private getAvailableCanvasSize(
    cellWidth: number,
    cellHeight: number,
  ): { width: number; height: number } {
    const parent = this.canvas.parentElement;
    const fallbackWidth = this.configuredResolution.columns * cellWidth;
    const fallbackHeight = this.configuredResolution.rows * cellHeight;

    return {
      width: this.getAvailableDimension(
        parent?.clientWidth ?? 0,
        this.canvas.clientWidth,
        fallbackWidth,
      ),
      height: this.getAvailableDimension(
        parent?.clientHeight ?? 0,
        this.canvas.clientHeight,
        fallbackHeight,
      ),
    };
  }

  private getAvailableDimension(
    parentDimension: number,
    canvasDimension: number,
    fallbackDimension: number,
  ): number {
    if (this.isPositiveFinite(parentDimension)) {
      return parentDimension;
    }

    if (this.isPositiveFinite(canvasDimension)) {
      return canvasDimension;
    }

    return fallbackDimension;
  }

  private validateResolution(resolution: RenderResolution): void {
    if (!Number.isSafeInteger(resolution.columns) || resolution.columns <= 0) {
      throw new RangeError("Resolution columns must be a positive integer.");
    }

    if (!Number.isSafeInteger(resolution.rows) || resolution.rows <= 0) {
      throw new RangeError("Resolution rows must be a positive integer.");
    }
  }

  private validatePositiveFinite(value: number, label: string): void {
    if (!this.isPositiveFinite(value)) {
      throw new RangeError(`${label} must be a positive finite number.`);
    }
  }

  private validateCanvasDimensions(width: number, height: number): void {
    if (
      !Number.isSafeInteger(width) ||
      width <= 0 ||
      !Number.isSafeInteger(height) ||
      height <= 0
    ) {
      throw new RangeError("Calculated canvas dimensions are invalid.");
    }
  }

  private isPositiveFinite(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }
}
