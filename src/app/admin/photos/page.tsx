import Image from "next/image";
import { requireAdmin } from "@/lib/supabase/server";
import type { Album, Game, Photo } from "@/lib/types";
import { photoUrl } from "@/lib/queries";
import { deletePhoto } from "@/app/admin/actions";
import AlbumForm from "@/components/admin/AlbumForm";
import PhotoUploader from "@/components/admin/PhotoUploader";
import { Card } from "@/components/ui";

export default async function AdminPhotos() {
  const { supabase } = await requireAdmin();
  const [{ data: albums }, { data: games }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").order("created_at", { ascending: false }),
    supabase.from("games").select("*").order("starts_at", { ascending: false }),
    supabase.from("photos").select("*"),
  ]);
  const photosByAlbum = new Map<string, Photo[]>();
  ((photos ?? []) as Photo[]).forEach((p) => {
    photosByAlbum.set(p.album_id, [...(photosByAlbum.get(p.album_id) ?? []), p]);
  });
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">New album</h2><AlbumForm games={(games ?? []) as Game[]} /></Card>
      {((albums ?? []) as Album[]).map((a) => (
        <Card key={a.id}>
          <h3 className="mb-3 font-display text-sm text-steel-400">{a.title}</h3>
          <PhotoUploader albumId={a.id} />
          <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-6">
            {(photosByAlbum.get(a.id) ?? []).map((p) => (
              <form key={p.id} action={deletePhoto} className="relative aspect-square">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="storage_path" value={p.storage_path} />
                <Image src={photoUrl(p.storage_path)} alt="" fill sizes="20vw" className="rounded object-cover" />
                <button className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-steel-950/80 text-xs text-steel-100" aria-label="Delete photo">✕</button>
              </form>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
