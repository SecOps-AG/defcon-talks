import Link from "next/link";
import type { TalkIndexEntry } from "@/lib/types";

const MAX_TOPICS = 3;

/**
 * Cards take a TalkIndexEntry, not a Talk — summaries never reach a list view.
 */
export function TalkCard({ talk }: { talk: TalkIndexEntry }) {
  const shown = talk.topics.slice(0, MAX_TOPICS);
  const overflow = talk.topics.length - shown.length;

  return (
    <article className="panel group flex h-full flex-col overflow-hidden transition hover:border-acid/50">
      <Link
        href={`/talks/${talk.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative block overflow-hidden bg-black"
      >
        <img
          src={`https://i.ytimg.com/vi/${talk.youtubeId}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover opacity-80 transition group-hover:opacity-100"
        />
        <span className="absolute right-2 top-2 rounded-sm border border-acid/40 bg-void/85 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-acid">
          {talk.eventShortName}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.16em]">
          <Link href={`/villages/${talk.villageSlug}`} className="text-cyan hover:text-acid">
            {talk.villageName}
          </Link>
          <span className="text-mint/25">/</span>
          <Link href={`/tracks/${talk.track}`} className="text-mag/90 hover:text-acid">
            {talk.trackName}
          </Link>
        </p>

        <h3 className="font-display text-base font-semibold leading-snug text-acid">
          <Link href={`/talks/${talk.slug}`} className="hover:text-cyan">
            {talk.title}
          </Link>
        </h3>

        {talk.speakers.length > 0 ? (
          <p className="text-xs text-mint/65">{talk.speakers.join(" · ")}</p>
        ) : null}

        {talk.teaser ? (
          <p className="text-sm leading-relaxed text-mint/85">{talk.teaser}</p>
        ) : null}

        {shown.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {shown.map((topic) => (
              <span key={topic} className="tag">
                {topic}
              </span>
            ))}
            {overflow > 0 ? <span className="tag border-transparent">+{overflow}</span> : null}
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </div>
    </article>
  );
}
