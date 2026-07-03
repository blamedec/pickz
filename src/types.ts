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
  tablePoints?: number;
  matchPoints?: number;
  cleanSheetBonusPoints?: number;
  statementWinBonusPoints?: number;
  giantSlayerBonusPoints?: number;
  majorGiantSlayerBonusPoints?: number;
  redCards?: number;
  ownGoals?: number;
  redCardDeductionPoints?: number;
  ownGoalDeductionPoints?: number;
  disciplineDeductionPoints?: number;
  stageBonusPoints?: number;
  championBonusPoints?: number;
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
  entryComplete?: boolean;
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
  teamPot?: Pot;
  opponentPot?: Pot;
  redCards?: number;
  ownGoals?: number;
}

export interface ScoringConfig {
  groupWin: number;
  groupDraw: number;
  knockoutNormalWin: number;
  knockoutEtPensWin: number;
  cleanSheetBonus: number;
  statementWinBonus: number;
  giantSlayerBonus: number;
  majorGiantSlayerBonus: number;
  redCardDeduction: number;
  ownGoalDeduction: number;
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
  /** Banked bonus only: stays 0 until the tournament is decided. */
  predictionPoints: number;
  totalPoints: number;
  /** Bonus pick currently leads the goal race — +10 in play, not yet banked. */
  bonusOnTrack: boolean;
  activeTeams: number;
  rank: number;
  movement: number;
}

export interface LeaderboardSnapshot {
  id: string;
  leagueId: string;
  entrantId: string;
  countryPoints: number;
  predictionPoints: number;
  totalPoints: number;
  activeTeams: number;
  rank: number;
  snapshottedAt: string;
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
  discipline?: {
    homeRedCards: number;
    awayRedCards: number;
    homeOwnGoals: number;
    awayOwnGoals: number;
  };
  source: "espn";
}

export interface LeagueApiPayload {
  league: League;
  entrants: Entrant[];
  currentEntrantId: string | null;
  picksVisible: boolean;
  adminCode?: string;
  snapshots?: LeaderboardSnapshot[];
}
