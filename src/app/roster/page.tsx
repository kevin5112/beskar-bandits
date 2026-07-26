import Image from "next/image";
import Link from "next/link";
import { getRoster, getSetting } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import PreLaunchSplash from "@/components/PreLaunchSplash";

export const revalidate = 60;

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  if (await getSetting("prelaunch_mode", false)) return <PreLaunchSplash />;

  const players = await getRoster();
  return (
    <div className="pb-10">
      <PageTitle>Roster</PageTitle>
      {players.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {players.map((p) => (
            <Link key={p.id} href={`/roster/${p.id}`}>
              <Card className="text-center hover:border-gold-500">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-steel-700 bg-steel-800">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-2xl font-bold text-steel-400">
                      {p.jersey_number ?? "?"}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate font-medium">{p.name}</p>
                <p className="text-xs text-steel-400">#{p.jersey_number ?? "–"} · {p.positions.join("/") || "UT"}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : <div className="mt-4"><EmptyState message="Roster coming soon." /></div>}
    </div>
  );
}
