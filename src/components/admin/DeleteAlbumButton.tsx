"use client";
import { useTransition } from "react";
import { deleteAlbum } from "@/app/admin/actions";

export default function DeleteAlbumButton({ albumId, title, photoCount }: { albumId: string; title: string; photoCount: number }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const confirmed = window.confirm(`Delete "${title}" and its ${photoCount} photo${photoCount === 1 ? "" : "s"}? This can't be undone.`);
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("id", albumId);
    startTransition(async () => {
      await deleteAlbum(formData);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`min-h-11 rounded border border-steel-700 px-3 text-sm text-steel-400 hover:border-red-500 hover:text-red-400 ${isPending ? "molten-pending" : ""}`}>
      {isPending ? "Deleting…" : "Delete album"}
    </button>
  );
}
