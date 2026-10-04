// Seeds the talent roster (ADR-024) from a manifest and its photos.
//
//   npm run talent:seed -- --fake               fictional placeholders (fixtures/talent/fake.json)
//   npm run talent:prod -- talent               the real pack in ./talent (reads .env.prod)
//   npm run talent:prod -- talent --dry-run     checks the pack without writing anything
//
// The real pack never enters git (/talent/ is gitignored): <folder>/talent.json, shaped like
// fixtures/talent/example.json, next to the photos it names. Photos are resized to 2,000 px on the
// long edge, stripped of their metadata (camera, location) and uploaded to Blob under a content
// hash, so a replaced photo gets a new URL. Talent are upserted by slug, and anyone missing from the
// manifest is deactivated: that is how a withdrawn consent takes effect.
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";
import pg from "pg";
import sharp from "sharp";
import { z } from "zod";

const MAX_EDGE = 2000;
const args = process.argv.slice(2);
const isFake = args.includes("--fake");
const isDryRun = args.includes("--dry-run");
const folder = isFake
  ? path.resolve("fixtures/talent")
  : path.resolve(args.find((arg) => !arg.startsWith("--")) ?? "talent");
const manifestFile = path.join(folder, isFake ? "fake.json" : "talent.json");

const Photo = z.object({ file: z.string().min(1), alt: z.string().min(1).max(160) });
const Talent = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase words joined by hyphens"),
  name: z.string().min(1).max(60),
  tagline: z.string().min(1).max(80),
  bio: z.string().min(1).max(400),
  tags: z.array(z.string().min(1).max(24)).max(6),
  // The fake roster has no photo files: its placeholders are drawn below.
  photos: isFake ? z.array(Photo).max(0).default([]) : z.array(Photo).min(1).max(5),
  consent: z.object({
    signedOn: z.iso.date(),
    scope: z.string().min(20).max(400),
    reference: z.string().min(1).max(200),
  }),
  active: z.boolean().default(true),
});
const Manifest = z.object({ talent: z.array(Talent).min(1).max(50) });

const manifest = Manifest.parse(JSON.parse(await readFile(manifestFile, "utf8")));
const slugs = manifest.talent.map((t) => t.slug);
if (new Set(slugs).size !== slugs.length) fail("Two talent share a slug.");

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) fail("No database URL: set DATABASE_URL_UNPOOLED or DATABASE_URL.");
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!isFake && !isDryRun && !blobToken) fail("BLOB_READ_WRITE_TOKEN is needed to upload photos.");

const rows = [];
for (const [index, talent] of manifest.talent.entries()) {
  const photos = isFake
    ? [placeholder(talent)]
    : await Promise.all(talent.photos.map(upload(talent)));
  rows.push({ ...talent, photos, sortOrder: index });
  console.log(
    `${isDryRun ? "checked" : "ready"}: ${talent.name} (${String(photos.length)} photos)`,
  );
}
if (isDryRun) {
  console.log("Dry run: the pack is valid. Nothing was uploaded or written.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query("begin");
  for (const row of rows) {
    await client.query(
      `insert into talents (id, slug, name, tagline, bio, tags, photos, consent_signed_on,
                            consent_scope, consent_reference, is_active, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (slug) do update set
         name = excluded.name, tagline = excluded.tagline, bio = excluded.bio,
         tags = excluded.tags, photos = excluded.photos,
         consent_signed_on = excluded.consent_signed_on, consent_scope = excluded.consent_scope,
         consent_reference = excluded.consent_reference, is_active = excluded.is_active,
         sort_order = excluded.sort_order, updated_at = now()`,
      [
        `tal_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
        row.slug,
        row.name,
        row.tagline,
        row.bio,
        row.tags,
        JSON.stringify(row.photos),
        row.consent.signedOn,
        row.consent.scope,
        row.consent.reference,
        row.active,
        row.sortOrder,
      ],
    );
  }
  const { rowCount } = await client.query(
    "update talents set is_active = false, updated_at = now() where is_active and slug <> all($1::text[])",
    [slugs],
  );
  await client.query("commit");
  console.log(
    `Seeded ${String(rows.length)} talent; deactivated ${String(rowCount ?? 0)} no longer listed.`,
  );
} catch (error) {
  await client.query("rollback");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}

/** Resizes and strips one photo, then uploads it under a content hash (or just checks it). */
function upload(talent) {
  return async (photo, index) => {
    const source = await readFile(path.join(folder, photo.file)).catch(() =>
      fail(`${talent.name}: can't read ${photo.file}`),
    );
    const bytes = await sharp(source)
      .rotate() // Honour the camera's orientation before the metadata is dropped.
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    if (isDryRun) return { url: `(dry run) ${photo.file}`, alt: photo.alt };
    const blob = await put(`talent/${talent.slug}/${String(index + 1)}-${hash}.jpg`, bytes, {
      access: "public",
      token: blobToken,
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
    });
    return { url: blob.url, alt: photo.alt };
  };
}

/** A drawn portrait card for a fictional placeholder, as a data URL: no files, no storage. */
function placeholder(talent) {
  const hue = [...talent.slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360;
  const initials = talent.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 480 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${String(hue)} 45% 32%)"/><stop offset="1" stop-color="hsl(${String((hue + 40) % 360)} 50% 18%)"/>
</linearGradient></defs>
<rect width="480" height="600" fill="url(#g)"/>
<circle cx="240" cy="250" r="96" fill="hsl(${String(hue)} 30% 80% / 0.18)"/>
<path d="M90 600c10-120 70-190 150-190s140 70 150 190z" fill="hsl(${String(hue)} 30% 80% / 0.18)"/>
<text x="240" y="275" font-family="Georgia, serif" font-size="72" fill="white" text-anchor="middle">${initials}</text>
</svg>`;
  return {
    url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    alt: `Placeholder portrait for ${talent.name}, a fictional profile`,
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
