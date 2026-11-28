import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  Scene,
  SRGBColorSpace,
  type ColorRepresentation,
  type Light,
  type Texture,
} from "three";
import {
  LightingManager,
  type LightPosition,
} from "../../core/Lighting";

export interface MirrorballLightingOptions {
  ambientColor?: ColorRepresentation;
  ambientIntensity?: number;
  directionalColor?: ColorRepresentation;
  directionalIntensity?: number;
  directionalPosition?: LightPosition;
  pointColor?: ColorRepresentation;
  pointIntensity?: number;
  pointPosition?: LightPosition;
  pointDistance?: number;
  pointDecay?: number;
}

export class MirrorballLighting {
  private readonly lights: Light[] = [];
  private attachedScene: Scene | null = null;
  private previousEnvironment: Texture | null = null;
  private environmentTexture: CanvasTexture | null = null;
  private disposed = false;

  constructor(
    private readonly options: MirrorballLightingOptions = {},
    private readonly lightingManager: LightingManager = new LightingManager(),
  ) {
    this.validateNonNegativeFinite(
      options.ambientIntensity ?? 0.15,
      "Ambient intensity",
    );
    this.validateNonNegativeFinite(
      options.directionalIntensity ?? 4,
      "Directional intensity",
    );
    this.validateNonNegativeFinite(
      options.pointIntensity ?? 60,
      "Point intensity",
    );
    this.validateNonNegativeFinite(
      options.pointDistance ?? 14,
      "Point distance",
    );
    this.validateNonNegativeFinite(options.pointDecay ?? 2, "Point decay");
    this.validatePosition(options.directionalPosition ?? [-3, 4, 5]);
    this.validatePosition(options.pointPosition ?? [2, 1, 3]);
  }

  attachTo(scene: Scene): this {
    this.ensureNotDisposed();

    if (this.attachedScene === scene) {
      return this;
    }

    if (this.attachedScene !== null) {
      this.attachedScene.remove(...this.lights);
      this.restoreEnvironment(this.attachedScene);
      this.attachedScene = null;
      this.previousEnvironment = null;
    }

    if (this.lights.length > 0) {
      scene.add(...this.lights);
      this.previousEnvironment = scene.environment;
      scene.environment = this.environmentTexture;
      this.attachedScene = scene;
      return this;
    }

    const environmentTexture = this.createEnvironmentTexture();

    try {
      this.lights.push(
        this.lightingManager.addAmbientLight(scene, {
          color: this.options.ambientColor ?? 0xffffff,
          intensity: this.options.ambientIntensity ?? 0.15,
        }),
      );
      this.lights.push(
        this.lightingManager.addDirectionalLight(scene, {
          color: this.options.directionalColor ?? 0xffffff,
          intensity: this.options.directionalIntensity ?? 4,
          position: this.options.directionalPosition ?? [-3, 4, 5],
        }),
      );
      this.lights.push(
        this.lightingManager.addPointLight(scene, {
          color: this.options.pointColor ?? 0xffffff,
          intensity: this.options.pointIntensity ?? 60,
          distance: this.options.pointDistance ?? 14,
          decay: this.options.pointDecay ?? 2,
          position: this.options.pointPosition ?? [2, 1, 3],
        }),
      );
      // Second point light from the opposite side for more specular coverage.
      this.lights.push(
        this.lightingManager.addPointLight(scene, {
          color: this.options.pointColor ?? 0xffffff,
          intensity: (this.options.pointIntensity ?? 60) * 0.6,
          distance: this.options.pointDistance ?? 14,
          decay: this.options.pointDecay ?? 2,
          position: [-2, 2, -3],
        }),
      );
      this.previousEnvironment = scene.environment;
      this.environmentTexture = environmentTexture;
      scene.environment = environmentTexture;
      this.attachedScene = scene;
      return this;
    } catch (error) {
      scene.remove(...this.lights);
      this.lights.length = 0;
      environmentTexture.dispose();
      throw error;
    }
  }

  /**
   * Returns the procedural environment texture used for reflections.
   * The caller may assign this to a material's envMap for per-object control.
   */
  getEnvironmentTexture(): CanvasTexture | null {
    return this.environmentTexture;
  }

  getLights(): readonly Light[] {
    return [...this.lights];
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    if (this.attachedScene !== null) {
      this.attachedScene.remove(...this.lights);
      this.restoreEnvironment(this.attachedScene);
    }

    this.lights.length = 0;
    this.attachedScene = null;
    this.previousEnvironment = null;
    this.environmentTexture?.dispose();
    this.environmentTexture = null;
    this.disposed = true;
  }

  /**
   * Builds a high-contrast equirectangular environment texture that simulates
   * the scattered bright light sources a disco mirrorball reflects.
   *
   * Design rationale:
   *  - The texture is mostly black so dark mirror-like areas read clearly.
   *  - Bright vertical bands of varying widths and positions mimic ceiling
   *    spotlights and windows seen from inside the ball.
   *  - Multiple narrow high-intensity spikes produce the characteristic
   *    scattered-highlight look when reflected by a low-roughness sphere.
   */
  private createEnvironmentTexture(): CanvasTexture {
    if (typeof document === "undefined") {
      throw new Error(
        "Mirrorball environment generation requires a browser document.",
      );
    }

    const canvas = document.createElement("canvas");
    // Higher resolution gives sharper reflection hotspots in ASCII output.
    canvas.width = 2048;
    canvas.height = 1024;

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error(
        "Unable to acquire a 2D context for the mirrorball environment.",
      );
    }

    const { width, height } = canvas;

    // Near-black base — mirrors should read dark between highlights.
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);

    // Broad primary spotlight (upper third) — the main bright source.
    this.drawLightBand(context, width, height, 0.18, 0.12, 1.0, 0.65);
    // Secondary spotlight at mid-right.
    this.drawLightBand(context, width, height, 0.55, 0.09, 0.9, 0.55);
    // Narrow sharp spike — produces a crisp hot highlight.
    this.drawLightBand(context, width, height, 0.36, 0.025, 1.0, 0.72);
    // Wide soft fill from the right side.
    this.drawLightBand(context, width, height, 0.78, 0.18, 0.75, 0.45);
    // Tight rear spike.
    this.drawLightBand(context, width, height, 0.93, 0.03, 0.95, 0.68);
    // Faint left fill.
    this.drawLightBand(context, width, height, 0.03, 0.08, 0.6, 0.35);

    // Horizontal bright strip near the equator (ceiling reflections).
    this.drawHorizontalBand(context, width, height, 0.35, 0.06, 0.55);
    // Faint floor reflection near the bottom.
    this.drawHorizontalBand(context, width, height, 0.82, 0.04, 0.3);

    const texture = new CanvasTexture(canvas);
    texture.mapping = EquirectangularReflectionMapping;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Draws a vertical Gaussian-shaped light band across the full canvas height.
   * @param centerU   Horizontal center as a fraction of canvas width [0, 1].
   * @param bandWidth Width of the band as a fraction of canvas width.
   * @param peak      Alpha of the band centre (0–1).
   * @param shoulder  Alpha at ~1 sigma from the centre.
   */
  private drawLightBand(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerU: number,
    bandWidth: number,
    peak: number,
    shoulder: number,
  ): void {
    const centerX = centerU * width;
    const halfW = (bandWidth * width) / 2;

    const gradient = context.createLinearGradient(
      centerX - halfW,
      0,
      centerX + halfW,
      0,
    );

    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.15, `rgba(255,255,255,${(shoulder * 0.3).toFixed(3)})`);
    gradient.addColorStop(0.38, `rgba(255,255,255,${(shoulder * 0.75).toFixed(3)})`);
    gradient.addColorStop(0.5, `rgba(255,255,255,${peak.toFixed(3)})`);
    gradient.addColorStop(0.62, `rgba(255,255,255,${(shoulder * 0.75).toFixed(3)})`);
    gradient.addColorStop(0.85, `rgba(255,255,255,${(shoulder * 0.3).toFixed(3)})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    context.fillStyle = gradient;
    context.fillRect(centerX - halfW, 0, halfW * 2, height);
  }

  /**
   * Draws a horizontal luminous strip — simulates ceiling/floor reflections.
   * @param centerV  Vertical centre as a fraction of canvas height [0, 1].
   * @param bandH    Strip height as a fraction of canvas height.
   * @param alpha    Alpha of the strip.
   */
  private drawHorizontalBand(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerV: number,
    bandH: number,
    alpha: number,
  ): void {
    const centerY = centerV * height;
    const halfH = (bandH * height) / 2;

    const gradient = context.createLinearGradient(0, centerY - halfH, 0, centerY + halfH);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.4, `rgba(255,255,255,${(alpha * 0.6).toFixed(3)})`);
    gradient.addColorStop(0.5, `rgba(255,255,255,${alpha.toFixed(3)})`);
    gradient.addColorStop(0.6, `rgba(255,255,255,${(alpha * 0.6).toFixed(3)})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    context.fillStyle = gradient;
    context.fillRect(0, centerY - halfH, width, halfH * 2);
  }

  private restoreEnvironment(scene: Scene): void {
    if (scene.environment === this.environmentTexture) {
      scene.environment = this.previousEnvironment;
    }
  }

  private validatePosition(position: LightPosition): void {
    if (position.length !== 3 || !position.every(Number.isFinite)) {
      throw new RangeError(
        "Light position must contain three finite coordinates.",
      );
    }
  }

  private validateNonNegativeFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${label} must be a non-negative finite number.`);
    }
  }

  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error("Cannot attach disposed MirrorballLighting.");
    }
  }
}
