import Link from "next/link";

const NAV = [
  { href: "/", label: "All talks" },
  { href: "/villages", label: "Villages" },
  { href: "/tracks", label: "Tracks" },
  { href: "/topics", label: "Topics" },
  { href: "/speakers", label: "Speakers" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-acid/20 bg-void/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-baseline gap-2">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-display text-base font-bold tracking-[0.14em] text-acid group-hover:text-cyan sm:text-lg">
              DEF CON TALKS
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-mint/40 sm:inline">
              archive
            </span>
          </Link>
          {/* Sits outside the home link: it is a disclaimer, not navigation. */}
          <span className="rounded-sm border border-warn/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-warn/75">
            Unofficial
          </span>
        </div>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-mint/80"
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cyan">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
