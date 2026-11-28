import { Mirrorball } from "./Mirrorball";

export interface MirrorballAnimationOptions {
  /**
   * Y-axis rotation speed of the whole mirrorball group in radians per second.
   * Rotating the group (rather than just the sphere) makes environment-map
   * reflections visibly sweep across the surface.
   * @default 1.2
   */
  rotationSpeed?: number;
  /**
   * Maximum Z-axis pendulum swing angle in radians.
   * Keep this very small so the hanging silhouette stays stable.
   * @default 0.004
   */
  swingAmplitude?: number;
  /** Swing oscillation frequency in radians per second. @default 0.5 */
  swingSpeed?: number;
}

export class MirrorballAnimation {
  private readonly rotationSpeed: number;
  private readonly swingAmplitude: number;
  private readonly swingSpeed: number;
  private readonly initialGroupRotationY: number;
  private readonly initialSwingRotation: number;
  private elapsedTime = 0;

  constructor(
    private readonly mirrorball: Mirrorball,
    options: MirrorballAnimationOptions = {},
  ) {
    this.rotationSpeed = options.rotationSpeed ?? 1.2;
    this.swingAmplitude = options.swingAmplitude ?? 0.004;
    this.swingSpeed = options.swingSpeed ?? 0.5;

    this.validateFinite(this.rotationSpeed, "Rotation speed");
    this.validateNonNegativeFinite(this.swingAmplitude, "Swing amplitude");
    this.validateNonNegativeFinite(this.swingSpeed, "Swing speed");

    this.initialGroupRotationY = mirrorball.group.rotation.y;
    this.initialSwingRotation = mirrorball.group.rotation.z;
  }

  update(deltaTime: number): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new RangeError("Delta time must be a non-negative finite number.");
    }

    this.elapsedTime += deltaTime;

    // Rotate the entire group on the Y axis so the environment map
    // reflections arc across the sphere surface as seen by the camera.
    this.mirrorball.group.rotation.y =
      this.initialGroupRotationY + this.rotationSpeed * this.elapsedTime;

    // Very subtle pendulum swing on Z — barely noticeable but physically plausible.
    this.mirrorball.group.rotation.z =
      this.initialSwingRotation +
      this.swingAmplitude * Math.sin(this.swingSpeed * this.elapsedTime);
  }

  reset(): void {
    this.elapsedTime = 0;
    this.mirrorball.group.rotation.y = this.initialGroupRotationY;
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
