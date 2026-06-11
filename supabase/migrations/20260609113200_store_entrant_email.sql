alter table public.entrants
  add column if not exists email text;

create index if not exists entrants_email_idx on public.entrants(email);
