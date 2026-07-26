import type { Player, StatLine } from "@/lib/types";
import { saveBoxScore } from "@/app/admin/actions";
import { btnCls, labelCls } from "./PlayerForm";

const fields = ["ab", "r", "h", "doubles", "triples", "hr", "rbi", "bb", "k"] as const;
const headers = ["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K"];

export default function BoxScoreForm({ gameId, players, lines, ourScore, theirScore }: {
  gameId: string; players: Player[]; lines: StatLine[]; ourScore: number | null; theirScore: number | null;
}) {
  const byPlayer = new Map(lines.map((l) => [l.player_id, l]));
  const cell = "h-11 w-11 rounded border border-steel-700 bg-steel-950 text-center text-steel-100";
  return (
    <form action={saveBoxScore}>
      <input type="hidden" name="game_id" value={gameId} />
      <div className="flex gap-3">
        <div><label className={labelCls}>Our score</label><input name="our_score" type="number" inputMode="numeric" defaultValue={ourScore ?? ""} className={cell + " w-16"} /></div>
        <div><label className={labelCls}>Their score</label><input name="their_score" type="number" inputMode="numeric" defaultValue={theirScore ?? ""} className={cell + " w-16"} /></div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
        <table className="text-sm">
          <thead className="bg-steel-800 font-display text-xs uppercase text-steel-400">
            <tr><th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>{headers.map((h) => <th key={h} className="px-1 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-steel-700">
            {players.map((p) => {
              const line = byPlayer.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="sticky left-0 bg-steel-900 px-3 py-1 whitespace-nowrap">
                    <input type="hidden" name="player_id" value={p.id} />
                    <span className="text-steel-400">{p.jersey_number ?? "–"}</span> {p.name}
                  </td>
                  {fields.map((f) => (
                    <td key={f} className="px-1 py-1">
                      <input name={`stat_${p.id}_${f}`} type="number" inputMode="numeric" min={0}
                        defaultValue={line ? String(line[f]) : ""} className={cell} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-steel-400">Leave a player's whole row blank if they didn't play. Filling any score marks the game Final.</p>
      <button className={btnCls + " mt-3"}>Save box score</button>
    </form>
  );
}
