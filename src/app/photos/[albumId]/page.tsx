import { notFound } from "next/navigation";
import { getAlbum, photoUrl, getSetting } from "@/lib/queries";
import { EmptyState, PageTitle } from "@/components/ui";
import PhotoGrid from "@/components/PhotoGrid";
import PreLaunchSplash from "@/components/PreLaunchSplash";

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  if (await getSetting("prelaunch_mode", false)) return <PreLaunchSplash />;

  const { albumId } = await params;
  const album = await getAlbum(albumId);
  if (!album) notFound();
  const photos = album.photos
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => ({ id: p.id, url: photoUrl(p.storage_path), caption: p.caption }));
  return (
    <div className="pb-10">
      <PageTitle>{album.title}</PageTitle>
      <div className="mt-4">
        {photos.length ? <PhotoGrid photos={photos} /> : <EmptyState message="This album is empty so far." />}
      </div>
    </div>
  );
}
