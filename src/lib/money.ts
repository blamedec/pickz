import type { League } from "../types";

export function formatPence(value: number): string {
  const pounds = value / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(pounds) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export function parseEntryFeeToPence(value: string): number {
  const normalized = value.replace(/[^\d.]/g, "");
  const pounds = Number.parseFloat(normalized);
  if (!Number.isFinite(pounds) || pounds < 0) return 0;
  return Math.round(pounds * 100);
}

export function getPrizePotPence(league: League, entrantCount: number): number {
  return league.entryFeePence * entrantCount;
}

export function getPrizePotLabel(league: League, entrantCount: number): string {
  return `${formatPence(getPrizePotPence(league, entrantCount))} pot`;
}

export function getEntryFeeLabel(league: League): string {
  return `${formatPence(league.entryFeePence)} entry`;
}
