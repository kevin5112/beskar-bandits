create table public.site_settings (
  key text primary key,
  value boolean not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "public read site_settings" on public.site_settings for select using (true);
create policy "admin write site_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values ('show_teaser_banner', true);
