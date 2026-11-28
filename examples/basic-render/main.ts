import {
  ASCIIEngine,
  Mirrorball,
  MirrorballAnimation,
  MirrorballLighting,
} from "../../src/index";

const canvas = document.querySelector<HTMLCanvasElement>("#output");
const destroyButton = document.querySelector<HTMLButtonElement>("#destroy");

if (canvas === null || destroyButton === null) {
  throw new Error("The basic render example is missing required page elements.");
}

const engine = new ASCIIEngine({
  canvas,
  resolution: { columns: 100, rows: 48 },
  characterPalette: " .:-=+*#%@",
  backgroundColor: "#000000",
  foregroundColor: "#ffffff",
  frameRate: 30,
  autoResize: true,
});

const sphereRadius = 1.1;
const chainLength = 0.6;
const connectorHeight = 0.12;
const motifCenterY =
  -(chainLength + connectorHeight + sphereRadius * 2) / 2;

engine.cameraManager.setPosition(0, motifCenterY, 5.5);
engine.cameraManager
  .getCamera()
  .lookAt(0, motifCenterY, 0);

const mirrorball = new Mirrorball({
  geometry: {
    sphereRadius,
    chainLength,
    connectorHeight,
  },
  sphereColor: 0xd4d7dc,
  supportColor: 0x9a9da3,
  metalness: 0.96,
  roughness: 0.18,
});
const scene = engine.sceneManager.getScene();
mirrorball.addTo(scene);

const mirrorballLighting = new MirrorballLighting({
  ambientColor: 0xffffff,
  ambientIntensity: 0.12,
  directionalColor: 0xffffff,
  directionalIntensity: 3.5,
  directionalPosition: [-3, 4, 5],
  pointColor: 0xffffff,
  pointIntensity: 48,
  pointPosition: [2, 1, 3],
  pointDistance: 12,
  pointDecay: 2,
});
mirrorballLighting.attachTo(scene);

const mirrorballAnimation = new MirrorballAnimation(mirrorball, {
  rotationSpeed: 1.5,
  swingAmplitude: 0.01,
  swingSpeed: 0.7,
});
const removeAnimationUpdate = engine.addUpdateCallback((deltaTime) => {
  mirrorballAnimation.update(deltaTime);
});

let destroyed = false;
const destroyEngine = (): void => {
  if (destroyed) {
    return;
  }

  destroyed = true;
  removeAnimationUpdate();
  mirrorballAnimation.reset();
  mirrorballLighting.dispose();
  mirrorball.dispose();
  engine.destroy();
  destroyButton.disabled = true;
};

destroyButton.addEventListener("click", destroyEngine);
window.addEventListener("pagehide", destroyEngine, { once: true });

engine.start();
