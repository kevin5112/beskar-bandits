# Beskar Bandits Team Site — Design Spec

**Date:** 2026-07-25
**Status:** Approved design, pending implementation plan
**Owner:** Kevin Chen

## Overview

A public website for the Beskar Bandits, a coed softball team in a Disney employee league. The site showcases the team (schedule, full box scores, season stats, roster, news, photos, YouTube highlights) and gives teammates a logged-in area for RSVPs, profiles, photo uploads, and comments. Non-technical admins manage all content through a built-in admin panel.

This is a personal project — completely separate from Easy Street Capital work. Different git host (personal GitHub, not work Bitbucket), different hosting, no shared code or configs.

## Goals

1. A shareable, good-looking public home for the team that stays current all season.
2. Stats entered once (per-game box scores) with season totals derived automatically.
3. Non-technical teammates can run the site day-to-day (scores, news, photos) without touching code.
4. Players engage through RSVPs, profiles, photos, and comments.
5. Free to run (only optional cost: a custom domain, ~$12/yr).
6. Kevin learns Next.js along the way.
7. **Mobile-first**: most of the team will use the site from their phones — every page is designed for the phone screen first, desktop second.
8. Site traffic is visible to Kevin (page views, visitors, what's popular) via free analytics.

## Users & Roles

| Role | Who | Can do |
|---|---|---|
| Visitor (no login) | Anyone | View everything public: schedule, stats, roster, news, photos, highlights, comments (read-only) |
| Player | Teammates who sign up | Everything visitors can, plus: RSVP to games, edit own profile, upload photos to albums, write comments |
| Admin | Kevin + trusted teammates (captain, scorekeeper) | Everything players can, plus: manage games/box scores/news/roster/albums, delete any photo or comment, promote admins |

Roster entries exist independently of login accounts. An admin links a player's account to their roster spot after they sign up, so the site is complete even if some teammates never log in.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Kevin writes React daily; App Router is the current standard and a learning goal |
| Backend services | Supabase free tier | One service for Postgres, auth, and file storage; row-level security handles role-based permissions |
| Hosting | Vercel free tier (Hobby) | Auto-deploys from GitHub on push; PR preview URLs; free `*.vercel.app` subdomain |
| Code host | Personal GitHub, repo `beskar-bandits` (private is fine — the deployed site is public regardless) | |
| Styling | Tailwind CSS | Fits the from-scratch custom theme; standard in the Next.js ecosystem |

Alternatives considered: Firebase (clunkier SQL-style stat rollups, hosting outside the GitHub flow) and Express + MongoDB on Render (work-stack familiarity, but free tier sleeps the server and auth is hand-rolled). Rejected in favor of the above.

## Architecture

```
Browsers
   │
beskarbandits.vercel.app  (later: custom domain)
   │
Next.js app on Vercel ──── auto-deploys from GitHub `main`; PRs get preview URLs
   │
Supabase (one free project)
├── Postgres ── all structured data (tables below)
├── Auth ────── email/Google sign-in; roles via profiles table
└── Storage ─── photo files (client-side compressed before upload)
```

One repo, one app. Public site, player area, and admin panel are routes in the same Next.js app, gated by role. No separate API service.

### Setup sequence (one-time)

1. Create local project → `git init` → create private repo on personal GitHub → push.
2. Create Supabase account + project; note the project URL and anon/service keys.
3. Local dev via `npm run dev` against the real Supabase project (free tier is the dev environment too; a second free Supabase project can be added later as a dedicated dev DB if needed).
4. Create Vercel account (sign in with GitHub), import the repo, set the Supabase env vars. From then on every push to `main` deploys automatically.
5. Optional, anytime: buy a custom domain and point it at Vercel.

## Data Model (Postgres)

Season stats are **always computed** from `stat_lines` + `games` — never stored. No sync bugs.

| Table | Key columns |
|---|---|
| `profiles` | id (= auth user id), display_name, role (`admin` \| `player`), created_at |
| `players` | id, name, jersey_number, positions[], photo_url, bio, walkup_song, profile_id (nullable FK → profiles), active |
| `games` | id, opponent, starts_at, location/field, home_away, our_score, their_score, status (`upcoming` \| `final` \| `canceled`), youtube_video_ids[] |
| `stat_lines` | id, game_id FK, player_id FK, ab, r, h, doubles, triples, hr, rbi, bb, k — one row per player per game; unique (game_id, player_id) |
| `rsvps` | id, game_id FK, profile_id FK, status (`in` \| `out` \| `maybe`), updated_at; unique (game_id, profile_id) |
| `news_posts` | id, title, body (markdown), author_profile_id FK, published_at, slug |
| `albums` | id, title, game_id (nullable FK — albums can be non-game events), created_at |
| `photos` | id, album_id FK, storage_path, caption, uploaded_by_profile_id FK, created_at |
| `comments` | id, body, author_profile_id FK, target (`game` \| `news_post`), target_id, created_at |

Stat categories (AB, R, H, 2B, 3B, HR, RBI, BB, K) match common slowpitch scorekeeping; adding a column later (e.g., SF) is a small migration since nothing derived is stored.

Access rules (Supabase row-level security):

- Public read on everything except `rsvps` (login required to see who's in/out) and `profiles`.
- Players: insert/update own `rsvps`; update own linked `players` row (profile fields only, not stats); insert `photos` and `comments`.
- Admins: full write on everything.
- Derived stats views are public reads.

## Pages & Routes

### Public

| Route | Content |
|---|---|
| `/` | Hero + brand, next-game countdown, latest result, latest news, recent photos strip |
| `/schedule` | Season game list with dates/times/fields/scores; links to game pages |
| `/games/[id]` | Final score, full box score, game album, YouTube embeds (RSVP tally shown only when logged in) |
| `/stats` | Sortable season table (per-player totals + AVG), team record header |
| `/roster` | Player cards → `/roster/[id]` with profile + game-by-game stat log |
| `/news` + `/news/[slug]` | Post list and post pages with comments (visible to all, writable by logged-in) |
| `/photos` + `/photos/[albumId]` | Album grid → album with lightbox |
| `/highlights` | YouTube embeds organized by game |

### Player (login required)

- RSVP controls (In / Out / Maybe) on upcoming games with live tally.
- `/me` — edit own profile: photo, bio, walk-up song.
- Photo upload into albums.
- Comment forms on games and news posts.

### Admin (`/admin`, admin role required)

- **Games**: CRUD games, enter final scores, box-score entry grid (one row per player who played; keyboard-friendly).
- **News**: write/edit posts (markdown editor).
- **Players**: roster CRUD, link accounts to roster spots, promote/demote admins.
- **Photos**: create albums, delete photos.
- **Comments**: delete comments.

## Design / Branding

Original Mandalorian-*inspired* theme — no Star Wars or Disney logos, fonts, artwork, or character imagery anywhere (the league being Disney-run makes IP hygiene extra important):

- Dark gunmetal/steel palette, molten-gold accent.
- Brushed-metal textures, angular panel shapes, custom "beskar ingot" motif for stat cards and jersey numbers.
- Original iconography only.

### Mobile-first (priority requirement)

Most traffic will be phones — teammates checking scores from the field, RSVPing from the couch. Concretely:

- Every page is designed at phone width first; desktop is the adaptation, not the other way around.
- Thumb-friendly tap targets (44px minimum) for RSVP buttons, nav, and admin forms.
- Box scores and stat tables get a dedicated small-screen treatment (sticky player column + horizontal scroll, or card layout) — never a pinch-zoom desktop table.
- Bottom-of-screen navigation on mobile for the core pages (Home, Schedule, Stats, Photos).
- Fast on cellular: Next.js image optimization, lazy-loaded photos, YouTube embeds load on tap (facade pattern) instead of at page load.
- The box-score entry grid in the admin panel must be usable on a phone — scores get entered from the parking lot, not a desk.
- Accessibility basics throughout: sufficient contrast on the dark theme, semantic HTML, alt text on photos, keyboard navigability.

## Build Phases

| Phase | Ships | Site state after |
|---|---|---|
| 1 — Public site | All public pages, auth (Kevin as sole admin), minimal admin data entry to seed content | Live, shareable, current |
| 2 — Admin panel | Box-score grid, news editor, roster/album management | Co-admins run the site without Kevin |
| 3 — Player accounts | Sign-up, profile editing, RSVPs, photo uploads, comments | Full feature set |

Future ideas (explicitly out of scope for now): realtime team chat via Supabase Realtime (comments cover banter initially), custom domain, league standings, game reminders/notifications.

## Analytics

- **Vercel Web Analytics** (free tier), enabled at first deploy. Shows page views, unique visitors, top pages, referrers, device breakdown, and countries — right in the Vercel dashboard Kevin already uses for deploys.
- Privacy-friendly (no cookies), so no cookie-consent banner is needed.
- If deeper analysis is ever wanted (user flows, retention), Google Analytics 4 can be added later as a free upgrade path; not planned now.

## Testing & Error Handling

- Unit tests on stat-rollup logic (AVG and totals derivations) — the one place a math bug is publicly embarrassing.
- Manual walkthrough per phase for everything else, on **both a phone-sized viewport and desktop** — mobile is the primary target.
- Friendly empty states everywhere ("No games yet — season starts soon") since the site launches data-sparse.
- Photo uploads: client-side compression/resizing before upload to protect the 1GB free storage tier; reject non-image files.

## Privacy & Legal Notes

- Roster names, photos, and stats are public on the internet. Team gets a heads-up before launch; players who prefer can use first name + last initial and/or skip the photo.
- RSVPs and the who's-in tally are login-only.
- No Disney/Star Wars IP anywhere on the site (see Design).

## Costs

| Item | Cost |
|---|---|
| GitHub (private repo) | $0 |
| Vercel Hobby | $0 |
| Supabase free tier (500MB DB, 1GB storage) | $0 |
| Vercel Web Analytics (free tier) | $0 |
| Custom domain (optional) | ~$12/yr |
