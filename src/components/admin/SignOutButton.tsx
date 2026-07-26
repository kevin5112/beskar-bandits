"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}
      className="min-h-11 rounded border border-steel-700 px-3 text-sm text-steel-400 hover:text-gold-400">
      Sign out
    </button>
  );
}
