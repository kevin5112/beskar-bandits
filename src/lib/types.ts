export interface Player { id: string; name: string; jersey_number: number | null; positions: string[]; photo_url: string | null; bio: string | null; walkup_song: string | null; active: boolean; }
export interface Game { id: string; opponent: string; starts_at: string; location: string; home_away: "home" | "away"; our_score: number | null; their_score: number | null; status: "upcoming" | "final" | "canceled"; youtube_video_ids: string[]; }
export interface StatLine { id: string; game_id: string; player_id: string; ab: number; r: number; h: number; doubles: number; triples: number; hr: number; rbi: number; bb: number; k: number; }
export interface NewsPost { id: string; title: string; body: string; published_at: string; slug: string; }
export interface Album { id: string; title: string; game_id: string | null; created_at: string; }
export interface Photo { id: string; album_id: string; storage_path: string; caption: string | null; created_at: string; }
