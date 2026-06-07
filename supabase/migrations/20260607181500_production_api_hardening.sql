alter table public.leagues
  add column if not exists creator_email text;

create index if not exists leaderboard_snapshots_entrant_idx on public.leaderboard_snapshots(entrant_id);
create index if not exists league_events_team_idx on public.league_events(team_id);
create index if not exists matches_home_team_idx on public.matches(home_team_id);
create index if not exists matches_away_team_idx on public.matches(away_team_id);
create index if not exists matches_winner_team_idx on public.matches(winner_team_id);
create index if not exists team_picks_team_idx on public.team_picks(team_id);
