import type { Talk, TalkSummary } from "@/lib/types";

/**
 * Summaries arrive as one long string of blank-line-separated blocks. Short
 * blocks with no terminal punctuation are section headings in practice, so we
 * promote them instead of rendering a 4 KB wall of paragraphs.
 */
function isHeading(block: string): boolean {
  const text = block.trim();
  return text.length < 90 && text.split(/\s+/).length <= 12 && !/[.?!,;]$/.test(text);
}

const LEAD_IN = /^([A-Z][^:]{2,44}):\s+([\s\S]+)$/;

function ProseBlocks({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (isHeading(block)) {
          return (
            <h3
              key={index}
              className="pt-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cyan"
            >
              {block}
            </h3>
          );
        }
        const lead = block.match(LEAD_IN);
        if (lead) {
          return (
            <p key={index} className="text-[15px] leading-relaxed text-mint/90">
              <strong className="font-semibold text-acid">{lead[1]}: </strong>
              {lead[2]}
            </p>
          );
        }
        return (
          <p key={index} className="text-[15px] leading-relaxed text-mint/90">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function TalkSummaryPanel({ talk }: { talk: Talk }) {
  const summary = talk.summary;

  if (summary == null || summary === "") {
    return (
      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-acid">Summary</h2>
        <p className="mt-3 text-sm text-mint/50">
          No summary yet — watch the video above, or open it on YouTube.
        </p>
      </section>
    );
  }

  if (typeof summary === "string") {
    return (
      <section className="panel p-5 sm:p-6">
        <h2 className="mb-4 border-b border-acid/15 pb-2 font-display text-sm uppercase tracking-[0.2em] text-acid">
          Summary
        </h2>
        <ProseBlocks text={summary} />
      </section>
    );
  }

  const structured = summary as TalkSummary;
  const extras = Object.entries(structured).filter(
    ([key]) => !["overview", "bullets", "takeaways"].includes(key),
  );

  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="mb-4 border-b border-acid/15 pb-2 font-display text-sm uppercase tracking-[0.2em] text-acid">
        Summary
      </h2>
      {structured.overview ? <ProseBlocks text={structured.overview} /> : null}
      {Array.isArray(structured.bullets) && structured.bullets.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-mint/90">
          {structured.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {Array.isArray(structured.takeaways) && structured.takeaways.length > 0 ? (
        <>
          <h3 className="pt-5 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-cyan">
            Takeaways
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-mint/90">
            {structured.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {!structured.overview && !structured.bullets && !structured.takeaways && extras.length > 0 ? (
        <pre className="mt-4 overflow-x-auto text-xs text-mint/70">
          {JSON.stringify(structured, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
