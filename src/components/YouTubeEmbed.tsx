"use client";
import { useState } from "react";

export default function YouTubeEmbed({ videoId, title = "Highlight video" }: { videoId: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
      />
    );
  }
  return (
    <button onClick={() => setPlaying(true)} aria-label={`Play ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg border border-steel-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={title} className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-steel-950/40 group-hover:bg-steel-950/20">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 font-display text-xl text-steel-950">▶</span>
      </span>
    </button>
  );
}
