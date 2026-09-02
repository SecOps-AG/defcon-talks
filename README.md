# DEF CON Talk Archive

Searchable archive of DEF CON village talks — video, speakers, and a written
summary for most talks.

Coverage today: 6 events (DEF CON 23, Safe Mode, 29, 31, 32, 33), 29 villages
across 42 village editions, 1,103 talks. `npm run validate` prints the current
totals.

Unofficial. Not affiliated with, sponsored by, or endorsed by DEF CON or the
Dark Tangent.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run validate # data/ schema check (also runs as part of build)
npm run build
npm start
```

## Browsing

| Route | What it is |
| --- | --- |
| `/` | The browser itself — search, counted facets, three-up cards, pagination |
| `/villages`, `/villages/<village>` | A village across every year it ran |
| `/<event>`, `/<event>/<village>` | One event, and one village at that event |
| `/tracks`, `/tracks/<track>` | Fixed category vocabulary |
| `/topics`, `/topics/<topic>` | The long-tail tag index |
| `/speakers`, `/speakers/<speaker>` | Everyone credited on a talk, and their talks |
| `/talks/<slug>` | Video, teaser, summary, related talks |

Filter state is stored in the URL, so a filtered view can be shared. `/talks`
redirects to `/` with its query intact.

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
