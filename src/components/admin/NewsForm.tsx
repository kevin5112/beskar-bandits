import type { NewsPost } from "@/lib/types";
import { saveNewsPost } from "@/app/admin/actions";
import { inputCls, labelCls } from "./PlayerForm";
import SubmitButton from "./SubmitButton";

export default function NewsForm({ post }: { post?: NewsPost }) {
  return (
    <form action={saveNewsPost} className="space-y-3">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div><label className={labelCls}>Title</label><input name="title" required defaultValue={post?.title} className={inputCls} /></div>
      <div><label className={labelCls}>Slug (blank = auto)</label><input name="slug" defaultValue={post?.slug} className={inputCls} /></div>
      <div><label className={labelCls}>Body (markdown)</label><textarea name="body" rows={8} defaultValue={post?.body} className={inputCls + " py-2"} /></div>
      <SubmitButton>{post ? "Save post" : "Publish post"}</SubmitButton>
    </form>
  );
}
