import React from 'react';
import type { RealVoiceFrameData } from './realVoiceTimeline';
import { AnnotateOverlay } from './AnnotateOverlay';

interface RealVoiceOverlayProps {
  data: RealVoiceFrameData;
}

export const RealVoiceOverlay: React.FC<RealVoiceOverlayProps> = ({ data }) => {
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
      {/* 顶部标题栏 */}
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
            background: 'rgba(30, 45, 68, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 700,
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
          空间双轨道二面角极值探究（原声解说版）
        </div>
      </div>

      {/* 右上角步骤阶段胶囊 */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          right: '48px',
          background: 'rgba(13, 21, 34, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
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
          {data.stageName}
        </span>
        {data.optionBadge && (
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
            选项 {data.optionBadge}
          </span>
        )}
      </div>

      {/* 原题呈现卡片 (0s ~ 25s) */}
      {data.timeSec <= 25 && (
        <div
          style={{
            position: 'absolute',
            left: '48px',
            top: '105px',
            width: '460px',
            background: 'rgba(13, 21, 34, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '22px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ color: '#f0b232', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
            【原题呈现】
          </div>
          <div style={{ fontSize: '15px', lineHeight: 1.65, color: '#e2e8f0', marginBottom: '14px' }}>
            在空间中，A、B 为两个定点，动点 C 到直线 AB 的距离为 2，动点 D 到直线 AB 的距离为 1。若二面角 C-AB-D 为 60°，则（　）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>A. ∠CAD ≥ 60°</div>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>B. CD ≥ √3</div>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>C. 当 AB⊥CD 时，CD⊥平面 ABD</div>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>D. 当 AB⊥平面 ACD 时，AC⊥AD</div>
          </div>
        </div>
      )}

      {/* QQ 截图辅助线与板书推导组件 */}
      <AnnotateOverlay timeSec={data.timeSec} />

      {/* 底部霞鹜文楷大号字幕卡片 */}
      {data.currentSubtitle && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '1360px',
            minWidth: '850px',
            background: 'rgba(10, 16, 26, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '18px',
            padding: '16px 36px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.9)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: 1.5,
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              letterSpacing: '0.02em',
            }}
          >
            {data.currentSubtitle}
          </div>
        </div>
      )}
    </div>
  );
};
