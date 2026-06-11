create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.matches
  add column if not exists home_red_cards integer not null default 0,
  add column if not exists away_red_cards integer not null default 0,
  add column if not exists home_own_goals integer not null default 0,
  add column if not exists away_own_goals integer not null default 0;

alter table public.team_scores
  add column if not exists table_points integer not null default 0,
  add column if not exists match_points integer not null default 0,
  add column if not exists clean_sheet_bonus_points integer not null default 0,
  add column if not exists statement_win_bonus_points integer not null default 0,
  add column if not exists giant_slayer_bonus_points integer not null default 0,
  add column if not exists major_giant_slayer_bonus_points integer not null default 0,
  add column if not exists red_cards integer not null default 0,
  add column if not exists own_goals integer not null default 0,
  add column if not exists red_card_deduction_points integer not null default 0,
  add column if not exists own_goal_deduction_points integer not null default 0,
  add column if not exists discipline_deduction_points integer not null default 0,
  add column if not exists stage_bonus_points integer not null default 0,
  add column if not exists champion_bonus_points integer not null default 0;

update public.teams
set espn_id = case id
  when 'nor' then '464'
  when 'civ' then '4789'
  when 'jor' then '2917'
  when 'hai' then '2654'
  when 'nzl' then '2666'
  when 'irq' then '4375'
  else espn_id
end
where id in ('nor', 'civ', 'jor', 'hai', 'nzl', 'irq');

update public.stat_leaders
set leader_value = '',
    metric_value = 0,
    source = 'pre_tournament',
    updated_at = now()
where category = 'highest_scoring_team'
  and source = 'demo_seed';

update public.entrants
set email = lower(btrim(email))
where email is not null;

with ranked as (
  select
    id,
    league_id,
    email,
    first_value(id) over (
      partition by league_id, lower(email)
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as keeper_id
  from public.entrants
  where email is not null
    and btrim(email) <> ''
),
duplicates as (
  select id, league_id, keeper_id
  from ranked
  where id <> keeper_id
),
merged_picks as (
  insert into public.team_picks (entrant_id, league_id, team_id, pot, created_at, updated_at)
  select
    duplicates.keeper_id,
    team_picks.league_id,
    team_picks.team_id,
    team_picks.pot,
    team_picks.created_at,
    team_picks.updated_at
  from public.team_picks
  join duplicates on duplicates.id = team_picks.entrant_id
  on conflict (entrant_id, pot) do update
  set team_id = case
        when excluded.updated_at > public.team_picks.updated_at then excluded.team_id
        else public.team_picks.team_id
      end,
      updated_at = greatest(public.team_picks.updated_at, excluded.updated_at)
  returning 1
),
merged_predictions as (
  insert into public.prediction_picks (entrant_id, league_id, category, pick_value, created_at, updated_at)
  select
    duplicates.keeper_id,
    prediction_picks.league_id,
    prediction_picks.category,
    prediction_picks.pick_value,
    prediction_picks.created_at,
    prediction_picks.updated_at
  from public.prediction_picks
  join duplicates on duplicates.id = prediction_picks.entrant_id
  on conflict (entrant_id, category) do update
  set pick_value = case
        when excluded.updated_at > public.prediction_picks.updated_at then excluded.pick_value
        else public.prediction_picks.pick_value
      end,
      updated_at = greatest(public.prediction_picks.updated_at, excluded.updated_at)
  returning 1
)
delete from public.entrants
using duplicates
where public.entrants.id = duplicates.id;

create unique index if not exists entrants_league_email_unique
on public.entrants (league_id, lower(email))
where email is not null
  and btrim(email) <> '';

do $$
begin
  perform cron.unschedule('pot-to-glory-sync-scores');
exception
  when others then null;
end $$;

do $$
begin
  perform cron.unschedule('pickfour-sync-scores');
exception
  when others then null;
end $$;

select cron.schedule(
  'pickfour-sync-scores',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://xtipajfuubqitttbrrjv.supabase.co/functions/v1/sync-scores',
    headers := jsonb_build_object('Content-type', 'application/json'),
    body := jsonb_build_object('triggered_at', now(), 'source', 'pg_cron')
  ) as request_id;
  $$
);
