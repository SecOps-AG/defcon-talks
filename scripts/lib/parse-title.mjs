/**
 * DEF CON upload titles are formatted by hand and drift, e.g.
 *   "DEF CON 33  Recon Village -  A Playbook for Integration Servers - Ryan Bonner, Guðmundur Karlsson"
 *   "DEF CON 33 Recon Village  - Mapping the Shadow War From Estonia to Ukraine -  Evgueni Erchov"
 *
 * This splits off the event/village prefix and the trailing speaker list. It is
 * best-effort scaffolding — the ingest runbook requires every result to be
 * checked against the video itself.
 */

const EVENT_PREFIX = /^def\s*con\s*\d*\s*/i;

function normalise(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

/** A trailing part is a speaker list only if it reads like names, not prose. */
function looksLikeSpeakers(part) {
  if (!part || part.length > 90) return false;
  if (/[:;?!]/.test(part)) return false;
  if (/\b(the|and|for|with|your|how|why|from|into|using|what)\b/i.test(part)) return false;
  const names = splitSpeakers(part);
  if (names.length === 0 || names.length > 6) return false;
  return names.every(
    (name) => name.split(" ").length <= 5 && /^[A-ZÀ-ÖØ-Þ0-9]/.test(name),
  );
}

export function splitSpeakers(value) {
  return normalise(value)
    .split(/\s*(?:,|&|\band\b|\/|\+)\s*/i)
    .map((name) => normalise(name))
    .filter(Boolean);
}

export function parseVideoTitle(rawTitle, villageName = "") {
  const title = normalise(rawTitle);
  const village = normalise(villageName);

  // Split on dashes that are used as separators (surrounded by space), not hyphens.
  let parts = title
    .split(/\s+[-–—]\s+/)
    .map(normalise)
    .filter(Boolean);

  // Strip the "DEF CON NN" / "DEF CON NN <Village>" prefix wherever it landed.
  parts = parts
    .map((part, index) => (index === 0 ? part.replace(EVENT_PREFIX, "").trim() : part))
    .filter(Boolean);

  if (village) {
    const villageLower = village.toLowerCase();
    parts = parts
      .map((part) => {
        const lower = part.toLowerCase();
        if (lower === villageLower) return "";
        if (lower.startsWith(`${villageLower} `)) return part.slice(village.length).trim();
        return part;
      })
      .filter(Boolean);
  }

  if (parts.length === 0) return { title, speakers: [], confident: false };

  if (parts.length >= 2) {
    const tail = parts[parts.length - 1];
    if (looksLikeSpeakers(tail)) {
      return {
        title: parts.slice(0, -1).join(" - "),
        speakers: splitSpeakers(tail),
        confident: true,
      };
    }
  }

  return { title: parts.join(" - "), speakers: [], confident: false };
}
