import { requireAdmin } from "@/lib/supabase/server";
import type { Player, Profile } from "@/lib/types";
import PlayerForm from "@/components/admin/PlayerForm";
import AccountsPanel from "@/components/admin/AccountsPanel";
import { Card } from "@/components/ui";

export default async function AdminPlayers() {
  const { supabase, user } = await requireAdmin();
  const { data: players } = await supabase.from("players").select("*").order("jersey_number");
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, role").order("display_name");

  const playerList = (players ?? []) as Player[];
  const profileList = (profiles ?? []) as Pick<Profile, "id" | "display_name" | "role">[];
  const linkableProfiles = profileList.map((p) => ({
    id: p.id,
    display_name: p.display_name,
    linkedPlayerId: playerList.find((pl) => pl.profile_id === p.id)?.id ?? null,
  }));

  return (
    <div className="space-y-6">
      <AccountsPanel profiles={profileList} selfId={user.id} players={playerList} />
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Add player</h2><PlayerForm /></Card>
      {playerList.map((p) => (
        <Card key={p.id}><h3 className="mb-3 font-display text-sm text-steel-400">#{p.jersey_number ?? "–"} {p.name}{p.active ? "" : " (inactive)"}</h3><PlayerForm player={p} profiles={linkableProfiles} /></Card>
      ))}
    </div>
  );
}
