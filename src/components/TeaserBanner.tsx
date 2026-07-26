"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TeaserBanner() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready || hasSession) return null;

  return (
    <div className="mt-6 rounded-lg border border-gold-500/40 bg-steel-900 px-4 py-3 text-center">
      <p className="text-sm text-steel-100">
        Follow the Bandits all season — scores, stats, and highlights.{" "}
        <span className="font-display uppercase tracking-wider text-gold-400">More coming soon.</span>
      </p>
    </div>
  );
}
