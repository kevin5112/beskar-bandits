"use client";
import { useState } from "react";
import Image from "next/image";

interface GridPhoto { id: string; url: string; caption: string | null }

export default function PhotoGrid({ photos }: { photos: GridPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 md:gap-2">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(i)} aria-label={p.caption ?? "View photo"}
            className="relative aspect-square overflow-hidden rounded">
            <Image src={p.url} alt={p.caption ?? "Team photo"} fill sizes="(max-width: 768px) 33vw, 25vw" className="object-cover" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-steel-950/95" onClick={() => setOpen(null)}>
          <div className="flex justify-between p-4">
            <button onClick={(e) => { e.stopPropagation(); setOpen(open > 0 ? open - 1 : photos.length - 1); }}
              className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">‹</button>
            <button onClick={() => setOpen(null)} className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">✕</button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(open < photos.length - 1 ? open + 1 : 0); }}
              className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">›</button>
          </div>
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[open].url} alt={photos[open].caption ?? "Team photo"} fill sizes="100vw" className="object-contain" />
          </div>
          {photos[open].caption && <p className="p-4 text-center text-sm text-steel-400">{photos[open].caption}</p>}
        </div>
      )}
    </>
  );
}
