import { describe, expect, it } from "vitest";
import type { Entrant, PredictionCategory, TeamScore } from "../types";
import type { WorldCupFixture } from "../types";
import {
  buildLeaderboard,
  calculateMatchPoints,
  calculatePredictionPoints,
  canEditPicks,
  validateOnePickPerPot,
} from "./scoring";
import { buildScoresFromFixtures, getCorrectPredictionFromScores, getCurrentFixtures, parseDiscipline } from "./worldCupApi";
import { getTeamPointsBreakdown } from "./matchImpact";
import { teams } from "../data/teams";

describe("country scoring", () => {
  it("scores group results as win/draw/loss", () => {
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 1 })).toBe(3);
    expect(calculateMatchPoints({ stage: "group", teamScore: 1, opponentScore: 1 })).toBe(1);
    expect(calculateMatchPoints({ stage: "group", teamScore: 0, opponentScore: 1 })).toBe(0);
  });

  it("adds scoreable match bonuses", () => {
    expect(calculateMatchPoints({ stage: "group", teamScore: 1, opponentScore: 0 })).toBe(4);
    expect(calculateMatchPoints({ stage: "group", teamScore: 4, opponentScore: 0 })).toBe(6);
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 1, teamPot: 4, opponentPot: 1 })).toBe(6);
  });

  it("scores knockout wins by win method", () => {
    expect(calculateMatchPoints({ stage: "round_of_16", teamScore: 2, opponentScore: 1, advanced: true, winMethod: "normal" })).toBe(3);
    expect(calculateMatchPoints({ stage: "quarter_final", teamScore: 1, opponentScore: 1, advanced: true, winMethod: "penalties" })).toBe(2);
    expect(calculateMatchPoints({ stage: "semi_final", teamScore: 1, opponentScore: 2, advanced: false })).toBe(0);
  });

  it("deducts red cards and own goals without hiding the base result", () => {
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 1, redCards: 1 })).toBe(1);
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 1, ownGoals: 1 })).toBe(2);
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 1, redCards: 1, ownGoals: 1 })).toBe(0);
  });
});

describe("pick rules", () => {
  it("requires exactly one selection from each pot", () => {
    expect(validateOnePickPerPot({ 1: "eng", 2: "jpn", 3: "nor", 4: "gha" })).toBe(true);
    expect(validateOnePickPerPot({ 1: "eng", 2: "jpn", 3: "", 4: "gha" })).toBe(false);
  });

  it("locks pick editing at the configured deadline", () => {
    expect(canEditPicks(new Date("2026-06-11T18:54:59Z"), "2026-06-11T18:55:00Z")).toBe(true);
    expect(canEditPicks(new Date("2026-06-11T18:55:00Z"), "2026-06-11T18:55:00Z")).toBe(false);
  });
});

describe("prediction bonuses", () => {
  const prediction = { highest_scoring_team: "Brazil" };
  const correct: Record<PredictionCategory, string[]> = {
    highest_scoring_team: ["Brazil"],
  };

  it("adds ten points for the correct highest-scoring team", () => {
    expect(calculatePredictionPoints(prediction, correct)).toBe(10);
    expect(
      calculatePredictionPoints(
        {
          highest_scoring_team: "France",
        },
        correct,
      ),
    ).toBe(0);
  });

  it("pays every backer when the goal race is tied at the top", () => {
    const jointCorrect: Record<PredictionCategory, string[]> = {
      highest_scoring_team: ["Brazil", "France"],
    };

    expect(calculatePredictionPoints({ highest_scoring_team: "Brazil" }, jointCorrect)).toBe(10);
    expect(calculatePredictionPoints({ highest_scoring_team: "France" }, jointCorrect)).toBe(10);
    expect(calculatePredictionPoints({ highest_scoring_team: "Spain" }, jointCorrect)).toBe(0);
  });

  it("allows the bonus pick to be any tournament team", () => {
    expect(
      calculatePredictionPoints(prediction, correct, undefined, {
        1: "bra",
        2: "jpn",
        3: "nor",
        4: "gha",
      }),
    ).toBe(10);
    expect(
      calculatePredictionPoints(prediction, correct, undefined, {
        1: "eng",
        2: "jpn",
        3: "nor",
        4: "gha",
      }),
    ).toBe(10);
  });
});

describe("leaderboard", () => {
  const entrants: Entrant[] = [
    {
      id: "a",
      name: "Amy",
      avatarColor: "#fff",
      picks: { 1: "bra", 2: "jpn", 3: "nor", 4: "gha" },
      predictions: {
        highest_scoring_team: "Brazil",
      },
    },
    {
      id: "b",
      name: "Ben",
      avatarColor: "#000",
      picks: { 1: "fra", 2: "cro", 3: "sco", 4: "cze" },
      predictions: {
        highest_scoring_team: "France",
      },
    },
  ];

  const scores: Record<string, TeamScore> = {
    bra: { teamId: "bra", points: 8, wins: 2, draws: 0, losses: 0, goalsFor: 6, goalsAgainst: 1, cleanSheets: 1, status: "active", stageReached: "round_of_16", lastUpdate: "" },
    jpn: { teamId: "jpn", points: 7, wins: 2, draws: 1, losses: 0, goalsFor: 5, goalsAgainst: 2, cleanSheets: 1, status: "active", stageReached: "round_of_16", lastUpdate: "" },
    nor: { teamId: "nor", points: 4, wins: 1, draws: 1, losses: 1, goalsFor: 4, goalsAgainst: 4, cleanSheets: 0, status: "eliminated", stageReached: "group", lastUpdate: "" },
    gha: { teamId: "gha", points: 2, wins: 0, draws: 2, losses: 1, goalsFor: 2, goalsAgainst: 5, cleanSheets: 0, status: "eliminated", stageReached: "group", lastUpdate: "" },
    fra: { teamId: "fra", points: 9, wins: 3, draws: 0, losses: 0, goalsFor: 8, goalsAgainst: 1, cleanSheets: 2, status: "active", stageReached: "round_of_16", lastUpdate: "" },
    cro: { teamId: "cro", points: 6, wins: 2, draws: 0, losses: 1, goalsFor: 4, goalsAgainst: 3, cleanSheets: 1, status: "active", stageReached: "round_of_32", lastUpdate: "" },
    sco: { teamId: "sco", points: 3, wins: 1, draws: 0, losses: 2, goalsFor: 3, goalsAgainst: 6, cleanSheets: 0, status: "eliminated", stageReached: "group", lastUpdate: "" },
    cze: { teamId: "cze", points: 1, wins: 0, draws: 1, losses: 2, goalsFor: 1, goalsAgainst: 4, cleanSheets: 0, status: "eliminated", stageReached: "group", lastUpdate: "" },
  };

  it("sorts by total points, then active teams and country score", () => {
    const rows = buildLeaderboard(entrants, scores, {
      highest_scoring_team: ["Brazil"],
    });

    expect(rows[0].entrant.name).toBe("Amy");
    expect(rows[0].totalPoints).toBe(31);
    expect(rows[0].rank).toBe(1);
  });

  it("gives matching entries the same rank", () => {
    const rows = buildLeaderboard(
      [
        entrants[0],
        {
          ...entrants[0],
          id: "c",
          name: "Cam",
          avatarColor: "#123456",
        },
      ],
      scores,
      {
        highest_scoring_team: ["Brazil"],
      },
    );

    expect(rows.map((row) => row.rank)).toEqual([1, 1]);
  });

  it("finds joint goal-race leaders instead of an arbitrary first team", () => {
    const tied: Record<string, TeamScore> = {
      bra: { teamId: "bra", points: 8, wins: 2, draws: 0, losses: 0, goalsFor: 6, goalsAgainst: 1, cleanSheets: 1, status: "active", stageReached: "round_of_16", lastUpdate: "" },
      fra: { teamId: "fra", points: 9, wins: 3, draws: 0, losses: 0, goalsFor: 6, goalsAgainst: 1, cleanSheets: 2, status: "active", stageReached: "round_of_16", lastUpdate: "" },
      jpn: { teamId: "jpn", points: 7, wins: 2, draws: 1, losses: 0, goalsFor: 5, goalsAgainst: 2, cleanSheets: 1, status: "active", stageReached: "round_of_16", lastUpdate: "" },
    };

    expect(getCorrectPredictionFromScores(tied).highest_scoring_team).toEqual(["Brazil", "France"]);
    expect(getCorrectPredictionFromScores({}).highest_scoring_team).toEqual([]);
  });
});

describe("live score builder", () => {
  it("keeps just-started scheduled matches visible while the live provider catches up", () => {
    const fixtures = [
      {
        id: "mex-rsa",
        startsAt: "2026-06-11T19:00:00Z",
        stage: "group",
        group: "A",
        status: "scheduled",
        displayClock: "",
        venue: "Test Stadium",
        home: { id: "mex", espnId: "203", name: "Mexico", shortName: "Mexico", code: "MEX", score: 0, winner: false },
        away: { id: "rsa", espnId: "467", name: "South Africa", shortName: "South Africa", code: "RSA", score: 0, winner: false },
        source: "espn",
      },
      {
        id: "kor-cze",
        startsAt: "2026-06-12T02:00:00Z",
        stage: "group",
        group: "A",
        status: "scheduled",
        displayClock: "",
        venue: "Test Stadium",
        home: { id: "kor", espnId: "451", name: "South Korea", shortName: "Korea", code: "KOR", score: 0, winner: false },
        away: { id: "cze", espnId: "450", name: "Czechia", shortName: "Czechia", code: "CZE", score: 0, winner: false },
        source: "espn",
      },
    ] satisfies WorldCupFixture[];

    const current = getCurrentFixtures(fixtures, new Date("2026-06-11T19:08:00Z").getTime());

    expect(current.map((fixture) => fixture.id)).toEqual(["mex-rsa"]);
  });

  it("keeps real group-table points separate from PickFour fantasy points", () => {
    const fixtures = [
      {
        id: "esp-arg",
        startsAt: "2026-06-12T20:00:00Z",
        stage: "group",
        group: "H",
        status: "completed",
        displayClock: "FT",
        venue: "Test Stadium",
        home: { id: "esp", espnId: "164", name: "Spain", shortName: "Spain", code: "ESP", score: 4, winner: true },
        away: { id: "arg", espnId: "202", name: "Argentina", shortName: "Argentina", code: "ARG", score: 0, winner: false },
        discipline: { homeRedCards: 1, awayRedCards: 0, homeOwnGoals: 0, awayOwnGoals: 0 },
        source: "espn",
      },
      {
        id: "nor-fra",
        startsAt: "2026-06-13T20:00:00Z",
        stage: "group",
        group: "I",
        status: "completed",
        displayClock: "FT",
        venue: "Test Stadium",
        home: { id: "nor", espnId: "464", name: "Norway", shortName: "Norway", code: "NOR", score: 2, winner: true },
        away: { id: "fra", espnId: "478", name: "France", shortName: "France", code: "FRA", score: 1, winner: false },
        discipline: { homeRedCards: 0, awayRedCards: 0, homeOwnGoals: 0, awayOwnGoals: 1 },
        source: "espn",
      },
    ] satisfies WorldCupFixture[];

    const scores = buildScoresFromFixtures(fixtures);

    expect(scores.esp.tablePoints).toBe(3);
    expect(scores.esp.points).toBe(4);
    expect(scores.esp.redCards).toBe(1);
    expect(scores.esp.redCardDeductionPoints).toBe(-2);
    expect(scores.nor.tablePoints).toBe(3);
    expect(scores.nor.points).toBe(6);
    expect(scores.fra.ownGoals).toBe(1);
    expect(scores.fra.ownGoalDeductionPoints).toBe(-1);

    // The receipt shown in the UI must sum to the team's headline total.
    for (const teamId of ["esp", "arg", "nor", "fra"]) {
      const breakdownTotal = getTeamPointsBreakdown(scores[teamId]).reduce((total, item) => total + item.points, 0);
      expect(breakdownTotal).toBe(scores[teamId].points);
    }
  });

  it("eliminates group-stage exits once the full round-of-32 field is known", () => {
    const knockoutTeams = teams.filter((team) => team.id !== "tur").slice(0, 32);
    const fullSlate = Array.from({ length: 16 }, (_, index) => {
      const home = knockoutTeams[index * 2];
      const away = knockoutTeams[index * 2 + 1];
      return {
        id: `r32-${index}`,
        startsAt: `2026-06-${28 + (index % 2)}T18:00:00Z`,
        stage: "round_of_32",
        group: null,
        status: "scheduled",
        displayClock: "",
        venue: "Test Stadium",
        home: { id: home.id, espnId: home.espnId, name: home.name, shortName: home.shortName, code: home.code, score: 0, winner: false },
        away: { id: away.id, espnId: away.espnId, name: away.name, shortName: away.shortName, code: away.code, score: 0, winner: false },
        source: "espn",
      } satisfies WorldCupFixture;
    });

    const decided = buildScoresFromFixtures(fullSlate);
    expect(decided.tur.status).toBe("eliminated");
    expect(decided.tur.lastUpdate).toBe("Out at the group stage");
    expect(decided[knockoutTeams[0].id].status).toBe("active");

    const partialSlate = fullSlate.slice(0, 15);
    const undecided = buildScoresFromFixtures(partialSlate);
    expect(undecided.tur.status).toBe("active");
  });
});

describe("espn discipline parsing", () => {
  it("deducts an own goal from the team whose player scored it, not the credited side", () => {
    // ESPN credits the own-goal scoring play to the benefiting side (home,
    // espn id 164 here); the -1 must land on the opponents.
    const discipline = parseDiscipline([{ ownGoal: true, team: { id: "164" } }], "164", "202");

    expect(discipline.homeOwnGoals).toBe(0);
    expect(discipline.awayOwnGoals).toBe(1);
  });

  it("keeps red cards on the carded team", () => {
    const discipline = parseDiscipline([{ redCard: true, team: { id: "202" } }], "164", "202");

    expect(discipline.homeRedCards).toBe(0);
    expect(discipline.awayRedCards).toBe(1);
  });
});
