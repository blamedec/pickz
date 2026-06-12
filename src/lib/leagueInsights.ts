import type { LeaderboardRow } from "../types";

/**
 * League-wide lookups derived from the leaderboard. Previously LiveScreen and
 * MatchdayOverviewScreen each carried their own copies of these.
 */

/** How many entries hold each team across their four picks. */
export function buildPickCounts(rows: LeaderboardRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const teamId of Object.values(row.entrant.picks)) {
      if (teamId) counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Leaderboard rows whose entrant holds the team, in table order. */
export function rowsForTeam(rows: LeaderboardRow[], teamId: string | null | undefined): LeaderboardRow[] {
  if (!teamId) return [];
  return rows.filter((row) => Object.values(row.entrant.picks).includes(teamId));
}

/** Entrant names (A–Z) whose +10 bonus pick is the given team name. */
export function bonusBackers(rows: LeaderboardRow[], teamName: string | null | undefined): string[] {
  if (!teamName) return [];
  return rows
    .filter((row) => row.entrant.predictions.highest_scoring_team === teamName)
    .map((row) => row.entrant.name)
    .sort((a, b) => a.localeCompare(b));
}

/** Bonus-pick counts keyed by team name. */
export function buildBonusBackerCounts(rows: LeaderboardRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row.entrant.predictions.highest_scoring_team;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}
