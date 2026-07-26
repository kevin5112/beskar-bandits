"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PreLaunchSplash from "@/components/PreLaunchSplash";

export default function PreLaunchOverlay() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(!!session));
    return () => subscription.unsubscribe();
  }, []);

  if (hasSession !== true) return <PreLaunchSplash />;

  return (
    <div className="fixed inset-x-0 bottom-14 z-50 border-t border-gold-500/40 bg-steel-900 px-4 py-2 text-center md:bottom-0">
      <p className="text-xs text-steel-400">
        Pre-launch mode is on — visitors see the teaser. You&apos;re seeing the real site because you&apos;re signed in.
      </p>
    </div>
  );
}
