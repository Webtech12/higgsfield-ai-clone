// Model bake-off for the ad studio (ADR-024): the same fictional talent and product go through the
// leading frame, video and music models on fal, then a test assembly in fal's cloud ffmpeg. Every
// output is downloaded straight away (fal's result URLs expire within minutes) into bakeoff/, which
// is gitignored, and re-hosted on Blob so later stages can send it back to fal.
//
//   npm run bakeoff -- inputs                 a fictional talent headshot and product packshot
//   npm run bakeoff -- frames                 5 frame models × 2 shots, with both as references
//   npm run bakeoff -- videos <frame id>      6 video models from one start frame (a shot-A frame)
//   npm run bakeoff -- music                  4 music models, 15 seconds each
//   npm run bakeoff -- cut <clip> <clip> <clip> [music id]
//                                             joins three clips, lays the music under them and
//                                             overlays a headline and a call to action
//   npm run bakeoff -- page                   writes bakeoff/index.html to compare everything
//
// Prices are fal's list prices (pricing API, 2026-10-04) for the exact settings used here.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { ApiError, createFalClient } from "@fal-ai/client";
import { put } from "@vercel/blob";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const OUT = path.resolve("bakeoff");
const RESULTS = path.join(OUT, "results.json");
const CALL_TIMEOUT_MS = 15 * 60_000;
/** The talent seed resizes real photos to the same long edge, so references match production. */
const REFERENCE_MAX_EDGE = 2000;

const fal = createFalClient({ credentials: requireEnv("FAL_KEY") });
const blobToken = requireEnv("BLOB_READ_WRITE_TOKEN");

// --- What goes in -------------------------------------------------------------------------------

const TALENT_PROMPT =
  "Photorealistic studio headshot of a fictional woman in her late twenties with warm brown skin, " +
  "dark curly shoulder-length hair and a friendly natural smile, minimal makeup, wearing a plain " +
  "cream crew-neck t-shirt, looking straight at the camera, soft diffused daylight, plain light " +
  "grey background, sharp focus, natural skin texture, 85mm portrait photography.";

const PRODUCT_PROMPT =
  "Professional e-commerce product photo of a 30 ml amber glass dropper bottle of face serum with a " +
  "matte black dropper cap and a minimal white label printed with the word 'LUMA' in bold " +
  "sans-serif and 'Vitamin C Serum' underneath, standing upright on a seamless white background, " +
  "soft studio lighting with a gentle shadow, sharp focus, photorealistic.";

const KEEP_IDENTITY =
  "Keep her face, hair and skin tone exactly as in image 1, and the bottle's shape, colours and " +
  "label exactly as in image 2.";

const SHOTS = {
  a: {
    label: "Shot A: hook close-up",
    prompt:
      "Close-up vertical beauty shot: the woman from image 1 holds the serum bottle from image 2 up " +
      "beside her cheek and smiles at the camera, in a bright minimalist bathroom with soft morning " +
      `window light, shallow depth of field. ${KEEP_IDENTITY} Photorealistic commercial ` +
      "photography, 50mm lens, natural skin texture, no added text, no watermark.",
  },
  b: {
    label: "Shot B: lifestyle",
    prompt:
      "Vertical lifestyle shot: the woman from image 1 walks along a sunlit tree-lined city street " +
      "at golden hour in a linen shirt, holding the serum bottle from image 2 at chest height, " +
      `candid smile, warm backlight. ${KEEP_IDENTITY} Photorealistic commercial photography, 35mm ` +
      "lens, no added text, no watermark.",
  },
};

/** Written for a shot-A frame: the motion every video model is asked for. */
const MOTION =
  "slowly brings the serum bottle closer to the camera and tilts it so the label catches the " +
  "light, then smiles warmly; gentle hair movement, natural blinking. Camera: slow dolly in. " +
  "Photorealistic commercial look, smooth natural motion, no on-screen text.";

const MUSIC_PROMPT =
  "Bright, modern feel-good pop instrumental for a skincare ad: warm plucked synths, soft claps, " +
  "light percussion and a gentle bass, 110 BPM, uplifting and polished, builds slightly and ends " +
  "cleanly on the last beat. No vocals.";

// --- The contestants ----------------------------------------------------------------------------

const FRAME_MODELS = [
  {
    key: "nano-banana-pro",
    name: "Nano Banana Pro edit",
    model: "fal-ai/nano-banana-pro/edit",
    price: 0.15,
    input: (prompt, refs) => ({
      prompt,
      image_urls: refs,
      aspect_ratio: "9:16",
      resolution: "2K",
      output_format: "png",
    }),
  },
  {
    key: "nano-banana-2",
    name: "Nano Banana 2 edit",
    model: "fal-ai/nano-banana-2/edit",
    price: 0.08,
    input: (prompt, refs) => ({
      prompt,
      image_urls: refs,
      aspect_ratio: "9:16",
      resolution: "2K",
      output_format: "png",
    }),
  },
  {
    key: "seedream-5-pro",
    name: "Seedream 5 Pro edit",
    model: "bytedance/seedream/v5/pro/edit",
    price: 0.0675,
    // Total pixels must be between 1024² and 2048².
    input: (prompt, refs) => ({
      prompt,
      image_urls: refs,
      image_size: { width: 1152, height: 2048 },
      output_format: "png",
    }),
  },
  {
    key: "seedream-4-5",
    name: "Seedream 4.5 edit",
    model: "fal-ai/bytedance/seedream/v4.5/edit",
    price: 0.04,
    // At least 2560×1440 pixels in total.
    input: (prompt, refs) => ({
      prompt,
      image_urls: refs,
      image_size: { width: 1440, height: 2560 },
    }),
  },
  {
    key: "flux-3",
    name: "FLUX.3 edit",
    model: "blackforestlabs/flux-3/edit-image",
    // $0.024 per megapixel; 2k at 9:16 is about 2.4 MP.
    price: 0.057,
    input: (prompt, refs) => ({
      prompt,
      image_urls: refs,
      aspect_ratio: "9:16",
      resolution: "2k",
      output_format: "png",
    }),
  },
];

/** Kling refers to elements in the prompt: @Element1 is the talent, @Element2 the product. */
const klingElements = (talentUrl, productUrl) => [
  { frontal_image_url: talentUrl, reference_image_urls: [talentUrl] },
  { frontal_image_url: productUrl, reference_image_urls: [productUrl] },
];

const VIDEO_MODELS = [
  {
    key: "kling-v3-pro",
    name: "Kling v3 Pro (with talent and product elements)",
    model: "fal-ai/kling-video/v3/pro/image-to-video",
    price: 0.14 * 5,
    input: ({ frameUrl, talentUrl, productUrl }) => ({
      prompt: `@Element1 holding @Element2 ${MOTION}`,
      start_image_url: frameUrl,
      duration: "5",
      generate_audio: false,
      elements: klingElements(talentUrl, productUrl),
    }),
  },
  {
    key: "kling-o3-pro",
    name: "Kling O3 Pro reference-to-video",
    model: "fal-ai/kling-video/o3/pro/reference-to-video",
    price: 0.14 * 5,
    input: ({ frameUrl, talentUrl, productUrl }) => ({
      prompt: `@Element1 holding @Element2 ${MOTION}`,
      start_image_url: frameUrl,
      elements: klingElements(talentUrl, productUrl),
      duration: "5",
      aspect_ratio: "9:16",
      generate_audio: false,
    }),
  },
  {
    key: "veo-3-1-fast",
    name: "Veo 3.1 Fast (6 s; no 1:1)",
    model: "fal-ai/veo3.1/fast/image-to-video",
    price: 0.15 * 6,
    input: ({ frameUrl }) => ({
      prompt: `The woman ${MOTION}`,
      image_url: frameUrl,
      duration: "6s",
      resolution: "1080p",
      aspect_ratio: "9:16",
      generate_audio: false,
    }),
  },
  {
    key: "wan-3",
    name: "Wan 3.0",
    model: "alibaba/wan-3.0/image-to-video",
    price: 0.05 * 5,
    input: ({ frameUrl }) => ({
      prompt: `The woman ${MOTION}`,
      start_image_url: frameUrl,
      resolution: "1080p",
      duration: 5,
      aspect_ratio: "9:16",
      audio: false,
    }),
  },
  {
    key: "h3-max",
    name: "MiniMax H3 Max",
    model: "minimax/h3-max/image-to-video",
    price: 0.03 * 5,
    input: ({ frameUrl }) => ({
      prompt: `The woman ${MOTION}`,
      image_url: frameUrl,
      resolution: "1080P",
      duration: 5,
      prompt_expansion_mode: "balanced",
    }),
  },
  {
    key: "gemini-omni-flash",
    name: "Gemini Omni Flash (no 1:1)",
    model: "google/gemini-omni-flash/v1.1/image-to-video",
    price: 0.03 * 5,
    input: ({ frameUrl }) => ({
      prompt: `The woman ${MOTION}`,
      image_url: frameUrl,
      aspect_ratio: "9:16",
      duration: 5,
      resolution: "1080p",
    }),
  },
];

const MUSIC_MODELS = [
  {
    key: "elevenlabs",
    name: "ElevenLabs Music v2.5 (exactly 15 s, instrumental)",
    model: "elevenlabs/music/v2.5",
    price: 0.6 / 4,
    input: () => ({
      prompt: MUSIC_PROMPT,
      music_length_ms: 15_000,
      force_instrumental: true,
      output_format: "mp3_48000_192",
    }),
  },
  {
    key: "lyria",
    name: "Lyria 3.5 (no length control)",
    model: "google/lyria-3.5",
    price: 0.1,
    input: () => ({ prompt: `${MUSIC_PROMPT} About 15 seconds long.` }),
  },
  {
    key: "stable-audio",
    name: "Stable Audio 2.5",
    model: "fal-ai/stable-audio-25/text-to-audio",
    price: 0.2,
    input: () => ({ prompt: MUSIC_PROMPT, seconds_total: 15 }),
  },
  {
    key: "minimax-music",
    name: "MiniMax Music 3",
    model: "minimax/music-3",
    price: 0.002 * 15,
    input: () => ({
      prompt: MUSIC_PROMPT,
      lyrics: "[intro]\n[instrumental]\n[outro]",
      duration: 15,
    }),
  },
];

// --- Stages -------------------------------------------------------------------------------------

async function inputs() {
  await Promise.all([
    generate({
      id: "inputs/talent",
      label: "Fictional talent (headshot)",
      model: "fal-ai/nano-banana-pro",
      input: { prompt: TALENT_PROMPT, aspect_ratio: "3:4", resolution: "2K", output_format: "png" },
      pick: firstImage,
      priceUsd: 0.15,
      asReference: true,
    }),
    generate({
      id: "inputs/product",
      label: "Fictional product (packshot)",
      model: "fal-ai/nano-banana-pro",
      input: {
        prompt: PRODUCT_PROMPT,
        aspect_ratio: "1:1",
        resolution: "2K",
        output_format: "png",
      },
      pick: firstImage,
      priceUsd: 0.15,
      asReference: true,
    }),
  ]);
}

async function frames() {
  const refs = [await hosted("inputs/talent"), await hosted("inputs/product")];
  await Promise.all(
    FRAME_MODELS.flatMap((m) =>
      Object.entries(SHOTS).map(([shot, { label, prompt }]) =>
        generate({
          id: `frames/${m.key}-${shot}`,
          label: `${m.name} · ${label}`,
          model: m.model,
          input: m.input(prompt, refs),
          pick: firstImage,
          priceUsd: m.price,
        }),
      ),
    ),
  );
}

async function videos(frameId) {
  if (!frameId?.startsWith("frames/")) fail("Usage: npm run bakeoff -- videos frames/<model>-a");
  const context = {
    frameUrl: await hosted(frameId),
    talentUrl: await hosted("inputs/talent"),
    productUrl: await hosted("inputs/product"),
  };
  await Promise.all(
    VIDEO_MODELS.map((m) =>
      generate({
        id: `videos/${m.key}`,
        label: m.name,
        model: m.model,
        input: m.input(context),
        pick: (data) => data.video.url,
        priceUsd: m.price,
        note: `Start frame: ${frameId}`,
      }),
    ),
  );
}

async function music() {
  await Promise.all(
    MUSIC_MODELS.map((m) =>
      generate({
        id: `music/${m.key}`,
        label: m.name,
        model: m.model,
        input: m.input(),
        pick: (data) => data.audio.url,
        priceUsd: m.price,
      }),
    ),
  );
}

/**
 * Assembly, as tried in this bake-off: compose drops to 12 fps at about 2 Mbps and took ten minutes,
 * and a screen blend for text over video tints the whole frame magenta (it blends YUV planes). So
 * the text goes on an end card instead: a designed still with the product, headline and call to
 * action, held for two seconds, joined after the shots by merge-videos, with the music added last.
 */
async function cut(clipIds, musicId = "music/elevenlabs") {
  if (clipIds.length !== 3) fail("Usage: npm run bakeoff -- cut videos/<a> videos/<b> videos/<c>");
  const clips = await Promise.all(clipIds.map(hosted));
  const track = await hosted(musicId);
  const fps = 24;

  const card = await hostEndCard("cut/end-card", {
    productUrl: await hosted("inputs/product"),
    headline: "Glow in 7 days",
    cta: "Shop LUMA · 20% off",
  });
  const cardClip = await generate({
    id: "cut/end-card-clip",
    label: "End card held for 2 s (images-to-video)",
    model: "fal-ai/ffmpeg-api/images-to-video",
    input: { fps, images: [{ url: card, frames: 2 * fps }] },
    pick: (data) => data.video.url,
    priceUsd: 0,
  });
  if (!cardClip) return;

  const joined = await generate({
    id: "cut/joined",
    label: "Shots and end card joined (merge-videos, 24 fps, 1080×1920)",
    model: "fal-ai/ffmpeg-api/merge-videos",
    input: {
      video_urls: [...clips, cardClip.url],
      target_fps: fps,
      resolution: { width: 1080, height: 1920 },
    },
    pick: (data) => data.video.url,
    priceUsd: 0.00017 * 30,
    note: `Clips: ${clipIds.join(", ")}`,
  });
  if (!joined) return;

  const final = await generate({
    id: "cut/final",
    label: "Finished ad: music laid under the cut (merge-audio-video)",
    model: "fal-ai/ffmpeg-api/merge-audio-video",
    input: { video_url: joined.url, audio_url: track },
    pick: (data) => data.video.url,
    priceUsd: 0.0002 * 17,
    note: `Music: ${musicId}`,
  });
  if (!final) return;

  await generate({
    id: "cut/last-frame",
    label: "Finished ad: last frame (the end card)",
    model: "fal-ai/ffmpeg-api/extract-frame",
    input: { video_url: final.url, frame_type: "last" },
    pick: firstImage,
    priceUsd: 0,
  });
  for (const item of [joined, final]) {
    const { data } = await withTimeout(
      fal.subscribe("fal-ai/ffmpeg-api/metadata", { input: { media_url: item.url } }),
      CALL_TIMEOUT_MS,
    );
    const { duration, fps: rate, bitrate, resolution, audio } = data.media;
    const metadata = { duration, fps: rate, bitrate, resolution, audio };
    await record({ id: `${item.id}-metadata`, label: `${item.label}: metadata`, metadata });
    console.log(item.id, JSON.stringify(metadata));
  }
}

/** The end card: product, headline and call to action, drawn by next/og like the app will. */
async function hostEndCard(id, { productUrl, headline, cta }) {
  const React = require("react");
  const { ImageResponse } = require("next/og");
  const h = React.createElement;
  const element = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fbf7f2 0%, #efe4d6 100%)",
        padding: "0 90px",
      },
    },
    h("img", { src: productUrl, width: 760, height: 760, style: { objectFit: "contain" } }),
    h(
      "div",
      { style: { marginTop: 40, fontSize: 96, color: "#1c1917", textAlign: "center" } },
      headline,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 48,
          padding: "26px 56px",
          borderRadius: 999,
          background: "#1c1917",
          color: "#fbf7f2",
          fontSize: 52,
        },
      },
      cta,
    ),
  );
  const png = Buffer.from(
    await new ImageResponse(element, { width: 1080, height: 1920 }).arrayBuffer(),
  );
  const file = `${id}.png`;
  await mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
  await writeFile(path.join(OUT, file), png);
  const url = await host(file, png);
  await record({
    id,
    label: "End card (product, headline, call to action)",
    file,
    url,
    priceUsd: 0,
  });
  return url;
}

// --- Calls, downloads and hosting ---------------------------------------------------------------

/** Runs one model, downloads its output and re-hosts it. Records failures instead of throwing. */
async function generate({ id, label, model, input, pick, priceUsd, note, asReference }) {
  const started = Date.now();
  console.log(`→ ${id} (${model})`);
  try {
    const { data } = await withTimeout(
      fal.subscribe(model, { input, mode: "polling", pollInterval: 4000 }),
      CALL_TIMEOUT_MS,
    );
    const sourceUrl = pick(data);
    let bytes = Buffer.from(await (await fetch(sourceUrl)).arrayBuffer());
    let extension = extensionOf(sourceUrl);
    if (asReference) {
      bytes = await sharp(bytes)
        .resize({ width: REFERENCE_MAX_EDGE, height: REFERENCE_MAX_EDGE, fit: "inside" })
        .jpeg({ quality: 92 })
        .toBuffer();
      extension = "jpg";
    }
    const file = `${id}.${extension}`;
    await mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
    await writeFile(path.join(OUT, file), bytes);
    const url = await host(file, bytes);
    const seconds = Math.round((Date.now() - started) / 1000);
    console.log(`✓ ${id} in ${String(seconds)} s`);
    return record({ id, label, model, file, url, seconds, priceUsd, note });
  } catch (error) {
    const reason = describe(error);
    console.log(`✗ ${id}: ${reason}`);
    await record({ id, label, model, priceUsd: 0, error: reason, note });
    return null;
  }
}

async function host(file, bytes) {
  const blob = await put(`bakeoff/${file}`, bytes, {
    access: "public",
    token: blobToken,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

async function hosted(id) {
  const item = (await load()).items[id];
  if (!item?.url) fail(`No result for ${id} yet: run its stage first.`);
  return item.url;
}

// --- The comparison page ------------------------------------------------------------------------

async function page() {
  const { items } = await load();
  const all = Object.values(items);
  const section = (title, prefix, render) => {
    const rows = all.filter((item) => item.id.startsWith(prefix));
    if (rows.length === 0) return "";
    return `<h2>${title}</h2><div class="grid">${rows.map((item) => card(item, render)).join("")}</div>`;
  };
  const total = all.reduce((sum, item) => sum + (item.priceUsd ?? 0), 0);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Model bake-off</title>
<style>
body{margin:0;padding:24px 16px 64px;background:#0b0b0f;color:#ececf1;font:15px/1.5 system-ui,sans-serif}
h1{margin:0 0 4px}h2{margin:40px 0 12px}p.lede{color:#a1a1aa;margin:0 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:#16161d;border:1px solid #26262f;border-radius:14px;overflow:hidden}
.card img,.card video{display:block;width:100%;background:#000}
.card audio{width:calc(100% - 24px);margin:12px}
.meta{padding:10px 12px}.meta b{display:block}.meta span{color:#a1a1aa;font-size:13px}
.error{color:#f87171;font-size:13px;padding:10px 12px}pre{white-space:pre-wrap;font-size:12px;padding:0 12px 12px;margin:0;color:#a1a1aa}
</style></head><body>
<h1>Model bake-off</h1>
<p class="lede">Same fictional talent and product through every model. List-price total so far: $${total.toFixed(2)}.</p>
${section("Inputs", "inputs/", "image")}
${section("Storyboard frames (talent + product as references)", "frames/", "image")}
${section("Video (same start frame and motion prompt)", "videos/", "video")}
${section("Music (15 s instrumental bed)", "music/", "audio")}
${section("Test assembly in fal's cloud ffmpeg: end card + merge-videos + music", "cut/", "auto")}
${section("Rejected assembly attempts", "rejected/", "auto")}
</body></html>`;
  await writeFile(path.join(OUT, "index.html"), html);
  console.log(`Wrote ${path.join(OUT, "index.html")}`);
}

function card(item, render) {
  const kind = render === "auto" ? kindOf(item.file) : render;
  const src = item.file ? encodeURI(item.file) : "";
  const media = item.error
    ? `<div class="error">Failed: ${escapeHtml(item.error)}</div>`
    : item.metadata
      ? `<pre>${escapeHtml(JSON.stringify(item.metadata, null, 2))}</pre>`
      : {
          image: `<a href="${src}"><img src="${src}" alt="${escapeHtml(item.label)}" loading="lazy"></a>`,
          video: `<video src="${src}" controls loop playsinline preload="metadata"></video>`,
          audio: `<audio src="${src}" controls preload="metadata"></audio>`,
        }[kind];
  const facts = [
    item.priceUsd ? `$${item.priceUsd.toFixed(3)}` : null,
    item.seconds ? `${String(item.seconds)} s` : null,
    item.model ?? null,
    item.note ?? null,
  ].filter(Boolean);
  return `<div class="card">${media}<div class="meta"><b>${escapeHtml(item.label)}</b><span>${escapeHtml(facts.join(" · "))}</span></div></div>`;
}

// --- Helpers ------------------------------------------------------------------------------------

async function load() {
  if (!existsSync(RESULTS)) return { items: {} };
  return JSON.parse(await readFile(RESULTS, "utf8"));
}

// Stages run their calls in parallel, so writes to results.json are queued one at a time.
let writes = Promise.resolve();
function record(item) {
  writes = writes.then(async () => {
    const results = await load();
    results.items[item.id] = { ...item, at: new Date().toISOString() };
    await mkdir(OUT, { recursive: true });
    await writeFile(RESULTS, JSON.stringify(results, null, 2));
  });
  return writes.then(() => item);
}

const firstImage = (data) => data.images[0].url;

function extensionOf(url) {
  const match = /\.([a-z0-9]{2,4})(?=$|[?#])/i.exec(new URL(url).pathname);
  return match?.[1]?.toLowerCase() ?? "bin";
}

function kindOf(file = "") {
  if (/\.(mp4|webm|mov)$/i.test(file)) return "video";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(file)) return "audio";
  return "image";
}

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/** fal's ApiError has an empty message; the reason is in the body's `detail`. */
function describe(error) {
  if (error instanceof ApiError) {
    const detail = error.body?.detail ?? error.message;
    return `fal ${String(error.status)}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`.slice(
      0,
      600,
    );
  }
  return error instanceof Error ? error.message : String(error);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${String(ms / 1000)} s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) fail(`${name} is not set (the bakeoff script reads .env.local).`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

// --- Entry --------------------------------------------------------------------------------------

const [stage, ...args] = process.argv.slice(2);
const STAGES = {
  inputs: () => inputs(),
  frames: () => frames(),
  videos: () => videos(args[0]),
  music: () => music(),
  cut: () => cut(args.slice(0, 3), args[3]),
  page: () => page(),
};
const run = STAGES[stage];
if (!run) fail(`Usage: npm run bakeoff -- <${Object.keys(STAGES).join(" | ")}> [ids]`);
await run();
await writes;
