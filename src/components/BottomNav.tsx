"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/", "Home"], ["/schedule", "Sched"], ["/stats", "Stats"], ["/photos", "Photos"], ["/more", "More"],
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-steel-700 bg-steel-900 pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map(([href, label]) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex min-h-14 flex-col items-center justify-center text-xs font-display uppercase tracking-wide ${active ? "text-gold-400" : "text-steel-400"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
