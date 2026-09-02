#!/usr/bin/env node
/**
 * Step 2 of ingest: turn a raw playlist dump into a village file with every
 * mechanical field filled and every editorial field left blank to annotate.
 *
 * Re-running is safe: existing talks are kept verbatim and only new videos in
 * the playlist are appended, so a village that grows later does not lose work.
 *
 *   node scripts/scaffold-village.mjs --id defcon-32-recon-village \
 *     --event defcon-32 --village-name "Recon Village"
 */
import fs from "node:fs";
import path from "node:path";
import { parseVideoTitle } from "./lib/parse-title.mjs";
import {
  DATA_DIR,
  fail,
  parseArgs,
  RAW_DIR,
  readEvents,
  readJson,
  require_,
  slugify,
  VILLAGE_DIR,
  villageFiles,
  writeJson,
} from "./lib/util.mjs";

const USAGE =
  'node scripts/scaffold-village.mjs --id <raw-id> --event <event-slug> --village-name "<Name>" [--village-slug <slug>] [--skip <id,id>]';

const { args } = parseArgs();
require_(args, ["id", "event", "village-name"], USAGE);

const rawFile = path.join(RAW_DIR, `${args.id}.json`);
if (!fs.existsSync(rawFile)) {
  fail(`no raw dump at ${path.relative(process.cwd(), rawFile)} — run fetch-playlist.mjs first`);
}
const raw = readJson(rawFile);

const events = readEvents();
const event = events.find((entry) => entry.slug === args.event);
if (!event) {
  fail(
    `event "${args.event}" is not in data/events.json.\n` +
      `         Known events: ${events.map((entry) => entry.slug).join(", ")}\n` +
      `         Add the event first (slug, name, shortName, year, dates, location).`,
  );
}

const villageName = String(args["village-name"]).trim();
const villageSlug = args["village-slug"] ? String(args["village-slug"]) : slugify(villageName);
const fileId = `${event.slug}-${villageSlug}`;
const outFile = path.join(VILLAGE_DIR, `${fileId}.json`);

const skip = new Set(
  String(args.skip || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

// Slugs are global: /talks/<slug> has no village in the path.
const takenSlugs = new Set();
for (const file of villageFiles()) {
  for (const talk of readJson(file).talks ?? []) takenSlugs.add(talk.slug);
}

function uniqueSlug(title, youtubeId) {
  const base = slugify(title).slice(0, 64).replace(/-+$/, "") || `talk-${youtubeId.toLowerCase()}`;
  if (!takenSlugs.has(base)) {
    takenSlugs.add(base);
    return base;
  }
  for (let suffix = 2; suffix < 50; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!takenSlugs.has(candidate)) {
      takenSlugs.add(candidate);
      return candidate;
    }
  }
  return `${base}-${youtubeId.toLowerCase()}`;
}

const existing = fs.existsSync(outFile) ? readJson(outFile) : null;
const existingById = new Map((existing?.talks ?? []).map((talk) => [talk.youtubeId, talk]));
for (const talk of existingById.values()) takenSlugs.delete(talk.slug);

let added = 0;
const talks = [];

for (const video of raw.videos) {
  if (skip.has(video.youtubeId)) continue;

  const kept = existingById.get(video.youtubeId);
  if (kept) {
    talks.push(kept);
    takenSlugs.add(kept.slug);
    continue;
  }

  const parsed = parseVideoTitle(video.title, villageName);
  added += 1;
  talks.push({
    youtubeId: video.youtubeId,
    slug: uniqueSlug(parsed.title, video.youtubeId),
    title: parsed.title,
    speakers: parsed.speakers,
    track: "",
    topics: [],
    teaser: "",
    summary: null,
    ...(video.durationSeconds ? { durationSeconds: video.durationSeconds } : {}),
  });
}

if (talks.length === 0) fail("nothing to write — every video was skipped");

writeJson(outFile, {
  villageSlug,
  villageName,
  eventSlug: event.slug,
  playlistUrl: raw.playlistUrl,
  description: existing?.description ?? "",
  talks,
});

const blank = talks.filter((talk) => !talk.track).length;
console.log(`\n  wrote    : ${path.relative(process.cwd(), outFile)}`);
console.log(`  village  : ${villageName} @ ${event.name}`);
console.log(`  talks    : ${talks.length} (${added} new, ${talks.length - added} kept)`);
console.log(`  to fill  : description + ${blank} × { track, topics, teaser, summary }`);
console.log(`\n  source notes: node scripts/source-notes.mjs --id ${args.id}`);
console.log(`  then check  : npm run validate\n`);

if (!fs.existsSync(path.join(DATA_DIR, "taxonomy.json"))) fail("data/taxonomy.json is missing");
