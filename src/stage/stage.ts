import katex from 'katex';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { applyTheme } from './theme';
import { locateTime, stepStart, totalDuration } from './timeline';
import type {
  AspectRatio,
  CameraMode,
  SceneController,
  StageConfig,
  StageMode,
  StepDefinition,
  ThemeName,
} from './types';

interface StageState {
  mode: StageMode;
  cameraMode: CameraMode;
  theme: ThemeName;
  ratio: AspectRatio;
  captions: boolean;
  playing: boolean;
  timeMs: number;
  stepIndex: number;
}

const query = new URLSearchParams(window.location.search);

function normalizeRatio(value: string | null): AspectRatio {
  return value === '9x16' ? '9x16' : '16x9';
}

function normalizeTheme(value: string | null): ThemeName {
  if (value === 'light' || value === 'paper') return 'paper';
  return 'dark';
}

function normalizeCameraMode(value: string | null): CameraMode {
  return value === 'free' ? 'free' : 'guided';
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

export function startStage(config: StageConfig): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app container');

  const initialMode: StageMode = query.get('mode') === 'capture' ? 'capture' : 'interactive';
  const state: StageState = {
    mode: initialMode,
    cameraMode: normalizeCameraMode(query.get('camera') ?? query.get('mode')),
    theme: normalizeTheme(query.get('theme')),
    ratio: normalizeRatio(query.get('ratio')),
    captions: query.get('captions') !== '0',
    playing: false,
    timeMs: 0,
    stepIndex: 0,
  };
  const duration = totalDuration(config.steps);
  const stepParam = query.get('step');
  const requestedStep = stepParam === null ? Number.NaN : Number(stepParam);
  if (Number.isFinite(requestedStep) && requestedStep >= 0) {
    const index = Math.min(config.steps.length - 1, Math.floor(requestedStep));
    state.stepIndex = index;
    state.timeMs = stepStart(config.steps, index) + Math.max(1, config.steps[index].durationMs - 1);
  }

  applyTheme(state.theme);
  document.body.dataset.mode = state.mode;
  document.body.dataset.ratio = state.ratio;

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true"></div>
          <div>
            <div class="eyebrow">${config.source}</div>
            <h1>${config.title}</h1>
          </div>
        </div>
        <div class="header-actions">
          <button class="ghost-button" data-action="camera-mode" type="button">◉ 视角：讲解</button>
          <button class="ghost-button" data-action="theme" type="button">◐ 深色</button>
          <button class="ghost-button" data-action="ratio" type="button">▭ 16:9</button>
          <button class="primary-button" data-action="capture" type="button">● 录屏模式</button>
        </div>
      </header>

      <main class="workspace">
        <section class="viewer" aria-label="三维动画舞台">
          <div class="reference-reveal"><div class="reference-clip">
          <section class="question-reference" aria-label="原题" inert>
            <strong>原题</strong>
            <p data-reference-stem></p>
            <div class="reference-options" data-reference-options></div>
          </section>
          </div></div>
          <div class="stage-frame" id="stage-frame">
            <div class="stage" id="stage"></div>
            <div class="source-chip">${config.source}</div>
            <div class="camera-hint">左键旋转 · 中键平移 · 滚轮缩放 · 双击复位</div>
            <div class="statement-card" data-statement>
              <div class="statement-copy" data-statement-copy></div>
              <div class="statement-figure" data-statement-figure></div>
            </div>
            <div class="step-overlays">
              <div class="caption-card" data-caption></div>
              <div class="formula-card" data-formula></div>
            </div>
          </div>

          <div class="transport">
            <button class="icon-button" data-action="reset" type="button" title="重置 (R)">↺</button>
            <button class="icon-button" data-action="prev" type="button" title="上一步 (←)">‹</button>
            <button class="play-button" data-action="play" type="button">▶ 播放</button>
            <button class="icon-button" data-action="next" type="button" title="下一步 (→)">›</button>
            <div class="timeline-wrap">
              <input data-timeline type="range" min="0" max="1000" value="0" aria-label="播放进度" />
              <div class="time-row"><span data-current-time>00:00</span><span data-total-time>00:00</span></div>
            </div>
            <button class="ghost-button compact" data-action="captions" type="button">字幕 开</button>
            <button class="ghost-button compact" data-action="fullscreen" type="button">全屏</button>
          </div>
        </section>

        <aside class="guide">
          <div class="step-kicker"><span data-step-number>01</span><span data-step-label>题面</span></div>
          <h2 data-step-title></h2>
          <p class="problem-text">${config.problem}</p>
          <div class="step-rule"></div>
          <ol class="step-list" data-step-list></ol>
          <div class="capture-note">
            <strong>录屏提示</strong>
            <span>按 C 隐藏界面，按 T 切换主题，按 V 切换画幅。</span>
          </div>
        </aside>
      </main>
    </div>
  `;

  const $ = <T extends Element>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  };

  const stageEl = $<HTMLDivElement>('#stage');
  const viewer = $<HTMLElement>('.viewer');
  const reference = $<HTMLElement>('.question-reference');
  const [stem, choices = ''] = (config.steps[0]?.statement ?? '').trim().split(/\r?\n\s*\r?\n/, 2);
  $<HTMLElement>('[data-reference-stem]').textContent = stem.replace(/\r?\n/g, ' ');
  const optionList = $<HTMLElement>('[data-reference-options]');
  for (const choice of choices.split(/\r?\n/).filter(Boolean)) {
    const option = document.createElement('span');
    option.dataset.choice = choice.charAt(0);
    option.textContent = choice;
    optionList.append(option);
  }
  const canvas = document.createElement('canvas');
  canvas.className = 'webgl-canvas';
  stageEl.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'label-layer';
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.inset = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  stageEl.appendChild(labelRenderer.domElement);

  let scene: SceneController;
  try {
    scene = config.createScene({ host: stageEl, canvas, renderer });
  } catch (error) {
    console.error(error);
    throw error;
  }
  scene.setTheme(state.theme);
  scene.setCameraMode(state.cameraMode);

  const captionEl = $<HTMLDivElement>('[data-caption]');
  const statementEl = $<HTMLDivElement>('[data-statement]');
  const statementCopyEl = $<HTMLDivElement>('[data-statement-copy]');
  const statementFigureEl = $<HTMLDivElement>('[data-statement-figure]');
  const formulaEl = $<HTMLDivElement>('[data-formula]');
  const stepTitle = $<HTMLElement>('[data-step-title]');
  const stepNumber = $<HTMLElement>('[data-step-number]');
  const stepLabel = $<HTMLElement>('[data-step-label]');
  const stepList = $<HTMLOListElement>('[data-step-list]');
  const playButton = $<HTMLButtonElement>('[data-action="play"]');
  const timeline = $<HTMLInputElement>('[data-timeline]');
  const currentTimeEl = $<HTMLElement>('[data-current-time]');
  const totalTimeEl = $<HTMLElement>('[data-total-time]');
  const themeButton = $<HTMLButtonElement>('[data-action="theme"]');
  const cameraModeButton = $<HTMLButtonElement>('[data-action="camera-mode"]');
  const ratioButton = $<HTMLButtonElement>('[data-action="ratio"]');
  const captureButton = $<HTMLButtonElement>('[data-action="capture"]');
  const captionButton = $<HTMLButtonElement>('[data-action="captions"]');

  totalTimeEl.textContent = formatTime(duration / 1000);

  config.steps.forEach((step, index) => {
    const item = document.createElement('li');
    const displayNumber = index === 0 ? '00' : String(index).padStart(2, '0');
    item.innerHTML = `<button type="button" data-step="${index}"><span>${displayNumber}</span><strong>${step.label}</strong><small>${step.title}</small></button>`;
    item.querySelector<HTMLButtonElement>('button')?.addEventListener('click', () => jumpToStep(index));
    stepList.appendChild(item);
  });

  let renderedStep = -1;
  let lastTimestamp = performance.now();
  let resizeQueued = false;
  let transitionFrom = 0;
  let transitionTo = 0;
  let transitionStartedAt = 0;
  let transitionDurationMs = 0;
  let transitioning = false;

  function updateCaption(): void {
    document.body.classList.toggle('captions-off', !state.captions);
    captionButton.textContent = `字幕 ${state.captions ? '开' : '关'}`;
  }

  function updateTheme(): void {
    applyTheme(state.theme);
    scene.setTheme(state.theme);
    themeButton.textContent = state.theme === 'paper' ? '◐ 深色' : '◑ 浅色';
    const url = new URL(window.location.href);
    url.searchParams.set('theme', state.theme === 'paper' ? 'light' : 'dark');
    window.history.replaceState(null, '', url);
  }

  function updateCameraMode(): void {
    document.body.dataset.cameraMode = state.cameraMode;
    cameraModeButton.textContent = state.cameraMode === 'guided' ? '◉ 视角：讲解' : '◎ 视角：自由';
  }

  function toggleCameraMode(): void {
    state.cameraMode = state.cameraMode === 'guided' ? 'free' : 'guided';
    scene.setCameraMode(state.cameraMode);
    if (state.cameraMode === 'guided') scene.resetCamera(state.stepIndex);
    updateCameraMode();
  }

  function updateRatio(): void {
    document.body.dataset.ratio = state.ratio;
    ratioButton.textContent = state.ratio === '16x9' ? '▭ 16:9' : '▯ 9:16';
    queueResize();
  }

  function updateMode(): void {
    document.body.dataset.mode = state.mode;
    captureButton.textContent = state.mode === 'capture' ? '退出录屏' : '● 录屏模式';
    queueResize();
  }

  function updatePlayButton(): void {
    playButton.textContent = state.playing ? '❚❚ 暂停' : '▶ 播放';
  }

  function restartOverlayAnimation(): void {
    captionEl.classList.remove('ui-enter');
    formulaEl.classList.remove('ui-enter');
    void stageEl.offsetWidth;
    requestAnimationFrame(() => {
      if (!document.body.classList.contains('statement-visible')) {
        captionEl.classList.add('ui-enter');
        formulaEl.classList.add('ui-enter');
      }
    });
  }

  function updateStepUI(step: StepDefinition, index: number): void {
    const showReference = index > 0 && Boolean(stem);
    viewer.classList.toggle('show-reference', showReference);
    reference.inert = !showReference;
    optionList.querySelectorAll<HTMLElement>('[data-choice]').forEach(el => {
      const letter = el.dataset.choice!;
      el.classList.toggle('discussed',letter === step.option);
      el.dataset.verdict = step.id === 'answer' ? ('BC'.includes(letter) ? '✓' : '×') : '';
    });
    stepNumber.textContent = index === 0 ? '00' : String(index).padStart(2, '0');
    stepLabel.textContent = step.label;
    stepTitle.textContent = step.title;
    // Keep the outgoing text in place while its layer fades out.
    // The outgoing caption stays in place during the 00 transition.
    if (step.statement) statementCopyEl.textContent = step.statement;
    statementFigureEl.innerHTML = '';
    statementEl.classList.remove('has-figure');
    if (step.statement) statementEl.classList.add('split-statement');
    document.body.classList.toggle('statement-visible', Boolean(step.statement));
    // Formula and narration are synchronized with the geometry below.
    stepList.querySelectorAll<HTMLButtonElement>('button').forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === index);
      button.classList.toggle('done', buttonIndex < index);
    });
  }

  let displayedBeat = '';
  function updateExplanation(step: StepDefinition, progress: number): void {
    const reveal = step.reveal && progress >= step.reveal.at ? step.reveal : null;
    const key = step.id + (reveal ? ':result' : ':setup');
    if (key === displayedBeat) return;
    displayedBeat = key;
    if (step.statement) return;
    const beat = reveal ?? step;
    captionEl.textContent = beat.caption;
    formulaEl.classList.toggle('is-empty', !beat.formula);
    if (beat.formula) katex.render(beat.formula, formulaEl, {displayMode:true,throwOnError:false});
    restartOverlayAnimation();
  }

  function goToTime(timeMs: number, force = false): void {
    state.timeMs = THREE.MathUtils.clamp(timeMs, 0, duration);
    const location = locateTime(config.steps, state.timeMs);
    const changed = force || location.stepIndex !== state.stepIndex;
    state.stepIndex = location.stepIndex;
    const step = config.steps[state.stepIndex];
    if (changed) {
      if (state.cameraMode === 'guided') scene.enterStep(state.stepIndex);
      updateStepUI(step, state.stepIndex);
      renderedStep = state.stepIndex;
    }
    updateExplanation(step, location.progress);
    scene.seekStep(state.stepIndex, location.progress);
    timeline.value = String(Math.round((state.timeMs / Math.max(1, duration)) * 1000));
    currentTimeEl.textContent = formatTime(state.timeMs / 1000);
    document.body.dataset.step = String(state.stepIndex + 1);
  }

  function jumpToStep(index: number): void {
    const safeIndex = THREE.MathUtils.clamp(index, 0, config.steps.length - 1);
    transitioning = false;
    state.playing = false;
    updatePlayButton();
    if (safeIndex !== state.stepIndex && Math.max(safeIndex, state.stepIndex) === 1) {
      goToTime(stepStart(config.steps, safeIndex) + (safeIndex === 1 ? config.steps[1].durationMs - 1 : 0), true);
      return;
    }
    const targetTime = stepStart(config.steps, safeIndex) + Math.max(1, config.steps[safeIndex].durationMs - 1);
    if (Math.abs(safeIndex - state.stepIndex) === 1) {
      transitionFrom = state.timeMs;
      transitionTo = targetTime;
      transitionStartedAt = performance.now();
      transitionDurationMs = 2000;
      transitioning = true;
    } else {
      goToTime(targetTime, true);
    }
  }

  function reset(): void {
    transitioning = false;
    state.playing = false;
    updatePlayButton();
    goToTime(0, true);
  }

  function togglePlay(): void {
    transitioning = false;
    if (state.playing) {
      state.playing = false;
      updatePlayButton();
      return;
    }
    const location = locateTime(config.steps, state.timeMs);
    if (state.timeMs >= duration - 2) {
      state.timeMs = 0;
    } else if (location.progress > 0.98) {
      state.timeMs = stepStart(config.steps, location.stepIndex);
    }
    state.playing = true;
    lastTimestamp = performance.now();
    updatePlayButton();
  }

  function resize(): void {
    const rect = stageEl.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
    scene.resize(width, height);
    renderer.render(scene.scene, scene.camera);
    labelRenderer.render(scene.scene, scene.camera);
  }

  function queueResize(): void {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      resize();
    });
  }

  function animate(now: number): void {
    const deltaMs = Math.min(50, now - lastTimestamp);
    lastTimestamp = now;
    scene.update(deltaMs);
    if (transitioning) {
      const raw = THREE.MathUtils.clamp((now - transitionStartedAt) / transitionDurationMs, 0, 1);
      const eased = raw * raw * (3 - 2 * raw);
      state.timeMs = THREE.MathUtils.lerp(transitionFrom, transitionTo, eased);
      if (raw >= 1) transitioning = false;
    }
    if (state.playing) {
      state.timeMs = Math.min(duration, state.timeMs + deltaMs);
      if (state.timeMs >= duration) {
        state.playing = false;
        updatePlayButton();
      }
    }
    goToTime(state.timeMs, renderedStep !== state.stepIndex);
    renderer.render(scene.scene, scene.camera);
    labelRenderer.render(scene.scene, scene.camera);
    requestAnimationFrame(animate);
  }

  document.querySelectorAll<HTMLElement>('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'play') togglePlay();
      if (action === 'prev') jumpToStep(state.stepIndex - 1);
      if (action === 'next') jumpToStep(state.stepIndex + 1);
      if (action === 'reset') reset();
      if (action === 'theme') {
        state.theme = state.theme === 'paper' ? 'dark' : 'paper';
        updateTheme();
      }
      if (action === 'camera-mode') toggleCameraMode();
      if (action === 'ratio') {
        state.ratio = state.ratio === '16x9' ? '9x16' : '16x9';
        updateRatio();
      }
      if (action === 'captions') {
        state.captions = !state.captions;
        updateCaption();
      }
      if (action === 'capture') {
        state.mode = state.mode === 'capture' ? 'interactive' : 'capture';
        updateMode();
      }
      if (action === 'fullscreen') {
        void viewer.requestFullscreen?.();
      }
    });
  });

  timeline.addEventListener('input', () => {
    transitioning = false;
    state.playing = false;
    updatePlayButton();
    goToTime((Number(timeline.value) / 1000) * duration, true);
  });

  canvas.addEventListener('dblclick', () => scene.resetCamera(state.stepIndex));
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    }
    if (event.key === 'ArrowRight') jumpToStep(state.stepIndex + 1);
    if (event.key === 'ArrowLeft') jumpToStep(state.stepIndex - 1);
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key.toLowerCase() === 't') {
      state.theme = state.theme === 'paper' ? 'dark' : 'paper';
      updateTheme();
    }
    if (event.key.toLowerCase() === 'm') toggleCameraMode();
    if (event.key === 'Home') {
      event.preventDefault();
      scene.resetCamera(state.stepIndex);
    }
    if (event.key.toLowerCase() === 'v') {
      state.ratio = state.ratio === '16x9' ? '9x16' : '16x9';
      updateRatio();
    }
    if (event.key.toLowerCase() === 'c') {
      state.mode = state.mode === 'capture' ? 'interactive' : 'capture';
      updateMode();
    }
    if (event.key.toLowerCase() === 'f') void viewer.requestFullscreen?.();
    if (event.key === 'Escape' && state.mode === 'capture') {
      state.mode = 'interactive';
      updateMode();
    }
  });

  new ResizeObserver(queueResize).observe(stageEl);
  window.addEventListener('resize', queueResize);

  updateTheme();
  updateCameraMode();
  updateRatio();
  updateMode();
  updateCaption();
  updatePlayButton();
  goToTime(state.timeMs, true);
  if (state.cameraMode === 'free' && state.stepIndex > 0) scene.resetCamera(state.stepIndex);
  requestAnimationFrame(() => {
    resize();
    requestAnimationFrame(animate);
  });

  window.__GEOMETRY_STAGE__ = {
    setStep: jumpToStep,
    seekTime: (timeMs: number) => goToTime(timeMs, true),
    setTheme: (theme: ThemeName) => {
      state.theme = theme;
      updateTheme();
    },
    setRatio: (ratio: AspectRatio) => {
      state.ratio = ratio;
      updateRatio();
    },
    setMode: (mode: StageMode) => {
      state.mode = mode;
      updateMode();
    },
    setCameraMode: (mode: CameraMode) => {
      state.cameraMode = mode;
      scene.setCameraMode(mode);
      if (mode === 'guided') scene.resetCamera(state.stepIndex);
      updateCameraMode();
    },
    resetCamera: () => scene.resetCamera(state.stepIndex),
    getCameraPosition: () => scene.camera.position.toArray(),
    setCaptions: (visible: boolean) => {
      state.captions = visible;
      updateCaption();
    },
    getState: () => ({ ...state }),
  };

  if (query.get('autoplay') === '1') window.setTimeout(togglePlay, 300);
}

declare global {
  interface Window {
    __GEOMETRY_STAGE__?: {
      setStep(index: number): void;
      seekTime(timeMs: number): void;
      setTheme(theme: ThemeName): void;
      setRatio(ratio: AspectRatio): void;
      setMode(mode: StageMode): void;
      setCameraMode(mode: CameraMode): void;
      resetCamera(): void;
      getCameraPosition(): number[];
      setCaptions(visible: boolean): void;
      getState(): StageState;
    };
  }
}
