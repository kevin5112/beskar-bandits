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
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Game details</h2><GameForm game={game as Game} /></Card>
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Box score</h2>
        <BoxScoreForm gameId={id} players={(players ?? []) as Player[]} lines={(lines ?? []) as StatLine[]}
          ourScore={(game as Game).our_score} theirScore={(game as Game).their_score} />
      </Card>
    </div>
  );
}
