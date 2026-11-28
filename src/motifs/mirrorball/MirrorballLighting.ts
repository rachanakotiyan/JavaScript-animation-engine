import { Scene, type ColorRepresentation, type Light } from "three";
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

    if (this.lights.length > 0) {
      scene.add(...this.lights);
      this.attachedScene = scene;
      return this;
    }

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
      this.attachedScene = scene;
      return this;
    } catch (error) {
      scene.remove(...this.lights);
      this.lights.length = 0;
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
    }

    this.lights.length = 0;
    this.attachedScene = null;
    this.disposed = true;
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
