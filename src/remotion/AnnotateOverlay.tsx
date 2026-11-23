import React from 'react';
import katex from 'katex';

interface AnnotateOverlayProps {
  timeSec: number;
}

export const AnnotateOverlay: React.FC<AnnotateOverlayProps> = ({ timeSec }) => {
  // 1. 第 1 次 QQ 截图红笔标注：136s ~ 152s (手写 DD' 垂线段与直角标记)
  const isDDActive = timeSec >= 136 && timeSec <= 152;

  // 2. 第 2 次 QQ 截图板书：308s ~ 360s (向量数量积正交推导板书)
  const isVectorActive = timeSec >= 308 && timeSec <= 360;

  if (!isDDActive && !isVectorActive) return null;

  return (
    <>
      {/* 第 1 次 QQ 截图还原：手绘 DD' 垂线标牌 (136s ~ 152s) */}
      {isDDActive && (
        <div
          style={{
            position: 'absolute',
            left: '32%',
            top: '42%',
            background: 'rgba(20, 6, 10, 0.88)',
            border: '2px dashed #ff4757',
            borderRadius: '12px',
            padding: '10px 18px',
            boxShadow: '0 12px 32px rgba(255, 71, 87, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 35,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#ff4757',
              fontFamily: "'LXGW WenKai', cursive, sans-serif",
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            }}
          >
            DD′ ⊥ 截面
          </div>
          <div style={{ fontSize: '14px', color: '#ffd2d2', lineHeight: 1.4 }}>
            <div>直角在 D′ 点</div>
            <div style={{ color: '#ffb142' }}>CD² = CD′² + DD′²</div>
          </div>
        </div>
      )}

      {/* 第 2 次 QQ 截图还原：截面板书推导 · 向量正交分解 (308s ~ 360s) */}
      {isVectorActive && (
        <div
          style={{
            position: 'absolute',
            left: '48px',
            top: '110px',
            width: '540px',
            borderRadius: '16px',
            background: 'rgba(8, 16, 28, 0.92)',
            border: '2px solid rgba(74, 136, 232, 0.65)',
            boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(74, 136, 232, 0.3)',
            backdropFilter: 'blur(16px)',
            padding: '20px 24px',
            color: '#f0f4fc',
            fontFamily: "'LXGW WenKai', -apple-system, sans-serif",
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          {/* 标头 */}
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
              <span style={{ color: '#ff4757', fontSize: '18px' }}>✏️</span>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#64b5f6', letterSpacing: '0.04em' }}>
                截面板书推导 · 向量正交分解
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#ff4757',
                background: 'rgba(255, 71, 87, 0.12)',
                border: '1px solid rgba(255, 71, 87, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              QQ截图红笔标注还原
            </div>
          </div>

          {/* 公式内容 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px', lineHeight: 1.6 }}>
            <div>
              <div style={{ color: '#ffd54f', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                ① 空间向量分解 (CD = CD′ + D′D)：
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

            <div>
              <div style={{ color: '#4dd0e1', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                ② 轴线 AB 方向向量 (仅有 y 分量)：
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

            <div>
              <div style={{ color: '#ff4757', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                ③ 垂直正交条件：
              </div>
              <div
                style={{
                  background: 'rgba(255, 71, 87, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 71, 87, 0.35)',
                }}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    '\\vec{AB} \\cdot \\vec{CD} = y_B(y_D - y_C) = 0 \\implies y_D = y_C',
                    { throwOnError: false }
                  ),
                }}
              />
              <div style={{ fontSize: '14px', color: '#ff8a80', marginTop: '6px', fontWeight: 700 }}>
                💡 结论：两垂足必重合 (O₁ = O₂)，C、D 必须共截面！
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
