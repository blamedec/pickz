import { describe, expect, it } from "vitest";
import { getFixtureSideImpact, getPointsOnOffer, getTeamMatchLedger } from "./matchImpact";
import { calculateMatchPoints } from "./scoring";
import type { WorldCupFixture } from "../types";

function fixture(overrides: Partial<WorldCupFixture> = {}): WorldCupFixture {
  return {
    id: "test-1",
    startsAt: "2026-06-12T16:00:00.000Z",
    stage: "group",
    group: "H",
    status: "completed",
    displayClock: "",
    venue: "Test Stadium",
    home: { id: "esp", espnId: "164", name: "Spain", shortName: "Spain", code: "ESP", score: 0, winner: false },
    away: { id: "ksa", espnId: "655", name: "Saudi Arabia", shortName: "Saudi", code: "KSA", score: 0, winner: false },
    discipline: { homeRedCards: 0, awayRedCards: 0, homeOwnGoals: 0, awayOwnGoals: 0 },
    source: "espn",
    ...overrides,
  };
}

describe("getFixtureSideImpact", () => {
  it("returns null for unfinished fixtures", () => {
    expect(getFixtureSideImpact(fixture({ status: "scheduled" }), "home")).toBeNull();
    expect(getFixtureSideImpact(fixture({ status: "live" }), "home")).toBeNull();
  });

  it("scores a statement group win with a clean sheet", () => {
    const match = fixture({
      home: { ...fixture().home, score: 3 },
      away: { ...fixture().away, score: 0 },
    });
    const impact = getFixtureSideImpact(match, "home");

    expect(impact?.items).toEqual([
      { label: "Group win", points: 3 },
      { label: "Clean sheet", points: 1 },
      { label: "Statement win", points: 2 },
    ]);
    expect(impact?.total).toBe(6);
  });

  it("matches calculateMatchPoints for a group win", () => {
    const match = fixture({
      home: { ...fixture().home, score: 3 },
      away: { ...fixture().away, score: 0 },
    });
    const impact = getFixtureSideImpact(match, "home");
    const expected = calculateMatchPoints({ stage: "group", teamScore: 3, opponentScore: 0, teamPot: 1, opponentPot: 3 });

    expect(impact?.total).toBe(expected);
  });

  it("gives the losing side only its deductions", () => {
    const match = fixture({
      home: { ...fixture().home, score: 2 },
      away: { ...fixture().away, score: 0 },
      discipline: { homeRedCards: 0, awayRedCards: 1, homeOwnGoals: 0, awayOwnGoals: 1 },
    });
    const impact = getFixtureSideImpact(match, "away");

    expect(impact?.items).toEqual([
      { label: "Red card", points: -2 },
      { label: "Own goal", points: -1 },
    ]);
    expect(impact?.total).toBe(-3);
  });

  it("scores a penalty shoot-out win in the knockouts", () => {
    const match = fixture({
      stage: "round_of_16",
      group: null,
      home: { ...fixture().home, score: 1 },
      away: { ...fixture().away, score: 1, winner: true },
    });
    const impact = getFixtureSideImpact(match, "away");

    expect(impact?.items).toContainEqual({ label: "Won on pens / extra time", points: 2 });
    expect(impact?.items).toContainEqual({ label: "Giant-slayer", points: 2 });
    expect(impact?.total).toBe(2 + 2 + 1);
  });

  it("awards giant-slayer bonuses to a pot 3+ side beating pot 1", () => {
    const match = fixture({
      home: { ...fixture().home, score: 0 },
      away: { ...fixture().away, score: 1 },
    });
    const impact = getFixtureSideImpact(match, "away");

    expect(impact?.items).toContainEqual({ label: "Giant-slayer", points: 2 });
    expect(impact?.items).toContainEqual({ label: "Major giant-slayer", points: 1 });
    expect(impact?.total).toBe(3 + 1 + 2 + 1);
  });
});

describe("getPointsOnOffer", () => {
  it("offers group points for a group fixture", () => {
    const offers = getPointsOnOffer(fixture({ status: "scheduled" }));
    expect(offers).toContainEqual({ label: "Win", points: 3 });
    expect(offers).toContainEqual({ label: "Draw", points: 1 });
  });

  it("offers knockout points after the groups", () => {
    const offers = getPointsOnOffer(fixture({ stage: "final", group: null, status: "scheduled" }));
    expect(offers).toContainEqual({ label: "Win", points: 3 });
    expect(offers).toContainEqual({ label: "Win on pens / extra time", points: 2 });
  });
});

describe("getTeamMatchLedger", () => {
  it("lists only completed matches for the team, newest first", () => {
    const fixtures = [
      fixture({ id: "a", startsAt: "2026-06-12T16:00:00.000Z", home: { ...fixture().home, score: 2 } }),
      fixture({ id: "b", startsAt: "2026-06-17T16:00:00.000Z", home: { ...fixture().home, score: 1 }, away: { ...fixture().away, score: 1 } }),
      fixture({ id: "c", startsAt: "2026-06-21T16:00:00.000Z", status: "scheduled" }),
    ];
    const ledger = getTeamMatchLedger("esp", fixtures);

    expect(ledger.map((entry) => entry.fixture.id)).toEqual(["b", "a"]);
    expect(ledger[0].impact.items).toContainEqual({ label: "Group draw", points: 1 });
  });
});
