import type { Player } from "@/lib/types";
import { savePlayer } from "@/app/admin/actions";

export const inputCls = "min-h-11 w-full rounded border border-steel-700 bg-steel-900 px-3 text-steel-100";
export const labelCls = "block text-xs font-display uppercase tracking-wider text-steel-400 mb-1";
export const btnCls = "min-h-11 rounded bg-gold-500 px-4 font-display font-bold uppercase tracking-wider text-steel-950";

export default function PlayerForm({ player }: { player?: Player }) {
  return (
    <form action={savePlayer} className="grid gap-3 md:grid-cols-2">
      {player && <input type="hidden" name="id" value={player.id} />}
      <div><label className={labelCls}>Name</label><input name="name" required defaultValue={player?.name} className={inputCls} /></div>
      <div><label className={labelCls}>Jersey #</label><input name="jersey_number" type="number" defaultValue={player?.jersey_number ?? ""} className={inputCls} /></div>
      <div><label className={labelCls}>Positions (comma-sep)</label><input name="positions" defaultValue={player?.positions.join(", ")} className={inputCls} /></div>
      <div><label className={labelCls}>Walk-up song</label><input name="walkup_song" defaultValue={player?.walkup_song ?? ""} className={inputCls} /></div>
      <div className="md:col-span-2"><label className={labelCls}>Bio</label><textarea name="bio" rows={2} defaultValue={player?.bio ?? ""} className={inputCls + " py-2"} /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={player?.active ?? true} className="h-5 w-5" /> Active</label>
      <div className="md:col-span-2"><button className={btnCls}>{player ? "Save player" : "Add player"}</button></div>
    </form>
  );
}
