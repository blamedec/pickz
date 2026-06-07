import { getTeamByEspnId, teams } from "../data/teams";
import type { MatchStage, TeamScore, WorldCupFixture } from "../types";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";

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
  season?: { slug?: string };
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
  }>;
};

type EspnStatus = NonNullable<NonNullable<EspnEvent["competitions"]>[number]["status"]>;

function stageFromSlug(slug?: string): MatchStage {
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

      const stage = stageFromSlug(event.season?.slug);
      const homeTeam = mapCompetitor(home);
      const awayTeam = mapCompetitor(away);
      const homeLocal = homeTeam.id ? teams.find((team) => team.id === homeTeam.id) : null;
      const awayLocal = awayTeam.id ? teams.find((team) => team.id === awayTeam.id) : null;

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

  for (const fixture of fixtures) {
    if (fixture.status !== "completed" || fixture.stage !== "group" || !fixture.home.id || !fixture.away.id) continue;

    const home = scores[fixture.home.id];
    const away = scores[fixture.away.id];
    home.goalsFor += fixture.home.score;
    home.goalsAgainst += fixture.away.score;
    away.goalsFor += fixture.away.score;
    away.goalsAgainst += fixture.home.score;
    if (fixture.away.score === 0) home.cleanSheets += 1;
    if (fixture.home.score === 0) away.cleanSheets += 1;

    if (fixture.home.score > fixture.away.score) {
      home.points += 3;
      home.wins += 1;
      away.losses += 1;
    } else if (fixture.home.score < fixture.away.score) {
      away.points += 3;
      away.wins += 1;
      home.losses += 1;
    } else {
      home.points += 1;
      away.points += 1;
      home.draws += 1;
      away.draws += 1;
    }

    home.stageReached = "group";
    away.stageReached = "group";
    home.lastUpdate = `Last result: ${fixture.home.shortName} ${fixture.home.score}-${fixture.away.score} ${fixture.away.shortName}`;
    away.lastUpdate = home.lastUpdate;
  }

  return scores;
}

export function getCurrentFixtures(fixtures: WorldCupFixture[]) {
  const live = fixtures.filter((fixture) => fixture.status === "live");
  if (live.length > 0) return live;

  const now = Date.now();
  return fixtures
    .filter((fixture) => fixture.status === "scheduled" && new Date(fixture.startsAt).getTime() >= now)
    .slice(0, 8);
}

export function getCorrectPredictionFromScores(scores: Record<string, TeamScore>) {
  const leader = Object.values(scores)
    .slice()
    .sort((a, b) => b.goalsFor - a.goalsFor || b.points - a.points)[0];

  const team = leader ? teams.find((item) => item.id === leader.teamId) : null;
  return { highest_scoring_team: leader && leader.goalsFor > 0 && team ? team.name : "" };
}
