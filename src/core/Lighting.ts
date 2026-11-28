import {
  AmbientLight,
  Color,
  DirectionalLight,
  PointLight,
  Scene,
  type ColorRepresentation,
  type Light,
} from "three";

export type LightPosition = readonly [number, number, number];

export interface AmbientLightOptions {
  color?: ColorRepresentation;
  intensity?: number;
}

export interface DirectionalLightOptions extends AmbientLightOptions {
  position?: LightPosition;
}

export interface PointLightOptions extends DirectionalLightOptions {
  distance?: number;
  decay?: number;
}

export class LightingManager {
  private readonly lights: Light[] = [];

  addAmbientLight(
    scene: Scene,
    options: AmbientLightOptions = {},
  ): AmbientLight {
    const color = this.createColor(options.color ?? 0xffffff);
    const intensity = options.intensity ?? 1;
    this.validateNonNegativeFinite(intensity, "Ambient light intensity");

    const light = new AmbientLight(color, intensity);
    scene.add(light);
    this.lights.push(light);
    return light;
  }

  addDirectionalLight(
    scene: Scene,
    options: DirectionalLightOptions = {},
  ): DirectionalLight {
    const color = this.createColor(options.color ?? 0xffffff);
    const intensity = options.intensity ?? 1;
    const position = options.position ?? [0, 1, 0];
    this.validateNonNegativeFinite(intensity, "Directional light intensity");
    this.validatePosition(position);

    const light = new DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
    this.lights.push(light);
    return light;
  }

  addPointLight(scene: Scene, options: PointLightOptions = {}): PointLight {
    const color = this.createColor(options.color ?? 0xffffff);
    const intensity = options.intensity ?? 1;
    const distance = options.distance ?? 0;
    const decay = options.decay ?? 2;
    const position = options.position ?? [0, 0, 0];
    this.validateNonNegativeFinite(intensity, "Point light intensity");
    this.validateNonNegativeFinite(distance, "Point light distance");
    this.validateNonNegativeFinite(decay, "Point light decay");
    this.validatePosition(position);

    const light = new PointLight(color, intensity, distance, decay);
    light.position.set(...position);
    scene.add(light);
    this.lights.push(light);
    return light;
  }

  getLights(): readonly Light[] {
    return [...this.lights];
  }

  private createColor(color: ColorRepresentation): Color {
    if (
      typeof color === "number" &&
      (!Number.isSafeInteger(color) || color < 0 || color > 0xffffff)
    ) {
      throw new RangeError(
        "Numeric light color must be an integer between 0 and 0xffffff.",
      );
    }

    if (typeof color === "string" && color.trim().length === 0) {
      throw new TypeError("Light color must not be empty.");
    }

    if (
      color instanceof Color &&
      ![color.r, color.g, color.b].every(Number.isFinite)
    ) {
      throw new RangeError("Light color channels must be finite numbers.");
    }

    return new Color(color);
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
}
