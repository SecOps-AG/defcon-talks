# Ingest

How a YouTube playlist becomes a village in the archive. The decisions that are
expensive to reverse — schema, taxonomy, layout — are already made, so an ingest
run only fills in per-talk fields, behind a validator.

```
playlist URL
    │  npm run ingest:fetch        yt-dlp, no video downloaded
    ▼
data/raw/<id>.json                 gitignored working material
    │  npm run ingest:scaffold     parses titles, assigns slugs
    ▼
data/villages/<event>-<village>.json
    │  annotation pass: track, topics, teaser, summary
    ▼
npm run validate                   errors exit 1; build runs this first
    │
    ▼
site — nav, search, facets, and pages update with no code change
```

## Run it

```bash
npm run ingest:fetch -- --playlist "<url>" --id defcon-32-recon-village --descriptions
npm run ingest:scaffold -- --id defcon-32-recon-village --event defcon-32 --village-name "Recon Village"
npm run ingest:notes -- --id defcon-32-recon-village   # source material to annotate from
npm run topics                                          # vocabulary already in use
npm run validate
```

`yt-dlp` is at `/home/box/.local/bin/yt-dlp`; pass `--yt-dlp <path>` or set
`YT_DLP` if it is not on `PATH`.

Work through [`docs/prompts/ingest-village.md`](prompts/ingest-village.md) with
the playlist URL, event slug, and village name. That runbook is the contract.

## Adding a new event

Dates and locations are never guessed during ingest. Add the event by hand first:

```jsonc
// data/events.json
{ "slug": "defcon-34", "name": "DEF CON 34", "shortName": "DC34",
  "year": 2026, "dates": "6–9 August 2026", "location": "Las Vegas Convention Center" }
```

## What the scripts do

| Script | Purpose |
| --- | --- |
| `scripts/fetch-playlist.mjs` | One flat `yt-dlp` call for the playlist; `--descriptions` adds a per-video pass for abstracts. Writes `data/raw/<id>.json`. |
| `scripts/scaffold-village.mjs` | Splits `DEF CON 33 - Village - Title - Speakers` into fields, assigns globally unique slugs, writes the village file. Re-runnable: existing talks are kept verbatim, only new videos are appended. |
| `scripts/source-notes.mjs` | Compact markdown of titles, lengths, and trimmed descriptions — the working input for annotation, far smaller than the raw yt-dlp JSON. |
| `scripts/validate-data.mjs` | Schema, referential integrity, uniqueness, taxonomy membership, field limits. Warns on topic drift (`supply-chain` vs `supplychain`). |
| `scripts/list-topics.mjs` | Topic vocabulary with counts, so topics get reused rather than reinvented. |

## Title parsing

DEF CON upload titles drift (`DEF CON 33  Recon Village -  Title - Speaker`), so
`scripts/lib/parse-title.mjs` strips the event and village prefix and splits off a
trailing speaker list only when it reads like names rather than prose.

Measured when it was written, against the first two playlists in the archive:
**26/26 titles** and **24/26 speaker lists** exact. The two misses are cases
where a human expanded initials and added panelists the video title omitted —
which is why the runbook requires speakers to be checked against the
description.

## Validation rules that matter

- `youtubeId` — 11 URL-safe chars, unique across the whole archive
- `slug` — kebab-case, unique across the whole archive (`/talks/<slug>` is flat)
- `track` — exactly one, must exist in `data/taxonomy.json`
- `topics` — 3 to 6, kebab-case, no duplicates
- `teaser` — required, max 220 characters
- `summary` — string, object, or `null`; `null` is preferred over invention
- village filename must equal `<eventSlug>-<villageSlug>.json`
- `eventSlug` must exist in `data/events.json`
