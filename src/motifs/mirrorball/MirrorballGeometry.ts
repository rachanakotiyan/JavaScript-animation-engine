import {
  Vector3,
  type CylinderGeometry,
  type SphereGeometry,
} from "three";
import { GeometryManager } from "../../core/Geometry";

export interface MirrorballGeometryOptions {
  sphereRadius?: number;
  sphereWidthSegments?: number;
  sphereHeightSegments?: number;
  chainLength?: number;
  chainRadius?: number;
  chainRadialSegments?: number;
  connectorHeight?: number;
  connectorRadius?: number;
  connectorRadialSegments?: number;
}

export interface MirrorballGeometryParts {
  sphereGeometry: SphereGeometry;
  chainGeometry: CylinderGeometry;
  connectorGeometry: CylinderGeometry;
  spherePosition: Vector3;
  chainPosition: Vector3;
  connectorPosition: Vector3;
}

export class MirrorballGeometry {
  constructor(
    private readonly options: MirrorballGeometryOptions = {},
    private readonly geometryManager: GeometryManager = new GeometryManager(),
  ) {}

  create(): MirrorballGeometryParts {
    const sphereRadius = this.options.sphereRadius ?? 1;
    const chainLength = this.options.chainLength ?? 0.6;
    const connectorHeight = this.options.connectorHeight ?? 0.12;

    return {
      sphereGeometry: this.geometryManager.createSphere({
        radius: sphereRadius,
        widthSegments: this.options.sphereWidthSegments ?? 64,
        heightSegments: this.options.sphereHeightSegments ?? 48,
      }),
      chainGeometry: this.geometryManager.createCylinder({
        radiusTop: this.options.chainRadius ?? 0.025,
        radiusBottom: this.options.chainRadius ?? 0.025,
        height: chainLength,
        radialSegments: this.options.chainRadialSegments ?? 12,
        openEnded: true,
      }),
      connectorGeometry: this.geometryManager.createCylinder({
        radiusTop: this.options.connectorRadius ?? 0.06,
        radiusBottom: this.options.connectorRadius ?? 0.06,
        height: connectorHeight,
        radialSegments: this.options.connectorRadialSegments ?? 16,
      }),
      spherePosition: new Vector3(0, 0, 0),
      chainPosition: new Vector3(
        0,
        sphereRadius + connectorHeight + chainLength / 2,
        0,
      ),
      connectorPosition: new Vector3(
        0,
        sphereRadius + connectorHeight / 2,
        0,
      ),
    };
  }
}
