#!/usr/bin/env node
/**
 * Prints the raw playlist material for one village as compact markdown — the
 * working input for writing teasers, topics, and summaries. Trims descriptions
 * rather than dumping the raw yt-dlp JSON, which is mostly noise.
 *
 *   node scripts/source-notes.mjs --id defcon-32-recon-village [--chars 1200]
 */
import fs from "node:fs";
import path from "node:path";
import { fail, parseArgs, RAW_DIR, readJson, require_ } from "./lib/util.mjs";

const { args } = parseArgs();
require_(args, ["id"], "node scripts/source-notes.mjs --id <raw-id> [--chars 1200]");

const file = path.join(RAW_DIR, `${args.id}.json`);
if (!fs.existsSync(file)) fail(`no raw dump at ${path.relative(process.cwd(), file)}`);

const raw = readJson(file);
const limit = Number.parseInt(args.chars ?? "1200", 10);

const minutes = (seconds) => (seconds ? `${Math.round(seconds / 60)} min` : "unknown length");

console.log(`# ${raw.playlistTitle || args.id}`);
console.log(`\n${raw.videoCount} videos · ${raw.playlistUrl}\n`);

for (const video of raw.videos) {
  console.log(`## ${video.youtubeId}`);
  console.log(`- raw title: ${video.title}`);
  console.log(`- length: ${minutes(video.durationSeconds)}`);
  console.log(`- watch: https://www.youtube.com/watch?v=${video.youtubeId}`);
  if (video.description) {
    const text = video.description.replace(/\s+/g, " ").trim().slice(0, limit);
    console.log(`- description: ${text}${video.description.length > limit ? " …" : ""}`);
  } else {
    console.log("- description: (none fetched — re-run fetch-playlist.mjs with --descriptions)");
  }
  console.log("");
}
