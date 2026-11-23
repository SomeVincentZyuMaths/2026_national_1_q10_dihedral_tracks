import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);
const VIDEO_ARCHIVE_DIR = path.join(ROOT_DIR, 'video', 'archive');
const RAW_DIR = path.join(ROOT_DIR, 'video', 'raw_recordings');

if (!fs.existsSync(VIDEO_ARCHIVE_DIR)) fs.mkdirSync(VIDEO_ARCHIVE_DIR, { recursive: true });
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

// 读取时间轴总时长
const timelinePath = path.join(ROOT_DIR, 'audio', 'audio_timeline.json');
let totalDurationMs = 205344;
if (fs.existsSync(timelinePath)) {
  const meta = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
  totalDurationMs = meta.total_duration_ms || 205344;
}

const PORT = 62026;
const TARGET_URL = `http://127.0.0.1:${PORT}/?mode=capture&theme=dark&captions=0`;

console.log(`🎬 [Playwright 无头录制引擎] 启动中...`);
console.log(`  目标页面: ${TARGET_URL}`);
console.log(`  录制视口: 1920x1080 (deviceScaleFactor: 2 视网膜极清)`);
console.log(`  演播总时长: ${(totalDurationMs / 1000).toFixed(2)} 秒\n`);

async function run() {
  // 1. 启动本地 Vite Preview 服务器
  console.log('🚀 启动本地预览服务器 (Vite Preview)...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: ROOT_DIR,
    shell: true,
    stdio: 'ignore'
  });

  // 等待服务端口就绪
  await new Promise(resolve => setTimeout(resolve, 2500));

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--enable-webgl',
        '--enable-gpu-rasterization',
        '--ignore-gpu-blocklist',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2, // 4K 级别渲染降采样抗锯齿，告别 OBS 模糊
      recordVideo: {
        dir: RAW_DIR,
        size: { width: 1920, height: 1080 }
      }
    });

    const page = await context.newPage();
    console.log('🌐 载入动画页面中...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    // 确保从第 0 毫秒开始
    await page.evaluate(() => {
      if (window.__GEOMETRY_STAGE__) {
        window.__GEOMETRY_STAGE__.seekTime(0);
        window.__GEOMETRY_STAGE__.setCaptions(false);
      }
    });

    await page.waitForTimeout(1000);
    console.log('▶️ 开始播放并同步录制全篇 10 幕动画...');
    await page.keyboard.press('Space');

    // 进度日志汇报
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, (elapsed / (totalDurationMs / 1000)) * 100);
      process.stdout.write(`\r⏳ 录制进度: ${pct.toFixed(1)}% (${elapsed.toFixed(1)}s / ${(totalDurationMs / 1000).toFixed(1)}s)`);
    }, 2000);

    // 等待全片播放完毕 + 1 秒尾部留白
    await page.waitForTimeout(totalDurationMs + 1000);
    clearInterval(interval);
    console.log('\n\n⏹️ 动画演播完毕，正在关闭浏览器保存视频流...');

    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const destPath = path.join(VIDEO_ARCHIVE_DIR, 'raw_playwright_recording.webm');
      fs.copyFileSync(videoPath, destPath);
      console.log(`✅ 无头浏览器录制成功保存至: ${destPath}`);
    }
  } finally {
    previewProcess.kill();
  }
}

run().catch(err => {
  console.error('❌ 录制失败:', err);
  process.exit(1);
});
