import { battingAvg } from "@/lib/stats";
import type { StatLine } from "@/lib/types";

type Line = StatLine & { player: { id: string; name: string; jersey_number: number | null } };
const cols = ["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG"] as const;

export default function BoxScoreTable({ lines }: { lines: Line[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
          <tr>
            <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>
            {cols.map((c) => <th key={c} className="px-2 py-2 text-right">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-700">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="sticky left-0 bg-steel-900 px-3 py-2">
                <span className="text-steel-400">{l.player.jersey_number ?? "–"}</span> {l.player.name}
              </td>
              {[l.ab, l.r, l.h, l.doubles, l.triples, l.hr, l.rbi, l.bb, l.k].map((v, i) => (
                <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
              ))}
              <td className="px-2 py-2 text-right tabular-nums">{battingAvg(l.h, l.ab)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
