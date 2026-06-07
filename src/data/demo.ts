import type { Entrant, GlobalLeaderboardEntry, League, PredictionCategory, TeamScore, UserProfile } from "../types";
import { teams } from "./teams";

export const demoProfile: UserProfile = {
  id: "creator-declan",
  email: "declan@pottoglory.app",
  name: "Declan",
  role: "creator",
};

export const demoLeague: League = {
  id: "declans-cup-league",
  name: "Declan's Cup League",
  inviteCode: "POT26",
  creatorEmail: demoProfile.email,
  entryFeePence: 0,
  prizePot: "£0 pot",
  inviteOpen: true,
  maxEntrants: null,
  lockTimeIso: "2026-06-11T19:00:00.000Z",
  locked: false,
};

export const predictionCategories: Array<{
  id: PredictionCategory;
  label: string;
  shortLabel: string;
  sample: string;
}> = [{ id: "highest_scoring_team", label: "Highest Scoring Team", shortLabel: "Bonus", sample: "Brazil" }];

export const correctPredictions: Record<PredictionCategory, string> = {
  highest_scoring_team: "Brazil",
};

export const demoEntrants: Entrant[] = [
  {
    id: "declan",
    name: "Declan",
    avatarColor: "#e71d36",
    picks: { 1: "eng", 2: "jpn", 3: "nor", 4: "gha" },
    predictions: { highest_scoring_team: "Brazil" },
  },
  {
    id: "soph",
    name: "Soph",
    avatarColor: "#1f7a4d",
    picks: { 1: "bra", 2: "cro", 3: "sco", 4: "cze" },
    predictions: { highest_scoring_team: "France" },
  },
  {
    id: "max",
    name: "Max",
    avatarColor: "#0c3b73",
    picks: { 1: "fra", 2: "mar", 3: "egy", 4: "hai" },
    predictions: { highest_scoring_team: "Spain" },
  },
  {
    id: "rory",
    name: "Rory",
    avatarColor: "#f2b705",
    picks: { 1: "arg", 2: "col", 3: "rsa", 4: "tur" },
    predictions: { highest_scoring_team: "Argentina" },
  },
  {
    id: "amy",
    name: "Amy",
    avatarColor: "#7c3aed",
    picks: { 1: "por", 2: "sui", 3: "tun", 4: "cpv" },
    predictions: { highest_scoring_team: "Portugal" },
  },
  {
    id: "harry",
    name: "Harry B",
    avatarColor: "#f97316",
    picks: { 1: "esp", 2: "uru", 3: "pan", 4: "swe" },
    predictions: { highest_scoring_team: "Spain" },
  },
  {
    id: "jack",
    name: "Jack",
    avatarColor: "#0891b2",
    picks: { 1: "ned", 2: "ecu", 3: "alg", 4: "nzl" },
    predictions: { highest_scoring_team: "Brazil" },
  },
  {
    id: "dan",
    name: "Dan",
    avatarColor: "#16a34a",
    picks: { 1: "bel", 2: "sen", 3: "civ", 4: "cod" },
    predictions: { highest_scoring_team: "England" },
  },
  {
    id: "mike",
    name: "Mike",
    avatarColor: "#dc2626",
    picks: { 1: "ger", 2: "aus", 3: "qat", 4: "irq" },
    predictions: { highest_scoring_team: "France" },
  },
  {
    id: "tom",
    name: "Tom",
    avatarColor: "#475569",
    picks: { 1: "usa", 2: "kor", 3: "ksa", 4: "jor" },
    predictions: { highest_scoring_team: "Argentina" },
  },
];

export const globalLeaderboardRows: GlobalLeaderboardEntry[] = [
  {
    id: "global-1",
    rank: 1,
    name: "Nina R",
    leagueName: "North London Glory",
    avatarColor: "#e71d36",
    countryPoints: 63,
    predictionPoints: 10,
    totalPoints: 73,
    activeTeams: 4,
    picks: { 1: "bra", 2: "jpn", 3: "civ", 4: "swe" },
    bonusTeamId: "bra",
  },
  {
    id: "global-2",
    rank: 2,
    name: "Mo",
    leagueName: "Office Worldies",
    avatarColor: "#1f7a4d",
    countryPoints: 60,
    predictionPoints: 10,
    totalPoints: 70,
    activeTeams: 4,
    picks: { 1: "eng", 2: "cro", 3: "pan", 4: "gha" },
    bonusTeamId: "eng",
  },
  {
    id: "global-3",
    rank: 3,
    name: "Caitlin",
    leagueName: "Sunday League HQ",
    avatarColor: "#0c3b73",
    countryPoints: 59,
    predictionPoints: 0,
    totalPoints: 59,
    activeTeams: 3,
    picks: { 1: "fra", 2: "mar", 3: "nor", 4: "nzl" },
    bonusTeamId: "fra",
  },
  {
    id: "global-4",
    rank: 4,
    name: "Declan",
    leagueName: "Declan's Cup League",
    avatarColor: "#e71d36",
    countryPoints: 48,
    predictionPoints: 10,
    totalPoints: 58,
    activeTeams: 4,
    picks: { 1: "eng", 2: "jpn", 3: "nor", 4: "gha" },
    bonusTeamId: "bra",
  },
  {
    id: "global-5",
    rank: 5,
    name: "Ade",
    leagueName: "Pub Table 12",
    avatarColor: "#7c3aed",
    countryPoints: 50,
    predictionPoints: 0,
    totalPoints: 50,
    activeTeams: 3,
    picks: { 1: "esp", 2: "uru", 3: "egy", 4: "cpv" },
    bonusTeamId: "esp",
  },
  {
    id: "global-6",
    rank: 6,
    name: "Sofia",
    leagueName: "The Golden Lot",
    avatarColor: "#f2b705",
    countryPoints: 49,
    predictionPoints: 0,
    totalPoints: 49,
    activeTeams: 3,
    picks: { 1: "arg", 2: "col", 3: "sco", 4: "tur" },
    bonusTeamId: "arg",
  },
];

export const demoTeamScores: Record<string, TeamScore> = Object.fromEntries(
  teams.map((team, index) => {
    const base = team.pot === 1 ? 8 : team.pot === 2 ? 6 : team.pot === 3 ? 4 : 2;
    const goalsFor = Math.max(1, base + (index % 4));
    const goalsAgainst = Math.max(0, team.pot - 1 + (index % 2));
    const eliminated = ["hai", "cpv", "tun", "rsa", "cuw"].includes(team.id);
    return [
      team.id,
      {
        teamId: team.id,
        points: eliminated ? base + 1 : base + 4 + (index % 5),
        wins: Math.max(0, Math.floor(base / 3)),
        draws: index % 3 === 0 ? 1 : 0,
        losses: eliminated ? 2 : index % 2,
        goalsFor,
        goalsAgainst,
        cleanSheets: index % 4,
        status: eliminated ? "eliminated" : "active",
        stageReached: eliminated ? "group" : team.pot === 1 ? "round_of_16" : "round_of_32",
        lastUpdate: eliminated ? "Out in group stage" : "Still alive",
      },
    ];
  }),
);

export const liveEvents = [
  { id: "e1", teamId: "eng", text: "England win +3", minute: "FT", tone: "win" },
  { id: "e2", teamId: "jpn", text: "Japan draw +1", minute: "90+4", tone: "draw" },
  { id: "e3", teamId: "gha", text: "Ghana eliminated", minute: "FT", tone: "out" },
  { id: "e4", teamId: "bra", text: "Brazil advance bonus +3", minute: "FT", tone: "bonus" },
] as const;

export const fixtureCards = [
  { id: "f1", home: "England", away: "Croatia", date: "Sat 20 Jun", time: "20:00", tag: "Your Pot 1" },
  { id: "f2", home: "Japan", away: "Sweden", date: "Sun 21 Jun", time: "17:00", tag: "Your Pot 2" },
  { id: "f3", home: "Norway", away: "France", date: "Tue 23 Jun", time: "20:00", tag: "Group I chaos" },
];
