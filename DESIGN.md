---
name: PickFour Matchday Programme System
version: 1.0.0
updated: 2026-06-12
status: live-prototype-design-system
source_of_truth:
  product: "PickFour, a live World Cup fantasy companion for friend leagues"
  implementation: "React 19 + Vite + TypeScript"
  primary_stylesheet: "src/styles.css"
  current_branch: "fable/live-ux-overhaul"
  production_url: "https://pickfour.vercel.app"
  demo_url: "https://pickfour-demo.vercel.app"
inspiration_mix:
  - "PickFour's existing code and live UI are the shipping source of truth."
  - "Claude-inspired warmth: editorial, human, slightly tactile."
  - "Linear-inspired discipline: dark app surfaces, calm hierarchy, precise rows."
  - "Nike-inspired sport energy: bold display type, confident matchday rhythm."
  - "Vercel-inspired engineering: named tokens, narrow component contracts, clean states."
principles:
  - "Mobile is the primary surface; desktop is a proper command centre, not a stretched phone."
  - "Explain what changed, who it helped, and what happens next."
  - "Every number must be traceable to a team, match, pick, or scoring rule."
  - "The app should feel like friends following a tournament together, not a betting product."
  - "Do not mutate live tournament data while improving presentation."
tokens:
  color:
    light:
      bg: "#f0ebe0"
      bg_strong: "#fffaf1"
      surface: "rgba(255, 250, 241, 0.92)"
      surface_solid: "#fffaf1"
      surface_subtle: "#f4ecde"
      text: "#10110f"
      muted: "rgba(16, 17, 15, 0.64)"
      line: "rgba(16, 17, 15, 0.12)"
      brand: "#d7193f"
      brand_dark: "#10110f"
      gold: "#d99c1c"
      gold_text: "#8a6512"
      green: "#0d7a43"
      paper: "#fff7eb"
      ink: "#050607"
    dark:
      bg: "#050607"
      bg_strong: "#0b0e0d"
      surface: "rgba(18, 22, 21, 0.94)"
      surface_solid: "#121615"
      surface_subtle: "#171c19"
      text: "#f8f1e6"
      muted: "rgba(248, 241, 230, 0.66)"
      line: "rgba(248, 241, 230, 0.12)"
      brand: "#e0193d"
      brand_dark: "#f7f0e6"
      gold: "#f0c531"
      gold_text: "#f0c531"
      green: "#72df84"
      paper: "#f7f0e6"
      ink: "#050607"
    semantic:
      action: "var(--brand)"
      live: "var(--green)"
      attention: "var(--gold)"
      danger: "var(--brand)"
      negative: "var(--brand)"
      neutral: "var(--muted)"
      focus: "var(--green)"
  typography:
    body_family: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    heading_family: "Barlow Condensed, Inter, ui-sans-serif, system-ui, sans-serif"
    scale:
      text_2xs: "0.7rem"
      text_xs: "0.75rem"
      text_sm: "0.8125rem"
      text_md: "0.875rem"
    display:
      family: "var(--font-heading)"
      weight: "800-900"
      transform: "uppercase where it reads like matchday print, never as filler"
      letter_spacing: "0 unless a small caps label needs tracking"
    body:
      family: "var(--font-body)"
      weight: "400-700"
      line_height: "1.35-1.55"
  radius:
    shell: "12px"
    control: "9px"
    small: "7px"
    pill: "999px"
  spacing:
    base: "4px"
    compact_gap: "8px"
    card_gap: "12px"
    panel_gap: "16px"
    desktop_gap: "24-42px"
    page_padding_mobile: "14-16px"
    page_padding_desktop: "24-42px"
  elevation:
    panel: "0 24px 70px rgba(42, 33, 18, 0.14)"
    panel_dark: "0 30px 90px rgba(0, 0, 0, 0.42)"
    tight: "0 10px 30px rgba(42, 33, 18, 0.1)"
  controls:
    primary_height: "48px"
    utility_height: "40px minimum"
    mobile_tap_target: "44px minimum"
    primary_radius: "8-9px"
    primary_font_size: "15px"
    primary_font_weight: 600
    primary_padding_x: "24px"
  breakpoints:
    mobile_min: "320px"
    mobile_target: "375-402px"
    tablet: "768px"
    desktop: "960px"
    wide: "1440px"
---

# Design Rationale

PickFour is a live tournament companion. The job is simple: help someone open the site, understand their entry, see who is winning, and feel the tension of every match. The design should feel like a bold matchday programme crossed with a clean football app. It should be warm, sharp, social, and data-rich without becoming cluttered.

The existing product already has the right bones: dark-first surfaces, cream paper contrast, red action, green live states, sticker flags, Barlow Condensed headlines, Inter UI text, and a fixed mobile nav. This system does not replace that. It names it, tightens it, and gives future work a shared standard.

## Atmosphere

The visual world is a nostalgic football draw ritual, but expressed as a modern live app. Use four slips, paper texture, sticker flags, programme marks, score straps, table rows, and group-chat language. The energy is mid-2000s tournament night: dramatic enough to make the group chat care, restrained enough to trust the scores.

The app should never look like a generic fantasy sports template. Avoid stock stadium drama, neon gaming panels, crypto dashboards, betting slips, casino language, and over-produced gradient backgrounds.

## Product Shape

Post-lock, the app is no longer a signup funnel. It is a living companion:

- `Overview`: what is happening, who leads, your entry, pressure matches, recent scoring changes.
- `Matches`: match centre, who is up for points, latest scored results, bonus race, most-backed countries, group tables, knockout path.
- `My Entry`: personal receipt, four countries, +10 pick, points ledger, next fixtures.
- `Table`: league standings, search, find me, share, expanded entrant breakdowns.
- `Scoring`: compact reference for point rules and abbreviations.

Pre-lock screens still matter for future tournaments, but they must not dominate the live tournament experience.

## Colour

Use colour as role, not decoration.

- Red is action, rivalry, deductions, and PickFour identity.
- Green is live, alive, confirmed, and positive motion.
- Gold/orange is attention, stakes, leader energy, and bonus-race heat.
- Cream is paper and legibility.
- Near-black is the stadium-night app canvas.

Never build a one-hue palette. Red, cream, dark green, gold, and near-black should all appear in measured roles. Light mode must feel like a printed programme, not just dark mode inverted.

## Typography

Barlow Condensed is the matchday voice. Use it for section titles, table rank drama, score headlines, and labels that need bite. Inter is the interface voice. Use it for paragraphs, inputs, tables, buttons, explanations, and dense data.

Rules:

- No italic headings.
- No viewport-scaled type.
- No tiny 9px metadata. The current token floor exists for a reason.
- Uppercase works for programme labels, but do not shout every sentence.
- Labels can use tracking; body text and buttons should not.
- Headings should wrap cleanly with `text-wrap: balance` where supported.

## Layout

Mobile is a vertical match feed with fixed bottom navigation. The reading order should always answer:

1. What is live or recently changed?
2. Where am I in the table?
3. Which of my countries matter next?
4. Who else has the same teams?
5. How are the points being calculated?

Desktop is a command centre. Use the width. Do not centre a narrow phone-shaped app in a sea of empty canvas. Desktop can carry a main column, right rail, table density, and side navigation, but it still needs calm spacing and obvious hierarchy.

Panels use 12px radius. Inner cards and controls use 9px. Flag tiles use 8-10px. Avoid cards inside cards unless the inner surface is a row, drawer, modal, or repeated item with a clear job.

## Components

### App Header

The header should be compact and trustworthy: logo, PickFour wordmark, league name, entry/login control, theme toggle. It is not a marketing nav. Avoid cramming status stats into the header on mobile.

### Section Kicker

Kickers are small navigational labels, not decorative headlines. The programme cross mark can be used sparingly, but remove it from helper copy and long explanatory text. A kicker should align optically with its heading and never force horizontal scroll.

### Buttons

Primary buttons are 48px high, 8-9px radius, 15px, 600 weight, 24px horizontal padding, centred text. Secondary and utility controls can be 40px high, but all mobile interactive targets must reach 44px through height or padding.

Do not use giant buttons for low-risk utilities. Search, share, find-me, filters, and overview links should live in compact rows where possible.

### Country Flags

Use `TeamFlag` for every country representation. Do not use emoji flags. Flags should feel like designed sticker tiles: square or near-square, rounded corners, accurate colours, subtle shadow, and no code-only placeholder blocks.

Country cards must show the country name and, where space allows, points, pick count, next fixture, or entrant names. Never make users infer meaning from colour bars alone.

### Match Cards

A match card must explain the stake:

- Who is playing.
- When or what minute.
- Current score or `vs`.
- How many entrants have each country.
- Whether the +10 race is involved.
- What points are on offer or what points were paid.

Expanded match drawers should expose detail without making the default card noisy. Use short abbreviations only when a visible key is nearby.

### League Table

The league table is the social core. It should support 69+ players without feeling endless. Keep row density high but readable. Search, find me, share, and overview controls should be one compact toolbar, not a stack of banners.

Rows need rank, entrant name, total points, movement only when meaningful, alive count, country points, and drawer affordance. Expanded rows can carry full picks, bonus pick, points breakdown, duplicate-entry notes, and points behind leader.

### My Entry

My Entry should feel like a receipt and a watchlist. It must show:

- Current rank and total points.
- Four chosen countries, one from each pot.
- +10 bonus pick.
- Per-country points breakdown.
- Match ledger in perpetuity.
- Next fixture ordered chronologically.

If the viewer is not logged in, the page should say how to log in with email and name. It must not ask for a league code when the task is identifying an existing entrant.

### Scoring Reference

Scoring is a compact reference, not a long rules article. Users should be able to screenshot it. Group rules, bonus rules, deductions, and +10 mechanic must be grouped clearly with direct point values.

## Data Visualization

PickFour visualizes social stakes, not abstract analytics. The best chart is usually a labelled row, bar, ledger, or small multiple.

Data rules:

- Keep essential values visible without hover.
- Use direct labels and counts on bars.
- Give every abbreviation a nearby key.
- Show last-updated state for live feeds.
- Prefer stale-but-visible data over blank refreshes.
- Empty states should explain what will appear when games finish.
- Never invent metrics. If data is unavailable, say so.

Primary visualization families:

- Leaderboard: ranked table with expandable rows and search.
- Match impact: two-sided match rows with entrant exposure and point chips.
- Bonus race: ranked goal bars with pick backers and gap to leader.
- Most-backed countries: grid/table of all countries with pick counts and click-through entrant lists.
- Group tables: compact standings with qualification line and picked-team emphasis.
- Knockout path: truthful round list. Do not draw connector lines unless bracket seeding data exists.
- Entry ledger: chronological point events per picked country.

Colour encodings:

- Positive points: green.
- Negative points: red.
- Attention/stakes: gold/orange.
- Neutral context: muted cream/grey.
- Selection/current user: clear outline plus label, not colour alone.

## Motion

Motion should make the app feel alive, not busy. Good motion: live pulse, gentle hover lift, drawer open/close, skeleton shimmer, selected row feedback. Bad motion: decorative sweeps, endless ambient movement, spinning loaders where stale data would be better.

Respect `prefers-reduced-motion`. Every motion cue needs a static equivalent.

## Voice And Tone

Tone is clear, warm, slightly cheeky, British-football-adjacent. It should sound like someone in the group chat who actually understands the stakes.

Use:

- "Follow the damage."
- "No one has this lot."
- "Table copied, paste it in the group chat."
- "Your +10 lands if..."
- "Picks are locked."

Avoid:

- Startup copy.
- Betting language.
- Overdramatic battle copy.
- Vague dashboard words like "insights" when "who it helped" is clearer.
- Long helper text where a label, key, or row state would do.
- The physical draw-prop word from the original logo reference in user-facing copy. Say slips, picks, draw, or four instead.

The footer disclaimer must appear in small muted text on every screen:

PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup, tournament organisers, broadcasters, or national associations.

## Accessibility

Meet WCAG AA contrast for text and controls. Gold text needs special care on cream surfaces. Do not use colour as the only meaning. Search, filters, drawers, table rows, and nav must be keyboard reachable with visible focus.

Mobile inputs must be at least 16px to avoid iOS zoom. Tap targets must be 44px minimum. Any icon-only button needs an accessible label.

## Responsive Rules

Test at 320, 375, 390, 402, 768, 960, and 1440px.

At 320px:

- Bottom nav labels must not wrap.
- Match rows must not clip flags, scores, or entrant counts.
- Toolbar buttons must collapse into a compact row or clear stack.
- No horizontal scroll except intentional internal tables with visible affordance.

At 390-402px:

- The app should feel like the intended mobile product, not a compromised fallback.
- Cards should keep equal left and right padding.
- Country grids can be two columns only if labels remain readable.

At 960px and above:

- Use multi-column layouts where they reduce scrolling.
- Keep the live right rail useful for spectators.
- Avoid stretching cards to awkward widths without adding information density.

At 1440px and above:

- The main content should feel like a proper responsive web app.
- Do not leave the user staring at a narrow centred column unless the screen is intentionally focused.

## Anti-Patterns

Do not ship:

- Emoji flags.
- Placeholder text or lorem ipsum.
- Dead buttons.
- Detached legends when direct labels fit.
- Hover-only meaning.
- Fake bracket connectors.
- Duplicate modules that show the same information twice.
- Huge rules blocks during live mode.
- Nested scroll traps on mobile.
- Red marks on every helper paragraph.
- Decorative gradients, orbs, or atmosphere that do not carry football or data meaning.
- Inconsistent radius families.
- More than one design language for buttons, chips, and rows.

## Implementation Notes

The current system lives mostly in `src/styles.css`. Before adding new styles, check if a token, utility, or component family already exists. Prefer adjusting the shared rule over adding another one-off selector.

For new components:

1. Use existing data helpers in `src/lib`.
2. Use `TeamFlag` for country visuals.
3. Use `lucide-react` only when the icon metaphor is clear and visually compatible.
4. Include loading, empty, error, locked, logged-out, and reduced-motion states.
5. Verify mobile and desktop with screenshots before deploy.

Design changes must not alter scoring, lock timing, entrant data, picks, leagues, matches, team scores, or leaderboard snapshots unless the user explicitly asks for backend work.
