import Link from "next/link";
import { formatGameDay, formatGameTime } from "@/lib/format";
import type { Game } from "@/lib/types";

export function ResultBadge({ game }: { game: Game }) {
  if (game.status !== "final" || game.our_score === null || game.their_score === null) return null;
  const res = game.our_score > game.their_score ? "W" : game.our_score < game.their_score ? "L" : "T";
  const color = res === "W" ? "text-gold-400 border-gold-500" : "text-steel-400 border-steel-700";
  return <span className={`rounded border px-1.5 py-0.5 font-display text-xs font-bold ${color}`}>{res}</span>;
}

export default function GameScoreLine({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="flex min-h-14 items-center justify-between gap-3 px-1 py-2 hover:bg-steel-800/50">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {game.home_away === "home" ? "vs" : "@"} {game.opponent}
          {game.status === "canceled" && <span className="ml-2 text-xs uppercase text-steel-400">Canceled</span>}
        </p>
        <p className="text-xs text-steel-400">{formatGameDay(game.starts_at)} · {formatGameTime(game.starts_at)} · {game.location}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {game.status === "final" && game.our_score !== null && game.their_score !== null && (
          <span className="font-display text-lg font-bold">{game.our_score}–{game.their_score}</span>
        )}
        <ResultBadge game={game} />
      </div>
    </Link>
  );
}
