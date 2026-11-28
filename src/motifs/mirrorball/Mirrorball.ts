import {
  Group,
  Mesh,
  MeshStandardMaterial,
  type ColorRepresentation,
  type Scene,
  type Texture,
} from "three";
import { GeometryManager } from "../../core/Geometry";
import {
  MirrorballGeometry,
  type MirrorballGeometryOptions,
  type MirrorballGeometryParts,
} from "./MirrorballGeometry";

export interface MirrorballOptions {
  geometry?: MirrorballGeometryOptions;
  sphereColor?: ColorRepresentation;
  supportColor?: ColorRepresentation;
  metalness?: number;
  roughness?: number;
  /**
   * Intensity multiplier applied to the environment map on the sphere.
   * Higher values make reflections appear brighter and more prominent.
   * @default 3.5
   */
  envMapIntensity?: number;
}

export class Mirrorball {
  readonly group: Group;
  readonly sphere: Mesh;
  readonly chain: Mesh;
  readonly connector: Mesh;

  private readonly geometries: MirrorballGeometryParts;
  private readonly sphereMaterial: MeshStandardMaterial;
  private readonly supportMaterial: MeshStandardMaterial;
  private disposed = false;

  constructor(
    options: MirrorballOptions = {},
    geometryManager: GeometryManager = new GeometryManager(),
  ) {
    const metalness = options.metalness ?? 0.9;
    const roughness = options.roughness ?? 0.22;
    const envMapIntensity = options.envMapIntensity ?? 3.5;
    this.validateMaterialProperty(metalness, "Metalness");
    this.validateMaterialProperty(roughness, "Roughness");
    if (!Number.isFinite(envMapIntensity) || envMapIntensity < 0) {
      throw new RangeError("envMapIntensity must be a non-negative finite number.");
    }

    this.geometries = new MirrorballGeometry(
      options.geometry,
      geometryManager,
    ).create();

    // High metalness + very low roughness + strong envMapIntensity produces the
    // chrome mirror look.  envMapIntensity above 1 is intentional here: it
    // compensates for the dark environment seen through ASCII character cells.
    this.sphereMaterial = new MeshStandardMaterial({
      color: options.sphereColor ?? 0xd0d5db,
      metalness,
      roughness,
      envMapIntensity,
    });
    this.supportMaterial = new MeshStandardMaterial({
      color: options.supportColor ?? 0x858b92,
      metalness: 0.75,
      roughness: 0.35,
    });

    this.group = new Group();
    this.sphere = new Mesh(
      this.geometries.sphereGeometry,
      this.sphereMaterial,
    );
    this.chain = new Mesh(
      this.geometries.chainGeometry,
      this.supportMaterial,
    );
    this.connector = new Mesh(
      this.geometries.connectorGeometry,
      this.supportMaterial,
    );

    const suspensionPointY =
      this.geometries.chainPosition.y +
      this.geometries.chainGeometry.parameters.height / 2;

    this.sphere.position.copy(this.geometries.spherePosition);
    this.chain.position.copy(this.geometries.chainPosition);
    this.connector.position.copy(this.geometries.connectorPosition);
    this.sphere.position.y -= suspensionPointY;
    this.chain.position.y -= suspensionPointY;
    this.connector.position.y -= suspensionPointY;
    this.group.add(this.chain, this.connector, this.sphere);
  }

  /**
   * Explicitly sets the environment map on the sphere material.
   * Call this after `MirrorballLighting.attachTo()` to ensure the material
   * uses the same procedural env texture that was set on the scene, with an
   * independent (and higher) envMapIntensity.
   */
  setEnvMap(texture: Texture | null): void {
    this.ensureNotDisposed();
    this.sphereMaterial.envMap = texture;
    this.sphereMaterial.needsUpdate = true;
  }

  addTo(scene: Scene): this {
    this.ensureNotDisposed();
    scene.add(this.group);
    return this;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.group.removeFromParent();
    this.geometries.sphereGeometry.dispose();
    this.geometries.chainGeometry.dispose();
    this.geometries.connectorGeometry.dispose();
    this.sphereMaterial.dispose();
    this.supportMaterial.dispose();
  }

  private validateMaterialProperty(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${label} must be a finite number between 0 and 1.`);
    }
  }

  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error("Cannot add a disposed Mirrorball to a scene.");
    }
  }
}
