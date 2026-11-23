import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, staticFile, Audio } from 'remotion';
import 'katex/dist/katex.min.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/400.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/500.css';
import './labelStyles.css';
import { computeRealVoiceFrame } from './realVoiceTimeline';
import { RemotionThreeBridge } from './SceneBridge';
import { RealVoiceOverlay } from './RealVoiceOverlay';
import { TracksInset } from './TracksInset';

export const RealVoiceComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelContainerRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<RemotionThreeBridge | null>(null);

  const timeSec = frame / fps;
  const frameData = computeRealVoiceFrame(timeSec);

  useEffect(() => {
    if (!canvasRef.current || !labelContainerRef.current) return;
    if (!bridgeRef.current) {
      bridgeRef.current = new RemotionThreeBridge(
        canvasRef.current,
        labelContainerRef.current,
        width,
        height
      );
    }

    return () => {
      bridgeRef.current?.dispose();
      bridgeRef.current = null;
    };
  }, [width, height]);

  // 每一帧在 DOM 提交后同步渲染 WebGL 和 CSS2D
  useEffect(() => {
    if (bridgeRef.current) {
      // 构造 SceneFrameData 格式给 bridge
      bridgeRef.current.render(
        {
          timeMs: frameData.timeMs,
          stepIndex: Math.floor(frameData.timeSec / 60),
          stepProgress: (frameData.timeSec % 60) / 60,
          cameraPosition: frameData.cameraPosition,
          cameraTarget: frameData.cameraTarget,
          cameraZoom: frameData.cameraZoom,
          axialC: frameData.axialC,
          axialD: frameData.axialD,
          insetOpacity: frameData.insetOpacity,
          planeOpacity: frameData.planeOpacity,
          highlight: frameData.highlight,
          showSectionLabel: frameData.showSectionLabel,
          sectionLabelText: frameData.sectionLabelText,
          isAtA: frameData.isAtA,
          isMerged: frameData.isMerged,
          stepTitle: frameData.stageName,
          stepLabel: frameData.stageName,
          currentCaption: frameData.currentSubtitle,
          currentFormula: '',
          currentOption: frameData.optionBadge,
        },
        width,
        height
      );
    }
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#080d15',
        overflow: 'hidden',
      }}
    >
      {/* 3D WebGL 画布 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* CSS2D 标签容器 (高对比度白色+黑描边) */}
      <div
        ref={labelContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      />

      {/* 右下角截面展开图 */}
      <TracksInset
        opacity={frameData.insetOpacity}
        isMerged={frameData.isMerged}
      />

      {/* 字幕、标题、QQ截图草稿板书 */}
      <RealVoiceOverlay data={frameData} />

      {/* 原声真人配音音频轨道 */}
      <Audio src={staticFile('audio/real_voice_master.mp3')} />
    </div>
  );
};
