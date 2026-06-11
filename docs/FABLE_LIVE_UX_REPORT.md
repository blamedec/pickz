# PickFour Live UX Overhaul — Handoff Report

Last updated: 2026-06-11
Audience: the implementing/deploying agent (and Declan)
Branch: `fable/live-ux-overhaul` (mirrored on `claude/fable-live-ux-overhaul-2546jh`), based on `fable-product-brief`

---

## 1. Executive summary

Two commits on this branch turn PickFour's live mode from "tables with numbers" into a companion that explains itself: every match can now answer *who needs it, what it pays, and what it paid*; every entry has a durable match-by-match points ledger; the bonus race speaks plain English; and a visual pass tightened desktop density, dark-mode contrast, and ≤390px stacking.

**Nothing here touches scoring rules, locked picks, entry mutation, identity, Supabase refs, or any production data path.** It is all read-and-display. The league totals still come from the synced `team_scores` rows exactly as before.

Verification status: `npm test` 23/23 passing (9 new tests), `npm run build` clean. **Not visually verified** — this sandbox has no browser (network allowlist blocks the Playwright CDN). A ready-made visual QA harness is included (see §6). Run it before deploying.

---

## 2. Commit log

| Commit | Title | Scope |
|---|---|---|
| `36a0a9d` | Live tournament UX overhaul | New `matchImpact` lib + tests; match drawers; bonus race; entry ledger; overview results module; table search; trust copy; QA harness |
| `041bdcb` | Visual polish: desktop density, dark-mode contrast, small-screen stacking | CSS-only plus the mobile "Updated HH:MM" stamp |
| (HEAD) | Knockout path redesign + design/functionality pass | New `KnockoutBracket` component (fixes wrong slot counts 8/4/2/2/1 → 16/8/4/2/1 for the 48-team format); group-table GD column + qualification line; table medals, gap-to-leader, Share button, richer rival drawers; match-centre "My countries" filter; refresh-on-focus; sparkline area+dot; eliminated tints; ~2.5KB dead bracket CSS removed |

### Knockout path redesign (`src/components/KnockoutBracket.tsx`)

The old "bracket tree" rendered text-only slots in a horizontal scroll and **silently truncated rounds** (it allotted 8 R32 slots, 4 R16, 2 QF — the 2026 format has 16/8/4/2/1). The replacement is a "Road to the final" view: round-by-round sections (L32 → Final) with flag/score match cards, winner emphasis, loser fade, gold edges on ties involving league picks, "n entries" exposure chips, dashed TBC placeholders for unset ties, a styled final card, and a champion banner once the final is scored. It deliberately does **not** draw connector lines between rounds because the feed doesn't tell us which tie feeds which slot — drawing fake pairings would mislead. If true bracket-position data is ever added (ESPN `raw_payload` may carry it), connectors become possible.

### Functional additions in this pass

- **Match centre filter**: "All matches / My countries" segmented control for logged-in entrants, applied to both live/upcoming and latest results, with an honest empty state.
- **Share the table**: button on the league table builds a group-chat-ready text snapshot (top 5 + your rank + URL) via `navigator.share`, falling back to clipboard with a confirmation notice.
- **Refresh on focus**: returning to the tab immediately re-syncs fixtures/scores and the league payload instead of waiting up to 60/120s for the next poll tick.
- **Rival drawers**: league-table pick drawers now show Out/Champions chips per pick and the bonus team's live goal count — "open any player for their full breakdown" is now true.
- **Group tables**: goal-difference column and a dashed qualification line after 2nd, with a note that the eight best third-placed teams also advance.

File-by-file:

- **`src/lib/matchImpact.ts` (new)** — display-only library. `getFixtureSideImpact(fixture, side)` decomposes a completed match into scoring events (group win +3, clean sheet +1, statement win +2, giant-slayer +2/+1, red card −2, own goal −1) using the values in `defaultScoringConfig`; `getPointsOnOffer(fixture)` lists what an unfinished match can pay; `getTeamMatchLedger(teamId, fixtures)` gives a team's completed matches newest-first with breakdowns. Tests assert its totals agree with `calculateMatchPoints`.
- **`src/lib/matchImpact.test.ts` (new)** — 9 unit tests (group/knockout/pens, statement win, giant-slayer, deductions, ledger ordering).
- **`src/components/LiveScreen.tsx`** — match drawers gained `SideImpactChips` (full-time breakdown + match total), `PointsOnOfferRow` (pre-match), `BonusBackersNote` (+10 stakes per side); new "Latest scored results" panel (last 6 finals, same expandable rows); bonus race rebuilt as ranked goal bars with "12 goals · 2 behind" and per-team bonus backers; empty copy is now "No one has this lot".
- **`src/components/PicksScreen.tsx`** — locked "My entry" view: per-pick **Still in / Out / Champions** status chips, per-team match ledger rows ("12 Jun · ESP 2-0 KSA · +6"), next-fixture line, and bonus card copy stating goal-race position and gap ("3rd in the goal race with 4 goals, 2 behind Brazil. Your +10 lands if they finish top."). New `fixtures` prop (wired in App).
- **`src/components/MatchdayOverviewScreen.tsx`** — new "Latest results, scored" module (per-country signed points per final, taps through to match centre); most-backed modal shows "Pot 1 · 4 of 18 entries (22%)"; +10 stat tile says "goals"; hero strap shows "Updated HH:MM" on mobile; new `liveSyncedAt` prop.
- **`src/components/LeaderboardScreen.tsx`** — player search (shown for >6 rows) + "Find me · #rank" button; honest empty state when a search matches nothing.
- **`src/App.tsx`** — `liveSyncedAt` state set on successful sync; ticker shows "Updated HH:MM"; delayed-feed error copy ("Live scores are delayed. Showing the latest saved data."); rail bonus bars say "goals"; props wiring.
- **`src/styles.css`** — ~430 new lines in two clearly-marked sections at the end of the file ("Live UX overhaul: …" and "Visual polish: …"); one in-place change (rail `.bonus-bar` last column 42px → auto; total-chip colour).
- **`scripts/preview-live.mjs` (new)** — visual QA harness, see §6.
- **`docs/FABLE_LIVE_UX_NOTES.md` (new)** — shipped-vs-proposed notes (superset of §7 below).

---

## 3. Visual audit — what was found and fixed

Audited directly against the stylesheet (7.5k lines) since screenshots weren't possible here.

| Finding | Fix shipped |
|---|---|
| Dark mode: match-total chip rendered gold text (`--gold: #f0c531`) on a cream chip (`--text` as background) — failed contrast | Chip text now inherits the inverted chip colour |
| Desktop panels used mobile padding (14px) at every width; headings sat tight | ≥901px: panels 18px, heroes 20px, heading margin 16px |
| My-entry breakdown and latest-results rendered as one long single column on wide screens (brief: "desktop should be a command centre") | ≥960px: both go two-column |
| ≤390px: bonus-race rows squeezed rank + name + bar into three columns | Goal bar stacks under the team name; result rows tighten to 36px date column |
| Desktop rail goal bar label column was 42px — fits "12 GF" but clipped "12 goals" | Column widened to `auto` |
| "Updated HH:MM" trust stamp lived only in the ticker, which is `display:none` on mobile | Overview hero strap now carries the stamp on mobile (replaces a duplicate league-name) |
| +10 stat tile label could wrap awkwardly in 2-col grids | Shortened to "ENG leads the +10 race" |

Verified-already-good (no action): bottom nav is fixed with `env(safe-area-inset-*)`; match drawers already stack at ≤520px; global `:focus-visible` outline exists; all new interactive elements meet 44px (search 44px, find-me 44px, result rows 52px); `tabular-nums` on score columns.

---

## 4. Recommended next visual improvements (NOT shipped — for the implementing agent)

Ordered by value. These need a human eye on a real screen, which is why I didn't change them blind:

1. **Matches-screen hero for spectators** (`LiveScreen.tsx` hero, `.score-hero`/`.rank-row strong` in CSS): a logged-out viewer sees a 210px hero dominated by a 4.8rem "#-". Replace with a compact live summary (live match count, next kickoff, league leader) when `myRank` is null.
2. **Group standings length on mobile** (`.group-standings-grid`): 12 group cards is a very long scroll. Consider collapsible groups or a horizontal snap carousel, with the user's groups first (groups containing their picks already get `.picked` highlighting — sort those to the top).
3. **Most-backed country grid nested scroll** (`.country-pick-grid`, `max-height: min(620px, 72vh); overflow-y:auto`): nested scroll areas on mobile are easy to miss. Prefer a "Show all 48" expander.
4. **Overview hero headline**: the h1 repeats the league name that's already in the header. An editorial line ("Who needs tonight?") plus the updated stamp would earn the space better.
5. **Sticky table header + rank column on desktop** for the league table (brief item, unimplemented).
6. **Per-panel loading skeletons**: `TournamentLoadingScreen` covers first load; section-level "warming up" empty states could become shimmer skeletons so refreshes feel alive without spinners.
7. **≤390px overview stat tiles** drop to one column (≈300px of stats before content). Two columns with 1.4rem numerals would halve that — needs a glance check on a 320px viewport before committing.
8. **Bracket horizontal scroll affordance** (`.bracket-tree-track`): add a fade-out edge gradient so users know it scrolls sideways.
9. **Light-theme contrast sweep** of `--gold` on `--surface-subtle` elements (movement chips, bonus highlights) — borderline in places.

---

## 5. Deploy runbook

```sh
# from the repo root, on fable/live-ux-overhaul
npm install
npm test          # expect 23 passing
npm run build     # tsc -b && vite build, must be clean

# visual QA (see §6) — strongly recommended before prod

# merge to main (keep main == deployed prod), then:
npx vercel@latest deploy --prod --yes
npx vercel@latest alias set <deployment-url> pickfour.vercel.app   # Vercel auto-aliases pot-to-glory.vercel.app; the explicit alias is required
```

- **No Supabase deployment is needed** — zero edge-function or schema changes.
- If anything Supabase-side ever is touched: verify the ref is `xtipajfuubqitttbrrjv` (three t's) via `supabase/.temp/linked-project.json` first.
- Do not run anything against `entrants`, `team_picks`, `prediction_picks`, `leagues`, `matches`, `team_scores`, `leaderboard_snapshots`.

## 6. Visual QA harness

`scripts/preview-live.mjs` runs the app against a **fully mocked backend** — a fake league of 7 entrants and completed/live/scheduled fixtures, with every network call (league-api, Supabase REST, ESPN, auth) intercepted by Playwright routes. It never contacts production.

```sh
npm run dev                      # terminal 1
node scripts/preview-live.mjs    # terminal 2; writes /tmp/pickfour-preview/{mobile,desktop}-{overview,matches,entry,table}.png
```

Check specifically: match drawer chips at 390px; the two-column entry breakdown at desktop; bonus-race rows at ≤390px; dark *and* light theme (flip `pickfour:theme` in the init script); the "Updated HH:MM" stamp in the overview strap.

## 7. Bigger product proposals (decisions for Declan, do not implement unprompted)

1. Migrate bonus picks from team-name strings to team ids (rename-safe; additive migration).
2. Matchday recap share cards for the group chat.
3. Rank-change digest riding the existing `leaderboard_snapshots`.
4. "Rival twins" callout for identical entries.
5. Server-side scoring event feed (additive table written by `sync-scores`) — the client-side ledger shipped here approximates it from fixtures and would be superseded by it.
6. Decide whether entry-fee/prize-pot money stays in the public UI for future tournaments.

## 8. Constraints honoured (and to keep honouring)

- Tournament is live; picks are locked. No entry, pick, league, or score mutation of any kind.
- Scoring rules untouched; `matchImpact` *re-states* them and is test-pinned to `calculateMatchPoints`.
- Copy rules kept: no "hat", no gambling language, "goals" over "GF" in public UI, compact event labels explained by the existing Key.
- `main` stays matching deployed prod until this branch is reviewed, QA'd, and merged.
