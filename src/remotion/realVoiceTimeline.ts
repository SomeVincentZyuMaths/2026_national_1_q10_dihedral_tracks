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

// 三大典型镜头视角定义
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

  // 1. 获取当前精准字幕
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

  if (t >= 142 && t < 155) {
    // 02:22 ~ 02:35：“当点 D 平移过来，刚好与 D' 重合的时候...” -> 动点沿轴向滑动至重合
    axialD = THREE.MathUtils.lerp(near, far, ramp(t, 142, 150));
  } else if (t >= 155 && t < 279) {
    // 保持在重合
    axialD = far;
  } else if (t >= 279 && t < 378) {
    // 向量分析演示，展示轴向滑动
    axialD = far - (far - near) * (ramp(t, 290, 305) - ramp(t, 360, 375));
  } else if (t >= 378 && t < 476) {
    // C选项两点共截面重合
    axialD = axialC = far;
  } else if (t >= 476 && t < 533) {
    // A选项反例：平移截面至 AO = √2 (约 1.414)
    axialD = axialC = THREE.MathUtils.lerp(far, Math.SQRT2, ramp(t, 476, 488));
  } else if (t >= 533 && t < 573) {
    // D选项反例：平移至原点 A (0)
    axialD = axialC = Math.SQRT2 * (1 - ramp(t, 533, 545));
  } else if (t >= 573) {
    // 总结阶段回原位
    axialC = far * ramp(t, 573, 580);
    axialD = near * ramp(t, 573, 580);
  }

  // 3. 镜头机位与视角插值计算 (1:1 严格对齐原视频操作动作！)
  const cameraPos = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  let cameraZoom = 1.0;

  const blend = (viewA: typeof obliqueView, viewB: typeof obliqueView, progress: number) => {
    const p = easeInOut(progress);
    cameraPos.lerpVectors(viewA.position, viewB.position, p);
    cameraTarget.lerpVectors(viewA.target, viewB.target, p);
    cameraZoom = THREE.MathUtils.lerp(viewA.zoom, viewB.zoom, p);
  };

  let stageName = '01 审题';
  let optionBadge: string | null = null;

  if (t < 42) {
    // 00:00 ~ 00:42 审题与空间建系，稳定在斜视角 obliqueView
    cameraPos.copy(obliqueView.position);
    cameraTarget.copy(obliqueView.target);
    stageName = t < 25 ? '01 审题' : '02 空间建系';
  } else if (t >= 42 && t < 96) {
    // 00:42 ~ 01:36：“二面角是 60 度很显然，我们转到这个角度来看……” -> 42s 准时平滑切入正视角 endOn！
    stageName = t < 62 ? '02 二面角定义' : '03 选项 B 截面投影';
    if (t >= 62) optionBadge = 'B';
    const p = ramp(t, 42, 45); // 42s ~ 45s 平滑转入
    blend(obliqueView, endOnView, p);
  } else if (t >= 96 && t < 224) {
    // 01:36 ~ 03:44：“先回到刚刚这一步……” -> 96s 准时切回立体斜视角 obliqueView
    stageName = '04 选项 B 空间下界';
    optionBadge = 'B';
    const p = ramp(t, 96, 100);
    blend(endOnView, obliqueView, p);
  } else if (t >= 224 && t < 279) {
    // 03:44 ~ 04:39：“为了方便看题，我们转到这个角度来看 xOz 平面...” -> 对称性展示，临时转正视
    stageName = '05 空间对称性';
    const p = ramp(t, 224, 228);
    blend(obliqueView, endOnView, p);
  } else if (t >= 279 && t < 415) {
    // 04:39 ~ 06:55：“然后看 C 选项，AB 垂直于 CD...” -> 切回斜视，触发 QQ 截图红线板书
    stageName = '06 选项 C 向量分解';
    optionBadge = 'C';
    const p = ramp(t, 279, 283);
    blend(endOnView, obliqueView, p);
  } else if (t >= 415 && t < 455) {
    // 06:55 ~ 07:35：“只看这个垂直截面内的三角形 OCD...” -> 切入正视，展示勾股直角
    stageName = '07 选项 C 勾股直角';
    optionBadge = 'C';
    const p = ramp(t, 415, 419);
    blend(obliqueView, endOnView, p);
  } else if (t >= 455 && t < 476) {
    // 07:35 ~ 07:56：“显出平面 ABD...” -> 切回立体斜视，半透明平面浮现
    stageName = '08 选项 C 线面垂直';
    optionBadge = 'C';
    const p = ramp(t, 455, 459);
    blend(endOnView, obliqueView, p);
  } else if (t >= 476 && t < 533) {
    // 07:56 ~ 08:53：“来看 A 选项反例，令 AO = √2...” -> 转入近景特写 closeView
    stageName = '09 选项 A 反例证明';
    optionBadge = 'A';
    const p = ramp(t, 476, 482);
    blend(obliqueView, closeView, p);
  } else if (t >= 533 && t < 573) {
    // 08:53 ~ 09:33：“D 的反例是把整个截面平移到原点 A...” -> 特写 closeView
    stageName = '10 选项 D 反例证明';
    optionBadge = 'D';
    cameraPos.copy(closeView.position);
    cameraTarget.copy(closeView.target);
  } else {
    // 09:33 ~ 09:48：总结收尾，全景回正
    stageName = '11 总结与回看';
    const p = ramp(t, 573, 580);
    blend(closeView, obliqueView, p);
  }

  // 4. 辅助图层状态
  const isMerged = Math.abs(axialC - axialD) < 0.08;
  const isAtA = axialC < 0.15;
  const insetOpacity = (t >= 62 && t < 135) || (t >= 415 && t < 455) ? 1 : 0;
  const planeOpacity = t >= 455 && t < 476 ? ramp(t, 455, 460) : 0;
  const highlight = t >= 42 && t < 573 ? 1 : 0;

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
    showSectionLabel: t < 42 || t >= 533,
    sectionLabelText: isAtA ? '平面 ACD ⟂ AB' : 'y=y_C ∥ xOz',
    isAtA,
    isMerged,
    currentSubtitle,
    stageName,
    optionBadge,
  };
}
