# 🎬 视频自动字幕工作流 (Faster-Whisper + FFmpeg)

> 专为解决剪映等商业剪辑软件“自动字幕收费”痛点设计的全开源、免订阅、高精度本地字幕生成与压制管线。

---

## 🛠️ 技术方案与架构

```
[原始视频/剪辑成片] 
       │
       ▼
 [transcribe_subtitles.py] ──(faster-whisper + VAD + 数学专用Prompt)──┐
       │                                                               │
       ├───────────────────────────────────────┐                       │
       ▼                                       ▼                       ▼
 [subtitles.srt]                         [subtitles.ass]        [subtitles.json]
 (通用外挂字幕 /                          (高颜值中文字体 /         (时间轴原始元数据)
  可直接回灌剪映草稿)                     描边/底边距定制)
                                               │
                                               ▼
                                      [burn_subtitles.py]
                                               │ (FFmpeg libass)
                                               ▼
                                  [稍微手动剪映剪辑_带字幕.mp4]
```

---

## 🚀 极速运行指南

确保在项目根目录 `D:\TMP\manim\20261027manim立体几何高考捏\2026_national_1_q10_dihedral_tracks` 下：

### 1. 一键提取并生成带时间戳字幕
```powershell
# 首次运行如果需要下载模型，请开启代理：
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"

uv run python scripts/transcribe_subtitles.py
```
- 默认使用 `small` 模型，针对中文优化，兼顾超高识别精度与推理速度。
- 内置针对**高考立体几何、空间向量、法向量、二面角轨道**的专业数学词汇提示词，大幅降低专业术语听错率。
- 自动在 `video/` 目录下生成：
  - `subtitles.srt`：标准 SRT 字幕
  - `subtitles.ass`：影视级 ASS 样式字幕
  - `subtitles.json`：分段起止时间戳 JSON

---

### 2. 一键硬压字幕出片 (无需任何第三方剪辑器)
```powershell
uv run python scripts/burn_subtitles.py
```
- 调用原生 `ffmpeg -vf subtitles` 极速渲染。
- 输出文件：`video/稍微手动剪映剪辑_带字幕.mp4`。

---

### 💡 如何彻底绕过剪映 VIP，把生成的 SRT 导回剪映继续花字编辑？
剪映仅对**“智能语音识别”**功能收费，对**字幕轨道本身编辑是完全免费的**：
1. 将 `video/subtitles.srt` 文件直接拖拽到剪映的“文本”->“本地字幕”窗口中导入；
2. 剪映会自动生成完整的字幕轨，你可以随意更换剪映的**免费花字、气泡、动画特效**；
3. 导出视频完全免费，彻底白嫖剪映所有排版功能！
