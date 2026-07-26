const ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (ID.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get("v");
    if (v && ID.test(v)) return v;
    const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
    if (ID.test(last)) return last;
  } catch { /* not a URL */ }
  return null;
}
