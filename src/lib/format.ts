const TZ = "America/New_York";

export function formatGameDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

export function formatGameTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatRecord(w: number, l: number, t: number): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

export function easternToIso(date: string, time: string): string {
  // date "2026-08-07", time "19:30" — wall-clock Eastern → UTC ISO.
  // Offset is derived from the UTC-vs-Eastern render of the same instant so the
  // result is identical on any machine timezone (comparing against the raw
  // naive Date instead would bake the local machine's offset into the result).
  const naive = new Date(`${date}T${time}:00Z`);
  const utcRef = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const eastRef = new Date(naive.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const offsetMs = utcRef.getTime() - eastRef.getTime();
  return new Date(naive.getTime() + offsetMs).toISOString();
}
