insert into public.site_settings (key, value) values ('prelaunch_mode', true)
on conflict (key) do update set value = excluded.value, updated_at = now();
