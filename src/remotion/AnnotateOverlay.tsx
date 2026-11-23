import React, { useMemo } from 'react';
import katex from 'katex';

interface AnnotateOverlayProps {
  timeSec: number;
}

/**
 * 还原原视频中“QQ 截图做辅助线与划线板书”的 Web 化原生组件
 * 活跃区间：约 279s ~ 378s（选项 C 向量数量积正交推导阶段）
 */
export const AnnotateOverlay: React.FC<AnnotateOverlayProps> = ({ timeSec }) => {
  // 仅在 279s ~ 378s 活跃
  const active = timeSec >= 279 && timeSec <= 378;
  if (!active) return null;

  // 阶段进度
  const stage = timeSec < 309 ? 1 : timeSec < 345 ? 2 : 3;

  return (
    <div
      style={{
        position: 'absolute',
        left: '48px',
        top: '110px',
        width: '540px',
        borderRadius: '16px',
        background: 'rgba(8, 16, 28, 0.9)',
        border: '2px solid rgba(74, 136, 232, 0.65)',
        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(74, 136, 232, 0.3)',
        backdropFilter: 'blur(16px)',
        padding: '20px 24px',
        color: '#f0f4fc',
        fontFamily: "'LXGW WenKai', -apple-system, sans-serif",
        zIndex: 30,
        pointerEvents: 'none',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* 顶部标头（模拟截图标注栏） */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4a88e8', fontSize: '18px' }}>✏️</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#64b5f6', letterSpacing: '0.04em' }}>
            截面板书推导 · 向量正交分解
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#8e9bb0',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          QQ截图辅助线还原
        </div>
      </div>

      {/* 板书内容：向量公式逐步展现 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px', lineHeight: 1.6 }}>
        {/* 步骤 1: 向量分解 */}
        <div style={{ opacity: stage >= 1 ? 1 : 0.4, transition: 'opacity 0.3s ease' }}>
          <div style={{ color: '#ffd54f', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
            ① 空间距离向量分解：
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(
                '\\vec{CD} = \\vec{CD\'} + \\vec{D\'D} = (\\Delta x,\\, 0,\\, \\Delta z) + (0,\\, y_D - y_C,\\, 0)',
                { throwOnError: false }
              ),
            }}
          />
        </div>

        {/* 步骤 2: AB 向量特征 */}
        {stage >= 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ color: '#4dd0e1', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              ② 轴线 AB 方向向量 (只有 y 分量)：
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\vec{AB} = (0,\\, y_B,\\, 0)',
                  { throwOnError: false }
                ),
              }}
            />
          </div>
        )}

        {/* 步骤 3: 正交点积判定 */}
        {stage >= 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ color: '#ff5252', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              ③ 垂直正交条件：
            </div>
            <div
              style={{
                background: 'rgba(255, 82, 82, 0.08)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 82, 82, 0.35)',
              }}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  '\\vec{AB} \\cdot \\vec{CD} = y_B(y_D - y_C) = 0 \\implies y_D = y_C',
                  { throwOnError: false }
                ),
              }}
            />
            <div style={{ fontSize: '14px', color: '#ff8a80', marginTop: '6px', fontWeight: 600 }}>
              💡 结论：两点垂足必重合 ($O_1 = O_2$)，C、D 必须同在垂直截面内！
            </div>
          </div>
        )}
      </div>

      {/* 底部动态手绘辅助虚线指示 */}
      <svg
        style={{
          position: 'absolute',
          right: '-90px',
          bottom: '20px',
          width: '100px',
          height: '60px',
          overflow: 'visible',
        }}
      >
        <path
          d="M 0 30 Q 50 10, 80 40"
          fill="none"
          stroke="#4a88e8"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        />
        <polygon points="80,40 70,36 74,45" fill="#4a88e8" />
      </svg>
    </div>
  );
};
