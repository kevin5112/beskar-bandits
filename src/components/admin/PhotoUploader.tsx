"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export default function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const supabase = createClient();
    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      try {
        const compressed = await imageCompression(files[i], { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true });
        const path = `${albumId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) { setStatus(`Upload failed: ${upErr.message}`); return; }
        const { error: dbErr } = await supabase.from("photos").insert({ album_id: albumId, storage_path: path });
        if (dbErr) { setStatus(`Save failed: ${dbErr.message}`); return; }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(`Failed on photo ${i + 1} of ${files.length}: ${message}`);
        return;
      }
    }
    setStatus("Done!");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)}
        className="block w-full text-sm text-steel-400 file:mr-3 file:min-h-11 file:rounded file:border-0 file:bg-gold-500 file:px-4 file:font-display file:font-bold file:uppercase file:text-steel-950" />
      {status && <p className="mt-2 text-xs text-steel-400">{status}</p>}
    </div>
  );
}
