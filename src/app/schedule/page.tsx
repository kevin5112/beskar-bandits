import { getGames } from "@/lib/queries";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";
import GameScoreLine from "@/components/GameScoreLine";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const games = await getGames();
  const upcoming = games.filter((g) => g.status === "upcoming");
  const played = games.filter((g) => g.status !== "upcoming").reverse();

  if (!games.length) return (<div><PageTitle>Schedule</PageTitle><div className="mt-4"><EmptyState message="No games scheduled yet — season starts soon." /></div></div>);

  return (
    <div className="pb-10">
      <PageTitle>Schedule</PageTitle>
      <Section title="Upcoming">
        {upcoming.length ? (
          <Card className="divide-y divide-steel-700 p-0">{upcoming.map((g) => <GameScoreLine key={g.id} game={g} />)}</Card>
        ) : <EmptyState message="Nothing on the calendar." />}
      </Section>
      <Section title="Results">
        {played.length ? (
          <Card className="divide-y divide-steel-700 p-0">{played.map((g) => <GameScoreLine key={g.id} game={g} />)}</Card>
        ) : <EmptyState message="No games played yet." />}
      </Section>
    </div>
  );
}
