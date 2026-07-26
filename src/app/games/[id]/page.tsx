import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbumForGame, getGame, getGameStatLines, getSetting } from "@/lib/queries";
import { formatGameDay, formatGameTime } from "@/lib/format";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";
import { ResultBadge } from "@/components/GameScoreLine";
import BoxScoreTable from "@/components/BoxScoreTable";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PreLaunchSplash from "@/components/PreLaunchSplash";

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  if (await getSetting("prelaunch_mode", false)) return <PreLaunchSplash />;

  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();
  const [lines, album] = await Promise.all([getGameStatLines(id), getAlbumForGame(id)]);

  return (
    <div className="pb-10">
      <PageTitle>{game.home_away === "home" ? "vs" : "@"} {game.opponent}</PageTitle>
      <p className="mt-1 text-sm text-steel-400">{formatGameDay(game.starts_at)} · {formatGameTime(game.starts_at)} · {game.location}</p>

      <Card className="mt-4 flex items-center justify-center gap-4">
        {game.status === "final" && game.our_score !== null ? (
          <>
            <span className="font-display text-5xl font-bold text-gold-400">{game.our_score}</span>
            <span className="text-steel-400">–</span>
            <span className="font-display text-5xl font-bold">{game.their_score}</span>
            <ResultBadge game={game} />
          </>
        ) : game.status === "canceled" ? (
          <span className="font-display uppercase tracking-widest text-steel-400">Canceled</span>
        ) : (
          <span className="font-display uppercase tracking-widest text-steel-400">Upcoming</span>
        )}
      </Card>

      <Section title="Box Score">
        {lines.length ? <BoxScoreTable lines={lines} /> : <EmptyState message="Box score not entered yet." />}
      </Section>

      {game.youtube_video_ids.length > 0 && (
        <Section title="Highlights">
          <div className="grid gap-4 md:grid-cols-2">
            {game.youtube_video_ids.map((v) => <YouTubeEmbed key={v} videoId={v} />)}
          </div>
        </Section>
      )}

      {album && (
        <Section title="Photos">
          <Link href={`/photos/${album.id}`} className="text-sm text-gold-400 hover:underline">{album.title} →</Link>
        </Section>
      )}
    </div>
  );
}
