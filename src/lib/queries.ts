import { publicClient } from "@/lib/supabase/public";
import type { Album, Game, NewsPost, Photo, Player, StatLine } from "@/lib/types";
import type { StatLineInput } from "@/lib/stats";

export function photoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${storagePath}`;
}

function db() { return publicClient(); }

export async function getGames(): Promise<Game[]> {
  const { data, error } = await db().from("games").select("*").order("starts_at");
  if (error) throw error;
  return data;
}

export async function getNextGame(): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*")
    .eq("status", "upcoming").gt("starts_at", new Date().toISOString())
    .order("starts_at").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLatestFinal(): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*")
    .eq("status", "final").order("starts_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGame(id: string): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGameStatLines(gameId: string) {
  const { data, error } = await db().from("stat_lines")
    .select("*, player:players(id, name, jersey_number)")
    .eq("game_id", gameId);
  if (error) throw error;
  return (data as unknown as (StatLine & { player: Pick<Player, "id" | "name" | "jersey_number"> })[])
    .sort((a, b) => (a.player.jersey_number ?? 999) - (b.player.jersey_number ?? 999));
}

export async function getSeasonStatLineInputs(): Promise<StatLineInput[]> {
  const { data, error } = await db().from("stat_lines")
    .select("ab, r, h, doubles, triples, hr, rbi, bb, k, player:players(id, name, jersey_number)");
  if (error) throw error;
  return (data as unknown as ({ player: { id: string; name: string; jersey_number: number | null } } & Omit<StatLineInput, "player_id" | "player_name" | "jersey_number">)[])
    .map(({ player, ...totals }) => ({ ...totals, player_id: player.id, player_name: player.name, jersey_number: player.jersey_number }));
}

export async function getRoster(): Promise<Player[]> {
  const { data, error } = await db().from("players").select("*")
    .eq("active", true).order("jersey_number", { nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getPlayer(id: string): Promise<Player | null> {
  const { data, error } = await db().from("players").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerGameLog(playerId: string) {
  const { data, error } = await db().from("stat_lines")
    .select("*, game:games(id, opponent, starts_at, status)")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data as unknown as (StatLine & { game: Pick<Game, "id" | "opponent" | "starts_at" | "status"> })[])
    .filter((l) => l.game.status === "final")
    .sort((a, b) => b.game.starts_at.localeCompare(a.game.starts_at));
}

export async function getNewsPosts(limit?: number): Promise<NewsPost[]> {
  let q = db().from("news_posts").select("*").order("published_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const { data, error } = await db().from("news_posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAlbums() {
  const { data, error } = await db().from("albums")
    .select("*, photos(count)").order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as (Album & { photos: { count: number }[] })[];
}

export async function getAlbum(id: string) {
  const { data, error } = await db().from("albums")
    .select("*, photos(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as (Album & { photos: Photo[] }) | null;
}

export async function getRecentPhotos(limit: number): Promise<Photo[]> {
  const { data, error } = await db().from("photos").select("*")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function getGamesWithVideos(): Promise<Game[]> {
  const games = await getGames();
  return games.filter((g) => g.youtube_video_ids.length > 0);
}

export async function getAlbumForGame(gameId: string): Promise<Album | null> {
  const { data, error } = await db().from("albums").select("*").eq("game_id", gameId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSetting(key: string, fallback: boolean): Promise<boolean> {
  // Missing table must never take down the home page — return fallback on any error
  const { data, error } = await db().from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error) return fallback;
  return data?.value ?? fallback;
}
