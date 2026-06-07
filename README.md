# Pot To Glory

Pot To Glory is a mobile-first World Cup friend-league PWA. Every entrant picks one national team from each official seeded pot before the tournament starts, then those four countries combine into a live total.

League organisers can set an entry fee per entrant; the app displays the social prize pot as `entry fee × entrants`. They can also choose open invites and no member cap. No payment collection is included in v1.

## Game Rules

- Pick exactly one country from Pot 1, Pot 2, Pot 3 and Pot 4.
- Duplicate country picks are allowed inside a league.
- Picks lock at the first match kickoff.
- Eliminated countries keep their points but stop scoring.
- Bonus pick is highest-scoring team only and worth +10.

## Local Development

```bash
npm install
npm run dev
npm test
npm run build
```

## Deployment

This app is ready for Vercel as a Vite SPA. The `vercel.json` file sets the build command, output directory, and a catch-all rewrite so direct links load the app.

Recommended flow:

```bash
git add .
git commit -m "Prepare Pot To Glory for Vercel"
git push origin main
```

Then import the GitHub repo in Vercel. Vercel will create previews for branches and a production deployment from `main`.

For a custom domain, add it to the Vercel project, then follow the DNS records Vercel recommends. Common defaults are an apex `A` record to `76.76.21.21` and a `www` CNAME to Vercel's DNS target, but use the exact values Vercel shows for your project.

The app runs in demo mode unless Supabase values are provided:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_DEMO_MODE=false
```

With `VITE_DEMO_MODE=false`, the email login button sends a Supabase magic link and returns to the app origin. Add your local and deployed app URLs to Supabase Auth redirect URLs.

## Supabase

The first schema pass lives in `supabase/migrations`. It creates the v1 tables, enables RLS on exposed tables, keeps private league data closed to direct anonymous table reads, and leaves league-specific access for Edge Functions that validate invite/admin codes server-side.

Scheduled score sync is scaffolded in `supabase/functions/sync-scores`. Supabase's current scheduling docs recommend `pg_cron` + `pg_net` to invoke Edge Functions on a cron schedule, with secrets stored in Vault.

## Source Notes

- FIFA states the final draw pots use the hosts plus FIFA/Coca-Cola Men's World Ranking allocation for the remaining teams.
- ESPN's `fifa.world` soccer endpoints are used as the first scoring data source.
- Supabase Cron and scheduled Edge Functions are scaffolded but not applied to a live project from this repo.
