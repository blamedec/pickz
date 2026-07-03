import type { Entrant, LeaderboardRow, MatchResultInput, PredictionCategory, PicksByPot, ScoringConfig, TeamScore } from "../types";

export const defaultScoringConfig: ScoringConfig = {
  groupWin: 3,
  groupDraw: 1,
  knockoutNormalWin: 3,
  knockoutEtPensWin: 2,
  cleanSheetBonus: 1,
  statementWinBonus: 2,
  giantSlayerBonus: 2,
  majorGiantSlayerBonus: 1,
  redCardDeduction: -2,
  ownGoalDeduction: -1,
  advanceFromGroup: 3,
  reachQuarterFinal: 5,
  reachSemiFinal: 7,
  reachFinal: 10,
  winTournament: 15,
  predictionCorrect: 10,
};

export function calculateGiantSlayerBonus(
  match: Pick<MatchResultInput, "teamPot" | "opponentPot"> & { wonMatch: boolean },
  config: ScoringConfig = defaultScoringConfig,
): number {
  const teamPot = match.teamPot ?? 1;
  const opponentPot = match.opponentPot ?? 4;
  if (!match.wonMatch || teamPot < 3 || opponentPot > 2) return 0;

  const potGap = teamPot - opponentPot;
  return config.giantSlayerBonus + (potGap >= 2 ? config.majorGiantSlayerBonus : 0);
}

export function calculateDisciplinePoints(match: Pick<MatchResultInput, "redCards" | "ownGoals">, config: ScoringConfig = defaultScoringConfig): number {
  return (match.redCards ?? 0) * config.redCardDeduction + (match.ownGoals ?? 0) * config.ownGoalDeduction;
}

export function calculateMatchPoints(match: MatchResultInput, config: ScoringConfig = defaultScoringConfig): number {
  const wonMatch = match.stage === "group" ? match.teamScore > match.opponentScore : match.advanced === true;
  let points = 0;

  if (match.stage === "group") {
    if (match.teamScore > match.opponentScore) points += config.groupWin;
    if (match.teamScore === match.opponentScore) points += config.groupDraw;
  } else if (match.advanced) {
    points += match.winMethod === "normal" ? config.knockoutNormalWin : config.knockoutEtPensWin;
  }

  if (match.opponentScore === 0) points += config.cleanSheetBonus;
  if (wonMatch && match.teamScore - match.opponentScore >= 3) points += config.statementWinBonus;
  points += calculateGiantSlayerBonus({ teamPot: match.teamPot, opponentPot: match.opponentPot, wonMatch }, config);
  points += calculateDisciplinePoints(match, config);

  return points;
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
  correct: Record<PredictionCategory, string[]>,
  config: ScoringConfig = defaultScoringConfig,
  _picks?: PicksByPot,
): number {
  const categories = Object.keys(correct) as PredictionCategory[];
  return categories.reduce((total, category) => {
    const prediction = predictions[category];
    return total + (prediction && correct[category].includes(prediction) ? config.predictionCorrect : 0);
  }, 0);
}

export function calculateCountryPoints(entrant: Entrant, scores: Record<string, TeamScore>): number {
  return Object.values(entrant.picks).reduce((total, teamId) => total + (teamId ? (scores[teamId]?.points ?? 0) : 0), 0);
}

export function calculateActiveTeams(entrant: Entrant, scores: Record<string, TeamScore>): number {
  return Object.values(entrant.picks).filter((teamId) => teamId && (scores[teamId]?.status === "active" || scores[teamId]?.status === "champion")).length;
}

export function buildLeaderboard(
  entrants: Entrant[],
  scores: Record<string, TeamScore>,
  correctPredictions: Record<PredictionCategory, string[]>,
): LeaderboardRow[] {
  const rows = entrants.map((entrant) => {
    const countryPoints = calculateCountryPoints(entrant, scores);
    const predictionPoints = calculatePredictionPoints(entrant.predictions, correctPredictions, defaultScoringConfig, entrant.picks);
    return {
      entrant,
      countryPoints,
      predictionPoints,
      totalPoints: countryPoints + predictionPoints,
      activeTeams: calculateActiveTeams(entrant, scores),
      rank: 0,
      movement: 0,
    };
  });

  const sortedRows = rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.activeTeams !== a.activeTeams) return b.activeTeams - a.activeTeams;
    if (b.countryPoints !== a.countryPoints) return b.countryPoints - a.countryPoints;
    return a.entrant.name.localeCompare(b.entrant.name);
  });

  let currentRank = 0;

  return sortedRows.map((row, index) => {
    const previous = sortedRows[index - 1];
    const tiedWithPrevious = Boolean(
      previous &&
        previous.totalPoints === row.totalPoints &&
        previous.activeTeams === row.activeTeams &&
        previous.countryPoints === row.countryPoints &&
        previous.predictionPoints === row.predictionPoints,
    );

    if (!tiedWithPrevious) {
      currentRank = index + 1;
    }

    return { ...row, rank: currentRank };
  });
}
