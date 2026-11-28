import {
  BoxGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
} from "three";

export interface SphereGeometryOptions {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
}

export interface BoxGeometryOptions {
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

export interface PlaneGeometryOptions {
  width?: number;
  height?: number;
  widthSegments?: number;
  heightSegments?: number;
}

export interface CylinderGeometryOptions {
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

export class GeometryManager {
  createSphere(options: SphereGeometryOptions = {}): SphereGeometry {
    const radius = options.radius ?? 1;
    const widthSegments = options.widthSegments ?? 32;
    const heightSegments = options.heightSegments ?? 16;

    this.validatePositiveFinite(radius, "Sphere radius");
    this.validateSegments(widthSegments, 3, "Sphere width segments");
    this.validateSegments(heightSegments, 2, "Sphere height segments");

    return new SphereGeometry(radius, widthSegments, heightSegments);
  }

  createBox(options: BoxGeometryOptions = {}): BoxGeometry {
    const width = options.width ?? 1;
    const height = options.height ?? 1;
    const depth = options.depth ?? 1;
    const widthSegments = options.widthSegments ?? 1;
    const heightSegments = options.heightSegments ?? 1;
    const depthSegments = options.depthSegments ?? 1;

    this.validatePositiveFinite(width, "Box width");
    this.validatePositiveFinite(height, "Box height");
    this.validatePositiveFinite(depth, "Box depth");
    this.validateSegments(widthSegments, 1, "Box width segments");
    this.validateSegments(heightSegments, 1, "Box height segments");
    this.validateSegments(depthSegments, 1, "Box depth segments");

    return new BoxGeometry(
      width,
      height,
      depth,
      widthSegments,
      heightSegments,
      depthSegments,
    );
  }

  createPlane(options: PlaneGeometryOptions = {}): PlaneGeometry {
    const width = options.width ?? 1;
    const height = options.height ?? 1;
    const widthSegments = options.widthSegments ?? 1;
    const heightSegments = options.heightSegments ?? 1;

    this.validatePositiveFinite(width, "Plane width");
    this.validatePositiveFinite(height, "Plane height");
    this.validateSegments(widthSegments, 1, "Plane width segments");
    this.validateSegments(heightSegments, 1, "Plane height segments");

    return new PlaneGeometry(width, height, widthSegments, heightSegments);
  }

  createCylinder(options: CylinderGeometryOptions = {}): CylinderGeometry {
    const radiusTop = options.radiusTop ?? 1;
    const radiusBottom = options.radiusBottom ?? 1;
    const height = options.height ?? 1;
    const radialSegments = options.radialSegments ?? 32;
    const heightSegments = options.heightSegments ?? 1;
    const openEnded = options.openEnded ?? false;
    const thetaStart = options.thetaStart ?? 0;
    const thetaLength = options.thetaLength ?? Math.PI * 2;

    this.validateNonNegativeFinite(radiusTop, "Cylinder top radius");
    this.validateNonNegativeFinite(radiusBottom, "Cylinder bottom radius");
    if (radiusTop === 0 && radiusBottom === 0) {
      throw new RangeError("At least one cylinder radius must be positive.");
    }

    this.validatePositiveFinite(height, "Cylinder height");
    this.validateSegments(radialSegments, 3, "Cylinder radial segments");
    this.validateSegments(heightSegments, 1, "Cylinder height segments");
    this.validateFinite(thetaStart, "Cylinder start angle");
    this.validatePositiveFinite(thetaLength, "Cylinder angle length");
    if (thetaLength > Math.PI * 2) {
      throw new RangeError("Cylinder angle length cannot exceed 2π radians.");
    }

    return new CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength,
    );
  }

  private validateSegments(
    value: number,
    minimum: number,
    label: string,
  ): void {
    if (!Number.isSafeInteger(value) || value < minimum) {
      throw new RangeError(
        `${label} must be an integer of at least ${minimum}.`,
      );
    }
  }

  private validatePositiveFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${label} must be a positive finite number.`);
    }
  }

  private validateNonNegativeFinite(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${label} must be a non-negative finite number.`);
    }
  }

  private validateFinite(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${label} must be a finite number.`);
    }
  }
}
