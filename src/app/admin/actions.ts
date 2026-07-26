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
    ...(formData.has("profile_id") ? { profile_id: str(formData, "profile_id") || null } : {}),
  };
  const { error } = id
    ? await supabase.from("players").update(row).eq("id", id)
    : await supabase.from("players").insert(row);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("That account is already linked to another player.");
    }
    throw error;
  }
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

export async function saveNewsPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = str(formData, "id");
  const title = str(formData, "title");
  let slug = (str(formData, "slug") || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (slug === "") slug = `post-${crypto.randomUUID().slice(0, 8)}`;
  const row = { title, slug, body: str(formData, "body"), author_profile_id: user.id };
  let { error } = id
    ? await supabase.from("news_posts").update(row).eq("id", id)
    : await supabase.from("news_posts").insert(row);
  if (error && (error as { code?: string }).code === "23505") {
    const retrySlug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
    const retryRow = { ...row, slug: retrySlug };
    ({ error } = id
      ? await supabase.from("news_posts").update(retryRow).eq("id", id)
      : await supabase.from("news_posts").insert(retryRow));
  }
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/news");
}

export async function saveAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const gameId = str(formData, "game_id");
  const { error } = await supabase.from("albums").insert({ title: str(formData, "title"), game_id: gameId || null });
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/photos");
}

export async function deleteAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data: photos, error: listError } = await supabase.from("photos").select("storage_path").eq("album_id", id);
  if (listError) throw listError;
  if (photos.length > 0) {
    const { error: storageError } = await supabase.storage.from("photos").remove(photos.map((p) => p.storage_path));
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function deletePhoto(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const path = str(formData, "storage_path");
  const { error: dbError } = await supabase.from("photos").delete().eq("id", id);
  if (dbError) throw dbError;
  const { error: storageError } = await supabase.storage.from("photos").remove([path]);
  if (storageError) console.error("Photo storage cleanup failed:", storageError);
  revalidatePath("/", "layout");
}

export async function setProfileRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const profileId = str(formData, "profile_id");
  const role = str(formData, "role");
  if (role !== "admin" && role !== "player") throw new Error("Invalid role.");
  if (profileId === user.id && role === "player") {
    throw new Error("You can't demote yourself — ask another admin.");
  }
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/players");
}

export async function refreshPublicContent() {
  await requireAdmin();
  revalidatePath("/", "layout");
}
