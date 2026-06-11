alter table public.leagues
  add column if not exists creator_identity_hash text;

update public.leagues
set creator_identity_hash = encode(digest('email:' || lower(trim(creator_email)), 'sha256'), 'hex')
where creator_identity_hash is null
  and creator_email is not null
  and trim(creator_email) <> '';

create index if not exists leagues_creator_identity_hash_idx on public.leagues(creator_identity_hash);
