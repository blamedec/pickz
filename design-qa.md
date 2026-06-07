# PickFour Design QA

final result: passed

Reference:
- `/Users/declanpitts/Documents/Sweepy/mp-latest-overhaul-preview.png`
- `/Users/declanpitts/Documents/Sweepy/mp-latest-mobile-preview.png`

Rendered checks:
- `/Users/declanpitts/Documents/Sweepy/qa-fidelity-fresh-rules-desktop-1440.png`
- `/Users/declanpitts/Documents/Sweepy/qa-fidelity-fresh-rules-mobile-390.png`
- `/Users/declanpitts/Documents/Sweepy/qa-fidelity-picks-desktop-1440.png`
- `/Users/declanpitts/Documents/Sweepy/qa-fidelity-picks-mobile-390.png`

Fidelity ledger:
- Typography now uses the MagicPath Barlow Condensed/Inter pairing for wordmark, headings, nav, and data panels.
- Logo is a cleaner hat-and-four-slips SVG mark instead of CSS-built approximate shapes.
- Mobile now has the guided top journey stepper from the MagicPath flow.
- Picks screens now reveal pot slips and country stickers in the first viewport on mobile and desktop.
- Team pick icons are SVG country stickers, not emoji flags, with consistent rounded sticker sizing.
- Desktop remains a three-column responsive app shell with sidebar, main work area, and live rail.
- Light/dark mode remains available, with dark as the default MagicPath-aligned first view.

Functional QA:
- `npm run build` passed.
- `npm test` passed.
- Browser plugin QA and Playwright screenshots showed no relevant console errors and no horizontal overflow at 1440x900 or 390x844.
