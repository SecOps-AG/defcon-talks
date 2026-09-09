# Feature ideas

A backlog, not a plan. Twelve ideas ranked by value over effort, each measured
against the archive as it stands today rather than against a guess.

Nothing here needs a database, an account system, or a fact the archive cannot
source. Nothing here makes the site look more official than it is.

## Where the archive actually is

Numbers from `main`, measured rather than remembered:

| | |
| --- | --- |
| talks | 4,755 across 214 village editions, 91 villages, 34 events |
| static pages | 12,987 |
| `teaser` | 100% populated |
| `durationSeconds` | 99.5% populated, rendered nowhere |
| `summary` | 67.3% (3,198 talks, 4.4 MB of prose, invisible to search) |
| topics | 3,935 distinct, 2,384 used exactly once |
| speakers | 3,953, of whom 3,136 have one talk and 644 span more than one year |
| home page | 3.18 MB HTML, 660 KB gzipped |
| `/sitemap.xml`, `/robots.txt` | both 404 |

Two of those deserve to be read twice. `durationSeconds` is on essentially every
talk and the UI never shows it. And the home page is **660 KB gzipped** —
`ARCHITECTURE.md` records 95 KB against a synthetic 2,792-talk archive, so real
data at 1.7× the talk count came in at 7× the weight. Teasers went from sparse
to universal, and the index carries all of them.

---

## 1. Runtime on the card, and a length filter — **S**

`durationSeconds` is present on 4,731 of 4,755 talks and appears nowhere in the
UI. Print it on the card and the talk page (`38 min`), add a **Length** facet
alongside Year and Track (under 20 minutes / 20–45 / 45+), and add `duration` to
the sort menu. "I have twenty-five minutes and I want something good" is one of
the most common ways a person actually approaches a talk archive, and right now
the site cannot answer it. The facet plumbing already exists — `FacetList` takes
options and a toggle, and `matchesDimension` in `src/lib/search.ts` gains one
bucket comparison. This is the cheapest real feature on the list.

## 2. Tell talks apart from clips — **S/M**

Load the site right now and the first sixteen results are a 12-second CFP
reminder, a 14-second "Good Morning", a 19-second Hacker Jeopardy teaser, a
1-second audio fragment, and a violin performance. That is not a bug in the
data; it is the default sort (newest first) meeting the `defcon-channel` pseudo
event, which is dated 2026 so that every trailer since DEF CON 6 sorts ahead of
every real talk. Derive a `kind` at load time in `src/lib/data.ts` — `talk`,
`clip`, `interview`, `announcement` — from duration, village slug, and title
shape, default the browser to `kind=talk`, and offer "include clips & extras" as
one checkbox. 183 talks run under five minutes and 91 under two; 168 sit in
interview villages. Derive rather than author, so nobody hand-labels 4,755
records, with an optional `kind` field in the village JSON as the escape hatch
for the ones the heuristic gets wrong. Worth pairing with a data fix: give
`defcon-channel` a year that does not put it at the front of the queue.

## 3. Sitemap, robots, and social previews — **S**

12,987 static pages and no `sitemap.xml`, no `robots.txt`, no `metadataBase`,
and no `og:image`. Every talk page is a well-titled, well-described, uniquely
addressable document about a specific piece of security research, and search
engines are being told about none of them. Add `app/sitemap.ts` (12,987 URLs sits
under the 50,000-entry limit, so a single generator covers the archive and
`generateSitemaps` can wait), `app/robots.ts`, and an OpenGraph image per talk
pointing at the YouTube thumbnail the cards already load from `i.ytimg.com`. No new data, no new dependency, and it changes
who finds the archive at all — plus talks stop pasting into Slack and Discord as
a bare grey rectangle.

## 4. Put the home index on a diet — **M**

660 KB gzipped, 3.18 MB on the wire, shipped to every visitor before they type a
character. Three cuts, in increasing order of work. Dropping `teaser` from
`TalkIndexEntry` takes it to 400 KB. Also dropping the fields that are pure
repetition — `id` is derivable, `villageName`/`trackName`/`eventShortName`/`eventSlug`
are joins against tables of 91, 20, and 34 rows that could ship once as lookup
tables — takes it to 362 KB. Splitting the index into one static JSON file per
year and fetching on demand puts the initial payload at 63 KB, because the
largest single year is 505 talks. `ARCHITECTURE.md` already sketches this as the
"past ten thousand talks" move and notes that `src/lib/search.ts` is pure and
takes an array, so it works unchanged behind a fetch. The threshold arrived
early. Do the first two cuts as one afternoon's work; the shard split is the
real project, and it is the thing idea 5 stands on.

## 5. Search the summaries — **M**

Search covers title, teaser, speakers, village, event, track, and topics. It
does not cover the 3,198 summaries, which is 4.4 MB of the most substantive
prose in the repository. A talk that spends twelve paragraphs on cache poisoning
but never says it in the title is currently unfindable by that word. The whole
summary corpus is 1.57 MB gzipped, far too much to ship eagerly, but per-year it
is 77–126 KB — so once idea 4 has sharded the index, a summary shard rides along
on the same mechanism, fetched in the background after first paint and merged
into the haystack. Search quietly gets deeper a second after the page loads, and
results gain a "matched in summary" hint so the reason a hit surfaced is legible.
This is the single largest recall improvement available from data already
committed.

## 6. Canonical topics — **M**

3,935 topics for 4,755 talks, and 2,384 of them are used exactly once. A topic
page with one talk on it is a dead end, and 61% of topic pages are dead ends.
The validator already prints the near-duplicate warnings — `wifi`/`wi-fi`,
`lockpicking`/`lock-picking`, `contest`/`contests`, `cyber-warfare`/`cyberwarfare`,
43 groups in all. Add a `topicAliases` map to `data/taxonomy.json`, fold aliases
at load time in `src/lib/data.ts`, redirect the retired topic URLs, and promote
the validator warning to an error so a new topic that aliases an existing one
cannot land. Mechanical, reversible, and it makes the topic axis worth browsing
instead of worth avoiding.

## 7. Speaker pages that earn their URL — **S/M**

A speaker page today is a name, a talk count, and the browser. There are 3,953
of them and they are the most likely search-engine landing page in the archive.
Everything needed to make them substantial is already derivable from
`talk.speakers`: years active (644 people span more than one year), the villages
they have spoken at, first and last appearance, and frequent co-speakers from
the 1,006 talks with more than one credited name. A row of year chips and a
short "also appears with" list turns a stub into a page someone would bookmark.
Deriving co-speakers is a single pass over `getTalks()` and memoises like the
rest of the data layer.

## 8. Command palette and keyboard navigation — **M**

The audience is keyboard-first and the search is already instant, in-memory, and
client-side. `⌘K` from any page opens a palette that jumps to a talk, speaker,
village, track, or topic; `/` focuses the search field; `j`/`k` walk the result
grid; `Enter` opens. It reuses `filterTalks` and the existing index with no new
data and no new route, and it fixes the real navigation cost of the current
design, which is that reaching a village from a talk page means going through a
listing. Fits the archive's posture better than any amount of visual polish
would.

## 9. Saved talks and watched marks, local only — **M**

Personalization with no account, no backend, and nothing to leak: a bookmark
toggle on cards and talk pages, a `/saved` route that runs `TalkBrowser` over
the saved subset, and a muted "watched" mark so working through Recon Village
2025 does not mean remembering where you stopped. State lives in `localStorage`
with a JSON export/import so it survives a browser wipe or moves between
machines. The one design constraint worth respecting: the pages are static, so
the marks have to render after hydration or the HTML mismatches — the same
pattern `TalkBrowser` already uses with its `ready` flag.

## 10. Move through an edition in order — **S**

A talk page links out to three scored "related talks" but has no sense of the
playlist it came from. Add previous/next within the village edition, a
"talk 7 of 24" position line, and a link to the source YouTube playlist, which
is already stored as `playlistUrl` on every edition. People watch a village the
way they watch a season, and right now the site makes them go back to a listing
between every episode.

## 11. Coverage, honestly displayed — **S**

32.7% of talks have no summary and the repo is actively backfilling them in
batches. Two small surfaces serve both readers and contributors: a `has:summary`
filter in the browser, so someone who wants to read rather than watch can see
only the covered talks; and a `/coverage` page showing summary, topic, and
speaker completeness per event and per village, driven by exactly the counts
`scripts/validate-data.mjs` already computes. Pair it with a plain line on the
talk page marking summaries as machine-written — that is the honest posture for
an unofficial archive, and it is better said out loud than left to be inferred.

## 12. Recently added feed, and a year index — **S/M**

Years are currently reachable only as a facet; there is no `/events` index, even
though `data/events.json` has dates and locations for all 34. A small index page
is nearly free. The feed is the more interesting half: `/feed.xml` of talks
recently added to the archive, which needs an `addedAt` the data does not have.
Do not backfill it by guessing — have `scripts/scaffold-village.mjs` stamp it on
new talks going forward and let the feed start shallow. Resist "on this day":
`publishedAt` is 0% populated and inferring it from event dates would be
inventing data.

---

## If you only do three

**Idea 2, talk versus clip.** The first screen of the site is the product, and
right now the first screen is a violin performance and a 1-second audio
fragment. Everything else on this list improves a journey that a fair number of
visitors are abandoning at the front door. It is also cheap, because the signal
is already in the data.

**Ideas 4 and 5 together, index diet then summary search.** These are one
project wearing two hats. The payload work is unavoidable — 660 KB is already
past the point `ARCHITECTURE.md` flagged as the redesign trigger, and it gets
worse with every ingest run. Doing it as sharding rather than as trimming means
the 4.4 MB of summary prose becomes searchable in the same move, which is the
largest single improvement to "can I find the talk I half-remember" that the
archive can make without new data.

**Idea 3, sitemap and OpenGraph.** Not the most interesting thing here, but it
is a few hours of work standing between 12,987 genuinely useful pages and every
person who would search for them. Do it regardless of what else gets picked.
