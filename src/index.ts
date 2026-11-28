export { ASCIIEngine } from "./core/Engine";
export { AnimationLoop } from "./animation/AnimationLoop";
export { CameraManager } from "./core/Camera";
export { GeometryManager } from "./core/Geometry";
export { LightingManager } from "./core/Lighting";
export { SceneManager } from "./core/Scene";
export { ASCIIConverter } from "./renderer/ASCIIConverter";
export { CanvasRenderer } from "./renderer/CanvasRenderer";
export { CharacterMapper } from "./renderer/CharacterMapper";
export { ColorManager } from "./renderer/ColorManager";
export { Renderer } from "./renderer/Renderer";
export { ResolutionManager } from "./renderer/ResolutionManager";
export type { AnimationUpdateCallback } from "./animation/AnimationLoop";
export type { CameraOptions } from "./core/Camera";
export type {
  BoxGeometryOptions,
  CylinderGeometryOptions,
  PlaneGeometryOptions,
  SphereGeometryOptions,
} from "./core/Geometry";
export type {
  AmbientLightOptions,
  DirectionalLightOptions,
  LightPosition,
  PointLightOptions,
} from "./core/Lighting";
export type { SceneBackground } from "./core/Scene";
export type {
  EngineConfig,
  EngineConfigOverrides,
  EngineLifecycleState,
  RenderResolution,
} from "./core/Types";
export type {
  CanvasRendererConfig,
  CharacterColorGrid,
} from "./renderer/CanvasRenderer";
export type { RGBColor } from "./renderer/ColorManager";
export type { RendererComponents } from "./renderer/Renderer";
export type { ResolutionInfo } from "./renderer/ResolutionManager";
