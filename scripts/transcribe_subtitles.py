import os
import sys
import json
import subprocess
from datetime import timedelta
import whisper

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO_DIR = os.path.join(BASE_DIR, "video")
DEFAULT_VIDEO = os.path.join(VIDEO_DIR, "稍微手动剪映剪辑.mp4")

OUTPUT_SRT = os.path.join(VIDEO_DIR, "subtitles.srt")
OUTPUT_ASS = os.path.join(VIDEO_DIR, "subtitles.ass")
OUTPUT_JSON = os.path.join(VIDEO_DIR, "subtitles.json")
FINAL_OUTPUT_VIDEO = os.path.join(VIDEO_DIR, "gemini处理-字幕版.mp4")

# 专业数学词汇提示词，避免数理术语听错
MATH_PROMPT = (
    "这是一道高考数学立体几何压轴题解析。涉及概念包括：直四棱柱，二面角，轨道，线面垂直，"
    "空间向量，法向量，点积，数量积，外积，坐标系，投影，勾股定理，根号3，CD最小值，AB垂直于CD。"
)

def format_timestamp_srt(seconds: float) -> str:
    td = timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    millis = int(td.microseconds / 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def format_timestamp_ass(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:05.2f}"

def generate_ass_content(segments, font_name="Microsoft YaHei", font_size=28):
    header = f"""[Script Info]
Title: Auto Generated Subtitles for 2026 National 1 Q10
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},&H00FFFFFF,&H000000FF,&H00141414,&H80000000,-1,0,0,0,100,100,0,0,1,2.5,1.5,2,30,30,36,1
Style: Highlight,{font_name},{font_size + 2},&H002EE0FF,&H000000FF,&H000A0A0A,&H80000000,-1,0,0,0,100,100,0,0,1,2.8,1.6,2,30,30,36,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for seg in segments:
        start_str = format_timestamp_ass(seg["start"])
        end_str = format_timestamp_ass(seg["end"])
        text = seg["text"].strip().replace("\n", " ")
        lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{text}")
    return "\n".join(lines)

def burn_video(input_video, ass_path, output_video):
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", f"subtitles='{escaped_ass}'",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "copy",
        output_video
    ]
    print(f"\n🚀 开始调用 FFmpeg 硬压字幕到成片: {output_video}")
    ret = subprocess.run(cmd)
    if ret.returncode == 0:
        print(f"🎉【压制成功】成片已生成: {output_video}")
    else:
        print(f"❌ FFmpeg 压制出错，返回码: {ret.returncode}")

def transcribe(video_path=DEFAULT_VIDEO, model_size="small", auto_burn=True):
    if not os.path.exists(video_path):
        print(f"❌ 视频文件不存在: {video_path}")
        return

    print(f"🎬 目标视频: {video_path}")
    print(f"🤖 载入 Whisper 模型 [{model_size}] ...")
    model = whisper.load_model(model_size)

    print(f"🎙️ 开始音频识别与精准时间轴对齐 (中文优化 + 数学专有名词增强)...")
    result = model.transcribe(
        video_path,
        language="zh",
        initial_prompt=MATH_PROMPT,
        verbose=True
    )

    segments = []
    srt_lines = []
    
    for idx, seg in enumerate(result.get("segments", []), start=1):
        item = {
            "id": idx,
            "start": round(seg["start"], 3),
            "end": round(seg["end"], 3),
            "text": seg["text"].strip(),
        }
        segments.append(item)

        start_str = format_timestamp_srt(seg["start"])
        end_str = format_timestamp_srt(seg["end"])
        srt_lines.append(f"{idx}\n{start_str} --> {end_str}\n{item['text']}\n")

    # 1. 导出 SRT
    with open(OUTPUT_SRT, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    print(f"\n✅ SRT 字幕已导出: {OUTPUT_SRT}")

    # 2. 导出 ASS
    ass_content = generate_ass_content(segments)
    with open(OUTPUT_ASS, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print(f"✅ ASS 高级样式字幕已导出: {OUTPUT_ASS}")

    # 3. 导出 JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON 时间轴元数据已导出: {OUTPUT_JSON}")

    # 4. 自动压制
    if auto_burn:
        burn_video(video_path, OUTPUT_ASS, FINAL_OUTPUT_VIDEO)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="自动从视频提取中文字幕并一键压制成片")
    parser.add_argument("--video", default=DEFAULT_VIDEO, help="输入视频路径")
    parser.add_argument("--model", default="base", choices=["tiny", "base", "small", "medium", "large"], help="模型规格 (默认 base，兼顾速度与准确度)")
    parser.add_argument("--no-burn", action="store_true", help="只提取字幕，不进行 FFmpeg 压制")
    args = parser.parse_args()

    transcribe(video_path=args.video, model_size=args.model, auto_burn=not args.no_burn)
