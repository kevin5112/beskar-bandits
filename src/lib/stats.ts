export interface StatTotals {
  ab: number; r: number; h: number; doubles: number; triples: number;
  hr: number; rbi: number; bb: number; k: number;
}
export interface StatLineInput extends StatTotals {
  player_id: string; player_name: string; jersey_number: number | null;
}
export interface SeasonStatRow extends StatTotals {
  player_id: string; player_name: string; jersey_number: number | null;
  games: number; avg: number | null;
}

export function battingAvg(h: number, ab: number): string {
  if (ab === 0) return "—";
  const avg = h / ab;
  const s = avg.toFixed(3);
  return avg < 1 ? s.replace(/^0/, "") : s;
}

export function computeSeasonStats(lines: StatLineInput[]): SeasonStatRow[] {
  const byPlayer = new Map<string, SeasonStatRow>();
  for (const l of lines) {
    const row = byPlayer.get(l.player_id) ?? {
      player_id: l.player_id, player_name: l.player_name, jersey_number: l.jersey_number,
      games: 0, avg: null, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0,
    };
    row.games += 1;
    row.ab += l.ab; row.r += l.r; row.h += l.h; row.doubles += l.doubles; row.triples += l.triples;
    row.hr += l.hr; row.rbi += l.rbi; row.bb += l.bb; row.k += l.k;
    byPlayer.set(l.player_id, row);
  }
  const rows = [...byPlayer.values()];
  for (const r of rows) r.avg = r.ab > 0 ? r.h / r.ab : null;
  rows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.h - a.h);
  return rows;
}

export function computeTeamRecord(games: { status: string; our_score: number | null; their_score: number | null }[]) {
  let w = 0, l = 0, t = 0;
  for (const g of games) {
    if (g.status !== "final" || g.our_score === null || g.their_score === null) continue;
    if (g.our_score > g.their_score) w += 1;
    else if (g.our_score < g.their_score) l += 1;
    else t += 1;
  }
  return { w, l, t };
}
