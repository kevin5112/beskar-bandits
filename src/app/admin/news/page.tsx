import { requireAdmin } from "@/lib/supabase/server";
import type { NewsPost } from "@/lib/types";
import NewsForm from "@/components/admin/NewsForm";
import { Card } from "@/components/ui";

export default async function AdminNews() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("news_posts").select("*").order("published_at", { ascending: false });
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">New post</h2><NewsForm /></Card>
      {((data ?? []) as NewsPost[]).map((p) => (
        <Card key={p.id}><h3 className="mb-3 font-display text-sm text-steel-400">{p.title}</h3><NewsForm post={p} /></Card>
      ))}
    </div>
  );
}
