import type { AspectRatio } from "@/contracts/brief";

import { hashString, pick } from "./hash";

/**
 * Draws a placeholder storyboard frame as SVG: a graded backdrop, a horizon, a subject silhouette and
 * the shot's labels. It makes the board readable on fakes without generating any media.
 */

const PALETTES = [
  ["#1d2b35", "#c98b4a", "#f2d5a0"],
  ["#2a1d33", "#d0566b", "#f6c28b"],
  ["#12261f", "#4c9a7a", "#d8e8c4"],
  ["#1c1f2e", "#6f7fd6", "#e3d9ff"],
  ["#2e2418", "#b5764b", "#f0e0c8"],
] as const;

const SIZES = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [1024, 1024],
} satisfies Record<AspectRatio, readonly [number, number]>;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => `&#${String(c.charCodeAt(0))};`);

export function renderFrameSvg(input: {
  seed: string;
  ratio: AspectRatio;
  title: string;
  subtitle: string;
}): string {
  const hash = hashString(input.seed);
  const [dark, mid, light] = pick(PALETTES, hash);
  const [width, height] = SIZES[input.ratio];
  const horizon = Math.round(height * (0.52 + ((hash % 17) - 8) / 100));
  const subjectX = Math.round(width * (0.3 + (hash % 40) / 100));
  const sunX = Math.round(width * (0.2 + ((hash >> 5) % 60) / 100));
  const unit = Math.min(width, height);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" width="${String(width)}" height="${String(height)}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${light}" stop-opacity="0.9"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <circle cx="${String(sunX)}" cy="${String(horizon - unit * 0.12)}" r="${String(unit * 0.22)}" fill="url(#glow)"/>
  <rect y="${String(horizon)}" width="100%" height="${String(height - horizon)}" fill="${dark}" opacity="0.85"/>
  <ellipse cx="${String(subjectX)}" cy="${String(horizon - unit * 0.06)}" rx="${String(unit * 0.035)}" ry="${String(unit * 0.12)}" fill="${dark}"/>
  <circle cx="${String(subjectX)}" cy="${String(horizon - unit * 0.2)}" r="${String(unit * 0.035)}" fill="${dark}"/>
  <text x="${String(unit * 0.05)}" y="${String(height - unit * 0.1)}" font-family="Georgia, serif" font-size="${String(unit * 0.07)}" fill="${light}">${escapeXml(input.title)}</text>
  <text x="${String(unit * 0.05)}" y="${String(height - unit * 0.05)}" font-family="Arial, sans-serif" font-size="${String(unit * 0.03)}" fill="${light}" opacity="0.7" letter-spacing="2">${escapeXml(input.subtitle.toUpperCase())} · STORYBOARD PREVIEW</text>
</svg>`;
}
