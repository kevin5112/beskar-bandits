import type { Game } from "@/lib/types";
import { saveAlbum } from "@/app/admin/actions";
import { formatGameDay } from "@/lib/format";
import { inputCls, labelCls } from "./PlayerForm";
import SubmitButton from "./SubmitButton";

export default function AlbumForm({ games }: { games: Game[] }) {
  return (
    <form action={saveAlbum} className="grid gap-3 md:grid-cols-2">
      <div><label className={labelCls}>Album title</label><input name="title" required className={inputCls} /></div>
      <div>
        <label className={labelCls}>Link to game (optional)</label>
        <select name="game_id" defaultValue="" className={inputCls}>
          <option value="">— none —</option>
          {games.map((g) => <option key={g.id} value={g.id}>{formatGameDay(g.starts_at)} · {g.opponent}</option>)}
        </select>
      </div>
      <div className="md:col-span-2"><SubmitButton>Create album</SubmitButton></div>
    </form>
  );
}
