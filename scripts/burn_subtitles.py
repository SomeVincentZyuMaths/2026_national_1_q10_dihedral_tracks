import os
import sys
import re
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO_DIR = os.path.join(BASE_DIR, "video")
INPUT_VIDEO = os.path.join(VIDEO_DIR, "稍微手动剪映剪辑.mp4")
ASS_PATH = os.path.join(VIDEO_DIR, "subtitles.ass")
OUTPUT_VIDEO = os.path.join(VIDEO_DIR, "gemini处理-字幕版.mp4")
FONTS_DIR = r"X:\字体\霞鹜文楷LXGW_WenKai\lxgw-wenkai-v1.520"

TOTAL_DURATION = 588.14 # 视频总秒数

def time_str_to_seconds(time_str):
    parts = time_str.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0

def burn_subtitles():
    if not os.path.exists(INPUT_VIDEO):
        print(f"❌ 输入视频不存在: {INPUT_VIDEO}")
        return
    if not os.path.exists(ASS_PATH):
        print(f"❌ 字幕文件不存在: {ASS_PATH}")
        return

    # 转义 Windows 路径供 FFmpeg filter 使用
    escaped_ass = ASS_PATH.replace("\\", "/").replace(":", "\\:")
    escaped_fonts = FONTS_DIR.replace("\\", "/").replace(":", "\\:")

    vf_filter = f"subtitles='{escaped_ass}':fontsdir='{escaped_fonts}'"

    cmd = [
        "ffmpeg", "-y",
        "-i", INPUT_VIDEO,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "copy",
        OUTPUT_VIDEO
    ]

    print(f"🚀 开始压制 LXGW 霞鹜文楷字幕版视频...")
    print(f"  输入: {INPUT_VIDEO}")
    print(f"  字体库: {FONTS_DIR}")
    print(f"  输出: {OUTPUT_VIDEO}")
    print(f"  总时长: {TOTAL_DURATION} 秒 (进度过半点约为 294 秒)\n")

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        encoding="utf-8",
        errors="replace"
    )

    halfway_notified = False
    time_regex = re.compile(r"time=(\d{2}:\d{2}:\d{2}\.\d+)")

    for line in process.stdout:
        match = time_regex.search(line)
        if match:
            t_str = match.group(1)
            sec = time_str_to_seconds(t_str)
            pct = (sec / TOTAL_DURATION) * 100

            if not halfway_notified and pct >= 50.0:
                halfway_notified = True
                print(f"\n🔔🔔🔔【进度过半通知】当前压制进度已达 {pct:.1f}% ({t_str} / 00:09:48)！已成功过半啦喵！🔔🔔🔔\n", flush=True)

    process.wait()

    if process.returncode == 0:
        print(f"\n🎉 霞鹜文楷字幕版视频压制完成！成片已覆盖生成至: {OUTPUT_VIDEO}")
    else:
        print(f"\n❌ FFmpeg 压制失败，退出码: {process.returncode}")

if __name__ == "__main__":
    burn_subtitles()
