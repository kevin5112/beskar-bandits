export default function PreLaunchSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-steel-950 px-6 text-center">
      <p className="font-display text-xs uppercase tracking-[0.4em] text-steel-400">
        Coed Softball · Cast Member League
      </p>
      <h1 className="font-display text-5xl font-bold uppercase leading-tight tracking-widest text-gold-400 md:text-7xl">
        Beskar<br />Bandits
      </h1>
      <div className="h-px w-24 bg-steel-700" />
      <p className="max-w-sm text-steel-100">
        The forge is hot. Scores, stats, and highlights are on the way.
      </p>
      <p className="font-display text-sm uppercase tracking-[0.3em] text-gold-400">
        Season site dropping soon
      </p>
    </div>
  );
}
