"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function ToastInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const label = params.get("saved") ? "Saved" : params.get("deleted") ? "Deleted" : null;
    if (!label) return;
    setMsg(label);
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex justify-center md:bottom-6" style={{ animation: "toast-in 200ms ease-out" }}>
      <div className="overflow-hidden rounded border-l-2 border-gold-500 bg-steel-800 shadow-lg">
        <p className="px-4 py-2 font-display text-sm font-bold uppercase tracking-widest text-gold-400">{msg}</p>
        <div className="h-0.5 bg-gold-500" style={{ animation: "toast-drain 3500ms linear forwards" }} />
      </div>
    </div>
  );
}

export default function ActionToast() {
  return (
    <Suspense>
      <ToastInner />
    </Suspense>
  );
}
