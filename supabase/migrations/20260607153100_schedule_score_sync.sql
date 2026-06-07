create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Supabase docs recommend storing project URL and function auth token in Vault.
-- Before enabling this schedule, create secrets named project_url and sync_scores_token.
-- Then uncomment and run the schedule below in the target project.

-- select cron.schedule(
--   'pot-to-glory-sync-scores',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-scores',
--     headers := jsonb_build_object(
--       'Content-type', 'application/json',
--       'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sync_scores_token')
--     ),
--     body := jsonb_build_object('triggered_at', now())
--   ) as request_id;
--   $$
-- );
