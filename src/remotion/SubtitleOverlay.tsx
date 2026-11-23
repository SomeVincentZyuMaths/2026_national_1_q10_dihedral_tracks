import React, { useMemo } from 'react';
import katex from 'katex';
import type { SceneFrameData } from './mathTimeline';

interface SubtitleOverlayProps {
  data: SceneFrameData;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ data }) => {
  // KaTeX 渲染公式
  const renderedFormula = useMemo(() => {
    if (!data.currentFormula) return null;
    try {
      return katex.renderToString(data.currentFormula, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [data.currentFormula]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: "'LXGW WenKai', -apple-system, sans-serif",
        color: '#f0f4fc',
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      {/* 顶部栏：来源与当前幕指示 */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'rgba(30, 45, 68, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#f0b232',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(8px)',
          }}
        >
          2026 全国I卷 · 第10题
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#f0f4fc',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          两个点绕同一条轴转，最近能有多近？
        </div>
      </div>

      {/* 右上角：步骤胶囊指示 */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          right: '48px',
          background: 'rgba(13, 21, 34, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 18px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            color: '#2cb5a0',
            fontWeight: 800,
            fontSize: '16px',
            letterSpacing: '0.05em',
          }}
        >
          {String(data.stepIndex).padStart(2, '0')} {data.stepLabel}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
        <span style={{ fontSize: '15px', color: '#8e9bb0', fontWeight: 600 }}>
          {data.stepTitle}
        </span>
        {data.currentOption && (
          <span
            style={{
              background: '#e05344',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              marginLeft: '4px',
            }}
          >
            选项 {data.currentOption}
          </span>
        )}
      </div>

      {/* 第 0 幕（原题）：左侧展示原题题干与选项面板 */}
      {data.stepIndex === 0 && (
        <div
          style={{
            position: 'absolute',
            left: '48px',
            top: '110px',
            width: '460px',
            background: 'rgba(13, 21, 34, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: '#f0b232', fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
            【原题呈现】
          </div>
          <div style={{ fontSize: '16px', lineHeight: 1.7, color: '#e2e8f0', marginBottom: '16px' }}>
            在空间中，A、B 为两个定点，动点 C 到直线 AB 的距离为 2，动点 D 到直线 AB 的距离为 1。若二面角 C-AB-D 为 60°，则（　）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '15px' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>A. ∠CAD ≥ 60°</div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>B. CD ≥ √3</div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>C. 当 AB⊥CD 时，CD⊥平面 ABD</div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>D. 当 AB⊥平面 ACD 时，AC⊥AD</div>
          </div>
        </div>
      )}

      {/* 底部字幕卡片（解说台词与推导公式） */}
      <div
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '1280px',
          minWidth: '800px',
          background: 'rgba(10, 16, 26, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '18px',
          padding: '16px 36px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center',
        }}
      >
        {/* 台词解说 */}
        <div
          style={{
            fontSize: '23px',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#f8fafc',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            letterSpacing: '0.02em',
          }}
        >
          {data.currentCaption}
        </div>

        {/* 数学公式（如有） */}
        {renderedFormula && (
          <div
            style={{
              fontSize: '21px',
              color: '#f0b232',
              marginTop: '2px',
              background: 'rgba(240, 178, 50, 0.08)',
              padding: '4px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(240, 178, 50, 0.25)',
            }}
            dangerouslySetInnerHTML={{ __html: renderedFormula }}
          />
        )}
      </div>
    </div>
  );
};
