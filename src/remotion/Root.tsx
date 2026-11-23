import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';
import { RealVoiceComposition } from './RealVoiceComposition';
import { TOTAL_DURATION_MS } from './mathTimeline';
import { TOTAL_REAL_VOICE_DURATION_SEC } from './realVoiceTimeline';

export const RemotionRoot: React.FC = () => {
  const fps = 60;
  const ttsFrames = Math.ceil((TOTAL_DURATION_MS / 1000) * fps); // 约 12321 帧
  const realVoiceFrames = Math.ceil(TOTAL_REAL_VOICE_DURATION_SEC * fps); // 约 35289 帧 (588.14s)

  return (
    <>
      {/* 1. 用户真人原声高质感 60FPS 终极版 */}
      <Composition
        id="RealVoiceDihedralTracks"
        component={RealVoiceComposition}
        durationInFrames={realVoiceFrames}
        fps={fps}
        width={1920}
        height={1080}
      />

      {/* 2. 之前参考的 AI TTS 版 */}
      <Composition
        id="DihedralTracks"
        component={MainComposition}
        durationInFrames={ttsFrames}
        fps={fps}
        width={1920}
        height={1080}
      />
    </>
  );
};
