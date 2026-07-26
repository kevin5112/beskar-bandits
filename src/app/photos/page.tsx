import Link from "next/link";
import { getAlbums } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export const revalidate = 60;

export const metadata = { title: "Photos" };

export default async function PhotosPage() {
  const albums = await getAlbums();
  return (
    <div className="pb-10">
      <PageTitle>Photos</PageTitle>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {albums.length ? albums.map((a) => (
          <Link key={a.id} href={`/photos/${a.id}`}>
            <Card className="hover:border-gold-500">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs text-steel-400">{a.photos[0]?.count ?? 0} photos · {formatGameDay(a.created_at)}</p>
            </Card>
          </Link>
        )) : <EmptyState message="No albums yet — bring a phone to the next game." />}
      </div>
    </div>
  );
}
