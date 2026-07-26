import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayerGameLog } from "@/lib/queries";
import { battingAvg, computeSeasonStats } from "@/lib/stats";
import { formatGameDay } from "@/lib/format";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();
  const log = await getPlayerGameLog(id);
  const season = computeSeasonStats(log.map((l) => ({
    player_id: id, player_name: player.name, jersey_number: player.jersey_number,
    ab: l.ab, r: l.r, h: l.h, doubles: l.doubles, triples: l.triples, hr: l.hr, rbi: l.rbi, bb: l.bb, k: l.k,
  })))[0];

  return (
    <div className="pb-10">
      <PageTitle>#{player.jersey_number ?? "–"} {player.name}</PageTitle>
      <p className="mt-1 text-sm text-steel-400">{player.positions.join(" / ") || "Utility"}</p>
      {player.bio && <p className="mt-2 text-sm">{player.bio}</p>}
      {player.walkup_song && <p className="mt-1 text-xs text-steel-400">Walk-up: {player.walkup_song}</p>}

      <Section title="Season">
        {season ? (
          <div className="grid grid-cols-4 gap-2 text-center md:grid-cols-8">
            {([["G", season.games], ["AB", season.ab], ["H", season.h], ["HR", season.hr], ["RBI", season.rbi], ["R", season.r], ["BB", season.bb], ["AVG", battingAvg(season.h, season.ab)]] as const).map(([k, v]) => (
              <Card key={k} className="p-2">
                <p className="font-display text-lg font-bold text-gold-400">{v}</p>
                <p className="text-[10px] uppercase tracking-wider text-steel-400">{k}</p>
              </Card>
            ))}
          </div>
        ) : <EmptyState message="No at-bats yet." />}
      </Section>

      <Section title="Game Log">
        {log.length ? (
          <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
                <tr>
                  <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Game</th>
                  {["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K"].map((c) => <th key={c} className="px-2 py-2 text-right">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700">
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="sticky left-0 bg-steel-900 px-3 py-2">
                      <Link href={`/games/${l.game.id}`} className="hover:text-gold-400">
                        {formatGameDay(l.game.starts_at)} · {l.game.opponent}
                      </Link>
                    </td>
                    {[l.ab, l.r, l.h, l.doubles, l.triples, l.hr, l.rbi, l.bb, l.k].map((v, i) => (
                      <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No games played yet." />}
      </Section>
    </div>
  );
}
