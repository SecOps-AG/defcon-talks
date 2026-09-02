# DEF CON Talk Archive

Searchable archive of DEF CON village talks — video, speakers, and an AI
summary.


Unofficial. Not affiliated with, sponsored by, or endorsed by DEF CON or the
Dark Tangent.

Live at https://defcon-talks.vercel.app/

AI Generated

## Adding talks

One JSON file per village per event under `data/villages/`. Drop a file in and
navigation, search, facets, and pages pick it up — there is no code to change.

```bash
npm run ingest:fetch -- --playlist "<url>" --id defcon-32-recon-village --descriptions
npm run ingest:scaffold -- --id defcon-32-recon-village --event defcon-32 --village-name "Recon Village"
npm run validate
```

- [`docs/INGEST.md`](docs/INGEST.md) — the pipeline, the scripts, the rules
- [`docs/prompts/ingest-village.md`](docs/prompts/ingest-village.md) — the runbook
  for filling in tracks, topics, teasers, and summaries
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — information architecture, data
  model, and how this scales to thousands of talks

## Data shape

```
data/events.json      DEF CONs (slug, name, year, dates, location)
data/taxonomy.json    the 20 tracks, plus topic display labels
data/villages/*.json  one village edition and its talks
```

A **village** is tracked across years (Recon Village), a **track** is one of a
fixed set of categories (OSINT, Red Team, Blue Team…), and **topics** are
free-form fine-grained tags, three to six per talk.
