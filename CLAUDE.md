# PickFour Agent Guide

PickFour is live. Real entrants are in the league, picks are locked, and people are following the World Cup through the app. Treat the production data as sacred.

## Current Project

- App: PickFour
- Repo: `blamedec/pickz`
- Local path: `/Users/declanpitts/Documents/Sweepy`
- Main live URL: `https://pickfour.vercel.app`
- Demo URL: `https://pickfour-demo.vercel.app`
- Vercel project: `declanpitts-projects/pickfour`
- Supabase ref: `xtipajfuubqitttbrrjv`
- Active overhaul branch: `fable/live-ux-overhaul`
- Stack: React 19, Vite, TypeScript, Supabase, Vercel

## Non-Negotiable Safety Rules

Do not mutate or delete production data:

- `entrants`
- `team_picks`
- `prediction_picks`
- `leagues`
- `matches`
- `team_scores`
- `leaderboard_snapshots`

Do not change scoring rules, lock logic, or existing picks unless Declan explicitly asks for that exact backend/data task.

Do not deploy production unless Declan explicitly approves it in the current conversation.

Never run:

```sh
npx vercel@latest deploy --prod --yes
```

unless production approval has been given. Preview/demo deploys are allowed when requested:

```sh
npx vercel@latest deploy --yes
npx vercel@latest alias set <preview-url> pickfour-demo.vercel.app
```

Do not alias anything to `pickfour.vercel.app` without explicit production approval.

## Design Source Of Truth

Read `DESIGN.md` before making UI changes. The system is called the PickFour Matchday Programme System.

Preserve the existing direction:

- Dark-first live matchday app.
- Cream paper contrast.
- Red PickFour action.
- Green live/positive states.
- Gold/orange stakes and bonus-race heat.
- Sticker-like country flags.
- Barlow Condensed display type.
- Inter body/UI type.
- Social, British-football-adjacent copy.

Do not replace the app with an external design system. Outside references can inspire principles, but the code and `DESIGN.md` are the shipping source of truth.

## Product Model

Post-lock, PickFour is a live companion:

- `Overview`: what changed, who leads, your entry, pressure matches.
- `Matches`: match centre, latest results, bonus race, most-backed countries, groups, knockout path.
- `My Entry`: personal receipt, countries, +10 pick, points ledger, next fixtures.
- `Table`: league standings, search, find me, share, expanded player breakdowns.
- `Scoring`: compact point reference.

Pre-lock creation/joining/picks flows still exist for future tournaments, but live mode should not push users toward entry creation now.

## UI Rules

- Mobile first: verify 320, 375, 390, and 402px.
- Desktop must be a real responsive web app, not a stretched phone view.
- Primary buttons: 48px high, 8-9px radius, 15px text, 600 weight, 24px horizontal padding.
- Utility controls: 40px minimum, with 44px mobile tap target.
- Country visuals must use `TeamFlag`; no emoji flags.
- No placeholder copy.
- No dead CTAs.
- No hover-only meaning.
- No horizontal overflow on mobile unless it is intentional and clearly signposted.
- Every interactive surface needs loading, empty, error, focused, disabled, and reduced-motion states where relevant.

## Copy Rules

Tone: clear, warm, slightly cheeky, football-adjacent, never startup-ish.

Good patterns:

- "Follow the damage."
- "No one has this lot."
- "Picks are locked."
- "Table copied, paste it in the group chat."
- "Your +10 lands if..."

Avoid:

- Betting/gambling framing.
- Overdramatic war language.
- Generic dashboard words when concrete football words fit.
- Long helper paragraphs where a key, label, or drawer would be clearer.
- The original draw-object word in user-facing UI text. Use slips, picks, draw, or four instead.

The disclaimer must remain visible as small muted footer text on every screen:

```txt
PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup, tournament organisers, broadcasters, or national associations.
```

## Data Visualization Rules

PickFour data views should answer:

- Who is winning?
- What changed?
- Which match caused it?
- Who has which country?
- How many points are on offer?
- Why did this team gain or lose points?

Prefer direct labels, row-level values, expandable detail, and visible keys. Avoid detached legends when labels can sit next to the mark.

Use colour consistently:

- Green: live, positive, confirmed, alive.
- Red: negative, deductions, danger, action.
- Gold/orange: stakes, attention, bonus race, leader heat.
- Muted: context and unavailable states.

Do not draw knockout connector lines unless the data contains true bracket seeding.

## Code Ownership

Key files:

- `src/App.tsx`: app state, routing, live sync, lock time, league payload wiring.
- `src/styles.css`: design tokens and almost all visual styling.
- `src/components/MatchdayOverviewScreen.tsx`: live overview and public entry lookup.
- `src/components/LiveScreen.tsx`: match centre, bonus race, countries, groups, knockout path.
- `src/components/PicksScreen.tsx`: My Entry and locked pick receipt.
- `src/components/LeaderboardScreen.tsx`: league table and entrant breakdown.
- `src/components/RulesScreen.tsx`: scoring/rules education.
- `src/components/TeamFlag.tsx`: country flag rendering.
- `src/lib/scoring.ts`: scoring logic. Do not casually change it.
- `src/lib/matchImpact.ts`: display-only scoring explanations pinned by tests.
- `src/lib/leagueApi.ts`: Supabase edge function client.

Prefer shared helpers in `src/lib` over duplicating logic inside components.

## Quality Bar

For any UI change:

1. Read `DESIGN.md`.
2. Make the smallest coherent change.
3. Run tests and build where practical.
4. Verify at mobile and desktop sizes.
5. Check dark and light themes.
6. Check logged-out and logged-in states where the affected screen depends on identity.
7. Confirm no production data mutation was introduced.

Core commands:

```sh
npm test
npm run build
npm run dev
```

Useful preview QA:

```sh
node scripts/preview-live.mjs
node scripts/preview-live.mjs --real
```

The normal expected test suite is currently 27 passing tests.

## Deployment

Demo deploy only unless Declan approves production:

```sh
npm test
npm run build
npx vercel@latest deploy --yes
npx vercel@latest alias set <preview-url> pickfour-demo.vercel.app
```

Production deploy requires explicit approval:

```sh
npx vercel@latest deploy --prod --yes
npx vercel@latest alias set <deployment-url> pickfour.vercel.app
```

## Human Decisions To Flag

Ask before making these changes:

- Any scoring change.
- Any Supabase schema/function/data change.
- Any pick, entrant, league, match, team score, or snapshot mutation.
- Any production deployment.
- Removing pre-lock flows.
- Replacing the visual system instead of refining it.
- Large component rewrites that affect multiple tabs.

## Final Handoff Standard

When handing work back, include:

- What changed.
- Files touched.
- Tests/build run.
- Browser/visual QA performed.
- Demo URL if deployed.
- Anything that still needs Declan's decision.
