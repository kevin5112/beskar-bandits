import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import type { Game, Player, StatLine } from "@/lib/types";
import GameForm from "@/components/admin/GameForm";
import BoxScoreForm from "@/components/admin/BoxScoreForm";
import { Card } from "@/components/ui";

export default async function AdminGameDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: game }, { data: players }, { data: lines }] = await Promise.all([
    supabase.from("games").select("*").eq("id", id).maybeSingle(),
    supabase.from("players").select("*").eq("active", true).order("jersey_number"),
    supabase.from("stat_lines").select("*").eq("game_id", id),
  ]);
  if (!game) notFound();

  const activePlayers = (players ?? []) as Player[];
  const statLines = (lines ?? []) as StatLine[];
  const activeIds = new Set(activePlayers.map((p) => p.id));
  const missingIds = [...new Set(statLines.map((l) => l.player_id).filter((pid) => !activeIds.has(pid)))];
  const { data: inactivePlayers } = missingIds.length
    ? await supabase.from("players").select("*").in("id", missingIds)
    : { data: [] as Player[] };

  const byId = new Map([...activePlayers, ...((inactivePlayers ?? []) as Player[])].map((p) => [p.id, p]));
  const boxScorePlayers = [...byId.values()].sort((a, b) => {
    if (a.jersey_number === null) return b.jersey_number === null ? 0 : 1;
    if (b.jersey_number === null) return -1;
    return a.jersey_number - b.jersey_number;
  });

  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Game details</h2><GameForm game={game as Game} /></Card>
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Box score</h2>
        <BoxScoreForm gameId={id} players={boxScorePlayers} lines={statLines}
          ourScore={(game as Game).our_score} theirScore={(game as Game).their_score} />
      </Card>
    </div>
  );
}
