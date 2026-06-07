import { describe, expect, it } from "vitest";
import type { League } from "../types";
import { formatPence, getEntryFeeLabel, getPrizePotLabel, parseEntryFeeToPence } from "./money";

const league: League = {
  id: "demo",
  name: "Demo League",
  inviteCode: "POT26",
  creatorEmail: "creator@pottoglory.app",
  entryFeePence: 1200,
  prizePot: "£120 pot",
  inviteOpen: true,
  maxEntrants: null,
  lockTimeIso: "2026-06-11T19:00:00.000Z",
  locked: false,
};

describe("money helpers", () => {
  it("formats entry fee and calculated pot labels", () => {
    expect(formatPence(1200)).toBe("£12");
    expect(getEntryFeeLabel(league)).toBe("£12 entry");
    expect(getPrizePotLabel(league, 10)).toBe("£120 pot");
  });

  it("parses pound input into pence", () => {
    expect(parseEntryFeeToPence("£12.50")).toBe(1250);
    expect(parseEntryFeeToPence("24")).toBe(2400);
    expect(parseEntryFeeToPence("not a fee")).toBe(0);
  });
});
