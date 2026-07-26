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
