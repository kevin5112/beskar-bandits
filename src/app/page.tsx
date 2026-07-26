import Image from "next/image";
import { getGames, getLatestFinal, getNewsPosts, getNextGame, getRecentPhotos, photoUrl } from "@/lib/queries";
import { computeTeamRecord } from "@/lib/stats";
import { formatGameDay, formatGameTime, formatRecord } from "@/lib/format";
import { Card, EmptyState, Section } from "@/components/ui";
import GameScoreLine from "@/components/GameScoreLine";
import Countdown from "@/components/Countdown";

export const revalidate = 60;

export default async function Home() {
  const [games, next, latest, news, photos] = await Promise.all([
    getGames(), getNextGame(), getLatestFinal(), getNewsPosts(3), getRecentPhotos(8),
  ]);
  const { w, l, t } = computeTeamRecord(games);

  return (
    <div className="pb-10">
      <div className="mt-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-steel-400">Coed Softball</p>
        <h1 className="mt-1 font-display text-4xl font-bold uppercase tracking-widest text-gold-400 md:text-5xl">Beskar Bandits</h1>
        <p className="mt-2 font-display text-sm uppercase tracking-widest text-steel-100">{formatRecord(w, l, t)} this season</p>
      </div>

      <Section title="Next Game" action={{ href: "/schedule", label: "Full schedule" }}>
        {next ? (
          <Card className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-lg font-medium">{next.home_away === "home" ? "vs" : "@"} {next.opponent}</p>
              <p className="text-sm text-steel-400">{formatGameDay(next.starts_at)} · {formatGameTime(next.starts_at)} · {next.location}</p>
            </div>
            <Countdown startsAt={next.starts_at} />
          </Card>
        ) : <EmptyState message="No games on the calendar — season starts soon." />}
      </Section>

      <Section title="Last Result" action={{ href: "/schedule", label: "All results" }}>
        {latest ? <Card className="p-0"><GameScoreLine game={latest} /></Card> : <EmptyState message="No results yet." />}
      </Section>

      <Section title="News" action={{ href: "/news", label: "All news" }}>
        {news.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {news.map((p) => (
              <Card key={p.id}>
                <a href={`/news/${p.slug}`} className="font-medium hover:text-gold-400">{p.title}</a>
                <p className="mt-1 text-xs text-steel-400">{formatGameDay(p.published_at)}</p>
              </Card>
            ))}
          </div>
        ) : <EmptyState message="No news yet. The front office is quiet." />}
      </Section>

      <Section title="Recent Photos" action={{ href: "/photos", label: "All photos" }}>
        {photos.length ? (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded">
                <Image src={photoUrl(p.storage_path)} alt={p.caption ?? "Team photo"} fill sizes="25vw" className="object-cover" />
              </div>
            ))}
          </div>
        ) : <EmptyState message="No photos yet — bring a phone to the next game." />}
      </Section>
    </div>
  );
}
