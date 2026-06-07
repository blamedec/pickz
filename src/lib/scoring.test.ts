import { describe, expect, it } from "vitest";
import type { Entrant, PredictionCategory, TeamScore } from "../types";
import {
  buildLeaderboard,
  calculateMatchPoints,
  calculatePredictionPoints,
  canEditPicks,
  validateOnePickPerPot,
} from "./scoring";

describe("country scoring", () => {
  it("scores group results as win/draw/loss", () => {
    expect(calculateMatchPoints({ stage: "group", teamScore: 2, opponentScore: 0 })).toBe(3);
    expect(calculateMatchPoints({ stage: "group", teamScore: 1, opponentScore: 1 })).toBe(1);
    expect(calculateMatchPoints({ stage: "group", teamScore: 0, opponentScore: 1 })).toBe(0);
  });

  it("scores knockout wins by win method", () => {
    expect(calculateMatchPoints({ stage: "round_of_16", teamScore: 2, opponentScore: 1, advanced: true, winMethod: "normal" })).toBe(3);
    expect(calculateMatchPoints({ stage: "quarter_final", teamScore: 1, opponentScore: 1, advanced: true, winMethod: "penalties" })).toBe(2);
    expect(calculateMatchPoints({ stage: "semi_final", teamScore: 1, opponentScore: 2, advanced: false })).toBe(0);
  });
});

describe("pick rules", () => {
  it("requires exactly one selection from each pot", () => {
    expect(validateOnePickPerPot({ 1: "eng", 2: "jpn", 3: "nor", 4: "gha" })).toBe(true);
    expect(validateOnePickPerPot({ 1: "eng", 2: "jpn", 3: "", 4: "gha" })).toBe(false);
  });

  it("locks pick editing after first kickoff", () => {
    expect(canEditPicks(new Date("2026-06-11T18:59:59Z"), "2026-06-11T19:00:00Z")).toBe(true);
    expect(canEditPicks(new Date("2026-06-11T19:00:00Z"), "2026-06-11T19:00:00Z")).toBe(false);
  });
});

describe("prediction bonuses", () => {
  const correct: Record<PredictionCategory, string> = {
    highest_scoring_team: "Brazil",
  };

  it("adds ten points for the correct highest-scoring team", () => {
    expect(calculatePredictionPoints(correct, correct)).toBe(10);
    expect(
      calculatePredictionPoints(
        {
          highest_scoring_team: "France",
        },
        correct,
      ),
    ).toBe(0);
  });
});

describe("leaderboard", () => {
  const entrants: Entrant[] = [
    {
      id: "a",
      name: "Amy",
      avatarColor: "#fff",
      picks: { 1: "eng", 2: "jpn", 3: "nor", 4: "gha" },
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
    eng: { teamId: "eng", points: 8, wins: 2, draws: 0, losses: 0, goalsFor: 6, goalsAgainst: 1, cleanSheets: 1, status: "active", stageReached: "round_of_16", lastUpdate: "" },
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
      highest_scoring_team: "Brazil",
    });

    expect(rows[0].entrant.name).toBe("Amy");
    expect(rows[0].totalPoints).toBe(31);
    expect(rows[0].rank).toBe(1);
  });
});
