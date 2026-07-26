import Link from "next/link";

const links = [
  ["/schedule", "Schedule"], ["/stats", "Stats"], ["/roster", "Roster"],
  ["/news", "News"], ["/photos", "Photos"], ["/highlights", "Highlights"],
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-700 bg-steel-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-widest text-gold-400 uppercase">
          Beskar Bandits
        </Link>
        <nav className="hidden gap-5 md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm text-steel-400 hover:text-gold-400">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
