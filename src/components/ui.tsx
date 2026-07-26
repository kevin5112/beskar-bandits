import Link from "next/link";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="pt-6 font-display text-2xl font-bold uppercase tracking-wider">{children}</h1>;
}

export function Section({ title, action, children }: { title: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gold-400">{title}</h2>
        {action && <Link href={action.href} className="inline-flex min-h-11 items-center text-xs text-steel-400 hover:text-gold-400">{action.label} →</Link>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-steel-700 bg-steel-900 p-4 ${className}`}>{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <Card className="text-center text-sm text-steel-400">{message}</Card>;
}
