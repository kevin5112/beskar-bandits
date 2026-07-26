import { getGames, getSeasonStatLineInputs } from "@/lib/queries";
import { computeSeasonStats, computeTeamRecord } from "@/lib/stats";
import { formatRecord } from "@/lib/format";
import { EmptyState, PageTitle } from "@/components/ui";
import StatsTable from "@/components/StatsTable";

export const metadata = { title: "Stats" };

export default async function StatsPage() {
  const [inputs, games] = await Promise.all([getSeasonStatLineInputs(), getGames()]);
  const rows = computeSeasonStats(inputs);
  const { w, l, t } = computeTeamRecord(games);

  return (
    <div className="pb-10">
      <PageTitle>Season Stats</PageTitle>
      <p className="mt-1 font-display text-sm uppercase tracking-widest text-steel-400">Team record: {formatRecord(w, l, t)}</p>
      <div className="mt-4">
        {rows.length ? <StatsTable rows={rows} /> : <EmptyState message="Stats appear after the first box score is entered." />}
      </div>
      <p className="mt-2 text-xs text-steel-400">Tap a column to sort. AVG = H ÷ AB.</p>
    </div>
  );
}
