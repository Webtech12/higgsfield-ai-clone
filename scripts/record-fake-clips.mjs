// Records the placeholder videos used by PROVIDERS=fake: a slow push-in over a storyboard-style
// scene, drawn on a canvas and captured with MediaRecorder in headless Chromium (no ffmpeg).
// Run once: `node scripts/record-fake-clips.mjs`. Output: public/fake-media/clip-<ratio>-<n>.webm
import { mkdir, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const RATIOS = { "16x9": [640, 360], "9x16": [360, 640], "1x1": [480, 480] };
const PALETTES = [
  ["#1d2b35", "#c98b4a", "#f2d5a0"],
  ["#2a1d33", "#d0566b", "#f6c28b"],
  ["#12261f", "#4c9a7a", "#d8e8c4"],
];
const DURATION_MS = 4000;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<canvas id='c'></canvas>");
await mkdir("public/fake-media", { recursive: true });

for (const [ratio, [width, height]] of Object.entries(RATIOS)) {
  for (const [index, palette] of PALETTES.entries()) {
    const base64 = await page.evaluate(
      async ({ width, height, palette, duration }) => {
        const canvas = document.getElementById("c");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const [dark, mid, light] = palette;
        const unit = Math.min(width, height);

        const draw = (t) => {
          const scale = 1 + 0.18 * t; // the "dolly in"
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);
          const sky = ctx.createLinearGradient(0, 0, 0, height);
          sky.addColorStop(0, dark);
          sky.addColorStop(1, mid);
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, width, height);
          const horizon = height * 0.56;
          const sunX = width * (0.3 + 0.25 * t);
          const glow = ctx.createRadialGradient(
            sunX,
            horizon - unit * 0.1,
            0,
            sunX,
            horizon - unit * 0.1,
            unit * 0.25,
          );
          glow.addColorStop(0, light);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = dark;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(0, horizon, width, height - horizon);
          ctx.globalAlpha = 1;
          const subjectX = width * 0.62;
          ctx.beginPath();
          ctx.ellipse(
            subjectX,
            horizon - unit * 0.06,
            unit * 0.035,
            unit * 0.12,
            0,
            0,
            Math.PI * 2,
          );
          ctx.arc(subjectX, horizon - unit * 0.2, unit * 0.035, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 24; i++) {
            const x = (i * 97 + t * 60 * (1 + (i % 3))) % width;
            const y = (i * 53 + t * 20) % horizon;
            ctx.fillStyle = `rgba(255,255,255,${String(0.15 + (i % 4) * 0.05)})`;
            ctx.fillRect(x, y, 2, 2);
          }
          ctx.restore();
          ctx.fillStyle = light;
          ctx.globalAlpha = 0.75;
          ctx.font = `${String(Math.round(unit * 0.035))}px Arial`;
          ctx.fillText("PREVIEW RENDER · DIRECTOR", unit * 0.05, height - unit * 0.05);
          ctx.globalAlpha = 1;
        };

        const recorder = new MediaRecorder(canvas.captureStream(30), {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: 700_000,
        });
        const chunks = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);
        const stopped = new Promise((resolve) => (recorder.onstop = resolve));
        recorder.start(100);

        const start = performance.now();
        await new Promise((resolve) => {
          const frame = (now) => {
            const t = Math.min(1, (now - start) / duration);
            draw(t);
            if (t < 1) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
        recorder.stop();
        await stopped;

        const bytes = new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
      },
      { width, height, palette, duration: DURATION_MS },
    );
    const file = `public/fake-media/clip-${ratio}-${String(index + 1)}.webm`;
    await writeFile(file, Buffer.from(base64, "base64"));
    console.log(`wrote ${file}`);
  }
}

await browser.close();
