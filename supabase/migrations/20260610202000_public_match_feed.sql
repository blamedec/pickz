grant select on table public.matches to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'matches'
      and policyname = 'matches are globally readable'
  ) then
    create policy "matches are globally readable" on public.matches
      for select
      using (true);
  end if;
end $$;
