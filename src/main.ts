import 'katex/dist/katex.min.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/400.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/500.css';
import './styles/theme.css';
import './styles/base.css';
import './styles/tracks.css';
import { createScene } from './scenes/scene';
import { startStage } from './stage/stage';
import type { StepDefinition } from './stage/types';

const steps: StepDefinition[] = [
  {
    id: 'original',
    label: '原题',
    title: '先看原题',
    caption: '先读题，再开始空间探索。',
    statement:
      '在空间中，A、B 为两个定点，动点 C 到直线 AB 的距离为 2，动点 D 到直线 AB 的距离为 1。\n若二面角 C-AB-D 为 60°，则（　）\n\nA. ∠CAD ≥ 60°\nB. CD ≥ √3\nC. 当 AB⊥CD 时，CD⊥平面 ABD\nD. 当 AB⊥平面 ACD 时，AC⊥AD',
    statementFigure: `
      <svg viewBox="0 0 520 360" role="img" aria-label="空间双轨道示意图">
        <defs>
          <marker id="q10-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold)"/>
          </marker>
        </defs>
        <g opacity="0.16" transform="rotate(-11 285 210)">
          <ellipse cx="285" cy="210" rx="42" ry="105" fill="var(--blue)"/>
        </g>
        <g opacity="0.16" transform="rotate(-11 370 190)">
          <ellipse cx="370" cy="190" rx="20" ry="52" fill="var(--teal)"/>
        </g>
        <line x1="55" y1="245" x2="465" y2="155" stroke="var(--gold)" stroke-width="3" marker-end="url(#q10-arrow)"/>
        <g transform="rotate(-11 285 210)">
          <ellipse cx="285" cy="210" rx="42" ry="105" fill="none" stroke="var(--blue)" stroke-width="2.5"/>
        </g>
        <g transform="rotate(-11 370 190)">
          <ellipse cx="370" cy="190" rx="20" ry="52" fill="none" stroke="var(--teal)" stroke-width="2.5"/>
        </g>
        <line x1="285" y1="210" x2="265" y2="106" stroke="var(--blue)" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.65"/>
        <line x1="370" y1="190" x2="389" y2="141" stroke="var(--teal)" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.65"/>
        <line x1="265" y1="106" x2="389" y2="141" stroke="var(--red)" stroke-width="4" stroke-linecap="round"/>
        <path d="M 330 190 A 28 28 0 0 0 349 166" fill="none" stroke="var(--gold)" stroke-width="2"/>
        <circle cx="265" cy="106" r="7" fill="var(--blue)"/>
        <circle cx="389" cy="141" r="7" fill="var(--teal)"/>
        <circle cx="285" cy="210" r="3.5" fill="var(--blue)"/>
        <circle cx="370" cy="190" r="3.5" fill="var(--teal)"/>
        <text x="244" y="94" fill="var(--blue)" font-size="18" font-weight="600">C</text>
        <text x="402" y="137" fill="var(--teal)" font-size="18" font-weight="600">D</text>
        <text x="61" y="238" fill="var(--gold)" font-size="16" font-weight="600">A</text>
        <text x="462" y="149" fill="var(--gold)" font-size="16" font-weight="600">B</text>
        <text x="305" y="227" fill="var(--gold)" font-size="15" font-weight="600">60°</text>
        <text x="320" y="107" fill="var(--red)" font-size="16" font-weight="600">CD</text>
        <text x="298" y="164" fill="var(--muted)" font-size="13">r₂ = 2</text>
        <text x="381" y="206" fill="var(--muted)" font-size="13">r₁ = 1</text>
      </svg>`,
    durationMs: 10000,
    cue: '完整展示原题和四个选项，停顿给观众阅读。',
  },
  {
    id: 'section', label: '建系', title: '60° 究竟是哪两条线的夹角？', durationMs: 11000,
    caption: '以 A 为原点，沿 AB 为 y 轴正向，z 轴竖直向上。C、D 在 y 轴上的垂足分别是 O₁、O₂。', formula: String.raw`O_1C=2,\quad O_2D=1`,
    reveal: { at: 0.43, caption: '把 O₂D 平移到 O₁D′，方向不变。金色角弧才是二面角的平面角。', formula: String.raw`O_1D'\parallel O_2D,\quad \angle CO_1D'=60^\circ` },
    cue: '把 O₂D 平移到 O₁D′，方向不变。金色角弧才是二面角的平面角。',
  },
  {
    id: 'projection', label: 'B · 投影', title: '先求截面上的 CD′', durationMs: 12000,
    caption: '沿 y 轴看，D 投到过 C、O₁ 的截面上，落点为 D′。', formula: String.raw`O_1C=2,\quad O_1D'=1`, option: 'B',
    reveal: { at: 0.42, caption: '在三角形 CO₁D′ 中用余弦定理。求出的是投影 CD′ 的长度。', formula: String.raw`CD'^2=2^2+1^2-2\cdot2\cdot1\cos60^\circ=3` },
    cue: '在三角形 CO₁D′ 中用余弦定理。求出的是投影 CD′ 的长度。',
  },
  {
    id: 'distance', label: 'B · 下界', title: '把空间距离拆成两条直角边', durationMs: 15000,
    caption: '回到斜视角：DD′ 垂直截面，直角在 D′。两段长度不能直接相加。', formula: String.raw`\begin{aligned}DD'&=O_1O_2=|y_D-y_C|\\CD^2&=CD'^2+DD'^2=3+(y_D-y_C)^2\end{aligned}`, option: 'B',
    reveal: { at: 0.78, caption: '让 O₂ 滑到 O₁：轴向距离变为零，D 与 D′ 重合。下界可以取到，B 正确。', formula: String.raw`DD'=O_1O_2=0\quad\Longrightarrow\quad CD_{\min}=\sqrt3` },
    cue: '让 O₂ 滑到 O₁：轴向距离变为零，D 与 D′ 重合。下界可以取到，B 正确。',
  },
  {
    id: 'component', label: 'C · 分量', title: '为什么 AB⊥CD 就能让两点共截面？', durationMs: 15000,
    caption: 'AB 只有 y 分量。点积里，CD 的 x、z 分量都乘以零；是否垂直只看 y 分量。', formula: String.raw`\begin{aligned}\vec{AB}&=(0,y_B,0)\\\vec{CD}&=(\Delta x,y_D-y_C,\Delta z)\\\vec{AB}\cdot\vec{CD}&=y_B(y_D-y_C)\end{aligned}`, option: 'C',
    reveal: { at: 0.78, caption: 'y_B 非零，所以 y_D=y_C。两个垂足合为 O，C、D、O 同在垂直于 y 轴的截面内。', formula: String.raw`AB\perp CD\iff y_D=y_C\iff O_1=O_2=O` },
    cue: 'y_B 非零，所以 y_D=y_C。两个垂足合为 O，C、D、O 同在垂直于 y 轴的截面内。',
  },
  {
    id: 'right', label: 'C · 直角', title: '截面里还有哪两条线垂直？', durationMs: 10000,
    caption: '只看截面三角形 OCD：三边分别是 1、√3 和 2。最长的 OC 对着 D 点。', formula: String.raw`OD=1,\quad CD=\sqrt3,\quad OC=2`, option: 'C',
    reveal: { at: 0.48, caption: '由勾股定理的逆定理，直角在 D 点。因此 CD 垂直于 OD。', formula: String.raw`OD^2+CD^2=1+3=OC^2\implies CD\perp OD` },
    cue: '由勾股定理的逆定理，直角在 D 点。因此 CD 垂直于 OD。',
  },
  {
    id: 'plane', label: 'C · 判定', title: '平面内找两条相交直线', durationMs: 12000,
    caption: '显出平面 ABD。AB 和 OD 都在这个平面内，并且交于 O。', formula: String.raw`AB\cap OD=\{O\}`, option: 'C',
    reveal: { at: 0.48, caption: 'CD 垂直于 AB 是前提，垂直于 OD 是上一幕所得。由线面垂直判定，C 正确。', formula: String.raw`CD\perp AB,\quad CD\perp OD\implies CD\perp\text{平面 }ABD` },
    cue: 'CD 垂直于 AB 是前提，垂直于 OD 是上一幕所得。由线面垂直判定，C 正确。',
  },
  {
    id: 'example-a', label: 'A · 反例', title: '同一个 60° 二面角，能否得到 45° 的 ∠CAD？', durationMs: 16000,
    caption: '两圆心保持重合，把截面移到 AO=√2 处。取这个位置仍满足全部题设。', formula: String.raw`AD^2=AO^2+OD^2=2+1=3`, option: 'A',
    reveal: { at: 0.58, caption: 'AD=CD=√3，而且 CD⊥AD。三角形 ADC 是等腰直角三角形，A 点的角只有 45°。', formula: String.raw`\angle CAD=45^\circ<60^\circ` },
    cue: 'AD=CD=√3，而且 CD⊥AD。三角形 ADC 是等腰直角三角形，A 点的角只有 45°。',
  },
  {
    id: 'example-d', label: 'D · 反例', title: '把整个截面移到 A，前提成立了', durationMs: 13000,
    caption: '继续平移，直至 O 与 A 重合。现在平面 ACD 就是垂直于 AB 的截面。', formula: String.raw`O=A\implies AB\perp\text{平面 }ACD`, option: 'D',
    reveal: { at: 0.62, caption: '此时 AC、AD 就是夹角 60° 的两条半径。点积等于 1，不是 0，所以 AC 不垂直于 AD。', formula: String.raw`\vec{AC}\cdot\vec{AD}=(0,0,2)\cdot(\tfrac{\sqrt3}{2},0,\tfrac12)=1\ne0` },
    cue: 'AC、AD 此时就是两条半径。它们夹 60°，不是直角；D 的前提成立，结论不成立。',
  },
  {
    id: 'answer', label: '回看', title: '四个选项，各留一条理由', durationMs: 8000,
    caption: 'A：45° 反例；B：投影给出下界 √3；C：垂直于平面内两条相交直线；D：截面过 A 时夹角为 60°。', formula: String.raw`\boxed{\text{正确选项：B、C}}`,
    cue: 'A：45° 反例；B：投影给出下界 √3；C：垂直于平面内两条相交直线；D：截面过 A 时夹角为 60°。',
  },
];

startStage({
  title: '两个点绕同一条轴转，最近能有多近？',
  source: '2026 全国I卷 · 第10题',
  problem:
    '空间中 A、B 为定点，C、D 到直线 AB 的距离分别是 2 和 1，二面角 C-AB-D 为 60°。哪些结论一定成立？',
  steps,
  createScene,
});
