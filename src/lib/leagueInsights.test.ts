import { describe, expect, it } from "vitest";
import { bonusBackers, buildBonusBackerCounts, buildPickCounts, rowsForTeam } from "./leagueInsights";
import type { LeaderboardRow } from "../types";

function row(name: string, picks: [string, string, string, string], bonus: string): LeaderboardRow {
  return {
    entrant: {
      id: name.toLowerCase(),
      name,
      avatarColor: "#e71d36",
      picks: { 1: picks[0], 2: picks[1], 3: picks[2], 4: picks[3] },
      predictions: { highest_scoring_team: bonus },
    },
    countryPoints: 0,
    predictionPoints: 0,
    totalPoints: 0,
    activeTeams: 4,
    rank: 1,
    movement: 0,
  };
}

const rows = [
  row("Declan", ["eng", "jpn", "nor", "gha"], "Brazil"),
  row("Soph", ["bra", "cro", "sco", "cze"], "France"),
  row("Rory", ["esp", "uru", "tun", "gha"], "Brazil"),
];

describe("buildPickCounts", () => {
  it("counts how many entries hold each team", () => {
    const counts = buildPickCounts(rows);
    expect(counts.get("gha")).toBe(2);
    expect(counts.get("eng")).toBe(1);
    expect(counts.get("fra")).toBeUndefined();
  });
});

describe("rowsForTeam", () => {
  it("returns rows holding the team and tolerates null ids", () => {
    expect(rowsForTeam(rows, "gha").map((r) => r.entrant.name)).toEqual(["Declan", "Rory"]);
    expect(rowsForTeam(rows, null)).toEqual([]);
  });
});

describe("bonusBackers", () => {
  it("returns sorted names backing the team for +10", () => {
    expect(bonusBackers(rows, "Brazil")).toEqual(["Declan", "Rory"]);
    expect(bonusBackers(rows, undefined)).toEqual([]);
  });
});

describe("buildBonusBackerCounts", () => {
  it("counts bonus picks by team name", () => {
    const counts = buildBonusBackerCounts(rows);
    expect(counts.get("Brazil")).toBe(2);
    expect(counts.get("France")).toBe(1);
  });
});
