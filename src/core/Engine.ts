import { WebGLRenderer } from "three";
import { AnimationLoop } from "../animation/AnimationLoop";
import { ASCIIConverter } from "../renderer/ASCIIConverter";
import { CanvasRenderer } from "../renderer/CanvasRenderer";
import { CharacterMapper } from "../renderer/CharacterMapper";
import { ColorManager } from "../renderer/ColorManager";
import { Renderer } from "../renderer/Renderer";
import { ResolutionManager } from "../renderer/ResolutionManager";
import { DefaultConfig } from "../config/DefaultConfig";
import { CameraManager } from "./Camera";
import { GeometryManager } from "./Geometry";
import { LightingManager } from "./Lighting";
import { SceneManager } from "./Scene";
import type {
  EngineConfig,
  EngineConfigOverrides,
  EngineLifecycleState,
} from "./Types";

const FONT_FAMILY = "monospace";
const FONT_SIZE = 12;
const CHARACTER_ASPECT_RATIO = 0.6;

export class ASCIIEngine {
  readonly config: EngineConfig;
  readonly sceneManager: SceneManager;
  readonly cameraManager: CameraManager;
  readonly geometryManager: GeometryManager;
  readonly lightingManager: LightingManager;

  private readonly animationLoop: AnimationLoop;
  private readonly webglRenderer: WebGLRenderer;
  private readonly readbackCanvas: HTMLCanvasElement;
  private readonly readbackContext: CanvasRenderingContext2D;
  private readonly resolutionManager: ResolutionManager;
  private readonly asciiRenderer: Renderer;
  private state: EngineLifecycleState = "idle";
  private renderWidth = 0;
  private renderHeight = 0;
  private cameraAspectRatio = 0;

  constructor(overrides: EngineConfigOverrides = {}) {
    this.config = {
      ...DefaultConfig,
      ...overrides,
      resolution: {
        ...DefaultConfig.resolution,
        ...overrides.resolution,
      },
    };

    this.validateConfig();

    if (!this.config.canvas) {
      throw new Error(
        "An output canvas must be provided in the ASCIIEngine configuration.",
      );
    }

    if (typeof document === "undefined") {
      throw new Error("ASCIIEngine requires a browser document to initialize.");
    }

    this.sceneManager = new SceneManager(this.config.backgroundColor);
    this.cameraManager = new CameraManager();
    this.cameraManager.setPosition(0, 0, 5);
    this.geometryManager = new GeometryManager();
    this.lightingManager = new LightingManager();

    const outputCanvas = this.config.canvas;
    this.resolutionManager = new ResolutionManager(
      this.config.resolution,
      FONT_SIZE,
      outputCanvas,
      this.config.autoResize,
      CHARACTER_ASPECT_RATIO,
    );

    const resolutionInfo = this.resolutionManager.getResolutionInfo();
    const characterMapper = new CharacterMapper(this.config.characterPalette);
    const asciiConverter = new ASCIIConverter(characterMapper);
    const colorManager = new ColorManager(
      this.config.foregroundColor,
      this.config.backgroundColor,
    );
    const canvasRenderer = new CanvasRenderer(outputCanvas, {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE,
      foregroundColor: colorManager.foregroundColor,
      backgroundColor: colorManager.backgroundColor,
      cellWidth: resolutionInfo.cellWidth,
      cellHeight: resolutionInfo.cellHeight,
    });

    this.asciiRenderer = new Renderer({
      asciiConverter,
      colorManager,
      resolutionManager: this.resolutionManager,
      canvasRenderer,
    });

    this.readbackCanvas = document.createElement("canvas");
    const readbackContext = this.readbackCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (readbackContext === null) {
      throw new Error("Unable to acquire a 2D context for WebGL readback.");
    }

    this.readbackContext = readbackContext;
    const webglCanvas = document.createElement("canvas");
    this.webglRenderer = new WebGLRenderer({
      canvas: webglCanvas,
      antialias: false,
      preserveDrawingBuffer: true,
    });

    this.animationLoop = new AnimationLoop(
      this.update,
      this.config.frameRate,
    );
  }

  getState(): EngineLifecycleState {
    return this.state;
  }

  start(): void {
    switch (this.state) {
      case "idle":
      case "stopped":
        this.animationLoop.start();
        this.state = "running";
        return;
      case "paused":
        this.animationLoop.resume();
        this.state = "running";
        return;
      case "running":
        return;
      case "disposed":
        throw new Error("Cannot start an ASCIIEngine after it has been destroyed.");
    }
  }

  pause(): void {
    if (this.state === "running") {
      this.animationLoop.pause();
      this.state = "paused";
    }
  }

  stop(): void {
    if (this.state !== "disposed") {
      this.animationLoop.stop();
      this.state = "stopped";
    }
  }

  destroy(): void {
    if (this.state === "disposed") {
      return;
    }

    this.animationLoop.destroy();
    this.webglRenderer.dispose();
    this.sceneManager.clear();
    this.readbackCanvas.width = 0;
    this.readbackCanvas.height = 0;
    this.state = "disposed";
  }

  private readonly update = (
    _deltaTime: number,
    _elapsedTime: number,
  ): void => {
    this.renderFrame();
  };

  private renderFrame(): void {
    const resolution = this.resolutionManager.recalculateDimensions();

    if (
      resolution.canvasWidth !== this.renderWidth ||
      resolution.canvasHeight !== this.renderHeight
    ) {
      this.webglRenderer.setSize(
        resolution.canvasWidth,
        resolution.canvasHeight,
        false,
      );
      this.readbackCanvas.width = resolution.canvasWidth;
      this.readbackCanvas.height = resolution.canvasHeight;
      this.renderWidth = resolution.canvasWidth;
      this.renderHeight = resolution.canvasHeight;
    }

    const aspectRatio = resolution.canvasWidth / resolution.canvasHeight;
    if (aspectRatio !== this.cameraAspectRatio) {
      this.cameraManager.updateAspectRatio(aspectRatio);
      this.cameraAspectRatio = aspectRatio;
    }

    this.webglRenderer.render(
      this.sceneManager.getScene(),
      this.cameraManager.getCamera(),
    );
    this.readbackContext.clearRect(
      0,
      0,
      resolution.canvasWidth,
      resolution.canvasHeight,
    );
    this.readbackContext.drawImage(
      this.webglRenderer.domElement,
      0,
      0,
      resolution.canvasWidth,
      resolution.canvasHeight,
    );

    const imageData = this.readbackContext.getImageData(
      0,
      0,
      resolution.canvasWidth,
      resolution.canvasHeight,
    );
    this.asciiRenderer.render(imageData);
  }

  private validateConfig(): void {
    const { columns, rows } = this.config.resolution;

    if (!Number.isInteger(columns) || columns <= 0) {
      throw new Error("Resolution columns must be a positive integer.");
    }

    if (!Number.isInteger(rows) || rows <= 0) {
      throw new Error("Resolution rows must be a positive integer.");
    }

    if (!Number.isFinite(this.config.frameRate) || this.config.frameRate <= 0) {
      throw new Error("Frame rate must be a positive finite number.");
    }

    if (this.config.characterPalette.length === 0) {
      throw new Error("Character palette must not be empty.");
    }
  }
}
