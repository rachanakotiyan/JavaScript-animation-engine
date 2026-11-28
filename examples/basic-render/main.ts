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

// Higher column count + a richer palette gives more luminance steps, which
// produces clearer sphere curvature and sharper reflection hot-spots.
const engine = new ASCIIEngine({
  canvas,
  resolution: { columns: 120, rows: 56 },
  // Palette goes dark → medium → bright; dense mid-range helps chrome shading.
  characterPalette: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  backgroundColor: "#000000",
  foregroundColor: "#ffffff",
  frameRate: 30,
  autoResize: true,
});

// Geometry parameters — keep chain short relative to the sphere.
const sphereRadius = 1.1;
const chainLength = 0.22;   // Short chain: ~20 % of sphere diameter.
const connectorHeight = 0.1;

// Centre the viewport on the midpoint of the full assembly.
// The group pivot is at the top of the chain, so the sphere centre sits at
// -(sphereRadius) in group-local space.  We want the camera to look at the
// sphere centre in world space.
const assemblyCentreY = -(sphereRadius + connectorHeight / 2);

engine.cameraManager.setPosition(0, assemblyCentreY, 4.8);
engine.cameraManager
  .getCamera()
  .lookAt(0, assemblyCentreY, 0);

const mirrorball = new Mirrorball({
  geometry: {
    sphereRadius,
    chainLength,
    connectorHeight,
    // Finer chain so it doesn't dominate the composition.
    chainRadius: 0.012,
    connectorRadius: 0.05,
  },
  // Brighter silver-white tint.
  sphereColor: 0xe0e4e8,
  supportColor: 0x9a9da3,
  // Near-perfect mirror: high metalness, very low roughness.
  metalness: 0.98,
  roughness: 0.08,
  // Amplify environment reflections well above 1× to compensate for the
  // lossy luminance averaging that the ASCII conversion performs.
  envMapIntensity: 5.0,
});

const scene = engine.sceneManager.getScene();
mirrorball.addTo(scene);

const mirrorballLighting = new MirrorballLighting({
  ambientColor: 0xffffff,
  // Keep ambient low so the dark mirror areas stay dark.
  ambientIntensity: 0.08,
  directionalColor: 0xffffff,
  directionalIntensity: 4.5,
  directionalPosition: [-2, 5, 4],
  pointColor: 0xffffff,
  pointIntensity: 72,
  pointPosition: [3, 2, 3],
  pointDistance: 14,
  pointDecay: 2,
});
mirrorballLighting.attachTo(scene);

// Wire the procedural env texture directly into the sphere material so it
// also drives per-object reflections independently of scene.environment.
mirrorball.setEnvMap(mirrorballLighting.getEnvironmentTexture());

// Primary motion: rotate the whole group on Y so the env-map reflections
// visibly sweep across the surface.  Swing is barely perceptible.
const mirrorballAnimation = new MirrorballAnimation(mirrorball, {
  rotationSpeed: 1.1,
  swingAmplitude: 0.003,
  swingSpeed: 0.4,
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
