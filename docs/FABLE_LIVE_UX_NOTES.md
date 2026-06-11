# Live Tournament UX Overhaul — Notes

Last updated: 2026-06-11
Branch: `claude/fable-live-ux-overhaul-2546jh` (requested name: `fable/live-ux-overhaul`)

This pass treats the live league as the product. Everything shipped is display-layer only: no scoring rules, locked-pick logic, entry mutation, or Supabase configuration changed. The league totals still come from the synced `team_scores` data exactly as before.

## What shipped

### New: `src/lib/matchImpact.ts` (+ tests)

A small display-only library that explains points using the existing scoring functions:

- `getFixtureSideImpact(fixture, side)` — breaks a completed match into the scoring events one side earned (group win +3, clean sheet +1, statement win +2, giant-slayer, red card −2, …) with a match total. Mirrors `calculateMatchPoints` exactly; covered by unit tests including a check that the totals agree.
- `getPointsOnOffer(fixture)` — what an unfinished match can still pay, in plain words.
- `getTeamMatchLedger(teamId, fixtures)` — a team's completed matches, newest first, each with its breakdown.

This is the engine behind "why did my score change?" across the app.

### Match centre (Matches tab)

- Tapping any match now answers three questions: **who needs it** (entrants per side, with "No one has this lot" when empty), **what it pays** ("Points on offer per team: Win +3 · Draw +1 · Clean sheet +1"), and — once it finishes — **what it paid** (per-side breakdown chips with a match total).
- Bonus stakes are visible: each side shows "+10 bonus pick for ⟨names⟩" when someone backed that country in the goal race.
- New "Latest scored results" panel: the most recent finals, expandable with the same impact drawers, so full-time damage is browsable.
- Bonus race rebuilt: ranked bars with "12 goals · 2 behind" language instead of "GF", plus who has each team as their bonus pick. The +10 copy now reads "Your +10 lands if your bonus country finishes top of the goal race."

### My entry (Picks tab after lock)

- Each pick card now carries a status chip — **Still in / Out / Champions** — so "which parts of my entry are alive" is answered at a glance.
- Per-team match ledger: every completed match with its scoreline and signed points ("12 Jun · ESP 2-0 KSA · +6"), a durable audit trail for the whole tournament.
- Next-fixture line per pick ("Next: Sat 13 Jun 17:00 vs Haiti" / "Live now vs Ghana").
- Bonus card now states your position in the goal race and the gap to the leader ("3rd in the goal race with 4 goals, 2 behind Brazil").

### Overview

- New "Latest results, scored" module: recent finals with the points each country banked (ESP +6 / KSA −3), tappable through to the match centre. Answers "what changed recently?".
- The +10 stat tile and modal copy now say "goals" rather than "GF".
- Most-backed country modal now shows pot, pick count as a share of the league ("Pot 1 · 4 of 18 entries (22%)"), and points.
- "No one has this lot" empty copy.

### League table

- Player search appears for leagues with more than six entries, plus a "Find me · #rank" button for logged-in entrants that clears the search and opens their pick drawer.
- A filtered-to-nothing state explains itself instead of claiming the league is empty.

### Trust and loading

- The desktop ticker shows "Updated HH:MM" after each successful live sync.
- A failed live refresh now says "Live scores are delayed. Showing the latest saved data." instead of surfacing a raw error, and the previous data stays on screen (existing behaviour, now with honest copy).

### QA harness

- `scripts/preview-live.mjs` — a Playwright script that runs the app against a fully mocked Supabase backend (mock league, seven entrants, completed/live/scheduled fixtures) and screenshots Overview, Matches, My entry, and Table at mobile and desktop sizes. Run locally with the dev server up: `node scripts/preview-live.mjs`. It never touches production; all network calls are intercepted.

## Data and scoring safety

- No changes to `scoring.ts` values or functions, lock logic, entry submission, identity, or Supabase refs.
- `matchImpact.ts` only reads fixture data already on the client and re-states it; if the synced `team_scores` ever disagreed with a client-side breakdown, the league table totals (from `team_scores`) still win everywhere they were used before.
- No SQL, no migrations, no edge function changes.

## Proposed but NOT shipped

These need Declan's call before any of them happen:

1. **Bonus race settlement clarity** — the schema scores `prediction_picks` by team name string. A future migration to team ids would be safer for renames (e.g. "Türkiye"). Additive migration, not done here.
2. **Matchday recap share card** — a generated image/text summary after each matchday ("Soph +9, top of the table, Rory's Spain banked a clean sheet") for the group chat. High delight, needs design time.
3. **Rank-change notifications** — snapshots already exist; a daily "you moved up 2" email/digest could ride on them.
4. **Identical-entry "rival twins" callout** — celebrate entrants with matching picks on the table instead of leaving it silent.
5. **Scoring event feed** — a chronological ledger of every points event in the league (who gained what, when), backed by a small additive table written by `sync-scores`. The client-side ledger shipped here approximates it from fixtures; a server-side ledger would also survive fixture-feed gaps.
6. **Entry-fee display** — the prize pot label is still computed from `entryFeePence`; decide whether money stays in the public UI for future tournaments.
