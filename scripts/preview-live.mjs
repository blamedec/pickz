/**
 * Visual QA harness: runs the app against a mocked Supabase backend so the
 * live-tournament screens can be screenshotted without touching production.
 * Usage: node scripts/preview-live.mjs [base-url]
 */
import { chromium } from "playwright";

const BASE_URL = process.argv[2] ?? "http://127.0.0.1:5173";
const OUT_DIR = process.env.PREVIEW_OUT ?? "/tmp/pickfour-preview";

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600_000).toISOString();
const hoursAhead = (h) => new Date(now + h * 3600_000).toISOString();

const matches = [
  {
    espn_match_id: "m1",
    starts_at: hoursAgo(9),
    stage: "group",
    group_letter: "H",
    home_team_id: "esp",
    away_team_id: "ksa",
    home_score: 2,
    away_score: 0,
    winner_team_id: "esp",
    status: "completed",
    home_red_cards: 0,
    away_red_cards: 1,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "Estadio Azteca" } }] },
  },
  {
    espn_match_id: "m2",
    starts_at: hoursAgo(6),
    stage: "group",
    group_letter: "A",
    home_team_id: "mex",
    away_team_id: "kor",
    home_score: 1,
    away_score: 1,
    winner_team_id: null,
    status: "completed",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "Estadio Akron" } }] },
  },
  {
    espn_match_id: "m3",
    starts_at: hoursAgo(4),
    stage: "group",
    group_letter: "C",
    home_team_id: "bra",
    away_team_id: "hai",
    home_score: 4,
    away_score: 1,
    winner_team_id: "bra",
    status: "completed",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 1,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "MetLife Stadium" } }] },
  },
  {
    espn_match_id: "m4",
    starts_at: hoursAgo(1),
    stage: "group",
    group_letter: "L",
    home_team_id: "eng",
    away_team_id: "gha",
    home_score: 1,
    away_score: 0,
    winner_team_id: null,
    status: "live",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: { displayClock: "63'" }, venue: { fullName: "AT&T Stadium" } }] },
  },
  {
    espn_match_id: "m5",
    starts_at: hoursAhead(14),
    stage: "group",
    group_letter: "I",
    home_team_id: "fra",
    away_team_id: "irq",
    home_score: 0,
    away_score: 0,
    winner_team_id: null,
    status: "scheduled",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "SoFi Stadium" } }] },
  },
  {
    espn_match_id: "m6",
    starts_at: hoursAhead(17),
    stage: "group",
    group_letter: "F",
    home_team_id: "ned",
    away_team_id: "jpn",
    home_score: 0,
    away_score: 0,
    winner_team_id: null,
    status: "scheduled",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "BC Place" } }] },
  },
  // Early knockout ties so the road-to-the-final view can be QA'd
  {
    espn_match_id: "m7",
    starts_at: hoursAhead(18 * 24),
    stage: "round_of_32",
    group_letter: null,
    home_team_id: "esp",
    away_team_id: "jpn",
    home_score: 0,
    away_score: 0,
    winner_team_id: null,
    status: "scheduled",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "Rose Bowl" } }] },
  },
  {
    espn_match_id: "m8",
    starts_at: hoursAhead(19 * 24),
    stage: "round_of_32",
    group_letter: null,
    home_team_id: "eng",
    away_team_id: "mar",
    home_score: 0,
    away_score: 0,
    winner_team_id: null,
    status: "scheduled",
    home_red_cards: 0,
    away_red_cards: 0,
    home_own_goals: 0,
    away_own_goals: 0,
    raw_payload: { competitions: [{ status: {}, venue: { fullName: "Estadio BBVA" } }] },
  },
];

const entrants = [
  { id: "declan", name: "Declan", avatarColor: "#e71d36", picks: { 1: "eng", 2: "jpn", 3: "nor", 4: "gha" }, predictions: { highest_scoring_team: "Brazil" }, entryComplete: true },
  { id: "soph", name: "Soph", avatarColor: "#1f7a4d", picks: { 1: "bra", 2: "cro", 3: "sco", 4: "cze" }, predictions: { highest_scoring_team: "France" }, entryComplete: true },
  { id: "max", name: "Max", avatarColor: "#0c3b73", picks: { 1: "fra", 2: "mar", 3: "egy", 4: "hai" }, predictions: { highest_scoring_team: "Spain" }, entryComplete: true },
  { id: "rory", name: "Rory", avatarColor: "#f2b705", picks: { 1: "esp", 2: "uru", 3: "tun", 4: "gha" }, predictions: { highest_scoring_team: "Brazil" }, entryComplete: true },
  { id: "amy", name: "Amy", avatarColor: "#7b2d8b", picks: { 1: "bra", 2: "jpn", 3: "sco", 4: "tur" }, predictions: { highest_scoring_team: "England" }, entryComplete: true },
  { id: "jess", name: "Jess", avatarColor: "#0d7a43", picks: { 1: "mex", 2: "kor", 3: "pan", 4: "hai" }, predictions: { highest_scoring_team: "Mexico" }, entryComplete: true },
  { id: "tom", name: "Tom", avatarColor: "#d99c1c", picks: { 1: "ger", 2: "sen", 3: "civ", 4: "swe" }, predictions: { highest_scoring_team: "Germany" }, entryComplete: true },
];

const league = {
  id: "world-cup-singles",
  name: "World cup Singles",
  inviteCode: "GCHYKF",
  creatorEmail: "declanpitts@gmail.com",
  entryFeePence: 1000,
  prizePot: "£70 pot",
  inviteOpen: true,
  maxEntrants: null,
  lockTimeIso: "2026-06-11T18:55:00.000Z",
  locked: true,
};

const snapshots = [
  { id: "s1", leagueId: league.id, entrantId: "declan", countryPoints: 0, predictionPoints: 0, totalPoints: 0, activeTeams: 4, rank: 3, snapshottedAt: hoursAgo(8) },
  { id: "s2", leagueId: league.id, entrantId: "declan", countryPoints: 3, predictionPoints: 0, totalPoints: 3, activeTeams: 4, rank: 2, snapshottedAt: hoursAgo(3) },
];

const leaguePayload = { league, entrants, currentEntrantId: "declan", picksVisible: true, snapshots };

async function captureScreens(page, label) {
  const tabs = [
    ["overview", "Overview"],
    ["matches", "Matches"],
    ["entry", "My entry"],
    ["table", "Table"],
  ];

  for (const [slug, navLabel] of tabs) {
    const nav = page.locator(`nav button:visible, .desktop-step:visible`).filter({ hasText: navLabel }).first();
    if ((await nav.count()) > 0) {
      await nav.click();
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: `${OUT_DIR}/${label}-${slug}.png`, fullPage: true });
  }
}

async function run() {
  const browser = await chromium.launch();

  for (const [label, viewport] of [
    ["mobile", { width: 390, height: 844 }],
    ["desktop", { width: 1512, height: 945 }],
  ]) {
    const context = await browser.newContext({ viewport });

    await context.route("**/functions/v1/league-api", async (route) => {
      const body = JSON.parse(route.request().postData() ?? "{}");
      const payload = body.action === "list-leagues" ? { leagues: [leaguePayload] } : leaguePayload;
      await route.fulfill({ json: payload });
    });
    await context.route("**/rest/v1/matches*", (route) => route.fulfill({ json: matches }));
    await context.route("**/rest/v1/team_scores*", (route) => route.fulfill({ json: [] }));
    await context.route("**/site.api.espn.com/**", (route) => route.fulfill({ json: { events: [] } }));
    await context.route("**/auth/v1/**", (route) => route.fulfill({ json: {} }));

    await context.addInitScript(() => {
      localStorage.setItem("pickfour:v2:rules-accepted", "true");
      localStorage.setItem("pickfour:theme", "dark");
      localStorage.setItem(
        "pickfour:v2:profile",
        JSON.stringify({ id: "local-player", email: "declanpitts@gmail.com", name: "Declan", role: "joiner" }),
      );
    });

    const page = await context.newPage();
    page.on("pageerror", (error) => console.error(`[${label}] page error:`, error.message));
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await captureScreens(page, label);
    await context.close();
  }

  await browser.close();
  console.log(`Screenshots written to ${OUT_DIR}`);
}

await run();
