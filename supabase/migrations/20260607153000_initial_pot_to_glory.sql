create extension if not exists pgcrypto;

create type public.team_status as enum ('active', 'eliminated', 'champion');
create type public.match_stage as enum ('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final');
create type public.prediction_category as enum ('highest_scoring_team');

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{4,12}$'),
  admin_code_hash text not null,
  entry_fee_pence integer not null default 0 check (entry_fee_pence >= 0),
  prize_pot text not null default 'Bragging rights',
  invite_open boolean not null default false,
  max_entrants integer check (max_entrants is null or max_entrants > 0),
  lock_time timestamptz not null,
  picks_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entrants (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  local_identity_hash text not null,
  avatar_color text not null default '#e71d36',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, local_identity_hash)
);

create table public.teams (
  id text primary key,
  espn_id text not null unique,
  name text not null,
  short_name text not null,
  code text not null,
  flag text not null,
  group_letter text not null check (group_letter ~ '^[A-L]$'),
  pot integer not null check (pot between 1 and 4),
  primary_color text not null,
  secondary_color text not null,
  created_at timestamptz not null default now()
);

create table public.team_picks (
  id uuid primary key default gen_random_uuid(),
  entrant_id uuid not null references public.entrants(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id text not null references public.teams(id),
  pot integer not null check (pot between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entrant_id, pot)
);

create table public.prediction_picks (
  id uuid primary key default gen_random_uuid(),
  entrant_id uuid not null references public.entrants(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  category public.prediction_category not null,
  pick_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entrant_id, category)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  espn_match_id text not null unique,
  stage public.match_stage not null,
  group_letter text check (group_letter ~ '^[A-L]$'),
  home_team_id text references public.teams(id),
  away_team_id text references public.teams(id),
  home_score integer not null default 0,
  away_score integer not null default 0,
  winner_team_id text references public.teams(id),
  win_method text check (win_method in ('normal', 'extra_time', 'penalties')),
  starts_at timestamptz not null,
  status text not null check (status in ('scheduled', 'live', 'completed')),
  raw_payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.team_scores (
  team_id text primary key references public.teams(id) on delete cascade,
  points integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  clean_sheets integer not null default 0,
  status public.team_status not null default 'active',
  stage_reached public.match_stage,
  last_update text not null default 'Pre-tournament',
  updated_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  entrant_id uuid not null references public.entrants(id) on delete cascade,
  country_points integer not null default 0,
  prediction_points integer not null default 0,
  total_points integer not null default 0,
  active_teams integer not null default 4,
  rank integer not null,
  snapshotted_at timestamptz not null default now()
);

create table public.stat_leaders (
  category public.prediction_category primary key,
  leader_value text not null,
  metric_value integer not null default 0,
  source text not null default 'manual',
  updated_at timestamptz not null default now()
);

create table public.league_events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references public.leagues(id) on delete cascade,
  team_id text references public.teams(id),
  event_type text not null,
  message text not null,
  points_delta integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index entrants_league_idx on public.entrants(league_id);
create index team_picks_league_idx on public.team_picks(league_id);
create index prediction_picks_league_idx on public.prediction_picks(league_id);
create index matches_status_starts_idx on public.matches(status, starts_at);
create index leaderboard_latest_idx on public.leaderboard_snapshots(league_id, snapshotted_at desc);
create index league_events_league_created_idx on public.league_events(league_id, created_at desc);

alter table public.leagues enable row level security;
alter table public.entrants enable row level security;
alter table public.teams enable row level security;
alter table public.team_picks enable row level security;
alter table public.prediction_picks enable row level security;
alter table public.matches enable row level security;
alter table public.team_scores enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.stat_leaders enable row level security;
alter table public.league_events enable row level security;

-- Direct browser table access is intentionally closed for v1.
-- Client reads/writes should go through Edge Functions that validate invite/admin codes
-- and use the server-side service role key. This avoids leaking private leagues via anon SELECT.

create policy "teams are globally readable" on public.teams
  for select
  using (true);

create policy "team scores are globally readable" on public.team_scores
  for select
  using (true);

create policy "stat leaders are globally readable" on public.stat_leaders
  for select
  using (true);

insert into public.stat_leaders (category, leader_value, metric_value, source)
values
  ('highest_scoring_team', 'Brazil', 14, 'demo_seed')
on conflict (category) do update
set leader_value = excluded.leader_value,
    metric_value = excluded.metric_value,
    source = excluded.source,
    updated_at = now();
