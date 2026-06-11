# PickFour Product, Game, and UX Brief

Last updated: 2026-06-11

This is the working brief for Fable, Claude Code, Codex, or any other second agent reviewing PickFour. It explains what the product is trying to become, how the live game works, what must not break, and the design philosophy behind the current direction.

The short version: PickFour should feel like a lively World Cup companion for a group chat. It gives people a reason to care about matches they might otherwise skip, without turning the tournament into a betting product. It is social, lightweight, competitive, and easy to follow on a phone.

## Current Production Context

- Production app: https://pickfour.vercel.app
- GitHub repo: https://github.com/blamedec/pickz
- Production Supabase project ref: `xtipajfuubqitttbrrjv`
- Active public league invite: `GCHYKF`
- Active public league: `World cup Singles`
- Hosting stays on Vercel.
- Live data/API stays on Supabase.

Important: the tournament is live. Real people have entered. Their picks are locked. Do not mutate, delete, recalculate destructively, or reseed production entries unless Declan explicitly asks for that exact operation.

## Product Idea

PickFour is a friend-league fantasy football game built around one simple ritual:

1. Join a league.
2. Pick one country from each of four seeded pots.
3. Choose one bonus country for the highest-scoring-team race.
4. Watch the tournament with your group as those countries collect points.

The fun is not in pretending to be a pro fantasy manager. The fun is in the social tension: your mate needs Portugal to keep a clean sheet, someone else is suddenly invested in a group-stage underdog, and the table changes as real matches unfold.

It should feel closer to a sweepstake upgraded into a live app than a casino, sportsbook, or generic fantasy dashboard. People should be able to understand it in one minute, enter once, and then keep coming back because the live story keeps moving.

## Why It Exists

The product should solve these human problems:

- The World Cup has too many matches for casual fans to care about equally.
- Friend groups want a shared reason to follow games together.
- Traditional sweepstakes are simple but go stale once teams are knocked out.
- Fantasy football can feel too complex, admin-heavy, or serious.
- Betting products add stakes but can be exclusionary, risky, or not the vibe.

PickFour sits in the middle:

- Simple enough for someone who barely follows football.
- Dynamic enough to stay interesting for the whole tournament.
- Social enough to fuel group-chat nonsense.
- Fair enough that multiple strategies can work.
- Lightweight enough to use while watching TV, at the pub, on the bus, or during a lunch break.

## The Emotional Target

The product should create these moments:

- "I forgot I had them, now this match matters."
- "Why am I celebrating a Tunisia corner?"
- "You are only top because Mexico got a red card, behave."
- "I need Colombia to win by three or my weekend is ruined."
- "Everyone laughed at that Pot 4 pick and now it is carrying."

That is the core. PickFour should make neutral matches personal, without making the product feel heavy or transactional.

## Product Principles

1. Social first, stats second.
   Every table, chart, and match view should answer: who does this affect in the league?

2. Simple on the surface, deeper on tap.
   The main view should be obvious for non-technical users. Details, breakdowns, rules, and history should be available without making the first screen dense.

3. Mobile is the default seat.
   Most users will open this from a link in WhatsApp/iMessage. The mobile experience should not feel like a squeezed desktop table.

4. Desktop should feel like a real command centre.
   On desktop, use the extra width for comparison, filters, sticky side panels, and richer tables. Do not stretch mobile cards into awkward rows.

5. Locked means locked.
   After tournament start, no new entries, no new leagues, no pick edits. The app should feel like the game has begun.

6. Reveal creates drama.
   Before lock, picks can be private. After lock, everyone should be able to see who has what.

7. No gambling posture.
   Even if friends choose to use a social prize pot, the app should not look or speak like a betting product. Avoid odds-heavy language, deposit/withdraw metaphors, or dark sportsbook aesthetics.

8. Never hide the next useful action.
   If someone opens a league link, they should know whether they are viewing, logging in, making picks, or checking their standing.

9. Prototype the real product, not a disposable demo.
   This World Cup league is the live proof of concept, but the direction should imagine PickFour as a repeatable social tournament platform. Improvements should help this league now and teach us what the future product should become.

10. Respect the real stakes.
   People have entered with friends and there is social money on the line. The product should feel fun, fair, and trustworthy. Any change that could affect scores, entries, identity, or locked picks needs extra caution and a clear explanation.

## Prototype and Platform Tension

PickFour is in an unusual but useful state: it is both a prototype and a real live product. That means the next design pass should do two jobs at once.

For the current tournament, it needs to:

- Make the live league easy to follow.
- Help every entrant understand their own position.
- Show why each fixture matters.
- Make scoring transparent enough that nobody feels stitched up.
- Keep the group-chat energy alive.
- Avoid breaking locked picks, scoring, identity, or league access.

For the future product, it should explore:

- How leagues are created, shared, joined, and managed across many tournaments.
- How a user returns across devices, events, and friend groups.
- How multiple leagues for one person should work.
- How scoring rules could become configurable without becoming confusing.
- How tournament data, match feeds, standings, and scoring events become reusable primitives.
- How PickFour could support different sports while keeping the core "pick a small set, follow the drama" mechanic.

The best work will make the current app better immediately while leaving clearer paths for the bigger product.

## Current Game State

PickFour has moved from entry mode to live mode:

- Entries are closed.
- New leagues are closed.
- New joins are closed.
- Pick edits are locked.
- League invites now act as public viewing links.
- Picks are visible after lock.
- Returning players can log in by email to highlight their own entry.

The live experience is now the product. The entry funnel still matters for future tournaments, but the immediate focus is: make the current World Cup league easy and fun to follow.

## Core Game Logic

Each entrant has:

- Email address for recovery/login.
- Display name.
- League membership.
- Four team picks.
- One bonus pick.

Four team picks means:

- One country from Pot 1.
- One country from Pot 2.
- One country from Pot 3.
- One country from Pot 4.
- Duplicate country picks are allowed across entrants.
- An entrant cannot submit without all four pots filled.
- Picks are editable only before lock.

Bonus pick means:

- One country selected for the highest-scoring-team race.
- The bonus is worth +10 if that country finishes as the tournament's highest-scoring team.
- This should be explained as "your +10 lands if your bonus country finishes top of the goal race."
- The bonus country can be any tournament team, not only one of the four main picks if the current implementation allows it. If the app copy says otherwise, align copy and logic before shipping.

Login/recovery means:

- Email is the durable identity key.
- Display name is not the login key.
- If someone mistyped their name, logging in with the original email should still find them.
- If someone uses the wrong email, the app should not attach them to another entry.

## Scoring Rules

The current scoring must stay stable unless explicitly changed and communicated.

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
- Highest-scoring-team bonus: +10

Additional event scoring represented in the schema:

- Clean-sheet bonus.
- Statement win bonus.
- Giant-slayer bonus.
- Major giant-slayer bonus.
- Red-card deduction.
- Own-goal deduction.

If UI labels abbreviate event scoring, use a compact key:

- CS = clean sheet.
- SW = statement win.
- GS = giant-slayer.
- MGS = major giant-slayer.
- RC = red card.
- OG = own goal.

Do not make event labels so long that they dominate the mobile match cards. The scoring key can explain them once, then compact labels can carry the interface.

## Data and Safety Rules

These production tables are sensitive:

- `entrants`
- `team_picks`
- `prediction_picks`
- `leagues`
- `matches`
- `team_scores`
- `leaderboard_snapshots`

Rules for agents:

- Read-only checks are encouraged.
- Additive migrations are okay when necessary.
- Destructive SQL is not okay without explicit approval.
- Do not clear leagues, entries, or picks.
- Do not run seed data against production.
- Do not change Supabase project refs.
- Always verify `xtipajfuubqitttbrrjv` before deploying Supabase functions.
- Keep `.env*`, Supabase temp files, exports, and local agent files out of Git.

The app should degrade gracefully if live data is delayed. Users should see useful empty/loading/error states rather than a broken screen.

## Main User Journeys

### New User Before Lock

This is for future tournaments or if the product is reopened later:

1. Lands from shared league link or homepage.
2. Reads the rules quickly.
3. Enters name and email.
4. Joins an invite or creates a league.
5. Picks one team from each pot.
6. Chooses a bonus country.
7. Reviews and confirms.
8. Receives clear confirmation and can share/check league.

The design should make the route obvious. If someone arrives with an invite link, joining should be the default path. If someone arrives without a link, viewing public league content or creating a league should be clear.

### Returning User Before Lock

1. Opens app.
2. Enters email.
3. Existing entry is found.
4. Picks and bonus are restored.
5. User can edit until lock.

Do not create duplicate entries for the same email in the same league. If the code currently allows that, it should be fixed carefully without deleting existing records.

### Spectator/User After Lock

1. Opens `pickfour.vercel.app` or an invite link.
2. Sees the live league state without needing to sign up.
3. Can browse the league table, match centre, country backing, bonus race, and scoring guide.
4. Can log in by email if they want "my entry" highlighting and personal breakdown.

After lock, the app should not keep pushing "make picks" or "create league" CTAs. Those should be replaced with live-tournament language.

### Logged-In Entrant After Lock

1. Opens app.
2. Logs in by email if needed.
3. Sees their current rank, points, live countries, upcoming matches, and bonus status.
4. Can tap into a points breakdown in perpetuity.
5. Can inspect which fixtures matter to them and to rivals.

This journey is the heart of the current app.

## Key Screens and What They Should Do

### Overview

The Overview should answer:

- Who is top?
- Where am I?
- Which matches matter next?
- Which countries are most backed?
- What has changed recently?

Good modules:

- League snapshot.
- My entry summary.
- Matches that matter.
- Most-backed countries.
- Bonus race teaser.
- Recent scoring events.

Avoid:

- Multiple duplicated tables.
- Dead CTAs.
- Huge empty cards.
- Forcing sign-up after lock.

### My Entry

The My Entry view should answer:

- What are my four countries?
- What is my bonus country?
- How many points do I have?
- Where did those points come from?
- What fixtures can change my score next?
- Which parts of my entry are still alive?

It should include a durable points ledger:

- Team-by-team totals.
- Match event rows.
- Stage bonuses.
- Deductions.
- Bonus race status.

This breakdown should remain useful for the entire tournament, not only the current matchday.

### League Table

The League Table should answer:

- Current rank.
- Entrant name.
- Total points.
- Movement where available.
- Picks.
- Bonus pick.
- Tap/click for detailed entrant breakdown.

For a large league, add:

- Search by entrant.
- "Find/log in to me."
- Sticky header on desktop.
- Sensible mobile rows.
- Tie handling that does not look broken. If everyone has 0 points, equal rank is okay but should be readable.

### Match Centre

The Match Centre should answer:

- What is happening now?
- What is coming next?
- Which entrants have either team?
- What points are available?
- What changed at full time?

Each match should be tappable/clickable. On open:

- Show home and away team.
- Show entrants backing each side.
- Show "none" when nobody has that country.
- Show possible scoring impact.
- Show final scored impact once processed.

This is where the app becomes a live companion rather than a static table.

### Most-Backed Countries

This view should answer:

- Which countries are carrying the group chat?
- Who has each country?
- Which pot did it come from?
- How much exposure does the league have to this team?

Consider a clean grid/table:

- 3 columns on mobile where possible, with small country tiles.
- Larger responsive grid on desktop.
- Each country tile opens a modal/sheet showing entrants.
- Include pick count and maybe percentage of league.

This is a social feature, not just a stat. It should invite little rivalries.

### Bonus Race

The Bonus Race should answer:

- Which team leads the goal race?
- Who picked them as bonus?
- How close are the chasing teams?
- What does GF mean? Prefer "Goals" in public UI unless a compact stat key explains "GF = goals for."

Avoid unclear football-table abbreviations unless the UI has a key.

### Rules / Scoring

The Rules page should be short and useful after lock:

- Explain how points work.
- Explain the bonus.
- Explain compact event labels.
- Keep the unofficial disclaimer present but muted.

Rules should not feel like the main product after the tournament starts. They are a reference, not the destination.

## Design Philosophy

The visual direction should feel:

- Football draw ritual.
- Mid-2000s tournament nostalgia.
- Clean Premier League app usability.
- Group-chat competitive energy.
- Modern enough to feel fast and trustworthy.

It should not feel:

- Generic fantasy sports SaaS.
- Betting app.
- Crypto dashboard.
- Startup landing page.
- Overdesigned Dribbble concept that ignores messy real data.

The app has to handle long names, lots of entrants, uneven points, live matches, empty states, and nervous users on mobile. Polish should come from rhythm, hierarchy, and clarity rather than decoration.

## Brand Direction

The current brand uses a black-and-white mark built around four selection slips and football/tournament symbolism. The logo should be simple, bold, and legible at small mobile sizes.

Use the brand mark sparingly:

- Header identity.
- App icon.
- Loading state.
- Empty state accent.

Do not let oversized branding cover real content or create awkward loading screens. The product is now about live information.

Important UI copy rule: do not use the word "hat" in app UI text. The visual can imply a draw ritual, but the copy should talk about picks, slips, pots, the league, and the table.

## Typography and Layout

The current voice uses strong, condensed football-style headings with cleaner supporting text. Keep that contrast, but protect readability.

Guidance:

- Headings should create energy, not shout over the data.
- Body copy should be plain and warm.
- Buttons should be consistent and tappable.
- Mobile cards need breathing room.
- Desktop should use multi-column layouts where helpful.
- Avoid horizontal scrolling on normal mobile widths.
- Avoid cards inside cards unless there is a strong reason.
- Keep bottom navigation fixed on mobile.
- Do not let the browser chrome obscure primary actions.

## Copy Voice

Tone:

- Clear.
- Warm.
- Slightly cheeky.
- British-football-adjacent.
- Never smug.
- Never overdramatic.
- Never startup-ish.

Good copy examples:

- "Your next pressure points"
- "Top of the group chat"
- "Matches that matter"
- "Log in to entry"
- "No one has this lot"
- "Your +10 lands if your bonus country finishes top of the goal race."

Avoid:

- "Unlock your fantasy sports experience"
- "Optimise your tournament portfolio"
- "Betting-style odds"
- "Lorem ipsum"
- "Create your winning strategy now"

## Data Visualisation Philosophy

Visualisation should make social stakes obvious:

- Orange bars can show how many entrants back a team, but include numbers or a key.
- Match cards should reveal entrant impact on tap.
- Country exposure should be browsable.
- Rank movement should appear only when real history exists.
- Score breakdowns should be legible rather than clever.

Every chart should answer a user question:

- "Who needs this result?"
- "Why did I move?"
- "Who has the same picks?"
- "Which country is everyone relying on?"
- "Can my bonus still land?"

If a graphic cannot answer one of those, simplify it.

## Live System Expectations

The app should feel alive, but it does not need second-by-second updates.

Reasonable live behavior:

- Refresh match and scoring data on app load.
- Poll during active match windows.
- Show last updated time where useful.
- Make loading states small and contextual.
- Avoid huge full-screen spinners once initial content has loaded.
- Preserve previous data while refreshing where possible.

If the score API fails:

- Show cached/current app data.
- Explain that live scores are delayed.
- Do not blank the league table.

## Accessibility and Usability

Minimum standard:

- 44px tap targets on mobile.
- Clear focus states.
- Sufficient contrast in dark and light modes.
- No important information communicated by colour alone.
- Abbreviations explained in a key.
- Country flags/badges have text names nearby.
- Modals/sheets can be dismissed reliably.
- The app works at 375px mobile width.

## Future Product Direction

PickFour could become a reusable social tournament engine:

- World Cup.
- Euros.
- AFCON.
- Champions League.
- Six Nations.
- Cricket tournaments.
- Olympics medal games.

Reusable primitives:

- Tournament.
- League.
- Entrant.
- Picks.
- Bonus pick.
- Scoring rules.
- Live event feed.
- Leaderboard history.
- Match impact view.
- Identity and recovery.
- Invite links.
- League management.
- Audit/history of scoring events.
- Public spectator mode.

Do not hard-code the product into one tournament so tightly that future events become impossible. But do not over-abstract today in a way that slows the live app.

Longer-term product questions worth exploring:

- What is the simplest league creation flow if a normal person wants to run a tournament with multiple friend groups?
- What does "my account" mean if the app wants to stay lightweight and magic-link based?
- Should future events have templates: World Cup, Euros, Champions League, Six Nations, custom office sweepstake?
- How does a host explain scoring to entrants before the tournament without a giant rules page?
- What happens if two or more entrants have identical picks: should the app celebrate rival twins, highlight tie-break possibilities, or simply show it neutrally?
- How should the app handle trust: visible scoring ledger, last updated time, match source, and clear explanations?
- How could PickFour generate shareable recaps after matchdays without feeling spammy?

## Suggested Work for Fable

Fable should work in a branch or draft pull request, not directly on `main`.

Recommended branch name:

```txt
fable/live-ux-overhaul
```

Recommended assignment:

1. Read `docs/PICKFOUR_HANDOFF.md`.
2. Read this brief.
3. Inspect the current app screens and code.
4. Explore PickFour as both:
   - A live World Cup companion that must work today for real entrants.
   - A scalable social tournament product that could support future events and friend groups.
5. Propose and/or implement a live-tournament UX pass focused on:
   - Overview clarity.
   - My Entry breakdown.
   - Match impact drawers.
   - Most-backed countries grid/modal.
   - Bonus race clarity.
   - Mobile fixed nav and loading polish.
   - Desktop use of space.
   - Trust, transparency, and "why did my score change?" explanations.
   - Future-friendly navigation and information architecture.
6. Feel free to propose bigger product ideas, but separate them from shippable changes.
7. Do not alter locked picks or production data logic.
8. Do not change scoring rules unless explicitly marked as a proposal.
9. Keep Supabase project ref unchanged.
10. Run tests/build before pushing.
11. Push to GitHub branch and describe changes clearly.

Exploration prompts for Fable:

- If this became a real product for many tournaments, what would the core app structure be?
- What are the three screens people would return to every matchday?
- What should a league invite link show after entries are locked?
- How does the app make someone feel like they have a stake in neutral fixtures without becoming gambling-coded?
- How should PickFour make identical or similar entries interesting rather than disappointing?
- What would make a league organiser trust the app enough to invite 50 friends?
- What information is missing from the current UX that would reduce support questions?
- What could be delightful but still practical on a small phone screen?

Good PR title:

```txt
Live tournament UX overhaul
```

Good PR description structure:

- What changed.
- Why it improves the live viewing experience.
- Data/scoring safety notes.
- Screens touched.
- Tests run.
- Known trade-offs.

## Human Decisions Still Needed

Before broadening the product beyond this league, Declan should decide:

- Whether bonus country must be one of the entrant's four teams or can be any team.
- Whether future tournaments reopen create/join flows automatically or by admin toggle.
- Whether entry fees remain display-only or get removed from the public product.
- Whether to keep the current scoring event bonuses exactly as-is for future competitions.
- Whether to add accountless persistent device sessions alongside email recovery.
- Whether to invest in analytics and what privacy standard to use.

## Final Guardrail

PickFour works when people can open it, immediately understand why the next match matters, and have something funny to say in the group chat. Any redesign should protect that. The product is not trying to be the most detailed football data site. It is trying to make a shared tournament feel personal.
