/**
 * Server-only data layer.
 *
 * Every village edition is its own file under data/villages/. They are read
 * from disk at first access rather than imported statically, so adding a
 * village to the archive means dropping in one JSON file — no code edit, no
 * merge conflict in a single giant talks.json. Results are memoised for the
 * lifetime of the process (build, dev server, or `next start`).
 */
import fs from "node:fs";
import path from "node:path";
import type {
  ArchiveStats,
  ConEvent,
  Speaker,
  StoredVillageEdition,
  Talk,
  TalkIndexEntry,
  Taxonomy,
  Track,
  VillageEdition,
  VillageSeries,
} from "./types";
import { buildIndexEntry, slugifySpeaker } from "./search";

const DATA_DIR = path.join(process.cwd(), "data");
const VILLAGE_DIR = path.join(DATA_DIR, "villages");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function memo<T>(load: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= load());
}

export const getEvents = memo((): ConEvent[] =>
  readJson<{ events: ConEvent[] }>(path.join(DATA_DIR, "events.json")).events
    .slice()
    .sort((a, b) => b.year - a.year),
);

export const getTaxonomy = memo((): Taxonomy =>
  readJson<Taxonomy>(path.join(DATA_DIR, "taxonomy.json")),
);

export const getTracks = memo((): Track[] => getTaxonomy().tracks);

const getStoredEditions = memo((): StoredVillageEdition[] =>
  fs
    .readdirSync(VILLAGE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => readJson<StoredVillageEdition>(path.join(VILLAGE_DIR, file))),
);

type Archive = {
  editions: VillageEdition[];
  talks: Talk[];
};

const getArchive = memo((): Archive => {
  const eventBySlug = new Map(getEvents().map((event) => [event.slug, event]));
  const trackBySlug = new Map(getTracks().map((track) => [track.slug, track]));

  const editions: VillageEdition[] = [];
  const talks: Talk[] = [];

  for (const stored of getStoredEditions()) {
    const event = eventBySlug.get(stored.eventSlug);
    if (!event) {
      throw new Error(
        `Village "${stored.villageSlug}" references unknown event "${stored.eventSlug}". Add it to data/events.json.`,
      );
    }
    const id = `${stored.eventSlug}-${stored.villageSlug}`;

    editions.push({
      id,
      villageSlug: stored.villageSlug,
      villageName: stored.villageName,
      eventSlug: event.slug,
      eventName: event.name,
      eventShortName: event.shortName,
      year: event.year,
      dates: event.dates,
      location: event.location,
      playlistUrl: stored.playlistUrl,
      description: stored.description,
      talkCount: stored.talks.length,
    });

    for (const talk of stored.talks) {
      talks.push({
        ...talk,
        id: `${id}-${talk.youtubeId}`,
        villageId: id,
        villageSlug: stored.villageSlug,
        villageName: stored.villageName,
        eventSlug: event.slug,
        eventName: event.name,
        eventShortName: event.shortName,
        year: event.year,
        youtubeUrl: `https://www.youtube.com/watch?v=${talk.youtubeId}`,
        trackName: trackBySlug.get(talk.track)?.name ?? talk.track,
      });
    }
  }

  editions.sort(
    (a, b) => b.year - a.year || a.villageName.localeCompare(b.villageName),
  );
  return { editions, talks };
});

export function getTalks(): Talk[] {
  return getArchive().talks;
}

export function getEditions(): VillageEdition[] {
  return getArchive().editions;
}

export function getEvent(slug: string): ConEvent | undefined {
  return getEvents().find((event) => event.slug === slug);
}

export function getEditionsForEvent(eventSlug: string): VillageEdition[] {
  return getEditions()
    .filter((edition) => edition.eventSlug === eventSlug)
    .sort((a, b) => a.villageName.localeCompare(b.villageName));
}

export function getEdition(
  eventSlug: string,
  villageSlug: string,
): VillageEdition | undefined {
  return getEditions().find(
    (edition) => edition.eventSlug === eventSlug && edition.villageSlug === villageSlug,
  );
}

/** Villages grouped across years: one "Recon Village", however many events it ran at. */
export const getVillageSeries = memo((): VillageSeries[] => {
  const bySlug = new Map<string, VillageEdition[]>();
  for (const edition of getEditions()) {
    const list = bySlug.get(edition.villageSlug) ?? [];
    list.push(edition);
    bySlug.set(edition.villageSlug, list);
  }

  return [...bySlug.entries()]
    .map(([slug, editions]) => {
      const sorted = editions.slice().sort((a, b) => b.year - a.year);
      const latest = sorted[0];
      return {
        slug,
        name: latest.villageName,
        description: latest.description,
        editions: sorted,
        talkCount: sorted.reduce((total, edition) => total + edition.talkCount, 0),
        years: sorted.map((edition) => edition.year),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

export function getSeries(slug: string): VillageSeries | undefined {
  return getVillageSeries().find((series) => series.slug === slug);
}

export function getTalksForEdition(editionId: string): Talk[] {
  return getTalks().filter((talk) => talk.villageId === editionId);
}

export function getTalksForSeries(villageSlug: string): Talk[] {
  return getTalks().filter((talk) => talk.villageSlug === villageSlug);
}

export function getTalkBySlug(slug: string): Talk | undefined {
  return getTalks().find((talk) => talk.slug === slug);
}

export function getTrack(slug: string): Track | undefined {
  return getTracks().find((track) => track.slug === slug);
}

/** Tracks that actually have talks, with counts — never the full vocabulary. */
export const getTrackCounts = memo((): { track: Track; count: number }[] => {
  const counts = new Map<string, number>();
  for (const talk of getTalks()) {
    counts.set(talk.track, (counts.get(talk.track) ?? 0) + 1);
  }
  return getTracks()
    .filter((track) => counts.has(track.slug))
    .map((track) => ({ track, count: counts.get(track.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.track.name.localeCompare(b.track.name));
});

export const getTopicCounts = memo((): { topic: string; label: string; count: number }[] => {
  const labels = getTaxonomy().topicLabels;
  const counts = new Map<string, number>();
  for (const talk of getTalks()) {
    for (const topic of talk.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, label: labels[topic] ?? topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
});

export function getTalksForTopic(topic: string): Talk[] {
  return getTalks().filter((talk) => talk.topics.includes(topic));
}

export function getTalksForTrack(track: string): Talk[] {
  return getTalks().filter((talk) => talk.track === track);
}

/**
 * The speaker index, derived from `talk.speakers` — data/ stores names only,
 * so there is no speaker file to keep in sync. Names that slugify to nothing
 * are dropped rather than given an unreachable page.
 */
export const getSpeakers = memo((): Speaker[] => {
  type Draft = { slug: string; spellings: Map<string, number>; talkCount: number };
  const bySlug = new Map<string, Draft>();

  for (const talk of getTalks()) {
    for (const name of talk.speakers) {
      const slug = slugifySpeaker(name);
      if (!slug) continue;
      const record = bySlug.get(slug) ?? { slug, spellings: new Map(), talkCount: 0 };
      record.spellings.set(name, (record.spellings.get(name) ?? 0) + 1);
      record.talkCount += 1;
      bySlug.set(slug, record);
    }
  }

  return [...bySlug.values()]
    .map(({ slug, spellings, talkCount }) => ({
      slug,
      // Most-used spelling wins; ties break alphabetically so it is stable.
      name: [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      talkCount,
    }))
    .sort((a, b) => b.talkCount - a.talkCount || a.name.localeCompare(b.name));
});

export function getSpeaker(slug: string): Speaker | undefined {
  return getSpeakers().find((speaker) => speaker.slug === slug);
}

export function getTalksForSpeaker(slug: string): Talk[] {
  return getTalks().filter((talk) =>
    talk.speakers.some((name) => slugifySpeaker(name) === slug),
  );
}

export const getStats = memo((): ArchiveStats => {
  const talks = getTalks();
  return {
    talks: talks.length,
    villages: getVillageSeries().length,
    events: getEvents().length,
    tracks: getTrackCounts().length,
    topics: getTopicCounts().length,
    speakers: getSpeakers().length,
  };
});

/** Slim, client-safe records for the browser UI. */
export function getTalkIndex(talks: Talk[] = getTalks()): TalkIndexEntry[] {
  return talks.map(buildIndexEntry);
}

export function getEditionPath(edition: VillageEdition): string {
  return `/${edition.eventSlug}/${edition.villageSlug}`;
}

export function getTalkPath(talk: { slug: string }): string {
  return `/talks/${talk.slug}`;
}
