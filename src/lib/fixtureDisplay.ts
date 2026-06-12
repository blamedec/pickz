import { isFixtureInKickoffWindow } from "./worldCupApi";
import type { MatchStage, TeamScore, WorldCupFixture } from "../types";

/**
 * Single source of truth for fixture wording. Before this existed the same
 * formatters were re-implemented (with drift) in App, LiveScreen,
 * MatchdayOverviewScreen, KnockoutBracket and PicksScreen.
 */

export function formatKickoffParts(value: string) {
  const kickoff = new Date(value);
  return {
    date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(kickoff),
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(kickoff),
  };
}

export function formatKickoff(value: string) {
  const { date, time } = formatKickoffParts(value);
  return `${date} ${time}`;
}

/** "vs" before any score exists, then "2-0". */
export function fixtureScoreLabel(fixture: WorldCupFixture) {
  const hasScore = fixture.home.score > 0 || fixture.away.score > 0;
  return fixture.status === "scheduled" && !hasScore ? "vs" : `${fixture.home.score}-${fixture.away.score}`;
}

/** FT / live clock / "Now" in the kickoff window / kickoff date-time. */
export function fixtureTimeLabel(fixture: WorldCupFixture) {
  if (fixture.status === "live") return fixture.displayClock || "Live";
  if (fixture.status === "completed") return "FT";
  if (isFixtureInKickoffWindow(fixture)) return "Now";
  return formatKickoff(fixture.startsAt);
}

export const stageLabels: Record<MatchStage, string> = {
  group: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  final: "Final",
};

export function stageReachedLabel(stage: TeamScore["stageReached"]) {
  return stage === "pre_tournament" ? stageLabels.group : stageLabels[stage];
}

export function groupOrStageLabel(fixture: WorldCupFixture) {
  return fixture.group ? `Group ${fixture.group}` : stageLabels[fixture.stage];
}

/**
 * The next unfinished fixture for a team. `graceMs` keeps a just-kicked-off
 * or in-progress match in scope (the overview uses a 2h grace window).
 */
export function nextFixtureForTeam(teamId: string, fixtures: WorldCupFixture[], graceMs = 0) {
  const cutoff = Date.now() - graceMs;
  return fixtures.find(
    (fixture) =>
      fixture.status !== "completed" &&
      (fixture.home.id === teamId || fixture.away.id === teamId) &&
      (fixture.status === "live" || isFixtureInKickoffWindow(fixture) || new Date(fixture.startsAt).getTime() >= cutoff),
  );
}
