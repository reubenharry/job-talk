/**
 * Capture the live WASM FRP demo stages to MP4 (exact canvas pixels).
 *
 * Usage:
 *   node capture_wasm.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:8766/media/frp/
 */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.argv[2] || "http://127.0.0.1:8766/media/frp/").replace(
  /\/?$/,
  "/"
);

const STAGES = ["prior", "obs", "particles"];
const SECONDS = 12;
const FPS = 20;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))
    );
  });
}

async function captureStage(browser, stage) {
  const page = await browser.newPage({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
  });

  const url = `${baseUrl}embed.html?stage=${stage}&v=cap2`;
  console.log(`→ ${stage}: ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

  await page.waitForFunction(
    () => {
      const s = document.getElementById("status");
      return s && /Running|Restarted/i.test(s.textContent || "");
    },
    null,
    { timeout: 120000 }
  );

  // Soft restart + hold stage (same path as talk embed messaging)
  await page.evaluate((st) => {
    const restart = document.querySelector("[data-restart]");
    if (restart) restart.click();
    if (typeof window.setFrpDemoStage === "function") {
      window.setFrpDemoStage(st);
    }
  }, stage);
  await page.waitForTimeout(600);

  const frameDir = path.join(__dirname, `_frames_${stage}`);
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const n = SECONDS * FPS;
  const intervalMs = 1000 / FPS;
  for (let i = 0; i < n; i++) {
    const t0 = Date.now();
    const dataUrl = await page.evaluate(() => {
      const c = document.getElementById("sim");
      const ctx = c.getContext("2d");
      // clearRect leaves alpha=0 → black in exports; composite white underneath.
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();
      return c.toDataURL("image/png");
    });
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const file = path.join(
      frameDir,
      `frame_${String(i).padStart(5, "0")}.png`
    );
    await writeFile(file, Buffer.from(b64, "base64"));
    const elapsed = Date.now() - t0;
    const wait = Math.max(0, intervalMs - elapsed);
    if (wait) await page.waitForTimeout(wait);
    if (i % 40 === 0) console.log(`  ${stage}: frame ${i}/${n}`);
  }

  const outMp4 = path.join(__dirname, `tracker_${stage}.mp4`);
  const outGif = path.join(__dirname, `tracker_${stage}.gif`);
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(frameDir, "frame_%05d.png"),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outMp4,
  ]);
  // Palette GIF for decent quality, still longish
  await run("ffmpeg", [
    "-y",
    "-i",
    outMp4,
    "-vf",
    "fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
    "-loop",
    "0",
    outGif,
  ]);

  await rm(frameDir, { recursive: true, force: true });
  await page.close();
  console.log(`✓ ${stage} → ${path.basename(outMp4)}, ${path.basename(outGif)}`);
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});
try {
  for (const stage of STAGES) {
    await captureStage(browser, stage);
  }
} finally {
  await browser.close();
}
console.log("done");
