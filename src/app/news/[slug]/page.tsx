import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getNewsPost } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export const revalidate = 60;

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) notFound();
  return (
    <article className="pb-10">
      <PageTitle>{post.title}</PageTitle>
      <p className="mt-1 text-xs text-steel-400">{formatGameDay(post.published_at)}</p>
      <div className="prose-invert mt-4 space-y-3 text-steel-100 [&_a]:text-gold-400 [&_strong]:text-gold-400">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </article>
  );
}
