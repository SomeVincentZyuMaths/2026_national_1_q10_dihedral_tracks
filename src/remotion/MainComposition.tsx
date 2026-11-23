import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, staticFile, Audio } from 'remotion';
import 'katex/dist/katex.min.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/400.css';
import '@hanzi.pro/webfonts-lxgw-wenkai/swap/500.css';
import './labelStyles.css';
import { computeFrameData } from './mathTimeline';
import { RemotionThreeBridge } from './SceneBridge';
import { SubtitleOverlay } from './SubtitleOverlay';
import { TracksInset } from './TracksInset';

export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelContainerRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<RemotionThreeBridge | null>(null);

  const timeMs = (frame / fps) * 1000;
  const frameData = computeFrameData(timeMs);

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
      bridgeRef.current.render(frameData, width, height);
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

      {/* CSS2D 标签容器 */}
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

      {/* 字幕、标题与步骤指示 */}
      <SubtitleOverlay data={frameData} />

      {/* 确定性音频轨道 */}
      <Audio src={staticFile('audio/master_audio.mp3')} />
    </div>
  );
};
