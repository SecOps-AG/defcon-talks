#!/usr/bin/env node
/**
 * Step 1 of ingest: pull a YouTube playlist's metadata to data/raw/.
 * Downloads no video — only titles, ids, durations, and (optionally) descriptions.
 *
 *   node scripts/fetch-playlist.mjs --playlist <url> --id defcon-32-recon-village
 *   node scripts/fetch-playlist.mjs --playlist <url> --id ... --descriptions
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fail, parseArgs, RAW_DIR, require_, SLUG, writeJson } from "./lib/util.mjs";

const USAGE =
  "node scripts/fetch-playlist.mjs --playlist <url> --id <event>-<village> [--descriptions] [--yt-dlp <path>]";

const { args } = parseArgs();
require_(args, ["playlist", "id"], USAGE);

if (!SLUG.test(args.id)) fail(`--id must be kebab-case, got "${args.id}"`);

const ytDlp = args["yt-dlp"] || process.env.YT_DLP || "yt-dlp";

function run(extraArgs) {
  const result = spawnSync(ytDlp, extraArgs, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) {
    fail(`could not run "${ytDlp}" (${result.error.message}). Pass --yt-dlp /path/to/yt-dlp.`);
  }
  if (result.status !== 0) {
    fail(`${ytDlp} exited ${result.status}\n${(result.stderr || "").trim().slice(0, 2000)}`);
  }
  return result.stdout;
}

console.log(`fetching playlist metadata with ${ytDlp} …`);

// --flat-playlist is one request for the whole list: fast and rate-limit friendly.
const flat = JSON.parse(
  run(["--flat-playlist", "--dump-single-json", "--no-warnings", args.playlist]),
);

const entries = (flat.entries || []).filter((entry) => entry && entry.id);
if (entries.length === 0) fail("playlist returned no videos");

let descriptions = {};
if (args.descriptions) {
  // Per-video, so only ask for it when the summaries need source material.
  console.log(`fetching descriptions for ${entries.length} videos (one request each) …`);
  const out = run([
    "--skip-download",
    "--dump-json",
    "--no-warnings",
    "--ignore-errors",
    args.playlist,
  ]);
  for (const line of out.split("\n").filter(Boolean)) {
    try {
      const video = JSON.parse(line);
      descriptions[video.id] = {
        description: video.description || "",
        uploadDate: video.upload_date || "",
        channel: video.channel || video.uploader || "",
      };
    } catch {
      /* a single unparseable line should not sink the run */
    }
  }
}

const payload = {
  fetchedAt: new Date().toISOString().slice(0, 10),
  playlistUrl: args.playlist,
  playlistTitle: flat.title || "",
  channel: flat.channel || flat.uploader || "",
  videoCount: entries.length,
  videos: entries.map((entry) => ({
    youtubeId: entry.id,
    title: entry.title || "",
    durationSeconds: Math.round(entry.duration || 0) || null,
    ...(descriptions[entry.id] ?? {}),
  })),
};

fs.mkdirSync(RAW_DIR, { recursive: true });
const out = path.join(RAW_DIR, `${args.id}.json`);
writeJson(out, payload);

console.log(`\n  playlist : ${payload.playlistTitle}`);
console.log(`  videos   : ${payload.videoCount}`);
console.log(`  wrote    : ${path.relative(process.cwd(), out)}`);
console.log(`\n  next: node scripts/scaffold-village.mjs --id ${args.id} --event <event-slug> --village-name "<Name>"\n`);
