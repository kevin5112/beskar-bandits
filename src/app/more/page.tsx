import Link from "next/link";
import { getSetting } from "@/lib/queries";
import AdminLink from "@/components/AdminLink";
import PreLaunchOverlay from "@/components/PreLaunchOverlay";

const items = [
  ["/roster", "Roster"], ["/news", "News"], ["/highlights", "Highlights"], ["/login", "Admin sign in"],
] as const;

export default async function MorePage() {
  const prelaunch = await getSetting("prelaunch_mode", false);

  return (
    <div className="py-6">
      {prelaunch && <PreLaunchOverlay />}
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider">More</h1>
      <ul className="mt-4 divide-y divide-steel-700 rounded-lg border border-steel-700 bg-steel-900">
        {items.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block min-h-11 px-4 py-3 text-steel-100 hover:text-gold-400">{label}</Link>
          </li>
        ))}
        <li className="px-4 py-3">
          <AdminLink />
        </li>
      </ul>
    </div>
  );
}
