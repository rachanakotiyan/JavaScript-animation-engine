import { Mirrorball } from "./Mirrorball";

export interface MirrorballAnimationOptions {
  /** Sphere rotation speed in radians per second. */
  rotationSpeed?: number;
  /** Maximum swing angle in radians. */
  swingAmplitude?: number;
  /** Swing oscillation speed in radians per second. */
  swingSpeed?: number;
}

export class MirrorballAnimation {
  private readonly rotationSpeed: number;
  private readonly swingAmplitude: number;
  private readonly swingSpeed: number;
  private readonly initialSphereRotation: number;
  private readonly initialSwingRotation: number;
  private elapsedTime = 0;

  constructor(
    private readonly mirrorball: Mirrorball,
    options: MirrorballAnimationOptions = {},
  ) {
    this.rotationSpeed = options.rotationSpeed ?? 0.8;
    this.swingAmplitude = options.swingAmplitude ?? 0.035;
    this.swingSpeed = options.swingSpeed ?? 0.7;

    this.validateFinite(this.rotationSpeed, "Rotation speed");
    this.validateNonNegativeFinite(this.swingAmplitude, "Swing amplitude");
    this.validateNonNegativeFinite(this.swingSpeed, "Swing speed");

    this.initialSphereRotation = mirrorball.sphere.rotation.y;
    this.initialSwingRotation = mirrorball.group.rotation.z;
  }

  update(deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new RangeError("Delta time must be a non-negative finite number.");
    }

    this.elapsedTime += deltaTime;
    this.mirrorball.sphere.rotation.y =
      this.initialSphereRotation + this.rotationSpeed * this.elapsedTime;
    this.mirrorball.group.rotation.z =
      this.initialSwingRotation +
      this.swingAmplitude * Math.sin(this.swingSpeed * this.elapsedTime);
  }

  reset(): void {
    this.elapsedTime = 0;
    this.mirrorball.sphere.rotation.y = this.initialSphereRotation;
    this.mirrorball.group.rotation.z = this.initialSwingRotation;
  }

  private validateFinite(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${label} must be a finite number.`);
    }
  }

  private validateNonNegativeFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${label} must be a non-negative finite number.`);
    }
  }
}
