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
