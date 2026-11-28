import { Mesh, MeshStandardMaterial } from "three";
import { ASCIIEngine } from "../../src/index";

const canvas = document.querySelector<HTMLCanvasElement>("#output");
const destroyButton = document.querySelector<HTMLButtonElement>("#destroy");

if (canvas === null || destroyButton === null) {
  throw new Error("The basic render example is missing required page elements.");
}

const engine = new ASCIIEngine({
  canvas,
  resolution: { columns: 100, rows: 48 },
  characterPalette: " .:-=+*#%@",
  backgroundColor: "#080b12",
  foregroundColor: "#e9edf5",
  frameRate: 30,
  autoResize: true,
});

const geometry = engine.geometryManager.createSphere({
  radius: 1.15,
  widthSegments: 48,
  heightSegments: 32,
});
const material = new MeshStandardMaterial({
  color: 0x40c9e8,
  metalness: 0.08,
  roughness: 0.36,
});
const sphere = new Mesh(geometry, material);
engine.sceneManager.add(sphere);

const scene = engine.sceneManager.getScene();
engine.lightingManager.addAmbientLight(scene, { intensity: 1.1 });
engine.lightingManager.addDirectionalLight(scene, {
  intensity: 2.4,
  position: [3, 4, 5],
});
engine.lightingManager.addPointLight(scene, {
  color: 0xffaa66,
  intensity: 24,
  distance: 8,
  position: [-3, 1, 2],
});

let destroyed = false;
const destroyEngine = (): void => {
  if (destroyed) {
    return;
  }

  destroyed = true;
  engine.destroy();
  geometry.dispose();
  material.dispose();
  destroyButton.disabled = true;
};

destroyButton.addEventListener("click", destroyEngine);
window.addEventListener("pagehide", destroyEngine, { once: true });

engine.start();
