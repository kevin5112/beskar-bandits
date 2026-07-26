"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mt-6 rounded-lg border border-error-500/50 bg-steel-900 p-6 text-center">
      <p className="font-display text-lg font-bold uppercase tracking-wider text-error-400">That didn&apos;t save</p>
      <p className="mt-2 text-sm text-steel-400">{error.message || "Something went wrong. Your change may not have been stored."}</p>
      <button onClick={reset} className="mt-4 min-h-11 rounded border border-steel-700 px-4 text-sm text-steel-100 transition hover:border-gold-500 active:translate-y-px">
        Try again
      </button>
    </div>
  );
}
