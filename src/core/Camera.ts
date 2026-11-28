import { PerspectiveCamera } from "three";

export interface CameraOptions {
  fieldOfView?: number;
  aspectRatio?: number;
  near?: number;
  far?: number;
}

export class CameraManager {
  private readonly camera: PerspectiveCamera;

  constructor(options: CameraOptions = {}) {
    const fieldOfView = options.fieldOfView ?? 50;
    const aspectRatio = options.aspectRatio ?? 1;
    const near = options.near ?? 0.1;
    const far = options.far ?? 2000;

    this.validateFieldOfView(fieldOfView);
    this.validatePositiveFinite(aspectRatio, "Aspect ratio");
    this.validatePositiveFinite(near, "Near plane");
    this.validatePositiveFinite(far, "Far plane");

    if (far <= near) {
      throw new RangeError("Far plane must be greater than the near plane.");
    }

    this.camera = new PerspectiveCamera(fieldOfView, aspectRatio, near, far);
  }

  setPosition(x: number, y: number, z: number): void {
    if (![x, y, z].every(Number.isFinite)) {
      throw new RangeError(
        "Camera position coordinates must be finite numbers.",
      );
    }

    this.camera.position.set(x, y, z);
  }

  getCamera(): PerspectiveCamera {
    return this.camera;
  }

  updateAspectRatio(aspectRatio: number): void {
    this.validatePositiveFinite(aspectRatio, "Aspect ratio");
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  private validateFieldOfView(fieldOfView: number): void {
    if (
      !Number.isFinite(fieldOfView) ||
      fieldOfView <= 0 ||
      fieldOfView >= 180
    ) {
      throw new RangeError(
        "Field of view must be greater than 0 and less than 180 degrees.",
      );
    }
  }

  private validatePositiveFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${label} must be a positive finite number.`);
    }
  }
}
