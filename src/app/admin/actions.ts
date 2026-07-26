"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { easternToIso } from "@/lib/format";
import { parseYouTubeId } from "@/lib/youtube";

const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";
const intOrNull = (fd: FormData, k: string) => { const v = str(fd, k); return v === "" ? null : Number(v); };

export async function savePlayer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const row = {
    name: str(formData, "name"),
    jersey_number: intOrNull(formData, "jersey_number"),
    positions: str(formData, "positions").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    bio: str(formData, "bio") || null,
    walkup_song: str(formData, "walkup_song") || null,
    active: formData.get("active") === "on",
  };
  const { error } = id
    ? await supabase.from("players").update(row).eq("id", id)
    : await supabase.from("players").insert(row);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/players");
}

export async function saveGame(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const row = {
    opponent: str(formData, "opponent"),
    starts_at: easternToIso(str(formData, "date"), str(formData, "time")),
    location: str(formData, "location"),
    home_away: str(formData, "home_away"),
    status: str(formData, "status"),
    our_score: intOrNull(formData, "our_score"),
    their_score: intOrNull(formData, "their_score"),
    youtube_video_ids: str(formData, "youtube_urls").split("\n").map((l) => parseYouTubeId(l)).filter((v): v is string => v !== null),
  };
  const { error } = id
    ? await supabase.from("games").update(row).eq("id", id)
    : await supabase.from("games").insert(row);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/games");
}

export async function saveBoxScore(formData: FormData) {
  const { supabase } = await requireAdmin();
  const gameId = str(formData, "game_id");
  const playerIds = formData.getAll("player_id") as string[];
  const fields = ["ab", "r", "h", "doubles", "triples", "hr", "rbi", "bb", "k"] as const;

  const upserts = [];
  const clears = [];
  for (const pid of playerIds) {
    const values = fields.map((f) => str(formData, `stat_${pid}_${f}`));
    if (values.every((v) => v === "")) { clears.push(pid); continue; }
    upserts.push({
      game_id: gameId, player_id: pid,
      ...Object.fromEntries(fields.map((f, i) => [f, values[i] === "" ? 0 : Number(values[i])])),
    });
  }
  if (upserts.length) {
    const { error } = await supabase.from("stat_lines").upsert(upserts, { onConflict: "game_id,player_id" });
    if (error) throw error;
  }
  if (clears.length) {
    const { error } = await supabase.from("stat_lines").delete().eq("game_id", gameId).in("player_id", clears);
    if (error) throw error;
  }
  const our = intOrNull(formData, "our_score"), their = intOrNull(formData, "their_score");
  if (our !== null && their !== null) {
    const { error } = await supabase.from("games").update({ our_score: our, their_score: their, status: "final" }).eq("id", gameId);
    if (error) throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/admin/games/${gameId}`);
}
