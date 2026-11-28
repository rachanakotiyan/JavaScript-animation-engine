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
      options.ambientIntensity ?? 0.2,
      "Ambient intensity",
    );
    this.validateNonNegativeFinite(
      options.directionalIntensity ?? 3,
      "Directional intensity",
    );
    this.validateNonNegativeFinite(
      options.pointIntensity ?? 40,
      "Point intensity",
    );
    this.validateNonNegativeFinite(
      options.pointDistance ?? 12,
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
          intensity: this.options.ambientIntensity ?? 0.2,
        }),
      );
      this.lights.push(
        this.lightingManager.addDirectionalLight(scene, {
          color: this.options.directionalColor ?? 0xffffff,
          intensity: this.options.directionalIntensity ?? 3,
          position: this.options.directionalPosition ?? [-3, 4, 5],
        }),
      );
      this.lights.push(
        this.lightingManager.addPointLight(scene, {
          color: this.options.pointColor ?? 0xffffff,
          intensity: this.options.pointIntensity ?? 40,
          distance: this.options.pointDistance ?? 12,
          decay: this.options.pointDecay ?? 2,
          position: this.options.pointPosition ?? [2, 1, 3],
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

  private createEnvironmentTexture(): CanvasTexture {
    if (typeof document === "undefined") {
      throw new Error(
        "Mirrorball environment generation requires a browser document.",
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error(
        "Unable to acquire a 2D context for the mirrorball environment.",
      );
    }

    const { width, height } = canvas;
    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#020202");
    background.addColorStop(0.5, "#101010");
    background.addColorStop(1, "#030303");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    this.drawLightPanel(context, width, height, 0.2, 0.15, 0.95);
    this.drawLightPanel(context, width, height, 0.48, 0.055, 0.7);
    this.drawLightPanel(context, width, height, 0.72, 0.2, 0.55);
    this.drawLightPanel(context, width, height, 0.91, 0.035, 0.8);

    const texture = new CanvasTexture(canvas);
    texture.mapping = EquirectangularReflectionMapping;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  private drawLightPanel(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    center: number,
    panelWidth: number,
    intensity: number,
  ): void {
    const centerX = center * width;
    const halfWidth = (panelWidth * width) / 2;
    const gradient = context.createLinearGradient(
      centerX - halfWidth,
      0,
      centerX + halfWidth,
      0,
    );

    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.22, `rgba(255, 255, 255, ${intensity * 0.08})`);
    gradient.addColorStop(0.43, `rgba(255, 255, 255, ${intensity * 0.55})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(0.57, `rgba(255, 255, 255, ${intensity * 0.55})`);
    gradient.addColorStop(0.78, `rgba(255, 255, 255, ${intensity * 0.08})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.fillStyle = gradient;
    context.fillRect(centerX - halfWidth, 0, halfWidth * 2, height);
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
