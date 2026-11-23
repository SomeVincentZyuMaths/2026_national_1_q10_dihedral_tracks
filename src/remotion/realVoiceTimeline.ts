import * as THREE from 'three';
import { TRACKS } from '../scenes/dihedralMath';
import subtitlesData from '../../audio/real_voice_subtitles.json';

export interface RealVoiceFrameData {
  timeSec: number;
  timeMs: number;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  cameraZoom: number;
  axialC: number;
  axialD: number;
  insetOpacity: number;
  planeOpacity: number;
  highlight: number;
  showSectionLabel: boolean;
  sectionLabelText: string;
  isAtA: boolean;
  isMerged: boolean;
  currentSubtitle: string;
  stageName: string;
  optionBadge: string | null;
}

const near = TRACKS.axialDStart; // 1.0
const far = TRACKS.axialC;      // 2.7

// 三大机位定义
const obliqueView = {
  position: new THREE.Vector3(13.5, 6, 10.5),
  target: new THREE.Vector3(5, 0, 0),
  zoom: 1.0,
};

const endOnView = {
  position: new THREE.Vector3(15, 0.8, 0),
  target: new THREE.Vector3(far, 0.8, 0),
  zoom: 1.0,
};

const closeView = {
  position: new THREE.Vector3(8, 4, 8),
  target: new THREE.Vector3(2, 0.9, 0),
  zoom: 1.0,
};

export const easeInOut = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const ramp = (t: number, a: number, b: number) =>
  easeInOut(THREE.MathUtils.clamp((t - a) / (b - a), 0, 1));

export const TOTAL_REAL_VOICE_DURATION_SEC = 588.14;

export function computeRealVoiceFrame(timeSec: number): RealVoiceFrameData {
  const t = THREE.MathUtils.clamp(timeSec, 0, TOTAL_REAL_VOICE_DURATION_SEC);
  const timeMs = t * 1000;

  // 1. 获取当前字幕
  let currentSubtitle = '';
  for (const item of subtitlesData) {
    if (t >= item.start && t <= item.end) {
      currentSubtitle = item.text;
      break;
    }
  }

  // 2. 动点轴向位置 (axialC, axialD)
  let axialC = far;
  let axialD = near;

  if (t >= 137 && t < 152) {
    // 01:37 ~ 02:32 动点滑动至重合
    axialD = THREE.MathUtils.lerp(near, far, ramp(t, 137, 146));
  } else if (t >= 152 && t < 279) {
    // 保持在重合或微小演示
    axialD = far;
  } else if (t >= 279 && t < 378) {
    // 向量分析，展示轴向滑动
    axialD = far - (far - near) * (ramp(t, 290, 305) - ramp(t, 360, 375));
  } else if (t >= 378 && t < 476) {
    // C选项重合
    axialD = axialC = far;
  } else if (t >= 476 && t < 533) {
    // A选项反例：平移至 AO = √2 (约 1.414)
    axialD = axialC = THREE.MathUtils.lerp(far, Math.SQRT2, ramp(t, 476, 488));
  } else if (t >= 533 && t < 573) {
    // D选项反例：平移至原点 A (0)
    axialD = axialC = Math.SQRT2 * (1 - ramp(t, 533, 545));
  } else if (t >= 573) {
    // 总结阶段回原位
    axialC = far * ramp(t, 573, 580);
    axialD = near * ramp(t, 573, 580);
  }

  // 3. 镜头机位与视角插值计算 (对应台词动作)
  const cameraPos = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  let cameraZoom = 1.0;

  const blend = (viewA: typeof obliqueView, viewB: typeof obliqueView, progress: number) => {
    const p = easeInOut(progress);
    cameraPos.lerpVectors(viewA.position, viewB.position, p);
    cameraTarget.lerpVectors(viewA.target, viewB.target, p);
    cameraZoom = THREE.MathUtils.lerp(viewA.zoom, viewB.zoom, p);
  };

  let stageName = '题面建系';
  let optionBadge: string | null = null;

  if (t < 64) {
    // 00:00 ~ 01:04 斜视角
    cameraPos.copy(obliqueView.position);
    cameraTarget.copy(obliqueView.target);
    stageName = t < 25 ? '01 审题' : '02 空间建系';
  } else if (t >= 64 && t < 96) {
    // 01:04 ~ 01:36 转正视角 endOn
    stageName = '03 选项 B 截面投影';
    optionBadge = 'B';
    const p = ramp(t, 64, 68);
    blend(obliqueView, endOnView, p);
  } else if (t >= 96 && t < 224) {
    // 01:36 ~ 03:44 切回斜视角 obliqueView
    stageName = '04 选项 B 空间下界';
    optionBadge = 'B';
    const p = ramp(t, 96, 100);
    blend(endOnView, obliqueView, p);
  } else if (t >= 224 && t < 279) {
    // 03:44 ~ 04:39 旋转对称性展示，临时转正视
    stageName = '05 空间对称性';
    const p = ramp(t, 224, 228);
    blend(obliqueView, endOnView, p);
  } else if (t >= 279 && t < 415) {
    // 04:39 ~ 06:55 向量分解与正交推导 (QQ截图板书阶段)
    stageName = '06 选项 C 向量分解';
    optionBadge = 'C';
    const p = ramp(t, 279, 283);
    blend(endOnView, obliqueView, p);
  } else if (t >= 415 && t < 455) {
    // 06:55 ~ 07:35 直角判定，转入正视角
    stageName = '07 选项 C 勾股直角';
    optionBadge = 'C';
    const p = ramp(t, 415, 419);
    blend(obliqueView, endOnView, p);
  } else if (t >= 455 && t < 476) {
    // 07:35 ~ 07:56 平面 ABD 显出，切回斜视
    stageName = '08 选项 C 线面垂直';
    optionBadge = 'C';
    const p = ramp(t, 455, 459);
    blend(endOnView, obliqueView, p);
  } else if (t >= 476 && t < 533) {
    // 07:56 ~ 08:53 选项 A 反例，特写机位 closeView
    stageName = '09 选项 A 反例证明';
    optionBadge = 'A';
    const p = ramp(t, 476, 482);
    blend(obliqueView, closeView, p);
  } else if (t >= 533 && t < 573) {
    // 08:53 ~ 09:33 选项 D 反例
    stageName = '10 选项 D 反例证明';
    optionBadge = 'D';
    cameraPos.copy(closeView.position);
    cameraTarget.copy(closeView.target);
  } else {
    // 09:33 ~ 09:48 总结尾声，优雅切回全景
    stageName = '11 总结与回看';
    const p = ramp(t, 573, 580);
    blend(closeView, obliqueView, p);
  }

  // 4. 辅助图层状态
  const isMerged = Math.abs(axialC - axialD) < 0.08;
  const isAtA = axialC < 0.15;
  const insetOpacity = (t >= 64 && t < 96) || (t >= 415 && t < 455) ? 1 : 0;
  const planeOpacity = t >= 455 && t < 476 ? ramp(t, 455, 460) : 0;
  const highlight = t >= 64 && t < 573 ? 1 : 0;

  return {
    timeSec: t,
    timeMs,
    cameraPosition: cameraPos,
    cameraTarget,
    cameraZoom,
    axialC,
    axialD,
    insetOpacity,
    planeOpacity,
    highlight,
    showSectionLabel: t < 64 || t >= 533,
    sectionLabelText: isAtA ? '平面 ACD ⟂ AB' : 'y=y_C ∥ xOz',
    isAtA,
    isMerged,
    currentSubtitle,
    stageName,
    optionBadge,
  };
}
