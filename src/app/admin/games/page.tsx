import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import type { Game } from "@/lib/types";
import GameForm from "@/components/admin/GameForm";
import { Card } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export default async function AdminGames() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("games").select("*").order("starts_at", { ascending: false });
  const games = (data ?? []) as Game[];
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Add game</h2><GameForm /></Card>
      <Card className="divide-y divide-steel-700 p-0">
        {games.map((g) => (
          <Link key={g.id} href={`/admin/games/${g.id}`} className="flex min-h-12 items-center justify-between px-4 py-2 hover:bg-steel-800/50">
            <span>{formatGameDay(g.starts_at)} · {g.home_away === "home" ? "vs" : "@"} {g.opponent}</span>
            <span className="text-sm text-steel-400">{g.status === "final" ? (g.our_score === null || g.their_score === null ? "—" : `${g.our_score}–${g.their_score}`) : g.status} · edit →</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
