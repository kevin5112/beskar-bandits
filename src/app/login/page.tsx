"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/admin/SignOutButton";

function LoginForm() {
  const router = useRouter();
  const denied = useSearchParams().get("denied");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/admin");
      });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider">Sign in</h1>
      {denied && (
        <div className="space-y-2 rounded border border-gold-500 bg-steel-900 p-3">
          <p className="text-sm">That account isn&apos;t an admin yet.</p>
          <SignOutButton />
        </div>
      )}
      {error && <p className="rounded border border-error-500 bg-steel-900 p-3 text-sm text-error-400">{error}</p>}
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        className="min-h-11 w-full rounded border border-steel-700 bg-steel-900 px-3 text-steel-100" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
        className="min-h-11 w-full rounded border border-steel-700 bg-steel-900 px-3 text-steel-100" />
      <button disabled={busy} className={`min-h-11 w-full rounded bg-gold-500 font-display font-bold uppercase tracking-wider text-steel-950 transition active:translate-y-px disabled:opacity-50 ${busy ? "molten-pending" : ""}`}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
