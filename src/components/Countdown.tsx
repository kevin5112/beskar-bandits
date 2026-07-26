"use client";
import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const d = Math.floor(msLeft / 86_400_000);
  const h = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return { d, h, m };
}

export default function Countdown({ startsAt }: { startsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const left = new Date(startsAt).getTime() - now;
  if (left <= 0) return <p className="font-display text-gold-400">Game time!</p>;
  const { d, h, m } = parts(left);
  return (
    <div className="flex gap-4">
      {[[d, "days"], [h, "hrs"], [m, "min"]].map(([v, label]) => (
        <div key={label as string} className="text-center">
          <p className="font-display text-3xl font-bold text-gold-400">{v}</p>
          <p className="text-xs uppercase tracking-wider text-steel-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
