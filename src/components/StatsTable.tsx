"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { battingAvg, type SeasonStatRow } from "@/lib/stats";

const cols = [
  ["games", "G"], ["ab", "AB"], ["r", "R"], ["h", "H"], ["doubles", "2B"], ["triples", "3B"],
  ["hr", "HR"], ["rbi", "RBI"], ["bb", "BB"], ["k", "K"], ["avg", "AVG"],
] as const;
type SortKey = (typeof cols)[number][0];

export default function StatsTable({ rows }: { rows: SeasonStatRow[] }) {
  const [sort, setSort] = useState<SortKey>("avg");
  const sorted = useMemo(
    () => [...rows].sort((a, b) => ((b[sort] ?? -1) as number) - ((a[sort] ?? -1) as number)),
    [rows, sort]
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
          <tr>
            <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>
            {cols.map(([key, label]) => (
              <th key={key} className="px-1 py-1 text-right">
                <button onClick={() => setSort(key)}
                  className={`min-h-11 min-w-9 px-1 ${sort === key ? "text-gold-400" : ""}`}>
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-700">
          {sorted.map((r) => (
            <tr key={r.player_id}>
              <td className="sticky left-0 bg-steel-900 px-3 py-2">
                <Link href={`/roster/${r.player_id}`} className="hover:text-gold-400">
                  <span className="text-steel-400">{r.jersey_number ?? "–"}</span> {r.player_name}
                </Link>
              </td>
              {[r.games, r.ab, r.r, r.h, r.doubles, r.triples, r.hr, r.rbi, r.bb, r.k].map((v, i) => (
                <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
              ))}
              <td className="px-2 py-2 text-right font-medium tabular-nums text-gold-400">{battingAvg(r.h, r.ab)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
