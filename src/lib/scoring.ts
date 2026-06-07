import type { Entrant, LeaderboardRow, MatchResultInput, PredictionCategory, ScoringConfig, TeamScore } from "../types";

export const defaultScoringConfig: ScoringConfig = {
  groupWin: 3,
  groupDraw: 1,
  knockoutNormalWin: 3,
  knockoutEtPensWin: 2,
  advanceFromGroup: 3,
  reachQuarterFinal: 5,
  reachSemiFinal: 7,
  reachFinal: 10,
  winTournament: 15,
  predictionCorrect: 10,
};

export function calculateMatchPoints(match: MatchResultInput, config: ScoringConfig = defaultScoringConfig): number {
  if (match.stage === "group") {
    if (match.teamScore > match.opponentScore) return config.groupWin;
    if (match.teamScore === match.opponentScore) return config.groupDraw;
    return 0;
  }

  if (!match.advanced) return 0;

  return match.winMethod === "normal" ? config.knockoutNormalWin : config.knockoutEtPensWin;
}

export function calculateStageBonus(stage: TeamScore["stageReached"], config: ScoringConfig = defaultScoringConfig): number {
  switch (stage) {
    case "round_of_32":
    case "round_of_16":
      return config.advanceFromGroup;
    case "quarter_final":
      return config.reachQuarterFinal;
    case "semi_final":
      return config.reachSemiFinal;
    case "final":
      return config.reachFinal;
    default:
      return 0;
  }
}

export function calculateChampionBonus(status: TeamScore["status"], config: ScoringConfig = defaultScoringConfig): number {
  return status === "champion" ? config.winTournament : 0;
}

export function validateOnePickPerPot(picks: Entrant["picks"]): boolean {
  return Boolean(picks[1] && picks[2] && picks[3] && picks[4]);
}

export function canEditPicks(now: Date, lockTimeIso: string): boolean {
  return now.getTime() < new Date(lockTimeIso).getTime();
}

export function calculatePredictionPoints(
  predictions: Entrant["predictions"],
  correct: Record<PredictionCategory, string>,
  config: ScoringConfig = defaultScoringConfig,
): number {
  const categories = Object.keys(correct) as PredictionCategory[];
  return categories.reduce((total, category) => {
    return total + (predictions[category] === correct[category] ? config.predictionCorrect : 0);
  }, 0);
}

export function calculateCountryPoints(entrant: Entrant, scores: Record<string, TeamScore>): number {
  return Object.values(entrant.picks).reduce((total, teamId) => total + (scores[teamId]?.points ?? 0), 0);
}

export function calculateActiveTeams(entrant: Entrant, scores: Record<string, TeamScore>): number {
  return Object.values(entrant.picks).filter((teamId) => scores[teamId]?.status === "active" || scores[teamId]?.status === "champion").length;
}

export function buildLeaderboard(
  entrants: Entrant[],
  scores: Record<string, TeamScore>,
  correctPredictions: Record<PredictionCategory, string>,
): LeaderboardRow[] {
  const rows = entrants.map((entrant) => {
    const countryPoints = calculateCountryPoints(entrant, scores);
    const predictionPoints = calculatePredictionPoints(entrant.predictions, correctPredictions);
    return {
      entrant,
      countryPoints,
      predictionPoints,
      totalPoints: countryPoints + predictionPoints,
      activeTeams: calculateActiveTeams(entrant, scores),
      rank: 0,
      movement: Math.floor(Math.random() * 5) - 2,
    };
  });

  return rows
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.activeTeams !== a.activeTeams) return b.activeTeams - a.activeTeams;
      if (b.countryPoints !== a.countryPoints) return b.countryPoints - a.countryPoints;
      return a.entrant.name.localeCompare(b.entrant.name);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
