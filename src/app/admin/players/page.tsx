import { requireAdmin } from "@/lib/supabase/server";
import type { Player } from "@/lib/types";
import PlayerForm from "@/components/admin/PlayerForm";
import { Card } from "@/components/ui";

export default async function AdminPlayers() {
  const { supabase } = await requireAdmin();
  const { data: players } = await supabase.from("players").select("*").order("jersey_number");
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Add player</h2><PlayerForm /></Card>
      {(players as Player[] | null)?.map((p) => (
        <Card key={p.id}><h3 className="mb-3 font-display text-sm text-steel-400">#{p.jersey_number ?? "–"} {p.name}{p.active ? "" : " (inactive)"}</h3><PlayerForm player={p} /></Card>
      ))}
    </div>
  );
}
