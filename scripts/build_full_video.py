import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO_ARCHIVE_DIR = os.path.join(BASE_DIR, "video", "archive")
RAW_VIDEO = os.path.join(VIDEO_ARCHIVE_DIR, "raw_playwright_recording.webm")
AUDIO_FILE = os.path.join(BASE_DIR, "audio", "master_audio.mp3")
ASS_PATH = os.path.join(BASE_DIR, "video", "subtitles.ass")
FONTS_DIR = r"X:\字体\霞鹜文楷LXGW_WenKai\lxgw-wenkai-v1.520"
FINAL_OUTPUT = os.path.join(VIDEO_ARCHIVE_DIR, "2026_q10_dihedral_tracks_final.mp4")

def build_full_video():
    if not os.path.exists(RAW_VIDEO):
        print(f"❌ 原始录像文件不存在: {RAW_VIDEO}")
        return False
    if not os.path.exists(AUDIO_FILE):
        print(f"❌ 配音音频文件不存在: {AUDIO_FILE}")
        return False
    if not os.path.exists(ASS_PATH):
        print(f"❌ ASS 字幕文件不存在: {ASS_PATH}")
        return False

    escaped_ass = ASS_PATH.replace("\\", "/").replace(":", "\\:")
    escaped_fonts = FONTS_DIR.replace("\\", "/").replace(":", "\\:")
    vf_filter = f"subtitles='{escaped_ass}':fontsdir='{escaped_fonts}'"

    cmd = [
        "ffmpeg", "-y",
        "-i", RAW_VIDEO,
        "-i", AUDIO_FILE,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "17",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_OUTPUT
    ]

    print("🚀 [FFmpeg 影视级音画字幕混流引擎] 启动中...")
    print(f"  画面输入: {RAW_VIDEO}")
    print(f"  晓晓配音: {AUDIO_FILE}")
    print(f"  霞鹜字库: {FONTS_DIR}")
    print(f"  输出成片: {FINAL_OUTPUT}\n")

    ret = subprocess.run(cmd)
    if ret.returncode == 0:
        size_mb = os.path.getsize(FINAL_OUTPUT) / (1024 * 1024)
        print(f"\n🎉 影视级成片压制大获全胜！")
        print(f"  文件位置: {FINAL_OUTPUT}")
        print(f"  成片体积: {size_mb:.2f} MB")
        return True
    else:
        print(f"\n❌ FFmpeg 混流失败，退出码: {ret.returncode}")
        return False

if __name__ == "__main__":
    build_full_video()
