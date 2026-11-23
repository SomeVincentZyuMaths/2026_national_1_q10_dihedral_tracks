import type { Camera, Scene, WebGLRenderer } from 'three';

export type ThemeName = 'paper' | 'dark';
export type AspectRatio = '16x9' | '9x16';
export type StageMode = 'interactive' | 'capture';
export type CameraMode = 'guided' | 'free';

export interface StepDefinition {
  id: string;
  label: string;
  title: string;
  caption: string;
  statement?: string;
  statementFigure?: string;
  formula?: string;
  option?: 'A' | 'B' | 'C' | 'D';
  reveal?: { at: number; caption: string; formula: string };
  durationMs: number;
  cue: string;
}

export interface SceneContext {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
}

export interface SceneController {
  scene: Scene;
  camera: Camera;
  enterStep(index: number): void;
  setCameraMode(mode: CameraMode): void;
  resetCamera(index: number): void;
  seekStep(index: number, progress: number): void;
  update(deltaMs: number): void;
  setTheme(theme: ThemeName): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export interface StageConfig {
  title: string;
  source: string;
  problem: string;
  steps: StepDefinition[];
  createScene(context: SceneContext): SceneController;
}

export interface TimelineLocation {
  stepIndex: number;
  progress: number;
}
