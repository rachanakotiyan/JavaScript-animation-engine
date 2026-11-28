import {
  Color,
  Scene,
  Texture,
  type ColorRepresentation,
  type Object3D,
} from "three";

export type SceneBackground = ColorRepresentation | Texture | null;

export class SceneManager {
  private readonly scene: Scene;

  constructor(background: SceneBackground = null) {
    this.scene = new Scene();
    this.setBackground(background);
  }

  add(object: Object3D): void {
    this.scene.add(object);
  }

  remove(object: Object3D): void {
    this.scene.remove(object);
  }

  getScene(): Scene {
    return this.scene;
  }

  clear(): void {
    this.scene.clear();
  }

  setBackground(background: SceneBackground): void {
    this.scene.background =
      background === null
        ? null
        : background instanceof Texture
          ? background
          : new Color(background);
  }
}
