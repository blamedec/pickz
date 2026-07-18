import { getTeamByEspnId, teams } from "../data/teams";
import {
  calculateChampionBonus,
  calculateDisciplinePoints,
  calculateGiantSlayerBonus,
  calculateMatchPoints,
  calculateStageBonus,
  defaultScoringConfig,
} from "./scoring";
import type { MatchStage, TeamScore, WorldCupFixture } from "../types";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";
const KICKOFF_VISIBILITY_WINDOW_MS = 3 * 60 * 60 * 1000;

type EspnCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  season?: { slug?: string; name?: string };
  competitions?: Array<{
    status?: {
      displayClock?: string;
      type?: {
        name?: string;
        completed?: boolean;
        state?: string;
      };
    };
    venue?: { fullName?: string };
    competitors?: EspnCompetitor[];
    details?: EspnDetail[];
    notes?: Array<{ headline?: string }>;
  }>;
};

// Matches the league does not count (the third-place playoff). Mirrors the
// sync-scores exclusion so the client's direct-ESPN fallback agrees with the
// server. Add ESPN event ids for belt-and-braces certainty.
export const EXCLUDED_ESPN_MATCH_IDS = new Set<string>([
  // "738012", // England v France third-place playoff — fill in if needed
]);

const THIRD_PLACE_PATTERN = /\b(3rd|third)\b[\s-]*place|\bbronze\b|play[\s-]?off for third/i;

export function isThirdPlacePlayoffEvent(event: {
  season?: { slug?: string; name?: string };
  competitions?: Array<{ notes?: Array<{ headline?: string }> } | undefined>;
}): boolean {
  const notes = (event.competitions?.[0]?.notes ?? []).map((note) => note?.headline ?? "").join(" ");
  return THIRD_PLACE_PATTERN.test(`${event.season?.slug ?? ""} ${event.season?.name ?? ""} ${notes}`);
}

type EspnStatus = NonNullable<NonNullable<EspnEvent["competitions"]>[number]["status"]>;

type EspnDetail = {
  redCard?: boolean;
  ownGoal?: boolean;
  team?: { id?: string };
};

const stageRank: Record<TeamScore["stageReached"], number> = {
  pre_tournament: 0,
  group: 1,
  round_of_32: 2,
  round_of_16: 3,
  quarter_final: 4,
  semi_final: 5,
  final: 6,
};

function stageFromSlug(slug?: string): MatchStage {
  // A third-place playoff must never be classified as the final.
  if (slug && THIRD_PLACE_PATTERN.test(slug)) return "semi_final";
  switch (slug) {
    case "round-of-32":
      return "round_of_32";
    case "round-of-16":
      return "round_of_16";
    case "quarterfinals":
    case "quarter-finals":
      return "quarter_final";
    case "semifinals":
    case "semi-finals":
      return "semi_final";
    case "final":
      return "final";
    default:
      return "group";
  }
}

function statusFromEspn(status?: EspnStatus): WorldCupFixture["status"] {
  if (status?.type?.completed) return "completed";
  if (status?.type?.state === "in" || status?.type?.name === "STATUS_IN_PROGRESS") return "live";
  return "scheduled";
}

function mapCompetitor(competitor: EspnCompetitor) {
  const espnId = competitor.team?.id ?? "";
  const team = getTeamByEspnId(espnId);

  return {
    id: team?.id ?? null,
    espnId,
    name: team?.name ?? competitor.team?.displayName ?? "TBC",
    shortName: team?.shortName ?? competitor.team?.shortDisplayName ?? competitor.team?.abbreviation ?? "TBC",
    code: team?.code ?? competitor.team?.abbreviation ?? "TBC",
    score: Number.parseInt(competitor.score ?? "0", 10) || 0,
    winner: competitor.winner === true,
  };
}

function emptyDiscipline() {
  return {
    homeRedCards: 0,
    awayRedCards: 0,
    homeOwnGoals: 0,
    awayOwnGoals: 0,
  };
}

export function parseDiscipline(details: EspnDetail[] | undefined, homeEspnId: string, awayEspnId: string) {
  const discipline = emptyDiscipline();

  for (const detail of details ?? []) {
    if (detail.redCard) {
      if (detail.team?.id === homeEspnId) discipline.homeRedCards += 1;
      if (detail.team?.id === awayEspnId) discipline.awayRedCards += 1;
    }

    if (detail.ownGoal) {
      // ESPN credits an own-goal scoring play to the side that benefits, so
      // the -1 belongs to the OTHER side — the team whose player scored it.
      if (detail.team?.id === homeEspnId) discipline.awayOwnGoals += 1;
      if (detail.team?.id === awayEspnId) discipline.homeOwnGoals += 1;
    }
  }

  return discipline;
}

export async function fetchWorldCupFixtures(): Promise<WorldCupFixture[]> {
  const response = await fetch(ESPN_SCOREBOARD_URL);
  if (!response.ok) {
    throw new Error(`ESPN scoreboard returned ${response.status}`);
  }

  const payload = (await response.json()) as { events?: EspnEvent[] };
  return (payload.events ?? [])
    .flatMap((event) => {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors ?? [];
      const home = competitors.find((competitor) => competitor.homeAway === "home") ?? competitors[0];
      const away = competitors.find((competitor) => competitor.homeAway === "away") ?? competitors[1];

      if (!event.id || !event.date || !home || !away) return [];
      if (EXCLUDED_ESPN_MATCH_IDS.has(event.id) || isThirdPlacePlayoffEvent(event)) return [];

      const stage = stageFromSlug(event.season?.slug);
      const homeTeam = mapCompetitor(home);
      const awayTeam = mapCompetitor(away);
      const homeLocal = homeTeam.id ? teams.find((team) => team.id === homeTeam.id) : null;
      const awayLocal = awayTeam.id ? teams.find((team) => team.id === awayTeam.id) : null;
      const discipline = parseDiscipline(competition?.details, homeTeam.espnId, awayTeam.espnId);

      return [
        {
          id: event.id,
          startsAt: event.date,
          stage,
          group: stage === "group" ? homeLocal?.group ?? awayLocal?.group ?? null : null,
          status: statusFromEspn(competition?.status),
          displayClock: competition?.status?.displayClock ?? "",
          venue: competition?.venue?.fullName ?? "Venue TBC",
          home: homeTeam,
          away: awayTeam,
          discipline,
          source: "espn" as const,
        },
      ];
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function buildScoresFromFixtures(fixtures: WorldCupFixture[]): Record<string, TeamScore> {
  const scores: Record<string, TeamScore> = Object.fromEntries(
    teams.map((team) => [
      team.id,
      {
        teamId: team.id,
        points: 0,
        tablePoints: 0,
        matchPoints: 0,
        cleanSheetBonusPoints: 0,
        statementWinBonusPoints: 0,
        giantSlayerBonusPoints: 0,
        majorGiantSlayerBonusPoints: 0,
        redCards: 0,
        ownGoals: 0,
        redCardDeductionPoints: 0,
        ownGoalDeductionPoints: 0,
        disciplineDeductionPoints: 0,
        stageBonusPoints: 0,
        championBonusPoints: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        cleanSheets: 0,
        status: "active",
        stageReached: "pre_tournament",
        lastUpdate: "Pre-tournament",
      } satisfies TeamScore,
    ]),
  );
  const reachedStageByTeam = new Map<string, TeamScore["stageReached"]>();
  const championTeamIds = new Set<string>();
  const knockoutParticipantIds = new Set<string>();
  const roundOf32ParticipantIds = new Set<string>();

  for (const fixture of fixtures) {
    if (fixture.stage === "group") continue;
    for (const teamId of [fixture.home.id, fixture.away.id]) {
      if (!teamId) continue;
      knockoutParticipantIds.add(teamId);
      if (fixture.stage === "round_of_32") roundOf32ParticipantIds.add(teamId);
    }
  }

  function markStage(teamId: string, stage: TeamScore["stageReached"]) {
    const current = reachedStageByTeam.get(teamId) ?? "pre_tournament";
    if (stageRank[stage] > stageRank[current]) {
      reachedStageByTeam.set(teamId, stage);
    }
  }

  for (const fixture of fixtures) {
    if (!fixture.home.id || !fixture.away.id) continue;

    const home = scores[fixture.home.id];
    const away = scores[fixture.away.id];
    const homeTeam = teams.find((team) => team.id === fixture.home.id);
    const awayTeam = teams.find((team) => team.id === fixture.away.id);
    const discipline = fixture.discipline ?? emptyDiscipline();

    if (fixture.stage !== "group") {
      markStage(fixture.home.id, fixture.stage);
      markStage(fixture.away.id, fixture.stage);
    }

    if (fixture.status !== "completed") continue;

    if (fixture.stage === "group") {
      markStage(fixture.home.id, "group");
      markStage(fixture.away.id, "group");
    }

    const winnerId = fixture.home.winner
      ? fixture.home.id
      : fixture.away.winner
        ? fixture.away.id
        : fixture.home.score > fixture.away.score
          ? fixture.home.id
          : fixture.away.score > fixture.home.score
            ? fixture.away.id
            : null;
    const winMethod = fixture.stage !== "group" && fixture.home.score === fixture.away.score ? "penalties" : "normal";
    const homePoints = calculateMatchPoints({
      stage: fixture.stage,
      teamScore: fixture.home.score,
      opponentScore: fixture.away.score,
      advanced: winnerId === fixture.home.id,
      winMethod,
      teamPot: homeTeam?.pot,
      opponentPot: awayTeam?.pot,
      redCards: discipline.homeRedCards,
      ownGoals: discipline.homeOwnGoals,
    });
    const awayPoints = calculateMatchPoints({
      stage: fixture.stage,
      teamScore: fixture.away.score,
      opponentScore: fixture.home.score,
      advanced: winnerId === fixture.away.id,
      winMethod,
      teamPot: awayTeam?.pot,
      opponentPot: homeTeam?.pot,
      redCards: discipline.awayRedCards,
      ownGoals: discipline.awayOwnGoals,
    });
    const homeWon = winnerId === fixture.home.id;
    const awayWon = winnerId === fixture.away.id;
    const homeGiantSlayerBonus = calculateGiantSlayerBonus({ teamPot: homeTeam?.pot, opponentPot: awayTeam?.pot, wonMatch: homeWon });
    const awayGiantSlayerBonus = calculateGiantSlayerBonus({ teamPot: awayTeam?.pot, opponentPot: homeTeam?.pot, wonMatch: awayWon });
    const homeDisciplinePoints = calculateDisciplinePoints({ redCards: discipline.homeRedCards, ownGoals: discipline.homeOwnGoals });
    const awayDisciplinePoints = calculateDisciplinePoints({ redCards: discipline.awayRedCards, ownGoals: discipline.awayOwnGoals });

    home.points += homePoints;
    away.points += awayPoints;
    home.matchPoints = (home.matchPoints ?? 0) + homePoints;
    away.matchPoints = (away.matchPoints ?? 0) + awayPoints;
    home.goalsFor += fixture.home.score;
    home.goalsAgainst += fixture.away.score;
    away.goalsFor += fixture.away.score;
    away.goalsAgainst += fixture.home.score;
    home.redCards = (home.redCards ?? 0) + discipline.homeRedCards;
    away.redCards = (away.redCards ?? 0) + discipline.awayRedCards;
    home.ownGoals = (home.ownGoals ?? 0) + discipline.homeOwnGoals;
    away.ownGoals = (away.ownGoals ?? 0) + discipline.awayOwnGoals;
    home.redCardDeductionPoints = (home.redCardDeductionPoints ?? 0) + discipline.homeRedCards * defaultScoringConfig.redCardDeduction;
    away.redCardDeductionPoints = (away.redCardDeductionPoints ?? 0) + discipline.awayRedCards * defaultScoringConfig.redCardDeduction;
    home.ownGoalDeductionPoints = (home.ownGoalDeductionPoints ?? 0) + discipline.homeOwnGoals * defaultScoringConfig.ownGoalDeduction;
    away.ownGoalDeductionPoints = (away.ownGoalDeductionPoints ?? 0) + discipline.awayOwnGoals * defaultScoringConfig.ownGoalDeduction;
    home.disciplineDeductionPoints = (home.disciplineDeductionPoints ?? 0) + homeDisciplinePoints;
    away.disciplineDeductionPoints = (away.disciplineDeductionPoints ?? 0) + awayDisciplinePoints;
    if (fixture.away.score === 0) {
      home.cleanSheets += 1;
      home.cleanSheetBonusPoints = (home.cleanSheetBonusPoints ?? 0) + defaultScoringConfig.cleanSheetBonus;
    }
    if (fixture.home.score === 0) {
      away.cleanSheets += 1;
      away.cleanSheetBonusPoints = (away.cleanSheetBonusPoints ?? 0) + defaultScoringConfig.cleanSheetBonus;
    }
    if (winnerId === fixture.home.id && fixture.home.score - fixture.away.score >= 3) {
      home.statementWinBonusPoints = (home.statementWinBonusPoints ?? 0) + defaultScoringConfig.statementWinBonus;
    }
    if (winnerId === fixture.away.id && fixture.away.score - fixture.home.score >= 3) {
      away.statementWinBonusPoints = (away.statementWinBonusPoints ?? 0) + defaultScoringConfig.statementWinBonus;
    }
    if (homeGiantSlayerBonus > 0) {
      home.giantSlayerBonusPoints = (home.giantSlayerBonusPoints ?? 0) + defaultScoringConfig.giantSlayerBonus;
      home.majorGiantSlayerBonusPoints = (home.majorGiantSlayerBonusPoints ?? 0) + (homeGiantSlayerBonus - defaultScoringConfig.giantSlayerBonus);
    }
    if (awayGiantSlayerBonus > 0) {
      away.giantSlayerBonusPoints = (away.giantSlayerBonusPoints ?? 0) + defaultScoringConfig.giantSlayerBonus;
      away.majorGiantSlayerBonusPoints = (away.majorGiantSlayerBonusPoints ?? 0) + (awayGiantSlayerBonus - defaultScoringConfig.giantSlayerBonus);
    }

    if (fixture.home.score > fixture.away.score) {
      home.tablePoints = (home.tablePoints ?? 0) + 3;
      home.wins += 1;
      away.losses += 1;
    } else if (fixture.home.score < fixture.away.score) {
      away.tablePoints = (away.tablePoints ?? 0) + 3;
      away.wins += 1;
      home.losses += 1;
    } else if (fixture.stage === "group") {
      home.tablePoints = (home.tablePoints ?? 0) + 1;
      away.tablePoints = (away.tablePoints ?? 0) + 1;
      home.draws += 1;
      away.draws += 1;
    } else {
      if (winnerId === fixture.home.id) {
        home.wins += 1;
        away.losses += 1;
      } else if (winnerId === fixture.away.id) {
        away.wins += 1;
        home.losses += 1;
      }
    }

    home.lastUpdate = `Last result: ${fixture.home.shortName} ${fixture.home.score}-${fixture.away.score} ${fixture.away.shortName}`;
    away.lastUpdate = home.lastUpdate;

    if (fixture.stage === "final" && winnerId) {
      championTeamIds.add(winnerId);
    }
    if (fixture.stage !== "group" && winnerId) {
      const loserId = winnerId === fixture.home.id ? fixture.away.id : fixture.home.id;
      scores[loserId].status = "eliminated";
    }
  }

  // Group-stage exits: once the full round-of-32 field is known, any team
  // that appears in no knockout tie is out of the tournament.
  const knockoutFieldKnown = roundOf32ParticipantIds.size >= 32;

  for (const score of Object.values(scores)) {
    const stageReached = reachedStageByTeam.get(score.teamId) ?? score.stageReached;
    score.stageReached = stageReached;
    score.stageBonusPoints = calculateStageBonus(stageReached);
    score.points += score.stageBonusPoints;

    if (knockoutFieldKnown && score.status === "active" && !knockoutParticipantIds.has(score.teamId)) {
      score.status = "eliminated";
      score.lastUpdate = "Out at the group stage";
    }

    if (championTeamIds.has(score.teamId)) {
      score.status = "champion";
      score.championBonusPoints = calculateChampionBonus("champion");
      score.points += score.championBonusPoints;
      score.lastUpdate = "Champion bonus confirmed";
    }
  }

  return scores;
}

export function isFixtureInKickoffWindow(fixture: WorldCupFixture, now = Date.now()) {
  if (fixture.status !== "scheduled") return false;
  const kickoff = new Date(fixture.startsAt).getTime();
  return kickoff <= now && now - kickoff <= KICKOFF_VISIBILITY_WINDOW_MS;
}

export function getCurrentFixtures(fixtures: WorldCupFixture[], now = Date.now()) {
  const active = fixtures
    .filter((fixture) => fixture.status === "live" || isFixtureInKickoffWindow(fixture, now))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "live" ? -1 : 1;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });

  if (active.length > 0) return active;

  return fixtures.filter((fixture) => fixture.status === "scheduled" && new Date(fixture.startsAt).getTime() >= now).slice(0, 8);
}

/**
 * All teams sharing the top of the goal race. A tie must pay every joint
 * leader's backers, not whichever team happens to sort first.
 */
export function getCorrectPredictionFromScores(scores: Record<string, TeamScore>): Record<"highest_scoring_team", string[]> {
  const rows = Object.values(scores);
  const topGoals = Math.max(0, ...rows.map((score) => score.goalsFor));
  if (topGoals === 0) return { highest_scoring_team: [] };

  const leaders = rows
    .filter((score) => score.goalsFor === topGoals)
    .map((score) => teams.find((item) => item.id === score.teamId)?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  return { highest_scoring_team: leaders };
}
