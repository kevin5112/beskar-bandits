import Link from "next/link";
import { getNewsPosts } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export const revalidate = 60;

export const metadata = { title: "News" };

export default async function NewsPage() {
  const posts = await getNewsPosts();
  return (
    <div className="pb-10">
      <PageTitle>News</PageTitle>
      <div className="mt-4 space-y-3">
        {posts.length ? posts.map((p) => (
          <Card key={p.id}>
            <Link href={`/news/${p.slug}`} className="font-display text-lg font-bold hover:text-gold-400">{p.title}</Link>
            <p className="mt-1 text-xs text-steel-400">{formatGameDay(p.published_at)}</p>
          </Card>
        )) : <EmptyState message="No news yet. The front office is quiet." />}
      </div>
    </div>
  );
}
