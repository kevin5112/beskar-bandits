import { setProfileRole } from "@/app/admin/actions";
import { Card } from "@/components/ui";
import { btnCls } from "@/components/admin/PlayerForm";
import type { Profile as FullProfile, Player as FullPlayer } from "@/lib/types";

type Profile = Pick<FullProfile, "id" | "display_name" | "role">;
type Player = Pick<FullPlayer, "id" | "name" | "profile_id">;

export default function AccountsPanel({
  profiles,
  selfId,
  players,
}: {
  profiles: Profile[];
  selfId: string;
  players: Player[];
}) {
  return (
    <Card>
      <h2 className="mb-3 font-display font-bold uppercase tracking-wider">Accounts</h2>
      <div className="space-y-2">
        {profiles.map((profile) => {
          const linkedPlayer = players.find((p) => p.profile_id === profile.id);
          const isSelf = profile.id === selfId;
          const nextRole = profile.role === "admin" ? "player" : "admin";
          return (
            <div
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-steel-700 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-steel-100">{profile.display_name}</span>
                <span
                  className={
                    "font-display text-xs uppercase " +
                    (profile.role === "admin"
                      ? "rounded border border-gold-500 px-2 py-0.5 text-gold-400"
                      : "rounded border border-steel-500 px-2 py-0.5 text-steel-400")
                  }
                >
                  {profile.role}
                </span>
                <span className="text-xs text-steel-400">
                  {linkedPlayer ? `→ ${linkedPlayer.name}` : "not linked"}
                </span>
              </div>
              {isSelf && profile.role === "admin" ? (
                <span className="text-xs text-steel-400">(you)</span>
              ) : (
                <form action={setProfileRole}>
                  <input type="hidden" name="profile_id" value={profile.id} />
                  <input type="hidden" name="role" value={nextRole} />
                  <button className={btnCls}>{profile.role === "admin" ? "Make player" : "Make admin"}</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
