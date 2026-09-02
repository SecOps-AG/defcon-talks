# Runbook: add a DEF CON village to the archive

One YouTube playlist becomes one **village edition** — one village, at one event,
in one year. Work the steps in order; do not improvise a different approach.

Three inputs are required. If any is missing, stop and get it first:

| Input | Example |
| --- | --- |
| Playlist URL | `https://www.youtube.com/playlist?list=PL9fPq3eQfaa...` |
| Event slug | `defcon-32` |
| Village name | `Recon Village` |

---

## Hard rules

1. **Only edit files under `data/`.** Never touch `src/`, `scripts/`, `docs/`, or
   config files. The site code already handles any village that is added.
2. **Never edit another village's file.** Exactly one file is created or edited:
   `data/villages/<event-slug>-<village-slug>.json`.
3. **Never invent a `youtubeId`, `title`, `speaker`, or fact.** Every value comes
   from the playlist data or the video description. Anything that cannot be
   sourced stays at its default and is noted in the run report.
4. **Never delete or rewrite a talk that is already in the file.** Re-running the
   scaffold keeps existing talks; the job is the blank fields.
5. **`npm run validate` must exit 0 before the run is done.** No exceptions.
6. If the event slug is not in `data/events.json`, **stop and add the event by
   hand** first. Never guess a DEF CON's dates or location.

---

## Step 1 — fetch the playlist

Pick an id of the form `<event-slug>-<village-slug>`, e.g. `defcon-32-recon-village`.

```bash
npm run ingest:fetch -- \
  --playlist "<PLAYLIST URL>" \
  --id <event-slug>-<village-slug> \
  --descriptions \
  --yt-dlp /home/box/.local/bin/yt-dlp
```

`--descriptions` is slower (one request per video) but pulls each talk's abstract,
the main source for teasers, topics, and summaries. Always use it.

This writes `data/raw/<id>.json`. That file is gitignored working material — never
commit it, never hand-edit it.

## Step 2 — scaffold the village file

```bash
npm run ingest:scaffold -- \
  --id <event-slug>-<village-slug> \
  --event <event-slug> \
  --village-name "<Village Name>"
```

This creates `data/villages/<event-slug>-<village-slug>.json` with `youtubeId`,
`slug`, `title`, `speakers`, and `durationSeconds` already filled in, and
`track`, `topics`, `teaser`, `summary` left blank.

If the playlist contains non-talk videos (an intro reel, a sponsor clip), re-run
with `--skip <youtubeId>,<youtubeId>`.

## Step 3 — read the source material

```bash
npm run ingest:notes -- --id <event-slug>-<village-slug>
npm run topics
```

The first prints the raw title, length, and description for each video. The
second prints the topic vocabulary already in use — read it before inventing a
topic.

## Step 4 — fill in the fields

Edit `data/villages/<event-slug>-<village-slug>.json` only.

### Village-level

- **`description`** — two sentences. What this village covers and what its talks
  are about at this event. No marketing language.

### Per talk

- **`title`** — check the scaffolded value against the raw title. It should be the
  talk's own title with no `DEF CON 33`, no village name, and no speaker names.
  Fix capitalisation to title case if the upload was shouty or lowercase.
- **`speakers`** — check against the description, which usually has full names.
  The raw title often abbreviates (`A Pennington` → `Adam Pennington`) or omits
  panelists. Order as the description lists them. Keep handles as-is
  (`Simwindie`, `Master Chen`). Empty array only if nobody is credited anywhere.
- **`track`** — exactly one slug from `data/taxonomy.json`. Ask "what kind of work
  is this?", not "what topic is it about?". Every talk gets a track, and a talk
  gets the track that best matches its *primary* stance:
  - attacking → `red-team`, `adversary-emulation`, `social-engineering`, `malware`
  - finding things → `osint`, `recon`
  - defending → `blue-team`, `threat-intel`
  - both at once → `purple-team`
  - about a technology area → `appsec`, `cloud`, `supply-chain`, `ai-security`,
    `hardware`, `wireless`, `ics-ot`, `mobile`, `privacy`
  - about people, law, or the scene → `policy`, `community`

  If two tracks fit, pick the one the speaker spends most of the talk on. If none
  fits, use the closest domain track — do **not** add a new track to the taxonomy.
- **`topics`** — 3 to 6, lowercase kebab-case, most specific first. Topics are the
  fine-grained "what is this actually about" layer: tools, techniques, targets,
  regions, ecosystems (`shodan`, `typosquatting`, `npm`, `dprk`, `knowledge-graph`).
  - **Reuse before inventing.** Run `npm run topics` and take an existing topic if
    it means the same thing. `supply-chain` not `supplychain`; `osint` not
    `open-source-intelligence`; singular not plural (`agent` vs `agents` — match
    whatever the list already uses).
  - Do not repeat the track as a topic unless the talk is specifically *about*
    that practice.
  - No generic filler: never `security`, `hacking`, `cyber`, `talk`, `defcon`.
- **`teaser`** — one sentence, at most 220 characters, plain present tense, saying
  what the talk delivers. It is the card blurb; it must be readable on its own.
  - Good: `Playbook for finding and exploiting the Web Methods servers that glue corporate systems together.`
  - Bad: `In this talk, the speaker will discuss various topics related to security.`
  - Do not start with "In this talk", "This presentation", or the speaker's name.
- **`summary`** — a single string, 300 to 900 words, written from the description
  and the video. Format it as blocks separated by **blank lines**:
  - A block that is short (under 90 characters), no more than 12 words, and ends
    with no punctuation renders as a **section heading**. Use 4 to 8 of them.
  - Every other block renders as a paragraph.
  - A paragraph may start with a bolded lead-in as `Term: explanation…`.
  - Write what the talk actually says: techniques, tools, numbers, conclusions.
    No hype, no invented detail, no "the speaker begins by".
  - **When only the description is available and the video cannot be watched,
    write a shorter summary from the description alone, or set `summary` to
    `null`.** An honest `null` is correct; a fabricated summary is not.

### Worked example

```json
{
  "youtubeId": "wgf5GKrY3nc",
  "slug": "a-playbook-for-integration-servers",
  "title": "A Playbook for Integration Servers",
  "speakers": ["Ryan Bonner", "Guðmundur Karlsson"],
  "track": "red-team",
  "topics": ["webmethods", "integration-servers", "recon", "bug-bounty", "legacy"],
  "teaser": "Playbook for finding and exploiting Web Methods servers that glue corporate systems together.",
  "summary": "Introduction to Web Methods Integration Servers\n\nThese servers act as middleware, connecting older systems with newer applications…\n\nReconnaissance Techniques\n\nShodan: Queries like www authenticate identify integration servers, yielding hundreds of results…",
  "durationSeconds": 1321
}
```

## Step 5 — validate

```bash
npm run validate
```

Fix every error and re-run until it exits 0. Errors name the exact file, talk,
and field. Warnings are advisory, but a warning that a new topic duplicates an
existing one should be fixed.

## Step 6 — check it renders

```bash
npm run build
```

Then, if a preview is running at http://localhost:3000, open
`/<event-slug>/<village-slug>` and confirm the talks, teasers, and summaries look
right. The village appears in navigation, search, and facets automatically.

## Step 7 — report

Write up, in the run notes or the pull request:

- the file created and how many talks it holds
- the track distribution (e.g. `red-team 4, osint 3, blue-team 3`)
- any topics invented rather than reused, and why
- any talk left with `summary` as `null`, or with unconfirmed speakers
- the `npm run validate` result

Do not commit, push, or open a pull request unless that was explicitly asked for.

---

## Definition of done

- [ ] `data/villages/<event>-<village>.json` exists and is the only file changed
- [ ] Every talk has a non-empty `track`, 3–6 `topics`, and a `teaser`
- [ ] `summary` is a real summary or an honest `null` — never invented
- [ ] `npm run validate` exits 0
- [ ] `npm run build` succeeds
- [ ] Invented topics and missing summaries are reported
