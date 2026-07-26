import Link from "next/link";

const items = [
  ["/roster", "Roster"], ["/news", "News"], ["/highlights", "Highlights"], ["/login", "Admin sign in"],
] as const;

export default function MorePage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider">More</h1>
      <ul className="mt-4 divide-y divide-steel-700 rounded-lg border border-steel-700 bg-steel-900">
        {items.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block min-h-11 px-4 py-3 text-steel-100 hover:text-gold-400">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
