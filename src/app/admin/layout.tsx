import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const links = [["/admin/games", "Games"], ["/admin/players", "Players"], ["/admin/news", "News"], ["/admin/photos", "Photos"]] as const;
  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold uppercase tracking-wider text-gold-400">Admin</h1>
        <SignOutButton />
      </div>
      <nav className="mt-3 flex gap-4 overflow-x-auto border-b border-steel-700 pb-2">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="min-h-11 whitespace-nowrap py-2 text-sm text-steel-400 hover:text-gold-400">{label}</Link>
        ))}
      </nav>
      <div className="mt-4">{children}</div>
    </div>
  );
}
