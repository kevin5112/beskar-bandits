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
