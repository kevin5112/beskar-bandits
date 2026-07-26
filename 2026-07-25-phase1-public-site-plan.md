# Beskar Bandits Phase 1 (Public Site) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full public Beskar Bandits site (home, schedule, box scores, stats, roster, news, photos, highlights) with admin-only auth and minimal admin data entry, deployed live on Vercel with Web Analytics.

**Architecture:** One Next.js App Router app. Public pages are server components that read Supabase Postgres through a cookie-less client (always-fresh, no cache complexity). Auth (admin only in Phase 1) uses `@supabase/ssr` cookie clients + middleware guarding `/admin`. All season stats are computed in pure TypeScript functions from raw stat lines — never stored.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Turbopack), Tailwind CSS v4, Supabase (Postgres + Auth + Storage, new `sb_publishable_` API keys), Vitest, react-markdown, browser-image-compression, @vercel/analytics.

## Global Constraints

- Repo: `C:\Users\KevinChen\Documents\beskar-bandits`, remote `https://github.com/kevin5112/beskar-bandits.git`, branch `main` (commit directly to main; no PRs in Phase 1).
- Commit messages: plain, no ticket refs, **no Co-Authored-By lines**.
- Git identity: repo-local `kevin5112@users.noreply.github.com` (already configured — never change to the work email).
- Node 20 (installed). TypeScript `strict`. Windows machine: run npm/git via shell; forward slashes in code.
- `.env.local` already exists with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` filled in. Never commit it. Never use legacy `anon`/`service_role` keys.
- SQL migrations are files in `supabase/migrations/`; **Kevin applies them by pasting into the Supabase SQL Editor** (no Supabase CLI/Docker). A task that adds a migration is not done until Kevin confirms it ran.
- Mobile-first: style for phone width by default, adapt upward with `md:`/`lg:` only. Tap targets ≥ 44px (`min-h-11`). No pinch-zoom tables — wide tables get `overflow-x-auto` wrappers with a sticky first column.
- Colors/fonts only via the Tailwind theme tokens defined in Task 1 — no hex values in components.
- All game times display in `America/New_York` regardless of viewer timezone.
- No Star Wars / Disney IP anywhere, **including seed data** (no character names, no park land names, **no verbatim franchise catchphrases in copy** — e.g. "This is the way"). The word "beskar" alone is allowed: it's the team's name. (Ruling by Kevin, 2026-07-25.)
- Empty states: every list page renders a friendly message when there's no data, never a blank screen.
- Dev server checks use the app preview browser at phone size (390px) first, then desktop.

## File Structure (end state)

```
beskar-bandits/
├── supabase/migrations/001_initial_schema.sql, 002_dev_seed.sql
├── vitest.config.ts
├── src/
│   ├── middleware.ts                  # guards /admin only
│   ├── app/
│   │   ├── layout.tsx, globals.css, page.tsx (home)
│   │   ├── schedule/page.tsx
│   │   ├── games/[id]/page.tsx
│   │   ├── stats/page.tsx
│   │   ├── roster/page.tsx, roster/[id]/page.tsx
│   │   ├── news/page.tsx, news/[slug]/page.tsx
│   │   ├── photos/page.tsx, photos/[albumId]/page.tsx
│   │   ├── highlights/page.tsx
│   │   ├── more/page.tsx              # mobile "More" nav target
│   │   ├── login/page.tsx
│   │   └── admin/ (layout.tsx, page.tsx, players/, games/, games/[id]/, news/, photos/, actions.ts)
│   ├── components/ (SiteHeader, BottomNav, ui.tsx, Countdown, YouTubeEmbed, StatsTable, PhotoGrid, admin/*)
│   └── lib/
│       ├── format.ts, youtube.ts      # pure utils (tested)
│       ├── stats.ts                   # season rollups (tested)
│       ├── types.ts                   # DB row interfaces
│       ├── queries.ts                 # public reads (cookie-less client)
│       └── supabase/ (public.ts, client.ts, server.ts, middleware.ts)
└── tests/ (format.test.ts, youtube.test.ts, stats.test.ts)
```

---

### Task 1: Scaffold Next.js app, theme, fonts, nav shell

**Files:**
- Create: entire Next.js scaffold via CLI, then edit `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/SiteHeader.tsx`, `src/components/BottomNav.tsx`, `src/app/more/page.tsx`

**Interfaces:**
- Produces: Tailwind tokens `steel-950/900/800/700/400/100`, `gold-400/500`; fonts `font-display`, `font-body`; nav components used by `layout.tsx`. Placeholder `page.tsx` (replaced in Task 9).

- [ ] **Step 1: Scaffold.** From the repo root:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: scaffold succeeds into the existing repo (it tolerates the existing .md/.gitignore/supabase files; if it balks about non-empty dir, scaffold into `tmp-scaffold/` and move contents up, preserving our `.gitignore` — merge its entries rather than overwrite).

- [ ] **Step 2: Verify dev server boots.** Start the dev server via the preview tool (`npm run dev`, port 3000). Expected: default Next.js page renders, no console errors. Stop is not needed; leave it running for the whole build.

- [ ] **Step 3: Replace `src/app/globals.css`** with the theme:

```css
@import "tailwindcss";

@theme inline {
  --color-steel-950: #0b0d10;
  --color-steel-900: #12151a;
  --color-steel-800: #1b2028;
  --color-steel-700: #262d38;
  --color-steel-400: #8b98a9;
  --color-steel-100: #e8ecf1;
  --color-gold-500: #d4a017;
  --color-gold-400: #e6b833;
  --font-display: var(--font-chakra);
  --font-body: var(--font-inter);
}

html { scroll-behavior: smooth; }
body { -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 4: Replace `src/app/layout.tsx`:**

```tsx
import type { Metadata } from "next";
import { Chakra_Petch, Inter } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const chakra = Chakra_Petch({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-chakra" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Beskar Bandits", template: "%s | Beskar Bandits" },
  description: "Coed softball. Schedule, stats, photos, and highlights for the Beskar Bandits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakra.variable} ${inter.variable}`}>
      <body className="bg-steel-950 text-steel-100 font-body min-h-dvh pb-20 md:pb-0">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 md:px-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create `src/components/SiteHeader.tsx`** (desktop top nav, mobile shows brand only):

```tsx
import Link from "next/link";

const links = [
  ["/schedule", "Schedule"], ["/stats", "Stats"], ["/roster", "Roster"],
  ["/news", "News"], ["/photos", "Photos"], ["/highlights", "Highlights"],
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-steel-700 bg-steel-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-widest text-gold-400 uppercase">
          Beskar Bandits
        </Link>
        <nav className="hidden gap-5 md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm text-steel-400 hover:text-gold-400">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Create `src/components/BottomNav.tsx`** (mobile only, 5 slots, 44px+ targets):

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/", "Home"], ["/schedule", "Sched"], ["/stats", "Stats"], ["/photos", "Photos"], ["/more", "More"],
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-steel-700 bg-steel-900 pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map(([href, label]) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex min-h-14 flex-col items-center justify-center text-xs font-display uppercase tracking-wide ${active ? "text-gold-400" : "text-steel-400"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 7: Create `src/app/more/page.tsx`:**

```tsx
import Link from "next/link";

const items = [
  ["/roster", "Roster"], ["/news", "News"], ["/highlights", "Highlights"], ["/login", "Admin sign in"],
] as const;

export default function MorePage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider">More</h1>
      <ul className="mt-4 divide-y divide-steel-700 rounded-lg border border-steel-700 bg-steel-900">
        {items.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block min-h-11 px-4 py-3 text-steel-100 hover:text-gold-400">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Placeholder home.** Replace `src/app/page.tsx` content with a minimal branded placeholder (real home page is Task 9):

```tsx
export default function Home() {
  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-bold uppercase tracking-widest text-gold-400">Beskar Bandits</h1>
      <p className="mt-2 text-steel-400">Site under construction. Fresh steel incoming.</p>
    </div>
  );
}
```

- [ ] **Step 9: Verify in preview** at 390px width: brand header, bottom nav with 5 tabs, More page lists 4 links, no horizontal scroll. Desktop (1280px): top nav visible, bottom nav hidden.

- [ ] **Step 10: Commit & push**

```bash
git add -A && git commit -m "Scaffold Next.js app with beskar theme, fonts, and mobile-first nav shell" && git push
```

---

### Task 2: Test harness + date/YouTube utils (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/format.ts`, `src/lib/youtube.ts`
- Test: `tests/format.test.ts`, `tests/youtube.test.ts`
- Modify: `package.json` (scripts + devDeps)

**Interfaces:**
- Produces: `formatGameDay(iso: string): string` (e.g. `"Fri, Aug 7"`), `formatGameTime(iso: string): string` (e.g. `"7:30 PM"`, always America/New_York), `formatRecord(w: number, l: number, t: number): string` (`"12-3"` or `"12-3-1"`), `parseYouTubeId(input: string): string | null`.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`** and add scripts:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["tests/**/*.test.ts"] } });
```

In `package.json` scripts add: `"test": "vitest run", "test:watch": "vitest"`.

- [ ] **Step 3: Write failing tests `tests/format.test.ts`** (tests import with relative paths):

```ts
import { describe, expect, it } from "vitest";
import { formatGameDay, formatGameTime, formatRecord } from "../src/lib/format";

// 2026-08-07T23:30:00Z == Aug 7 2026, 7:30 PM EDT
const iso = "2026-08-07T23:30:00.000Z";

describe("formatGameDay/Time", () => {
  it("renders Eastern time regardless of machine TZ", () => {
    expect(formatGameDay(iso)).toBe("Fri, Aug 7");
    expect(formatGameTime(iso)).toBe("7:30 PM");
  });
  it("handles winter (EST) dates", () => {
    // 2026-01-10T00:30:00Z == Jan 9 2026, 7:30 PM EST
    expect(formatGameDay("2026-01-10T00:30:00.000Z")).toBe("Fri, Jan 9");
    expect(formatGameTime("2026-01-10T00:30:00.000Z")).toBe("7:30 PM");
  });
});

describe("formatRecord", () => {
  it("omits ties when zero", () => expect(formatRecord(12, 3, 0)).toBe("12-3"));
  it("includes ties when present", () => expect(formatRecord(12, 3, 1)).toBe("12-3-1"));
});
```

And `tests/youtube.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "../src/lib/youtube";

describe("parseYouTubeId", () => {
  it("parses watch URLs", () => expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("parses short links", () => expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=5")).toBe("dQw4w9WgXcQ"));
  it("parses shorts", () => expect(parseYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("accepts a raw 11-char id", () => expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("rejects garbage", () => expect(parseYouTubeId("not a video")).toBeNull());
});
```

- [ ] **Step 4: Run to verify failure.** `npm test` — Expected: FAIL, cannot resolve `../src/lib/format`.

- [ ] **Step 5: Implement `src/lib/format.ts`:**

```ts
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
```

And `src/lib/youtube.ts`:

```ts
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
```

- [ ] **Step 6: Run tests.** `npm test` — Expected: all PASS. (If `formatGameDay` output uses narrow no-break spaces, normalize in the function with `.replace(/\u202f/g, " ")` — Node ICU quirk.)

- [ ] **Step 7: Commit & push** — `git add -A && git commit -m "Add test harness and date/record/youtube utils" && git push`

---

### Task 3: Database schema migration (all tables + RLS + storage)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: tables `profiles, players, games, stat_lines, rsvps, news_posts, albums, photos, comments`; function `public.is_admin()`; signup trigger; public `photos` storage bucket. Column names exactly as below — later tasks' types must match.

- [ ] **Step 1: Write `supabase/migrations/001_initial_schema.sql`:**

```sql
-- ===== TABLES =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'player' check (role in ('admin','player')),
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jersey_number int,
  positions text[] not null default '{}',
  photo_url text,
  bio text,
  walkup_song text,
  profile_id uuid unique references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  starts_at timestamptz not null,
  location text not null default '',
  home_away text not null default 'home' check (home_away in ('home','away')),
  our_score int,
  their_score int,
  status text not null default 'upcoming' check (status in ('upcoming','final','canceled')),
  youtube_video_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.stat_lines (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  ab int not null default 0,
  r int not null default 0,
  h int not null default 0,
  doubles int not null default 0,
  triples int not null default 0,
  hr int not null default 0,
  rbi int not null default 0,
  bb int not null default 0,
  k int not null default 0,
  unique (game_id, player_id)
);
create index stat_lines_game_idx on public.stat_lines(game_id);
create index stat_lines_player_idx on public.stat_lines(player_id);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('in','out','maybe')),
  updated_at timestamptz not null default now(),
  unique (game_id, profile_id)
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  author_profile_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now(),
  slug text not null unique
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game_id uuid references public.games(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index photos_album_idx on public.photos(album_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  target text not null check (target in ('game','news_post')),
  target_id uuid not null,
  created_at timestamptz not null default now()
);
create index comments_target_idx on public.comments(target, target_id);

-- ===== HELPERS =====
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.stat_lines enable row level security;
alter table public.rsvps enable row level security;
alter table public.news_posts enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.comments enable row level security;

-- public reads (everything except profiles + rsvps)
create policy "public read players" on public.players for select using (true);
create policy "public read games" on public.games for select using (true);
create policy "public read stat_lines" on public.stat_lines for select using (true);
create policy "public read news_posts" on public.news_posts for select using (true);
create policy "public read albums" on public.albums for select using (true);
create policy "public read photos" on public.photos for select using (true);
create policy "public read comments" on public.comments for select using (true);

-- profiles: own row or admin
create policy "read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "admin update profiles" on public.profiles for update using (public.is_admin());

-- rsvps: logged-in read; own-row writes (used in Phase 3, defined now)
create policy "authed read rsvps" on public.rsvps for select using (auth.uid() is not null);
create policy "insert own rsvp" on public.rsvps for insert with check (profile_id = auth.uid());
create policy "update own rsvp" on public.rsvps for update using (profile_id = auth.uid());

-- admin full write on content tables
create policy "admin write players" on public.players for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write games" on public.games for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write stat_lines" on public.stat_lines for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write rsvps" on public.rsvps for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write news_posts" on public.news_posts for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write albums" on public.albums for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write photos" on public.photos for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write comments" on public.comments for all using (public.is_admin()) with check (public.is_admin());

-- ===== STORAGE =====
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public read photo objects" on storage.objects for select using (bucket_id = 'photos');
create policy "admin insert photo objects" on storage.objects for insert with check (bucket_id = 'photos' and public.is_admin());
create policy "admin delete photo objects" on storage.objects for delete using (bucket_id = 'photos' and public.is_admin());
```

- [ ] **Step 2: Kevin applies it.** Ask Kevin to open Supabase Dashboard → SQL Editor → paste the whole file → Run. Expected output: `Success. No rows returned`.

- [ ] **Step 3: Verify.** Kevin runs in the SQL Editor:

```sql
select table_name, row_security_active('public.' || table_name) as rls
from information_schema.tables where table_schema = 'public' order by 1;
```

Expected: 9 rows, all `rls = true`. Then `select public.is_admin();` → `false` (not signed in — correct).

- [ ] **Step 4: Commit & push** — `git add -A && git commit -m "Add initial database schema with RLS and photo storage" && git push`

---

### Task 4: Dev seed data

**Files:**
- Create: `supabase/migrations/002_dev_seed.sql`

**Interfaces:**
- Produces: 10 players, 6 games (3 final w/ full stat lines, 2 upcoming, 1 canceled), 2 news posts, 1 empty album. All obviously-fake names; deleted before real launch (delete statements included at bottom, commented).

- [ ] **Step 1: Write `supabase/migrations/002_dev_seed.sql`:**

```sql
-- DEV SEED — fake data so pages render during development.
-- Wipe before launch with the DELETEs at the bottom.
insert into public.players (id, name, jersey_number, positions, bio) values
  ('00000000-0000-0000-0000-000000000001', 'Alex Rivera', 7,  '{SS}',    'Contact hitter. Allergic to pop flies.'),
  ('00000000-0000-0000-0000-000000000002', 'Sam Okafor', 23, '{1B}',    'Launch angle enthusiast.'),
  ('00000000-0000-0000-0000-000000000003', 'Jordan Lee', 4,  '{2B,SS}', 'Fastest walk-up in the league.'),
  ('00000000-0000-0000-0000-000000000004', 'Casey Nguyen', 11, '{C}',   'Framing pitches nobody threw.'),
  ('00000000-0000-0000-0000-000000000005', 'Riley Brooks', 9, '{LF}',   'Warning-track power, full-track confidence.'),
  ('00000000-0000-0000-0000-000000000006', 'Morgan Diaz', 15, '{CF}',   'Covers three zip codes.'),
  ('00000000-0000-0000-0000-000000000007', 'Taylor Kim', 2,  '{RF}',    'Cannon arm, questionable accuracy.'),
  ('00000000-0000-0000-0000-000000000008', 'Jamie Patel', 31, '{3B}',   'Hot corner, cold takes.'),
  ('00000000-0000-0000-0000-000000000009', 'Drew Santos', 44, '{P}',    'Throws strikes, occasionally on purpose.'),
  ('00000000-0000-0000-0000-000000000010', 'Quinn Harper', 12, '{UT}',  'Plays everywhere. Owns one glove.');

insert into public.games (id, opponent, starts_at, location, home_away, our_score, their_score, status) values
  ('10000000-0000-0000-0000-000000000001', 'Night Shift',     now() - interval '21 days', 'Field 3', 'home', 12, 7,  'final'),
  ('10000000-0000-0000-0000-000000000002', 'Dugout Kings',    now() - interval '14 days', 'Field 1', 'away', 9,  11, 'final'),
  ('10000000-0000-0000-0000-000000000003', 'Heatwave',        now() - interval '7 days',  'Field 3', 'home', 15, 4,  'final'),
  ('10000000-0000-0000-0000-000000000004', 'The Castaways',   now() - interval '3 days',  'Field 2', 'home', null, null, 'canceled'),
  ('10000000-0000-0000-0000-000000000005', 'Backlot Bombers', now() + interval '4 days',  'Field 3', 'home', null, null, 'upcoming'),
  ('10000000-0000-0000-0000-000000000006', 'The Regulars',    now() + interval '11 days', 'Field 1', 'away', null, null, 'upcoming');

-- box scores for the 3 finals: every player bats in every final (10 players x 3 games)
insert into public.stat_lines (game_id, player_id, ab, r, h, doubles, triples, hr, rbi, bb, k)
select g.id, p.id,
  3 + (abs(hashtext(g.id::text || p.id::text)) % 2),      -- ab: 3-4
  abs(hashtext('r'  || g.id::text || p.id::text)) % 3,     -- r: 0-2
  1 + (abs(hashtext('h' || g.id::text || p.id::text)) % 3),-- h: 1-3
  abs(hashtext('d'  || g.id::text || p.id::text)) % 2,     -- 2b: 0-1
  0,
  case when abs(hashtext('hr' || g.id::text || p.id::text)) % 5 = 0 then 1 else 0 end,
  abs(hashtext('rbi' || g.id::text || p.id::text)) % 4,
  abs(hashtext('bb' || g.id::text || p.id::text)) % 2,
  abs(hashtext('k'  || g.id::text || p.id::text)) % 2
from public.games g cross join public.players p
where g.status = 'final';

-- keep h <= ab (hash rows can violate it)
update public.stat_lines set h = ab where h > ab;
update public.stat_lines set doubles = h where doubles > h;

insert into public.news_posts (title, slug, body, published_at) values
  ('Bandits roll in season opener', 'season-opener-win',
   E'The bats showed up **loud**.\n\nFull box score is on the game page. Bring water Thursday — forecast says brutal.',
   now() - interval '20 days'),
  ('Playoff push starts now', 'playoff-push',
   E'Three games left in the regular season.\n\nWin two and we clinch a playoff spot. RSVP early so we know the lineup.',
   now() - interval '2 days');

insert into public.albums (title, game_id) values
  ('Season Opener vs Night Shift', '10000000-0000-0000-0000-000000000001');

-- LAUNCH CLEANUP (run when real data replaces seed):
-- delete from public.stat_lines; delete from public.games; delete from public.players;
-- delete from public.news_posts; delete from public.photos; delete from public.albums;
```

- [ ] **Step 2: Kevin applies it** in the SQL Editor. Expected: `Success`.
- [ ] **Step 3: Verify.** `select count(*) from public.stat_lines;` → `30`. `select count(*) from public.games where status='final';` → `3`.
- [ ] **Step 4: Commit & push** — `git add -A && git commit -m "Add dev seed data" && git push`

---

### Task 5: Supabase clients, auth, /admin gate

**Files:**
- Create: `src/lib/supabase/public.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`
- Create: `src/app/login/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/SignOutButton.tsx`

**Interfaces:**
- Consumes: theme tokens (Task 1).
- Produces: `publicClient()` (cookie-less, for public queries), `createClient()` browser + `createServerClient()` server (cookie-aware), middleware guarding `/admin/:path*`, admin layout that 403s non-admins, `requireAdmin(): Promise<{ supabase, user }>` exported from `src/app/admin/layout.tsx`'s sibling — define it in `src/lib/supabase/server.ts`.

- [ ] **Step 1: Install SDKs**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create the three clients.**

`src/lib/supabase/public.ts` (cookie-less; public pages — always fresh, no auth):

```ts
import { createClient } from "@supabase/supabase-js";

export function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

`src/lib/supabase/client.ts` (browser, cookie-backed session):

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

`src/lib/supabase/server.ts` (server components / actions, plus the admin guard):

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* called from a Server Component with middleware refreshing sessions — safe to ignore */ }
        },
      },
    }
  );
}

/** Redirects to /login when signed out; throws to /login?denied=1 when not an admin. */
export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/login?denied=1");
  return { supabase, user };
}
```

- [ ] **Step 3: Middleware (guards only /admin).** `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
```

`src/middleware.ts`:

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = { matcher: ["/admin/:path*"] };
```

- [ ] **Step 4: Login page.** `src/app/login/page.tsx`:

```tsx
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const denied = useSearchParams().get("denied");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider">Sign in</h1>
      {denied && <p className="rounded border border-gold-500 bg-steel-900 p-3 text-sm">That account isn&apos;t an admin yet.</p>}
      {error && <p className="rounded border border-red-500 bg-steel-900 p-3 text-sm text-red-400">{error}</p>}
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        className="min-h-11 w-full rounded border border-steel-700 bg-steel-900 px-3 text-steel-100" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
        className="min-h-11 w-full rounded border border-steel-700 bg-steel-900 px-3 text-steel-100" />
      <button disabled={busy} className="min-h-11 w-full rounded bg-gold-500 font-display font-bold uppercase tracking-wider text-steel-950 disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
```

- [ ] **Step 5: Admin shell.** `src/components/admin/SignOutButton.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}
      className="min-h-11 rounded border border-steel-700 px-3 text-sm text-steel-400 hover:text-gold-400">
      Sign out
    </button>
  );
}
```

`src/app/admin/layout.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const links = [["/admin/games", "Games"], ["/admin/players", "Players"], ["/admin/news", "News"], ["/admin/photos", "Photos"]] as const;
  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold uppercase tracking-wider text-gold-400">Admin</h1>
        <SignOutButton />
      </div>
      <nav className="mt-3 flex gap-4 overflow-x-auto border-b border-steel-700 pb-2">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="min-h-11 whitespace-nowrap py-2 text-sm text-steel-400 hover:text-gold-400">{label}</Link>
        ))}
      </nav>
      <div className="mt-4">{children}</div>
    </div>
  );
}
```

`src/app/admin/page.tsx`:

```tsx
export default function AdminHome() {
  return <p className="text-steel-400">Pick a section above. Games is where scores and box scores live.</p>;
}
```

- [ ] **Step 6: Kevin creates his account.** Supabase Dashboard → Authentication → Users → Add user → email + password (auto-confirm ON). Then SQL Editor:

```sql
update public.profiles set role = 'admin', display_name = 'Kevin'
where id = (select id from auth.users where email = '<kevin's chosen email>');
```

Expected: `UPDATE 1` (trigger already created the profile row).

- [ ] **Step 7: Verify flow in preview.** `/admin` signed out → redirected to `/login`. Sign in with Kevin's account → admin shell renders. Sign out → back home. Wrong password → error message shown inline.

- [ ] **Step 8: Commit & push** — `git add -A && git commit -m "Add Supabase clients, login, and admin gate" && git push`

---

### Task 6: Stats engine (TDD)

**Files:**
- Create: `src/lib/stats.ts`
- Test: `tests/stats.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:

```ts
export interface StatTotals { ab: number; r: number; h: number; doubles: number; triples: number; hr: number; rbi: number; bb: number; k: number; }
export interface StatLineInput extends StatTotals { player_id: string; player_name: string; jersey_number: number | null; }
export interface SeasonStatRow extends StatTotals { player_id: string; player_name: string; jersey_number: number | null; games: number; avg: number | null; }
export function battingAvg(h: number, ab: number): string;            // ".500", "1.000", "—" when ab === 0
export function computeSeasonStats(lines: StatLineInput[]): SeasonStatRow[]; // aggregated per player, sorted avg desc (nulls last), ties by h desc
export function computeTeamRecord(games: { status: string; our_score: number | null; their_score: number | null }[]): { w: number; l: number; t: number };
```

- [ ] **Step 1: Write failing tests `tests/stats.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { battingAvg, computeSeasonStats, computeTeamRecord, type StatLineInput } from "../src/lib/stats";

const line = (over: Partial<StatLineInput>): StatLineInput => ({
  player_id: "p1", player_name: "Alex", jersey_number: 7,
  ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, ...over,
});

describe("battingAvg", () => {
  it("formats sub-1 without leading zero", () => expect(battingAvg(1, 2)).toBe(".500"));
  it("formats perfect", () => expect(battingAvg(3, 3)).toBe("1.000"));
  it("dashes zero at-bats", () => expect(battingAvg(0, 0)).toBe("—"));
  it("rounds to 3 places", () => expect(battingAvg(1, 3)).toBe(".333"));
});

describe("computeSeasonStats", () => {
  it("aggregates across games and counts games played", () => {
    const rows = computeSeasonStats([
      line({ ab: 3, h: 2, hr: 1, rbi: 2 }),
      line({ ab: 4, h: 1, bb: 1 }),
      line({ player_id: "p2", player_name: "Sam", jersey_number: 23, ab: 4, h: 4 }),
    ]);
    const alex = rows.find((r) => r.player_id === "p1")!;
    expect(alex.games).toBe(2);
    expect(alex.ab).toBe(7);
    expect(alex.h).toBe(3);
    expect(alex.avg).toBeCloseTo(3 / 7);
  });
  it("sorts by avg desc, no-AB players last", () => {
    const rows = computeSeasonStats([
      line({ player_id: "a", player_name: "A", ab: 4, h: 1 }),
      line({ player_id: "b", player_name: "B", ab: 4, h: 4 }),
      line({ player_id: "c", player_name: "C", ab: 0, bb: 2 }),
    ]);
    expect(rows.map((r) => r.player_id)).toEqual(["b", "a", "c"]);
  });
});

describe("computeTeamRecord", () => {
  it("counts only finals", () => {
    expect(computeTeamRecord([
      { status: "final", our_score: 10, their_score: 5 },
      { status: "final", our_score: 4, their_score: 9 },
      { status: "final", our_score: 7, their_score: 7 },
      { status: "upcoming", our_score: null, their_score: null },
      { status: "canceled", our_score: null, their_score: null },
    ])).toEqual({ w: 1, l: 1, t: 1 });
  });
});
```

- [ ] **Step 2: Run to verify failure.** `npm test` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/stats.ts`:**

```ts
export interface StatTotals {
  ab: number; r: number; h: number; doubles: number; triples: number;
  hr: number; rbi: number; bb: number; k: number;
}
export interface StatLineInput extends StatTotals {
  player_id: string; player_name: string; jersey_number: number | null;
}
export interface SeasonStatRow extends StatTotals {
  player_id: string; player_name: string; jersey_number: number | null;
  games: number; avg: number | null;
}

export function battingAvg(h: number, ab: number): string {
  if (ab === 0) return "—";
  const avg = h / ab;
  const s = avg.toFixed(3);
  return avg < 1 ? s.replace(/^0/, "") : s;
}

export function computeSeasonStats(lines: StatLineInput[]): SeasonStatRow[] {
  const byPlayer = new Map<string, SeasonStatRow>();
  for (const l of lines) {
    const row = byPlayer.get(l.player_id) ?? {
      player_id: l.player_id, player_name: l.player_name, jersey_number: l.jersey_number,
      games: 0, avg: null, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0,
    };
    row.games += 1;
    row.ab += l.ab; row.r += l.r; row.h += l.h; row.doubles += l.doubles; row.triples += l.triples;
    row.hr += l.hr; row.rbi += l.rbi; row.bb += l.bb; row.k += l.k;
    byPlayer.set(l.player_id, row);
  }
  const rows = [...byPlayer.values()];
  for (const r of rows) r.avg = r.ab > 0 ? r.h / r.ab : null;
  rows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.h - a.h);
  return rows;
}

export function computeTeamRecord(games: { status: string; our_score: number | null; their_score: number | null }[]) {
  let w = 0, l = 0, t = 0;
  for (const g of games) {
    if (g.status !== "final" || g.our_score === null || g.their_score === null) continue;
    if (g.our_score > g.their_score) w += 1;
    else if (g.our_score < g.their_score) l += 1;
    else t += 1;
  }
  return { w, l, t };
}
```

- [ ] **Step 4: Run tests.** `npm test` — Expected: ALL PASS (format, youtube, stats).
- [ ] **Step 5: Commit & push** — `git add -A && git commit -m "Add season stats engine with tests" && git push`

---

### Task 7: DB types + public data layer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/queries.ts`

**Interfaces:**
- Consumes: `publicClient()` (Task 5), stat types (Task 6).
- Produces (all async, all throw on Supabase error):

```ts
// types.ts
export interface Player { id: string; name: string; jersey_number: number | null; positions: string[]; photo_url: string | null; bio: string | null; walkup_song: string | null; active: boolean; }
export interface Game { id: string; opponent: string; starts_at: string; location: string; home_away: "home" | "away"; our_score: number | null; their_score: number | null; status: "upcoming" | "final" | "canceled"; youtube_video_ids: string[]; }
export interface StatLine { id: string; game_id: string; player_id: string; ab: number; r: number; h: number; doubles: number; triples: number; hr: number; rbi: number; bb: number; k: number; }
export interface NewsPost { id: string; title: string; body: string; published_at: string; slug: string; }
export interface Album { id: string; title: string; game_id: string | null; created_at: string; }
export interface Photo { id: string; album_id: string; storage_path: string; caption: string | null; created_at: string; }
// queries.ts
export function photoUrl(storagePath: string): string; // public URL for the photos bucket
export async function getGames(): Promise<Game[]>;                       // ordered starts_at asc
export async function getNextGame(): Promise<Game | null>;
export async function getLatestFinal(): Promise<Game | null>;
export async function getGame(id: string): Promise<Game | null>;
export async function getGameStatLines(gameId: string): Promise<(StatLine & { player: Pick<Player, "id" | "name" | "jersey_number"> })[]>;
export async function getSeasonStatLineInputs(): Promise<StatLineInput[]>; // joined for computeSeasonStats
export async function getRoster(): Promise<Player[]>;                     // active only, jersey order
export async function getPlayer(id: string): Promise<Player | null>;
export async function getPlayerGameLog(playerId: string): Promise<(StatLine & { game: Pick<Game, "id" | "opponent" | "starts_at" | "status"> })[]>;
export async function getNewsPosts(limit?: number): Promise<NewsPost[]>;
export async function getNewsPost(slug: string): Promise<NewsPost | null>;
export async function getAlbums(): Promise<(Album & { photos: { count: number }[] })[]>;
export async function getAlbum(id: string): Promise<(Album & { photos: Photo[] }) | null>;
export async function getRecentPhotos(limit: number): Promise<Photo[]>;
export async function getGamesWithVideos(): Promise<Game[]>;
export async function getAlbumForGame(gameId: string): Promise<Album | null>;
```

- [ ] **Step 1: Create `src/lib/types.ts`** exactly as the interface block above (plain interfaces, one per table used publicly).

- [ ] **Step 2: Create `src/lib/queries.ts`:**

```ts
import { publicClient } from "@/lib/supabase/public";
import type { Album, Game, NewsPost, Photo, Player, StatLine } from "@/lib/types";
import type { StatLineInput } from "@/lib/stats";

export function photoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${storagePath}`;
}

function db() { return publicClient(); }

export async function getGames(): Promise<Game[]> {
  const { data, error } = await db().from("games").select("*").order("starts_at");
  if (error) throw error;
  return data;
}

export async function getNextGame(): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*")
    .eq("status", "upcoming").gt("starts_at", new Date().toISOString())
    .order("starts_at").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLatestFinal(): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*")
    .eq("status", "final").order("starts_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGame(id: string): Promise<Game | null> {
  const { data, error } = await db().from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGameStatLines(gameId: string) {
  const { data, error } = await db().from("stat_lines")
    .select("*, player:players(id, name, jersey_number)")
    .eq("game_id", gameId);
  if (error) throw error;
  return (data as unknown as (StatLine & { player: Pick<Player, "id" | "name" | "jersey_number"> })[])
    .sort((a, b) => (a.player.jersey_number ?? 999) - (b.player.jersey_number ?? 999));
}

export async function getSeasonStatLineInputs(): Promise<StatLineInput[]> {
  const { data, error } = await db().from("stat_lines")
    .select("ab, r, h, doubles, triples, hr, rbi, bb, k, player:players(id, name, jersey_number)");
  if (error) throw error;
  return (data as unknown as ({ player: { id: string; name: string; jersey_number: number | null } } & Omit<StatLineInput, "player_id" | "player_name" | "jersey_number">)[])
    .map(({ player, ...totals }) => ({ ...totals, player_id: player.id, player_name: player.name, jersey_number: player.jersey_number }));
}

export async function getRoster(): Promise<Player[]> {
  const { data, error } = await db().from("players").select("*")
    .eq("active", true).order("jersey_number", { nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getPlayer(id: string): Promise<Player | null> {
  const { data, error } = await db().from("players").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerGameLog(playerId: string) {
  const { data, error } = await db().from("stat_lines")
    .select("*, game:games(id, opponent, starts_at, status)")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data as unknown as (StatLine & { game: Pick<Game, "id" | "opponent" | "starts_at" | "status"> })[])
    .filter((l) => l.game.status === "final")
    .sort((a, b) => b.game.starts_at.localeCompare(a.game.starts_at));
}

export async function getNewsPosts(limit?: number): Promise<NewsPost[]> {
  let q = db().from("news_posts").select("*").order("published_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const { data, error } = await db().from("news_posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAlbums() {
  const { data, error } = await db().from("albums")
    .select("*, photos(count)").order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as (Album & { photos: { count: number }[] })[];
}

export async function getAlbum(id: string) {
  const { data, error } = await db().from("albums")
    .select("*, photos(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as (Album & { photos: Photo[] }) | null;
}

export async function getRecentPhotos(limit: number): Promise<Photo[]> {
  const { data, error } = await db().from("photos").select("*")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function getGamesWithVideos(): Promise<Game[]> {
  const games = await getGames();
  return games.filter((g) => g.youtube_video_ids.length > 0);
}

export async function getAlbumForGame(gameId: string): Promise<Album | null> {
  const { data, error } = await db().from("albums").select("*").eq("game_id", gameId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 3: Smoke-check.** Temporarily add to the placeholder home page: `const games = await getGames();` + render `{games.length} games loaded` (make the component async). Preview shows `6 games loaded`. Remove the temp code after confirming.
- [ ] **Step 4: `npm test` still green; `npx tsc --noEmit` clean.**
- [ ] **Step 5: Commit & push** — `git add -A && git commit -m "Add typed public data layer" && git push`

---

### Task 8: Shared UI primitives

**Files:**
- Create: `src/components/ui.tsx`, `src/components/GameScoreLine.tsx`

**Interfaces:**
- Produces: `Section({title, action?, children})`, `Card({children, className?})`, `EmptyState({message})`, `PageTitle({children})`, `ResultBadge({game})` (W/L/T pill), `GameScoreLine({game})` (opponent, date, score line used on home/schedule).

- [ ] **Step 1: Create `src/components/ui.tsx`:**

```tsx
import Link from "next/link";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="pt-6 font-display text-2xl font-bold uppercase tracking-wider">{children}</h1>;
}

export function Section({ title, action, children }: { title: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gold-400">{title}</h2>
        {action && <Link href={action.href} className="text-xs text-steel-400 hover:text-gold-400">{action.label} →</Link>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-steel-700 bg-steel-900 p-4 ${className}`}>{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <Card className="text-center text-sm text-steel-400">{message}</Card>;
}
```

- [ ] **Step 2: Create `src/components/GameScoreLine.tsx`:**

```tsx
import Link from "next/link";
import { formatGameDay, formatGameTime } from "@/lib/format";
import type { Game } from "@/lib/types";

export function ResultBadge({ game }: { game: Game }) {
  if (game.status !== "final" || game.our_score === null || game.their_score === null) return null;
  const res = game.our_score > game.their_score ? "W" : game.our_score < game.their_score ? "L" : "T";
  const color = res === "W" ? "text-gold-400 border-gold-500" : "text-steel-400 border-steel-700";
  return <span className={`rounded border px-1.5 py-0.5 font-display text-xs font-bold ${color}`}>{res}</span>;
}

export default function GameScoreLine({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="flex min-h-14 items-center justify-between gap-3 px-1 py-2 hover:bg-steel-800/50">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {game.home_away === "home" ? "vs" : "@"} {game.opponent}
          {game.status === "canceled" && <span className="ml-2 text-xs uppercase text-steel-400">Canceled</span>}
        </p>
        <p className="text-xs text-steel-400">{formatGameDay(game.starts_at)} · {formatGameTime(game.starts_at)} · {game.location}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {game.status === "final" && game.our_score !== null && (
          <span className="font-display text-lg font-bold">{game.our_score}–{game.their_score}</span>
        )}
        <ResultBadge game={game} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `npx tsc --noEmit` clean. Commit & push** — `git add -A && git commit -m "Add shared UI primitives" && git push`

---

### Task 9: Home page

**Files:**
- Create: `src/components/Countdown.tsx`
- Modify: `src/app/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `getNextGame, getLatestFinal, getNewsPosts, getRecentPhotos, photoUrl, getGames` (Task 7), `computeTeamRecord` (Task 6), `formatRecord` (Task 2), UI primitives (Task 8).

- [ ] **Step 1: Create `src/components/Countdown.tsx`:**

```tsx
"use client";
import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const d = Math.floor(msLeft / 86_400_000);
  const h = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return { d, h, m };
}

export default function Countdown({ startsAt }: { startsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const left = new Date(startsAt).getTime() - now;
  if (left <= 0) return <p className="font-display text-gold-400">Game time!</p>;
  const { d, h, m } = parts(left);
  return (
    <div className="flex gap-4">
      {[[d, "days"], [h, "hrs"], [m, "min"]].map(([v, label]) => (
        <div key={label as string} className="text-center">
          <p className="font-display text-3xl font-bold text-gold-400">{v}</p>
          <p className="text-xs uppercase tracking-wider text-steel-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`:**

```tsx
import Image from "next/image";
import { getGames, getLatestFinal, getNewsPosts, getNextGame, getRecentPhotos, photoUrl } from "@/lib/queries";
import { computeTeamRecord } from "@/lib/stats";
import { formatGameDay, formatGameTime, formatRecord } from "@/lib/format";
import { Card, EmptyState, Section } from "@/components/ui";
import GameScoreLine from "@/components/GameScoreLine";
import Countdown from "@/components/Countdown";

export default async function Home() {
  const [games, next, latest, news, photos] = await Promise.all([
    getGames(), getNextGame(), getLatestFinal(), getNewsPosts(3), getRecentPhotos(8),
  ]);
  const { w, l, t } = computeTeamRecord(games);

  return (
    <div className="pb-10">
      <div className="mt-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-steel-400">Coed Softball</p>
        <h1 className="mt-1 font-display text-4xl font-bold uppercase tracking-widest text-gold-400 md:text-5xl">Beskar Bandits</h1>
        <p className="mt-2 font-display text-sm uppercase tracking-widest text-steel-100">{formatRecord(w, l, t)} this season</p>
      </div>

      <Section title="Next Game" action={{ href: "/schedule", label: "Full schedule" }}>
        {next ? (
          <Card className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-lg font-medium">{next.home_away === "home" ? "vs" : "@"} {next.opponent}</p>
              <p className="text-sm text-steel-400">{formatGameDay(next.starts_at)} · {formatGameTime(next.starts_at)} · {next.location}</p>
            </div>
            <Countdown startsAt={next.starts_at} />
          </Card>
        ) : <EmptyState message="No games on the calendar — season starts soon." />}
      </Section>

      <Section title="Last Result" action={{ href: "/schedule", label: "All results" }}>
        {latest ? <Card className="p-0"><GameScoreLine game={latest} /></Card> : <EmptyState message="No results yet." />}
      </Section>

      <Section title="News" action={{ href: "/news", label: "All news" }}>
        {news.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {news.map((p) => (
              <Card key={p.id}>
                <a href={`/news/${p.slug}`} className="font-medium hover:text-gold-400">{p.title}</a>
                <p className="mt-1 text-xs text-steel-400">{formatGameDay(p.published_at)}</p>
              </Card>
            ))}
          </div>
        ) : <EmptyState message="No news yet. The front office is quiet." />}
      </Section>

      <Section title="Recent Photos" action={{ href: "/photos", label: "All photos" }}>
        {photos.length ? (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded">
                <Image src={photoUrl(p.storage_path)} alt={p.caption ?? "Team photo"} fill sizes="25vw" className="object-cover" />
              </div>
            ))}
          </div>
        ) : <EmptyState message="No photos yet — bring a phone to the next game." />}
      </Section>
    </div>
  );
}
```

- [ ] **Step 3: Allow Supabase-hosted images.** In `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "uiianteimptqehtfqzqj.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify in preview** at 390px: hero, record line, countdown ticking, last result W badge, 3 news cards stacked, photo empty-state (no photos yet). No horizontal scroll. Desktop: news cards in one row.
- [ ] **Step 5: Commit & push** — `git add -A && git commit -m "Add home page with countdown, record, and content sections" && git push`

---

### Task 10: Schedule + game detail (box score)

**Files:**
- Create: `src/app/schedule/page.tsx`, `src/app/games/[id]/page.tsx`, `src/components/BoxScoreTable.tsx`, `src/components/YouTubeEmbed.tsx`

**Interfaces:**
- Consumes: queries (Task 7), `battingAvg` (Task 6), UI (Task 8), `parseYouTubeId` NOT needed here (ids already stored parsed).
- Produces: `BoxScoreTable({lines})` (mobile: sticky first column + horizontal scroll), `YouTubeEmbed({videoId, title?})` (facade: thumbnail until tapped) — reused by highlights page.

- [ ] **Step 1: `src/app/schedule/page.tsx`:**

```tsx
import { getGames } from "@/lib/queries";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";
import GameScoreLine from "@/components/GameScoreLine";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const games = await getGames();
  const upcoming = games.filter((g) => g.status === "upcoming");
  const played = games.filter((g) => g.status !== "upcoming").reverse();

  if (!games.length) return (<div><PageTitle>Schedule</PageTitle><div className="mt-4"><EmptyState message="No games scheduled yet — season starts soon." /></div></div>);

  return (
    <div className="pb-10">
      <PageTitle>Schedule</PageTitle>
      <Section title="Upcoming">
        {upcoming.length ? (
          <Card className="divide-y divide-steel-700 p-0">{upcoming.map((g) => <GameScoreLine key={g.id} game={g} />)}</Card>
        ) : <EmptyState message="Nothing on the calendar." />}
      </Section>
      <Section title="Results">
        {played.length ? (
          <Card className="divide-y divide-steel-700 p-0">{played.map((g) => <GameScoreLine key={g.id} game={g} />)}</Card>
        ) : <EmptyState message="No games played yet." />}
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/BoxScoreTable.tsx`** (the mobile-first table pattern used across the site):

```tsx
import { battingAvg } from "@/lib/stats";
import type { StatLine } from "@/lib/types";

type Line = StatLine & { player: { id: string; name: string; jersey_number: number | null } };
const cols = ["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K", "AVG"] as const;

export default function BoxScoreTable({ lines }: { lines: Line[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
          <tr>
            <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>
            {cols.map((c) => <th key={c} className="px-2 py-2 text-right">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-700">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="sticky left-0 bg-steel-900 px-3 py-2">
                <span className="text-steel-400">{l.player.jersey_number ?? "–"}</span> {l.player.name}
              </td>
              {[l.ab, l.r, l.h, l.doubles, l.triples, l.hr, l.rbi, l.bb, l.k].map((v, i) => (
                <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
              ))}
              <td className="px-2 py-2 text-right tabular-nums">{battingAvg(l.h, l.ab)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/YouTubeEmbed.tsx`** (facade — no iframe until tap):

```tsx
"use client";
import { useState } from "react";

export default function YouTubeEmbed({ videoId, title = "Highlight video" }: { videoId: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
      />
    );
  }
  return (
    <button onClick={() => setPlaying(true)} aria-label={`Play ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg border border-steel-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={title} className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-steel-950/40 group-hover:bg-steel-950/20">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 font-display text-xl text-steel-950">▶</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 4: `src/app/games/[id]/page.tsx`** (Next 15: `params` is a Promise):

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbumForGame, getGame, getGameStatLines } from "@/lib/queries";
import { formatGameDay, formatGameTime } from "@/lib/format";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";
import { ResultBadge } from "@/components/GameScoreLine";
import BoxScoreTable from "@/components/BoxScoreTable";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();
  const [lines, album] = await Promise.all([getGameStatLines(id), getAlbumForGame(id)]);

  return (
    <div className="pb-10">
      <PageTitle>{game.home_away === "home" ? "vs" : "@"} {game.opponent}</PageTitle>
      <p className="mt-1 text-sm text-steel-400">{formatGameDay(game.starts_at)} · {formatGameTime(game.starts_at)} · {game.location}</p>

      <Card className="mt-4 flex items-center justify-center gap-4">
        {game.status === "final" && game.our_score !== null ? (
          <>
            <span className="font-display text-5xl font-bold text-gold-400">{game.our_score}</span>
            <span className="text-steel-400">–</span>
            <span className="font-display text-5xl font-bold">{game.their_score}</span>
            <ResultBadge game={game} />
          </>
        ) : game.status === "canceled" ? (
          <span className="font-display uppercase tracking-widest text-steel-400">Canceled</span>
        ) : (
          <span className="font-display uppercase tracking-widest text-steel-400">Upcoming</span>
        )}
      </Card>

      <Section title="Box Score">
        {lines.length ? <BoxScoreTable lines={lines} /> : <EmptyState message="Box score not entered yet." />}
      </Section>

      {game.youtube_video_ids.length > 0 && (
        <Section title="Highlights">
          <div className="grid gap-4 md:grid-cols-2">
            {game.youtube_video_ids.map((v) => <YouTubeEmbed key={v} videoId={v} />)}
          </div>
        </Section>
      )}

      {album && (
        <Section title="Photos">
          <Link href={`/photos/${album.id}`} className="text-sm text-gold-400 hover:underline">{album.title} →</Link>
        </Section>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify in preview** (390px): schedule shows Upcoming (2) + Results (4, newest first, W/L badges); tap a final → score header + box score scrolls horizontally with player column pinned; canceled game shows Canceled. `npm test` green.
- [ ] **Step 6: Commit & push** — `git add -A && git commit -m "Add schedule and game pages with mobile box score" && git push`

---

### Task 11: Stats + roster + player pages

**Files:**
- Create: `src/app/stats/page.tsx`, `src/components/StatsTable.tsx` (client, sortable), `src/app/roster/page.tsx`, `src/app/roster/[id]/page.tsx`

**Interfaces:**
- Consumes: `getSeasonStatLineInputs, getGames, getRoster, getPlayer, getPlayerGameLog` (Task 7), stats engine (Task 6), UI (Task 8), `BoxScoreTable` pattern (Task 10 — player log reuses table styling but is its own markup).
- Produces: `StatsTable({ rows }: { rows: SeasonStatRow[] })` client component with tap-to-sort column headers.

- [ ] **Step 1: `src/components/StatsTable.tsx`:**

```tsx
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { battingAvg, type SeasonStatRow } from "@/lib/stats";

const cols = [
  ["games", "G"], ["ab", "AB"], ["r", "R"], ["h", "H"], ["doubles", "2B"], ["triples", "3B"],
  ["hr", "HR"], ["rbi", "RBI"], ["bb", "BB"], ["k", "K"], ["avg", "AVG"],
] as const;
type SortKey = (typeof cols)[number][0];

export default function StatsTable({ rows }: { rows: SeasonStatRow[] }) {
  const [sort, setSort] = useState<SortKey>("avg");
  const sorted = useMemo(
    () => [...rows].sort((a, b) => ((b[sort] ?? -1) as number) - ((a[sort] ?? -1) as number)),
    [rows, sort]
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
          <tr>
            <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>
            {cols.map(([key, label]) => (
              <th key={key} className="px-1 py-1 text-right">
                <button onClick={() => setSort(key)}
                  className={`min-h-11 min-w-9 px-1 ${sort === key ? "text-gold-400" : ""}`}>
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-700">
          {sorted.map((r) => (
            <tr key={r.player_id}>
              <td className="sticky left-0 bg-steel-900 px-3 py-2">
                <Link href={`/roster/${r.player_id}`} className="hover:text-gold-400">
                  <span className="text-steel-400">{r.jersey_number ?? "–"}</span> {r.player_name}
                </Link>
              </td>
              {[r.games, r.ab, r.r, r.h, r.doubles, r.triples, r.hr, r.rbi, r.bb, r.k].map((v, i) => (
                <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
              ))}
              <td className="px-2 py-2 text-right font-medium tabular-nums text-gold-400">{battingAvg(r.h, r.ab)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: `src/app/stats/page.tsx`:**

```tsx
import { getGames, getSeasonStatLineInputs } from "@/lib/queries";
import { computeSeasonStats, computeTeamRecord } from "@/lib/stats";
import { formatRecord } from "@/lib/format";
import { EmptyState, PageTitle } from "@/components/ui";
import StatsTable from "@/components/StatsTable";

export const metadata = { title: "Stats" };

export default async function StatsPage() {
  const [inputs, games] = await Promise.all([getSeasonStatLineInputs(), getGames()]);
  const rows = computeSeasonStats(inputs);
  const { w, l, t } = computeTeamRecord(games);

  return (
    <div className="pb-10">
      <PageTitle>Season Stats</PageTitle>
      <p className="mt-1 font-display text-sm uppercase tracking-widest text-steel-400">Team record: {formatRecord(w, l, t)}</p>
      <div className="mt-4">
        {rows.length ? <StatsTable rows={rows} /> : <EmptyState message="Stats appear after the first box score is entered." />}
      </div>
      <p className="mt-2 text-xs text-steel-400">Tap a column to sort. AVG = H ÷ AB.</p>
    </div>
  );
}
```

- [ ] **Step 3: `src/app/roster/page.tsx`:**

```tsx
import Image from "next/image";
import Link from "next/link";
import { getRoster } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  const players = await getRoster();
  return (
    <div className="pb-10">
      <PageTitle>Roster</PageTitle>
      {players.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {players.map((p) => (
            <Link key={p.id} href={`/roster/${p.id}`}>
              <Card className="text-center hover:border-gold-500">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-steel-700 bg-steel-800">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-2xl font-bold text-steel-400">
                      {p.jersey_number ?? "?"}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate font-medium">{p.name}</p>
                <p className="text-xs text-steel-400">#{p.jersey_number ?? "–"} · {p.positions.join("/") || "UT"}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : <div className="mt-4"><EmptyState message="Roster coming soon." /></div>}
    </div>
  );
}
```

- [ ] **Step 4: `src/app/roster/[id]/page.tsx`:**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayerGameLog } from "@/lib/queries";
import { battingAvg, computeSeasonStats } from "@/lib/stats";
import { formatGameDay } from "@/lib/format";
import { Card, EmptyState, PageTitle, Section } from "@/components/ui";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();
  const log = await getPlayerGameLog(id);
  const season = computeSeasonStats(log.map((l) => ({
    player_id: id, player_name: player.name, jersey_number: player.jersey_number,
    ab: l.ab, r: l.r, h: l.h, doubles: l.doubles, triples: l.triples, hr: l.hr, rbi: l.rbi, bb: l.bb, k: l.k,
  })))[0];

  return (
    <div className="pb-10">
      <PageTitle>#{player.jersey_number ?? "–"} {player.name}</PageTitle>
      <p className="mt-1 text-sm text-steel-400">{player.positions.join(" / ") || "Utility"}</p>
      {player.bio && <p className="mt-2 text-sm">{player.bio}</p>}
      {player.walkup_song && <p className="mt-1 text-xs text-steel-400">Walk-up: {player.walkup_song}</p>}

      <Section title="Season">
        {season ? (
          <div className="grid grid-cols-4 gap-2 text-center md:grid-cols-8">
            {([["G", season.games], ["AB", season.ab], ["H", season.h], ["HR", season.hr], ["RBI", season.rbi], ["R", season.r], ["BB", season.bb], ["AVG", battingAvg(season.h, season.ab)]] as const).map(([k, v]) => (
              <Card key={k} className="p-2">
                <p className="font-display text-lg font-bold text-gold-400">{v}</p>
                <p className="text-[10px] uppercase tracking-wider text-steel-400">{k}</p>
              </Card>
            ))}
          </div>
        ) : <EmptyState message="No at-bats yet." />}
      </Section>

      <Section title="Game Log">
        {log.length ? (
          <div className="overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-steel-800 font-display text-xs uppercase tracking-wider text-steel-400">
                <tr>
                  <th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Game</th>
                  {["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K"].map((c) => <th key={c} className="px-2 py-2 text-right">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700">
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="sticky left-0 bg-steel-900 px-3 py-2">
                      <Link href={`/games/${l.game.id}`} className="hover:text-gold-400">
                        {formatGameDay(l.game.starts_at)} · {l.game.opponent}
                      </Link>
                    </td>
                    {[l.ab, l.r, l.h, l.doubles, l.triples, l.hr, l.rbi, l.bb, l.k].map((v, i) => (
                      <td key={i} className="px-2 py-2 text-right tabular-nums">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No games played yet." />}
      </Section>
    </div>
  );
}
```

- [ ] **Step 5: Verify in preview** (390px): stats table sorts on header tap (AVG highlighted by default), roster grid 2-wide, player page stat tiles 4-wide. Desktop: roster 4-wide, tiles 8-wide. `npm test` + `npx tsc --noEmit` green.
- [ ] **Step 6: Commit & push** — `git add -A && git commit -m "Add stats, roster, and player pages" && git push`

---

### Task 12: News, photos, highlights pages

**Files:**
- Create: `src/app/news/page.tsx`, `src/app/news/[slug]/page.tsx`, `src/app/photos/page.tsx`, `src/app/photos/[albumId]/page.tsx`, `src/components/PhotoGrid.tsx` (client lightbox), `src/app/highlights/page.tsx`

**Interfaces:**
- Consumes: queries (Task 7), UI (Task 8), `YouTubeEmbed` (Task 10), `formatGameDay` (Task 2).
- Produces: `PhotoGrid({ photos }: { photos: { id: string; url: string; caption: string | null }[] })` — grid + full-screen lightbox dialog with prev/next.

- [ ] **Step 1: Install markdown renderer**

```bash
npm install react-markdown
```

- [ ] **Step 2: `src/app/news/page.tsx`:**

```tsx
import Link from "next/link";
import { getNewsPosts } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

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
```

- [ ] **Step 3: `src/app/news/[slug]/page.tsx`:**

```tsx
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getNewsPost } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

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
```

- [ ] **Step 4: `src/components/PhotoGrid.tsx`:**

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";

interface GridPhoto { id: string; url: string; caption: string | null }

export default function PhotoGrid({ photos }: { photos: GridPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 md:gap-2">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(i)} aria-label={p.caption ?? "View photo"}
            className="relative aspect-square overflow-hidden rounded">
            <Image src={p.url} alt={p.caption ?? "Team photo"} fill sizes="(max-width: 768px) 33vw, 25vw" className="object-cover" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-steel-950/95" onClick={() => setOpen(null)}>
          <div className="flex justify-between p-4">
            <button onClick={(e) => { e.stopPropagation(); setOpen(open > 0 ? open - 1 : photos.length - 1); }}
              className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">‹</button>
            <button onClick={() => setOpen(null)} className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">✕</button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(open < photos.length - 1 ? open + 1 : 0); }}
              className="min-h-11 min-w-11 rounded border border-steel-700 text-steel-100">›</button>
          </div>
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[open].url} alt={photos[open].caption ?? "Team photo"} fill sizes="100vw" className="object-contain" />
          </div>
          {photos[open].caption && <p className="p-4 text-center text-sm text-steel-400">{photos[open].caption}</p>}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: `src/app/photos/page.tsx` and `src/app/photos/[albumId]/page.tsx`:**

```tsx
// photos/page.tsx
import Link from "next/link";
import { getAlbums } from "@/lib/queries";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export const metadata = { title: "Photos" };

export default async function PhotosPage() {
  const albums = await getAlbums();
  return (
    <div className="pb-10">
      <PageTitle>Photos</PageTitle>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {albums.length ? albums.map((a) => (
          <Link key={a.id} href={`/photos/${a.id}`}>
            <Card className="hover:border-gold-500">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs text-steel-400">{a.photos[0]?.count ?? 0} photos · {formatGameDay(a.created_at)}</p>
            </Card>
          </Link>
        )) : <EmptyState message="No albums yet — bring a phone to the next game." />}
      </div>
    </div>
  );
}
```

```tsx
// photos/[albumId]/page.tsx
import { notFound } from "next/navigation";
import { getAlbum, photoUrl } from "@/lib/queries";
import { EmptyState, PageTitle } from "@/components/ui";
import PhotoGrid from "@/components/PhotoGrid";

export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params;
  const album = await getAlbum(albumId);
  if (!album) notFound();
  const photos = album.photos
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => ({ id: p.id, url: photoUrl(p.storage_path), caption: p.caption }));
  return (
    <div className="pb-10">
      <PageTitle>{album.title}</PageTitle>
      <div className="mt-4">
        {photos.length ? <PhotoGrid photos={photos} /> : <EmptyState message="This album is empty so far." />}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `src/app/highlights/page.tsx`:**

```tsx
import { getGamesWithVideos } from "@/lib/queries";
import { EmptyState, PageTitle, Section } from "@/components/ui";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { formatGameDay } from "@/lib/format";

export const metadata = { title: "Highlights" };

export default async function HighlightsPage() {
  const games = await getGamesWithVideos();
  return (
    <div className="pb-10">
      <PageTitle>Highlights</PageTitle>
      {games.length ? games.map((g) => (
        <Section key={g.id} title={`${g.home_away === "home" ? "vs" : "@"} ${g.opponent} · ${formatGameDay(g.starts_at)}`}>
          <div className="grid gap-4 md:grid-cols-2">
            {g.youtube_video_ids.map((v) => <YouTubeEmbed key={v} videoId={v} />)}
          </div>
        </Section>
      )) : <div className="mt-4"><EmptyState message="No highlight videos yet. Upload clips to YouTube and attach them to a game in the admin." /></div>}
    </div>
  );
}
```

- [ ] **Step 7: Verify in preview** (390px + desktop): news renders markdown bold/links in gold; photos album grid; empty album message; highlights facade loads thumbnail only (check Network tab: no youtube iframe until tap). `npm test` + `npx tsc --noEmit` green.
- [ ] **Step 8: Commit & push** — `git add -A && git commit -m "Add news, photos, and highlights pages" && git push`

---

### Task 13: Admin — players, games, box scores

**Files:**
- Create: `src/app/admin/actions.ts` (all server actions), `src/app/admin/players/page.tsx`, `src/app/admin/games/page.tsx`, `src/app/admin/games/[id]/page.tsx`, `src/components/admin/PlayerForm.tsx`, `src/components/admin/GameForm.tsx`, `src/components/admin/BoxScoreForm.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 5), types (Task 7), `parseYouTubeId` (Task 2).
- Produces server actions (all `"use server"`, all call `requireAdmin()` first, all `revalidatePath("/", "layout")` on success):
  - `savePlayer(formData)` — insert or update by hidden `id`; fields: name, jersey_number, positions (comma string → array), bio, walkup_song, active (checkbox)
  - `saveGame(formData)` — insert/update; fields: opponent, date (YYYY-MM-DD), time (HH:mm, Eastern), location, home_away, status, our_score, their_score, youtube_urls (one per line → parsed ids)
  - `saveBoxScore(formData)` — upserts one stat_lines row per player with any non-empty stat; deletes rows for players cleared to all-empty; also sets game scores + status=final
- Eastern-time conversion helper `easternToIso(date: string, time: string): string` in `src/lib/format.ts` (append; convert local-Eastern wall time to UTC ISO using `Intl` offset math — implementation below).

- [ ] **Step 1: Append `easternToIso` to `src/lib/format.ts`** + tests in `tests/format.test.ts`:

```ts
// format.ts (append)
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
```

```ts
// tests/format.test.ts (append)
import { easternToIso } from "../src/lib/format";
it("converts summer Eastern wall time to UTC", () => {
  expect(easternToIso("2026-08-07", "19:30")).toBe("2026-08-07T23:30:00.000Z");
});
it("converts winter Eastern wall time to UTC", () => {
  expect(easternToIso("2026-01-09", "19:30")).toBe("2026-01-10T00:30:00.000Z");
});
```

Run `npm test` (fails first, then passes after implementing — standard cycle).

- [ ] **Step 2: `src/app/admin/actions.ts`:**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { easternToIso } from "@/lib/format";
import { parseYouTubeId } from "@/lib/youtube";

const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";
const intOrNull = (fd: FormData, k: string) => { const v = str(fd, k); return v === "" ? null : Number(v); };

export async function savePlayer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const row = {
    name: str(formData, "name"),
    jersey_number: intOrNull(formData, "jersey_number"),
    positions: str(formData, "positions").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    bio: str(formData, "bio") || null,
    walkup_song: str(formData, "walkup_song") || null,
    active: formData.get("active") === "on",
  };
  const { error } = id
    ? await supabase.from("players").update(row).eq("id", id)
    : await supabase.from("players").insert(row);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/players");
}

export async function saveGame(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const row = {
    opponent: str(formData, "opponent"),
    starts_at: easternToIso(str(formData, "date"), str(formData, "time")),
    location: str(formData, "location"),
    home_away: str(formData, "home_away"),
    status: str(formData, "status"),
    our_score: intOrNull(formData, "our_score"),
    their_score: intOrNull(formData, "their_score"),
    youtube_video_ids: str(formData, "youtube_urls").split("\n").map((l) => parseYouTubeId(l)).filter((v): v is string => v !== null),
  };
  const { error } = id
    ? await supabase.from("games").update(row).eq("id", id)
    : await supabase.from("games").insert(row);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/games");
}

export async function saveBoxScore(formData: FormData) {
  const { supabase } = await requireAdmin();
  const gameId = str(formData, "game_id");
  const playerIds = formData.getAll("player_id") as string[];
  const fields = ["ab", "r", "h", "doubles", "triples", "hr", "rbi", "bb", "k"] as const;

  const upserts = [];
  const clears = [];
  for (const pid of playerIds) {
    const values = fields.map((f) => str(formData, `stat_${pid}_${f}`));
    if (values.every((v) => v === "")) { clears.push(pid); continue; }
    upserts.push({
      game_id: gameId, player_id: pid,
      ...Object.fromEntries(fields.map((f, i) => [f, values[i] === "" ? 0 : Number(values[i])])),
    });
  }
  if (upserts.length) {
    const { error } = await supabase.from("stat_lines").upsert(upserts, { onConflict: "game_id,player_id" });
    if (error) throw error;
  }
  if (clears.length) {
    const { error } = await supabase.from("stat_lines").delete().eq("game_id", gameId).in("player_id", clears);
    if (error) throw error;
  }
  const our = intOrNull(formData, "our_score"), their = intOrNull(formData, "their_score");
  if (our !== null && their !== null) {
    const { error } = await supabase.from("games").update({ our_score: our, their_score: their, status: "final" }).eq("id", gameId);
    if (error) throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/admin/games/${gameId}`);
}
```

- [ ] **Step 3: Forms.** `src/components/admin/PlayerForm.tsx` (also defines the shared input style used by all admin forms):

```tsx
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
```

`src/components/admin/GameForm.tsx` (date/time split into Eastern-local fields; scores optional):

```tsx
import type { Game } from "@/lib/types";
import { saveGame } from "@/app/admin/actions";
import { inputCls, labelCls, btnCls } from "./PlayerForm";

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
      <div className="md:col-span-2"><button className={btnCls}>{game ? "Save game" : "Add game"}</button></div>
    </form>
  );
}
```

`src/components/admin/BoxScoreForm.tsx` (the parking-lot grid — number inputs, `inputMode="numeric"`):

```tsx
import type { Player, StatLine } from "@/lib/types";
import { saveBoxScore } from "@/app/admin/actions";
import { btnCls, labelCls } from "./PlayerForm";

const fields = ["ab", "r", "h", "doubles", "triples", "hr", "rbi", "bb", "k"] as const;
const headers = ["AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "K"];

export default function BoxScoreForm({ gameId, players, lines, ourScore, theirScore }: {
  gameId: string; players: Player[]; lines: StatLine[]; ourScore: number | null; theirScore: number | null;
}) {
  const byPlayer = new Map(lines.map((l) => [l.player_id, l]));
  const cell = "h-11 w-11 rounded border border-steel-700 bg-steel-950 text-center text-steel-100";
  return (
    <form action={saveBoxScore}>
      <input type="hidden" name="game_id" value={gameId} />
      <div className="flex gap-3">
        <div><label className={labelCls}>Our score</label><input name="our_score" type="number" inputMode="numeric" defaultValue={ourScore ?? ""} className={cell + " w-16"} /></div>
        <div><label className={labelCls}>Their score</label><input name="their_score" type="number" inputMode="numeric" defaultValue={theirScore ?? ""} className={cell + " w-16"} /></div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-steel-700 bg-steel-900">
        <table className="text-sm">
          <thead className="bg-steel-800 font-display text-xs uppercase text-steel-400">
            <tr><th className="sticky left-0 bg-steel-800 px-3 py-2 text-left">Player</th>{headers.map((h) => <th key={h} className="px-1 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-steel-700">
            {players.map((p) => {
              const line = byPlayer.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="sticky left-0 bg-steel-900 px-3 py-1 whitespace-nowrap">
                    <input type="hidden" name="player_id" value={p.id} />
                    <span className="text-steel-400">{p.jersey_number ?? "–"}</span> {p.name}
                  </td>
                  {fields.map((f) => (
                    <td key={f} className="px-1 py-1">
                      <input name={`stat_${p.id}_${f}`} type="number" inputMode="numeric" min={0}
                        defaultValue={line ? String(line[f]) : ""} className={cell} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-steel-400">Leave a player's whole row blank if they didn't play. Filling any score marks the game Final.</p>
      <button className={btnCls + " mt-3"}>Save box score</button>
    </form>
  );
}
```

- [ ] **Step 4: Admin pages.** `src/app/admin/players/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/supabase/server";
import type { Player } from "@/lib/types";
import PlayerForm from "@/components/admin/PlayerForm";
import { Card } from "@/components/ui";

export default async function AdminPlayers() {
  const { supabase } = await requireAdmin();
  const { data: players } = await supabase.from("players").select("*").order("jersey_number");
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Add player</h2><PlayerForm /></Card>
      {(players as Player[] | null)?.map((p) => (
        <Card key={p.id}><h3 className="mb-3 font-display text-sm text-steel-400">#{p.jersey_number ?? "–"} {p.name}{p.active ? "" : " (inactive)"}</h3><PlayerForm player={p} /></Card>
      ))}
    </div>
  );
}
```

`src/app/admin/games/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import type { Game } from "@/lib/types";
import GameForm from "@/components/admin/GameForm";
import { Card } from "@/components/ui";
import { formatGameDay } from "@/lib/format";

export default async function AdminGames() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("games").select("*").order("starts_at", { ascending: false });
  const games = (data ?? []) as Game[];
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Add game</h2><GameForm /></Card>
      <Card className="divide-y divide-steel-700 p-0">
        {games.map((g) => (
          <Link key={g.id} href={`/admin/games/${g.id}`} className="flex min-h-12 items-center justify-between px-4 py-2 hover:bg-steel-800/50">
            <span>{formatGameDay(g.starts_at)} · {g.home_away === "home" ? "vs" : "@"} {g.opponent}</span>
            <span className="text-sm text-steel-400">{g.status === "final" ? `${g.our_score}–${g.their_score}` : g.status} · edit →</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
```

`src/app/admin/games/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import type { Game, Player, StatLine } from "@/lib/types";
import GameForm from "@/components/admin/GameForm";
import BoxScoreForm from "@/components/admin/BoxScoreForm";
import { Card } from "@/components/ui";

export default async function AdminGameDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: game }, { data: players }, { data: lines }] = await Promise.all([
    supabase.from("games").select("*").eq("id", id).maybeSingle(),
    supabase.from("players").select("*").eq("active", true).order("jersey_number"),
    supabase.from("stat_lines").select("*").eq("game_id", id),
  ]);
  if (!game) notFound();
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Game details</h2><GameForm game={game as Game} /></Card>
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">Box score</h2>
        <BoxScoreForm gameId={id} players={(players ?? []) as Player[]} lines={(lines ?? []) as StatLine[]}
          ourScore={(game as Game).our_score} theirScore={(game as Game).their_score} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Verify in preview** signed in as Kevin: add a player → appears on /roster; edit a game score via box score grid → /stats and game page update immediately (revalidate worked); box score grid scrolls horizontally on 390px with name column pinned; entering stats for an upcoming seed game flips it to Final.
- [ ] **Step 6: `npm test` + `npx tsc --noEmit` green. Commit & push** — `git add -A && git commit -m "Add admin players, games, and box score entry" && git push`

---

### Task 14: Admin — news + albums/photo upload

**Files:**
- Create: `src/app/admin/news/page.tsx`, `src/app/admin/photos/page.tsx`, `src/components/admin/NewsForm.tsx`, `src/components/admin/AlbumForm.tsx`, `src/components/admin/PhotoUploader.tsx`
- Modify: `src/app/admin/actions.ts` (append `saveNewsPost`, `saveAlbum`, `deletePhoto`)

**Interfaces:**
- Consumes: everything prior.
- Produces: `saveNewsPost(formData)` (title, slug auto from title if blank, body markdown), `saveAlbum(formData)` (title, optional game_id), `deletePhoto(formData)` (photo id + storage_path); `PhotoUploader({ albumId })` client component — compresses to ≤0.5MB/1600px, uploads to `photos` bucket at `{albumId}/{uuid}.jpg`, inserts `photos` row, refreshes.

- [ ] **Step 1: Install compressor**

```bash
npm install browser-image-compression
```

- [ ] **Step 2: Append to `src/app/admin/actions.ts`:**

```ts
export async function saveNewsPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = str(formData, "id");
  const title = str(formData, "title");
  const slug = (str(formData, "slug") || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const row = { title, slug, body: str(formData, "body"), author_profile_id: user.id };
  const { error } = id
    ? await supabase.from("news_posts").update(row).eq("id", id)
    : await supabase.from("news_posts").insert(row);
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/news");
}

export async function saveAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const gameId = str(formData, "game_id");
  const { error } = await supabase.from("albums").insert({ title: str(formData, "title"), game_id: gameId || null });
  if (error) throw error;
  revalidatePath("/", "layout");
  redirect("/admin/photos");
}

export async function deletePhoto(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const path = str(formData, "storage_path");
  const { error: dbError } = await supabase.from("photos").delete().eq("id", id);
  if (dbError) throw dbError;
  const { error: storageError } = await supabase.storage.from("photos").remove([path]);
  if (storageError) throw storageError;
  revalidatePath("/", "layout");
}
```

- [ ] **Step 3: `src/components/admin/NewsForm.tsx`:**

```tsx
import type { NewsPost } from "@/lib/types";
import { saveNewsPost } from "@/app/admin/actions";
import { inputCls, labelCls, btnCls } from "./PlayerForm";

export default function NewsForm({ post }: { post?: NewsPost }) {
  return (
    <form action={saveNewsPost} className="space-y-3">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div><label className={labelCls}>Title</label><input name="title" required defaultValue={post?.title} className={inputCls} /></div>
      <div><label className={labelCls}>Slug (blank = auto)</label><input name="slug" defaultValue={post?.slug} className={inputCls} /></div>
      <div><label className={labelCls}>Body (markdown)</label><textarea name="body" rows={8} defaultValue={post?.body} className={inputCls + " py-2"} /></div>
      <button className={btnCls}>{post ? "Save post" : "Publish post"}</button>
    </form>
  );
}
```

- [ ] **Step 4: `src/components/admin/PhotoUploader.tsx`:**

```tsx
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export default function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const supabase = createClient();
    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      const compressed = await imageCompression(files[i], { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true });
      const path = `${albumId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, compressed, { contentType: "image/jpeg" });
      if (upErr) { setStatus(`Upload failed: ${upErr.message}`); return; }
      const { error: dbErr } = await supabase.from("photos").insert({ album_id: albumId, storage_path: path });
      if (dbErr) { setStatus(`Save failed: ${dbErr.message}`); return; }
    }
    setStatus("Done!");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)}
        className="block w-full text-sm text-steel-400 file:mr-3 file:min-h-11 file:rounded file:border-0 file:bg-gold-500 file:px-4 file:font-display file:font-bold file:uppercase file:text-steel-950" />
      {status && <p className="mt-2 text-xs text-steel-400">{status}</p>}
    </div>
  );
}
```

`src/components/admin/AlbumForm.tsx`:

```tsx
import type { Game } from "@/lib/types";
import { saveAlbum } from "@/app/admin/actions";
import { formatGameDay } from "@/lib/format";
import { inputCls, labelCls, btnCls } from "./PlayerForm";

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
      <div className="md:col-span-2"><button className={btnCls}>Create album</button></div>
    </form>
  );
}
```

- [ ] **Step 5: Pages.** `src/app/admin/news/page.tsx`:

```tsx
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
```

`src/app/admin/photos/page.tsx`:

```tsx
import Image from "next/image";
import { requireAdmin } from "@/lib/supabase/server";
import type { Album, Game, Photo } from "@/lib/types";
import { photoUrl } from "@/lib/queries";
import { deletePhoto } from "@/app/admin/actions";
import AlbumForm from "@/components/admin/AlbumForm";
import PhotoUploader from "@/components/admin/PhotoUploader";
import { Card } from "@/components/ui";

export default async function AdminPhotos() {
  const { supabase } = await requireAdmin();
  const [{ data: albums }, { data: games }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").order("created_at", { ascending: false }),
    supabase.from("games").select("*").order("starts_at", { ascending: false }),
    supabase.from("photos").select("*"),
  ]);
  const photosByAlbum = new Map<string, Photo[]>();
  ((photos ?? []) as Photo[]).forEach((p) => {
    photosByAlbum.set(p.album_id, [...(photosByAlbum.get(p.album_id) ?? []), p]);
  });
  return (
    <div className="space-y-6">
      <Card><h2 className="mb-3 font-display font-bold uppercase tracking-wider">New album</h2><AlbumForm games={(games ?? []) as Game[]} /></Card>
      {((albums ?? []) as Album[]).map((a) => (
        <Card key={a.id}>
          <h3 className="mb-3 font-display text-sm text-steel-400">{a.title}</h3>
          <PhotoUploader albumId={a.id} />
          <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-6">
            {(photosByAlbum.get(a.id) ?? []).map((p) => (
              <form key={p.id} action={deletePhoto} className="relative aspect-square">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="storage_path" value={p.storage_path} />
                <Image src={photoUrl(p.storage_path)} alt="" fill sizes="20vw" className="rounded object-cover" />
                <button className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-steel-950/80 text-xs text-steel-100" aria-label="Delete photo">✕</button>
              </form>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Verify in preview** signed in: publish a news post (auto slug) → appears on /news with markdown rendered; create an album linked to a final game; upload 2-3 photos (drag real images) → compressed jpgs land in Storage, thumbnails render in admin, photos show on /photos/[albumId], home page photo strip fills, game page links the album; delete a photo → gone from site and Storage (verify in Supabase dashboard).
- [ ] **Step 7: `npm test` + `npx tsc --noEmit` green. Commit & push** — `git add -A && git commit -m "Add admin news editor and photo album uploads" && git push`

---

### Task 15: QA sweep, README, deploy to Vercel + analytics

**Files:**
- Create: `README.md`
- Modify: `src/app/layout.tsx` (add `<Analytics />`)

**Interfaces:**
- Consumes: the finished app.
- Produces: live site at `beskar-bandits.vercel.app` (or similar) with Web Analytics collecting.

- [ ] **Step 1: Full mobile QA pass** in preview at 390px, then 768px, then 1280px, both themes are dark-only (by design). Checklist — every public page: no horizontal body scroll; tables scroll within their container; bottom nav never overlaps content (pb-20 works); all tap targets ≥44px; every page renders sensibly with seed data AND with empty tables (temporarily filter queries to empty arrays if needed — or trust EmptyState coverage from earlier tasks). Fix anything found; commit fixes individually.

- [ ] **Step 2: Lighthouse-style sanity.** In preview: home page loads without console errors; Network tab shows no YouTube iframes before tap; photos served as compressed jpgs.

- [ ] **Step 3: Analytics.**

```bash
npm install @vercel/analytics
```

In `src/app/layout.tsx`: add `import { Analytics } from "@vercel/analytics/next";` and place `<Analytics />` just before `</body>`.

- [ ] **Step 4: `README.md`:**

```markdown
# Beskar Bandits

Team site for the Beskar Bandits coed softball team. Next.js + Supabase + Vercel.

## Local dev
1. `npm install`
2. `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase dashboard → Settings → API).
3. `npm run dev` → http://localhost:3000

## Stack
- Next.js (App Router) · Tailwind v4 · Supabase (Postgres/Auth/Storage) · Vitest
- DB schema: `supabase/migrations/` (applied via Supabase SQL Editor)
- Deploys: push to `main` → Vercel auto-deploy

## Admin
Sign in at `/login`. Admin accounts are flagged in the `profiles` table (`role = 'admin'`).
```

- [ ] **Step 5: Commit & push** — `git add -A && git commit -m "Add analytics, README, and mobile QA fixes" && git push`

- [ ] **Step 6: Kevin connects Vercel (walk him through, ~3 min):** vercel.com → sign in with GitHub → Add New → Project → Import `beskar-bandits` → Framework preset auto-detects Next.js → add env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (values from `.env.local`) → Deploy. Expected: build succeeds, site live at the assigned `*.vercel.app` URL.

- [ ] **Step 7: Enable Web Analytics:** Vercel dashboard → project → Analytics tab → Enable. Visit the live site from a phone; confirm a page view appears in the dashboard within a few minutes.

- [ ] **Step 8: Production smoke test** on the live URL (Kevin's phone + preview browser): home, schedule, a game page, stats sort, roster, a news post, photo album, highlights facade, `/login` → admin → edit something → public page updates. Expected: all work identically to local.

- [ ] **Step 9: Final commit if any fixes emerged; push.** Phase 1 complete. 🎉

---

## Post-Phase-1 backlog (do not build now)

- Phase 2: co-admin accounts, polished admin UX.
- Phase 3: player signup, RSVP, profile self-editing, player photo uploads, comments.
- Real content: wipe `002_dev_seed.sql` data (cleanup SQL is at the bottom of that file), enter real roster/schedule, team heads-up re: public names/photos.
- Optional: custom domain.
