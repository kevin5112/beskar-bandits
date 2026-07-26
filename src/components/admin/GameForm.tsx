import type { Game } from "@/lib/types";
import { saveGame } from "@/app/admin/actions";
import { inputCls, labelCls } from "./PlayerForm";
import SubmitButton from "./SubmitButton";

function easternParts(iso?: string) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d); // YYYY-MM-DD
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return { date, time };
}

export default function GameForm({ game }: { game?: Game }) {
  const { date, time } = easternParts(game?.starts_at);
  return (
    <form action={saveGame} className="grid gap-3 md:grid-cols-2">
      {game && <input type="hidden" name="id" value={game.id} />}
      <div><label className={labelCls}>Opponent</label><input name="opponent" required defaultValue={game?.opponent} className={inputCls} /></div>
      <div><label className={labelCls}>Location</label><input name="location" defaultValue={game?.location} className={inputCls} /></div>
      <div><label className={labelCls}>Date (Eastern)</label><input name="date" type="date" required defaultValue={date} className={inputCls} /></div>
      <div><label className={labelCls}>Time (Eastern)</label><input name="time" type="time" required defaultValue={time} className={inputCls} /></div>
      <div>
        <label className={labelCls}>Home/Away</label>
        <select name="home_away" defaultValue={game?.home_away ?? "home"} className={inputCls}>
          <option value="home">Home</option><option value="away">Away</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Status</label>
        <select name="status" defaultValue={game?.status ?? "upcoming"} className={inputCls}>
          <option value="upcoming">Upcoming</option><option value="final">Final</option><option value="canceled">Canceled</option>
        </select>
      </div>
      <div><label className={labelCls}>Our score</label><input name="our_score" type="number" defaultValue={game?.our_score ?? ""} className={inputCls} /></div>
      <div><label className={labelCls}>Their score</label><input name="their_score" type="number" defaultValue={game?.their_score ?? ""} className={inputCls} /></div>
      <div className="md:col-span-2">
        <label className={labelCls}>YouTube links (one per line)</label>
        <textarea name="youtube_urls" rows={2} defaultValue={game?.youtube_video_ids.join("\n")} className={inputCls + " py-2"} />
      </div>
      <div className="md:col-span-2"><SubmitButton>{game ? "Save game" : "Add game"}</SubmitButton></div>
    </form>
  );
}
