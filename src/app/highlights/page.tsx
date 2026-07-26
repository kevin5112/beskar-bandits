import { getGamesWithVideos, getSetting } from "@/lib/queries";
import { EmptyState, PageTitle, Section } from "@/components/ui";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { formatGameDay } from "@/lib/format";
import PreLaunchOverlay from "@/components/PreLaunchOverlay";

export const revalidate = 60;

export const metadata = { title: "Highlights" };

export default async function HighlightsPage() {
  const [games, prelaunch] = await Promise.all([getGamesWithVideos(), getSetting("prelaunch_mode", false)]);
  return (
    <div className="pb-10">
      {prelaunch && <PreLaunchOverlay />}
      <PageTitle>Highlights</PageTitle>
      {games.length ? games.map((g) => (
        <Section key={g.id} title={`${g.home_away === "home" ? "vs" : "@"} ${g.opponent} · ${formatGameDay(g.starts_at)}`}>
          <div className="grid gap-4 md:grid-cols-2">
            {g.youtube_video_ids.map((v) => <YouTubeEmbed key={v} videoId={v} />)}
          </div>
        </Section>
      )) : <div className="mt-4"><EmptyState message="No highlight videos yet. Upload clips to YouTube and attach them to a game in the admin." /></div>}
    </div>
  );
}
