import os
import sys
import json
import asyncio
import subprocess
import edge_tts

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
VIDEO_DIR = os.path.join(BASE_DIR, "video")
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+10%"

# 10 幕与分镜头台词定义 (口播文案 + 屏幕展示字幕)
SCENES = [
    {
        "id": "original",
        "index": 0,
        "name": "00 原题",
        "text": "先看原题。在空间中，A、B 为两个定点，动点 C 到直线 AB 的距离为 2，动点 D 到直线 AB 的距离为 1。若二面角 C-AB-D 为 60 度，下列四个结论中，哪些一定成立？",
        "subtitle": "空间中 A、B 为定点，C、D 到直线 AB 距离为 2 和 1。\n二面角 C-AB-D 为 60°，哪些结论一定成立？"
    },
    {
        "id": "section",
        "index": 1,
        "name": "01 建系",
        "text": "我们先来建立空间直角坐标系。以 A 为原点，沿着 AB 方向为 y 轴，z 轴竖直向上。点 C 和点 D 在 y 轴上的垂足分别是欧一和欧二。我们把欧二D 平移到 欧一D撇，方向保持不变。注意看，这道金色的角弧，才是真正的二面角平面角，大小为 60 度。",
        "subtitle": "以 A 为原点沿 AB 为 y 轴，z 轴向上。垂足分别为 O₁、O₂。\n平移 O₂D 到 O₁D'，金色角弧即为 60° 二面角平面角。"
    },
    {
        "id": "projection",
        "index": 2,
        "name": "02 B·投影",
        "text": "接下来我们来分析选项 B。沿着 y 轴正方向平视过去，点 D 投影到过点 C 和 欧一 的截面上，落点为 D撇。在截面三角形 C 欧一 D撇 中应用余弦定理，两条边分别是 2 和 1，夹角 60 度，立刻算出投影 CD撇 的长度为根号 3。",
        "subtitle": "沿 y 轴看，D 投影到过 C、O₁ 的截面落点为 D'。\n三角形 CO₁D' 中用余弦定理，求得投影 CD' = √3。"
    },
    {
        "id": "bound",
        "index": 3,
        "name": "03 B·下界",
        "text": "回到斜视角观察：由于 DD撇 垂直于截面，三角形 C D撇 D 是一个直角三角形。根据勾股定理，空间距离 CD 的平方等于 CD撇方 加上 DD撇方。当 欧二 滑动到与 欧一 重合时，轴向距离变为零，D 与 D撇 重合，CD 的最小值正是根号 3！因此选项 B 正确。",
        "subtitle": "DD' 垂直截面，直角在 D'。勾股定理求空间距离。\n当 O₂ 与 O₁ 重合，轴向距为 0，CD 最小值为 √3，B 正确。"
    },
    {
        "id": "component",
        "index": 4,
        "name": "04 C·分量",
        "text": "现在来看选项 C。直线 AB 沿着 y 轴方向，只有 y 分量。在空间向量数量积中，CD 的 x 和 z 分量乘以零；所以 AB 是否垂直于 CD，完全由 CD 的 y 分量决定。当 AB 垂直于 CD 时，CD 的 y 分量必须为零。这意味着两个垂足必须重合，C、D、O 处在同一个垂直于 y 轴的截面内。",
        "subtitle": "AB 只有 y 分量，点积只看 y 分量。\nAB⊥CD 推出 y_D=y_C，两垂足合为 O，共在截面内。"
    },
    {
        "id": "right_angle",
        "index": 5,
        "name": "05 C·直角",
        "text": "只看这个垂直截面内的三角形 OCD：三边长度分别是 1、根号 3 和 2。最长边 OC 的平方正好等于 1 的平方加根号 3 的平方！由勾股定理逆定理，直角在点 D 处，因此线段 CD 垂直于线段 OD。",
        "subtitle": "截面三角形 OCD 三边为 1、√3、2。\n由勾股逆定理，直角在 D 点，因此 CD 垂直于 OD。"
    },
    {
        "id": "plane_proof",
        "index": 6,
        "name": "06 C·判定",
        "text": "此时显出平面 ABD。直线 AB 和直线 OD 都在这个平面内，并且相交于点 O。CD 既垂直于 AB，又垂直于 OD。根据线面垂直判定定理，CD 垂直于平面 ABD！因此选项 C 正确。",
        "subtitle": "显出平面 ABD，AB 与 OD 交于 O。\nCD 垂直于平面内两条相交直线，由判定定理 C 正确。"
    },
    {
        "id": "counter_a",
        "index": 7,
        "name": "07 A·反例",
        "text": "来看选项 A 为什么错。保持两圆心重合，把截面沿着 y 轴平移到 AO 等于根号 2 处。此时依然完全满足题目的所有条件。但通过勾股定理算出 AD 等于根号 3，三角形 ADC 是等腰直角三角形，角 CAD 只有 45 度，小于 60 度！反例成立，A 错误。",
        "subtitle": "两圆心重合平移到 AO=√2 处，仍满足题设。\nAD=CD=√3 且 CD⊥AD，∠CAD 为 45°，A 错误。"
    },
    {
        "id": "counter_d",
        "index": 8,
        "name": "08 D·反例",
        "text": "最后看选项 D。继续平移截面，直到垂足 O 与点 A 重合。此时平面 ACD 刚好就是垂直于 AB 的截面，满足条件。但在截面内，AC 和 AD 的夹角正好就是 60 度，数量积等于 1 而不是 0，所以 AC 并不垂直于 AD。D 选项也是错误的。",
        "subtitle": "平移至 O 与 A 重合，平面 ACD 即垂直于 AB。\nAC、AD 夹角为 60°，点积为 1 ≠ 0，D 错误。"
    },
    {
        "id": "answer",
        "index": 9,
        "name": "09 总结回看",
        "text": "最后完整回看四个选项：A 存在 45 度反例；B 的空间投影得出最小值根号 3；C 满足线面垂直判定定理；D 在截面过点 A 时夹角为 60 度。本题正确答案为——B、C！",
        "subtitle": "A: 45° 反例；B: 投影求得最小值 √3；\nC: 垂直于面内相交线；D: 夹角为 60°。答案：BC！"
    }
]

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

async def generate_single_audio(scene):
    out_file = os.path.join(AUDIO_DIR, f"scene_{scene['index']:02d}.mp3")
    print(f"🎙️ [生成中] {scene['name']} ...")
    communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
    await communicate.save(out_file)
    dur = get_audio_duration(out_file)
    print(f"✅ [完成] {scene['name']} -> 时长: {dur:.2f}s ({out_file})")
    return {
        "index": scene["index"],
        "id": scene["id"],
        "name": scene["name"],
        "text": scene["text"],
        "subtitle": scene["subtitle"],
        "audio_file": f"scene_{scene['index']:02d}.mp3",
        "duration_sec": round(dur, 3),
        "duration_ms": int(round(dur * 1000))
    }

def format_ass_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def format_srt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int((sec - int(sec)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

async def main():
    print(f"🚀 开始生成 Edge-TTS 微软晓晓配音 (Voice: {VOICE}, Rate: {RATE})...")
    
    # 并发生成 10 幕音频
    tasks = [generate_single_audio(s) for s in SCENES]
    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x["index"])

    # 计算整体累计时间轴
    current_time = 0.0
    timeline = []
    ass_events = []
    srt_events = []

    concat_list_path = os.path.join(AUDIO_DIR, "concat.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for r in results:
            f.write(f"file 'scene_{r['index']:02d}.mp3'\n")

    # FFmpeg 拼接 master_audio.mp3
    master_audio = os.path.join(AUDIO_DIR, "master_audio.mp3")
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        master_audio
    ]
    subprocess.run(concat_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    total_duration = get_audio_duration(master_audio)

    for r in results:
        start_sec = current_time
        end_sec = current_time + r["duration_sec"]
        r["start_sec"] = round(start_sec, 3)
        r["end_sec"] = round(end_sec, 3)
        r["start_ms"] = int(round(start_sec * 1000))
        r["end_ms"] = int(round(end_sec * 1000))
        timeline.append(r)

        # 构造 ASS 与 SRT
        start_ass = format_ass_time(start_sec)
        end_ass = format_ass_time(end_sec)
        sub_text_ass = r["subtitle"].replace("\n", "\\N")
        ass_events.append(f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{sub_text_ass}")

        start_srt = format_srt_time(start_sec)
        end_srt = format_srt_time(end_sec)
        srt_events.append(f"{r['index'] + 1}\n{start_srt} --> {end_srt}\n{r['subtitle']}\n")

        current_time = end_sec

    # 导出 audio_timeline.json
    timeline_meta = {
        "voice": VOICE,
        "rate": RATE,
        "total_duration_sec": round(total_duration, 3),
        "total_duration_ms": int(round(total_duration * 1000)),
        "scenes": timeline
    }
    timeline_path = os.path.join(AUDIO_DIR, "audio_timeline.json")
    with open(timeline_path, "w", encoding="utf-8") as f:
        json.dump(timeline_meta, f, ensure_ascii=False, indent=2)
    print(f"\n📊 时间轴元数据已生成: {timeline_path}")

    # 导出霞鹜文楷 ASS 字幕
    ass_header = """[Script Info]
Title: 2026 National 1 Q10 - Dihedral Tracks
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,LXGW WenKai Medium,42,&H00FFFFFF,&H000000FF,&H00141414,&H80000000,-1,0,0,0,100,100,0,0,1,3.2,2.0,2,60,60,54,1
Style: Highlight,LXGW WenKai Medium,44,&H002EE0FF,&H000000FF,&H000A0A0A,&H80000000,-1,0,0,0,100,100,0,0,1,3.6,2.2,2,60,60,54,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_path = os.path.join(VIDEO_DIR, "subtitles.ass")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(ass_events) + "\n")
    print(f"🎨 高清霞鹜文楷 ASS 字幕已生成: {ass_path}")

    # 导出 SRT 字幕
    srt_path = os.path.join(VIDEO_DIR, "subtitles.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_events))
    print(f"📝 标准 SRT 字幕已生成: {srt_path}")

    print(f"\n🎉 配音生成圆满完成！总片长: {total_duration:.2f} 秒 ({format_ass_time(total_duration)})")
    print(f"🎵 完整合并音频: {master_audio}")

if __name__ == "__main__":
    asyncio.run(main())
