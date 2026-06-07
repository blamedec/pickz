export type Pot = 1 | 2 | 3 | 4;

export type ThemeMode = "light" | "dark";

export type TeamStatus = "active" | "eliminated" | "champion";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

export type KnockoutWinMethod = "normal" | "extra_time" | "penalties";

export type PredictionCategory = "highest_scoring_team";

export type UserRole = "creator" | "joiner";

export type PicksByPot = Record<Pot, string | null>;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Team {
  id: string;
  espnId: string;
  name: string;
  shortName: string;
  code: string;
  flag: string;
  group: string;
  pot: Pot;
  primaryColor: string;
  secondaryColor: string;
  nostalgicNote?: string;
}

export interface TeamScore {
  teamId: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  status: TeamStatus;
  stageReached: MatchStage | "pre_tournament";
  lastUpdate: string;
}

export interface Entrant {
  id: string;
  name: string;
  avatarColor: string;
  picks: PicksByPot;
  predictions: Record<PredictionCategory, string>;
}

export interface League {
  id: string;
  name: string;
  inviteCode: string;
  creatorEmail: string;
  entryFeePence: number;
  prizePot: string;
  inviteOpen: boolean;
  maxEntrants: number | null;
  lockTimeIso: string;
  locked: boolean;
  adminCode?: string;
}

export interface LeagueCreateInput {
  name: string;
  entryFeePence: number;
  inviteOpen: boolean;
  maxEntrants: number | null;
}

export interface MatchResultInput {
  stage: MatchStage;
  teamScore: number;
  opponentScore: number;
  winMethod?: KnockoutWinMethod;
  advanced?: boolean;
}

export interface ScoringConfig {
  groupWin: number;
  groupDraw: number;
  knockoutNormalWin: number;
  knockoutEtPensWin: number;
  advanceFromGroup: number;
  reachQuarterFinal: number;
  reachSemiFinal: number;
  reachFinal: number;
  winTournament: number;
  predictionCorrect: number;
}

export interface LeaderboardRow {
  entrant: Entrant;
  countryPoints: number;
  predictionPoints: number;
  totalPoints: number;
  activeTeams: number;
  rank: number;
  movement: number;
}

export interface GlobalLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  leagueName: string;
  avatarColor: string;
  countryPoints: number;
  predictionPoints: number;
  totalPoints: number;
  activeTeams: number;
  picks: PicksByPot;
  bonusTeamId: string;
}

export interface FixtureTeam {
  id: string | null;
  espnId: string;
  name: string;
  shortName: string;
  code: string;
  score: number;
  winner: boolean;
}

export interface WorldCupFixture {
  id: string;
  startsAt: string;
  stage: MatchStage;
  group: string | null;
  status: "scheduled" | "live" | "completed";
  displayClock: string;
  venue: string;
  home: FixtureTeam;
  away: FixtureTeam;
  source: "espn";
}

export interface LeagueApiPayload {
  league: League;
  entrants: Entrant[];
  currentEntrantId: string | null;
  adminCode?: string;
}
