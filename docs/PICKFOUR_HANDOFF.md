# PickFour Handoff Report

Last updated: 2026-06-11

## Production Safety

- Production app: https://pickfour.vercel.app
- Current Vercel project: `declanpitts-projects/pickfour`
- Production Supabase project ref: `xtipajfuubqitttbrrjv`
- Production Supabase URL: `https://xtipajfuubqitttbrrjv.supabase.co`
- GitHub backup repo: https://github.com/blamedec/pickz
- Linked local Supabase metadata: `supabase/.temp/linked-project.json`
- Active public league invite: `GCHYKF`
- Active public league name: `World cup Singles`

GitHub is for source-code backup, history, branches, and second-agent review. It does not replace Vercel hosting or Supabase live data/API services.

Important: do not deploy to similarly named Supabase refs. The correct ref has three consecutive `t`s after `qi`: `xtipajfuubqitttbrrjv`.

Before any Supabase deploy, verify both:

```sh
cat supabase/.temp/linked-project.json
```

and the production bundle points to:

```txt
https://xtipajfuubqitttbrrjv.supabase.co
```

## Do Not Delete Finished Picks

The tournament is live. Treat these tables as production records:

- `entrants`
- `team_picks`
- `prediction_picks`
- `leagues`
- `matches`
- `team_scores`
- `leaderboard_snapshots`

Do not run delete/update SQL against real entries or picks unless Declan explicitly asks for that exact operation. Prefer read-only checks, exports, and additive fixes.

## Current Product State

PickFour is now in live-tournament mode:

- New leagues are closed.
- New joins are closed.
- Pick edits are locked.
- Picks are revealed publicly once a league invite is opened.
- Spectators can browse the table, matches, most-backed countries, bonus race, and scoring guide.
- Returning players can log in by entering the email they used before lock.

Email recovery behavior:

- The email is the recovery key.
- The typed name is not used to match the entry.
- If the email matches, the app highlights the saved entrant and restores the saved display name.
- If the email does not match, no entry is highlighted.

## Scoring Logic

Core scoring:

- Group win: +3
- Group draw: +1
- Loss: +0
- Knockout normal-time win: +3
- Extra-time or penalties win: +2
- Advance from group: +3
- Quarter-final: +5
- Semi-final: +7
- Final: +10
- Champion: +15
- Highest-scoring bonus pick: +10 if the tournament highest-scoring team is the user's bonus pick

Additional live scoring currently represented in the schema:

- Clean-sheet bonus
- Statement win bonus
- Giant-slayer bonus
- Major giant-slayer bonus
- Red-card deduction
- Own-goal deduction

Keep scoring changes conservative now that the tournament is live. Any scoring rule change should be explained clearly and checked against existing entries before deployment.

## Recent QoL / UX Fixes

- Mobile and desktop overview rebuilt around the live tournament state.
- Bottom nav is fixed and uses live labels: Scoring, Overview, Matches, Table.
- Header recovery control says `Log in`.
- Entry recovery button says `Log in to entry`.
- "Your next pressure points" / login card alignment tightened.
- Match centre supports entrant impact panels.
- Most-backed countries can be opened to show who picked each country.
- Bonus race uses compact metrics and clearer helper copy.
- Public/spectator flow now works without forcing users through sign-up after lock.

## Deployment Notes

Frontend:

```sh
npm run build
npm test
npx vercel@latest deploy --prod --yes
npx vercel@latest alias set <deployment-url> pickfour.vercel.app
```

Vercel currently auto-aliases `pot-to-glory.vercel.app`; always explicitly alias the new deployment to `pickfour.vercel.app`.

Supabase Edge Functions:

- `league-api` is public and configured with `verify_jwt = false`.
- `sync-scores` is public and configured with `verify_jwt = false`.
- Prefer the Supabase connector deployment if the CLI hangs.
- If using CLI, only deploy to `xtipajfuubqitttbrrjv`.

Example:

```sh
npx supabase functions deploy league-api --project-ref xtipajfuubqitttbrrjv --no-verify-jwt --use-api
```

## Git / Backup Status

Current local branch: `main`

The intended GitHub backup repository is `blamedec/pickz`. Do not rely only on the local folder.

Suggested backup flow:

1. Add `https://github.com/blamedec/pickz.git` as `origin`.
2. Confirm ignored files exclude secrets and local player-data exports.
3. Commit the current production state.
4. Push `main`.
5. Keep future UX experiments on branches.

Future Fable/second-agent work should happen on a branch or draft PR first. Keep `main` close to the deployed production state.

## Good Next-Chat Prompt

Use this when starting a new chat or handing off to another model:

```txt
We are continuing PickFour in /Users/declanpitts/Documents/Sweepy.

PickFour is live at https://pickfour.vercel.app and backed up at https://github.com/blamedec/pickz. Vercel remains the host and Supabase remains the live data/API system. The tournament has started, so do not allow new entries, new leagues, or pick edits. Do not delete or mutate finished picks unless explicitly instructed.

Production Supabase project ref is xtipajfuubqitttbrrjv. Verify before any Supabase deployment. Do not use similarly named refs. Active public league invite is GCHYKF for World cup Singles.

Main goal now: improve the live viewing UX without changing users' locked picks or breaking scoring. Focus on clarity for non-technical users: league table, personal entry login by email, points breakdown, match impact, most-backed countries, bonus race, and mobile navigation.

Email login/recovery should match by email only. The typed name is cosmetic; if the email matches, restore/highlight the saved entrant. Wrong email must not log in.

Before shipping anything: run npm run build and npm test. For frontend deployments, deploy to Vercel production and explicitly alias the deployment to pickfour.vercel.app.
```
