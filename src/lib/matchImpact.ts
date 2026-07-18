import { defaultScoringConfig } from "./scoring";
import type { ScoringConfig, TeamScore, WorldCupFixture } from "../types";
import { maybeGetTeam } from "../data/teams";

export interface ImpactItem {
  label: string;
  points: number;
}

/**
 * A team's tournament points grouped by rule, straight from the synced
 * score row. `matchPoints` includes every per-match bonus and deduction, so
 * those are subtracted back out — the items must sum to the team's total.
 * Zero-value groups are dropped so the list reads as a receipt.
 */
export function getTeamPointsBreakdown(score?: TeamScore): ImpactItem[] {
  if (!score) return [];

  const cleanSheets = score.cleanSheetBonusPoints ?? 0;
  const statementWins = score.statementWinBonusPoints ?? 0;
  const underdog = (score.giantSlayerBonusPoints ?? 0) + (score.majorGiantSlayerBonusPoints ?? 0);
  const discipline = score.disciplineDeductionPoints ?? 0;
  const baseResults = (score.matchPoints ?? 0) - cleanSheets - statementWins - underdog - discipline;

  return [
    { label: "Results", points: baseResults },
    { label: "Clean sheets", points: cleanSheets },
    { label: "Statement wins", points: statementWins },
    { label: "Underdog bonus", points: underdog },
    { label: "Stage bonus", points: (score.stageBonusPoints ?? 0) + (score.championBonusPoints ?? 0) },
    { label: "Discipline", points: discipline },
  ].filter((item) => item.points !== 0);
}

export interface FixtureSideImpact {
  total: number;
  items: ImpactItem[];
}

export function getFixtureWinnerId(fixture: WorldCupFixture): string | null {
  if (fixture.home.winner && fixture.home.id) return fixture.home.id;
  if (fixture.away.winner && fixture.away.id) return fixture.away.id;
  if (fixture.home.score > fixture.away.score) return fixture.home.id;
  if (fixture.away.score > fixture.home.score) return fixture.away.id;
  return null;
}

export function formatSignedPoints(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Breaks a completed fixture down into the scoring events one side earned,
 * using the same rules as `calculateMatchPoints`. Display-only: the league
 * totals still come from the synced `team_scores` data, this just explains them.
 */
export function getFixtureSideImpact(
  fixture: WorldCupFixture,
  side: "home" | "away",
  config: ScoringConfig = defaultScoringConfig,
): FixtureSideImpact | null {
  if (fixture.status !== "completed" || fixture.goalsOnly) return null;

  const us = side === "home" ? fixture.home : fixture.away;
  const them = side === "home" ? fixture.away : fixture.home;
  if (!us.id) return null;

  const winnerId = getFixtureWinnerId(fixture);
  const won = winnerId === us.id;
  const discipline = fixture.discipline ?? { homeRedCards: 0, awayRedCards: 0, homeOwnGoals: 0, awayOwnGoals: 0 };
  const redCards = side === "home" ? discipline.homeRedCards : discipline.awayRedCards;
  const ownGoals = side === "home" ? discipline.homeOwnGoals : discipline.awayOwnGoals;
  const ourPot = maybeGetTeam(us.id)?.pot;
  const theirPot = maybeGetTeam(them.id)?.pot;

  const items: ImpactItem[] = [];

  if (fixture.stage === "group") {
    if (us.score > them.score) items.push({ label: "Group win", points: config.groupWin });
    if (us.score === them.score) items.push({ label: "Group draw", points: config.groupDraw });
  } else if (won) {
    const winMethod = fixture.home.score === fixture.away.score ? "penalties" : "normal";
    items.push(
      winMethod === "normal"
        ? { label: "Knockout win", points: config.knockoutNormalWin }
        : { label: "Won on pens / extra time", points: config.knockoutEtPensWin },
    );
  }

  if (them.score === 0) items.push({ label: "Clean sheet", points: config.cleanSheetBonus });
  if (won && us.score - them.score >= 3) items.push({ label: "Statement win", points: config.statementWinBonus });

  if (won && ourPot !== undefined && theirPot !== undefined && ourPot >= 3 && theirPot <= 2) {
    items.push({ label: "Giant-slayer", points: config.giantSlayerBonus });
    if (ourPot - theirPot >= 2) items.push({ label: "Major giant-slayer", points: config.majorGiantSlayerBonus });
  }

  if (redCards > 0) {
    items.push({ label: redCards > 1 ? `Red cards ×${redCards}` : "Red card", points: redCards * config.redCardDeduction });
  }
  if (ownGoals > 0) {
    items.push({ label: ownGoals > 1 ? `Own goals ×${ownGoals}` : "Own goal", points: ownGoals * config.ownGoalDeduction });
  }

  return { total: items.reduce((sum, item) => sum + item.points, 0), items };
}

/** What an unfinished match can still pay out, in plain terms. */
export function getPointsOnOffer(fixture: WorldCupFixture, config: ScoringConfig = defaultScoringConfig): ImpactItem[] {
  if (fixture.goalsOnly) return [];
  if (fixture.stage === "group") {
    return [
      { label: "Win", points: config.groupWin },
      { label: "Draw", points: config.groupDraw },
      { label: "Clean sheet", points: config.cleanSheetBonus },
    ];
  }

  return [
    { label: "Win", points: config.knockoutNormalWin },
    { label: "Win on pens / extra time", points: config.knockoutEtPensWin },
    { label: "Clean sheet", points: config.cleanSheetBonus },
  ];
}

export interface TeamLedgerEntry {
  fixture: WorldCupFixture;
  side: "home" | "away";
  impact: FixtureSideImpact;
}

/** Completed matches for one team, newest first, each with its points breakdown. */
export function getTeamMatchLedger(teamId: string, fixtures: WorldCupFixture[]): TeamLedgerEntry[] {
  return fixtures
    .filter((fixture) => fixture.status === "completed" && (fixture.home.id === teamId || fixture.away.id === teamId))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .flatMap((fixture) => {
      const side = fixture.home.id === teamId ? ("home" as const) : ("away" as const);
      const impact = getFixtureSideImpact(fixture, side);
      return impact ? [{ fixture, side, impact }] : [];
    });
}
