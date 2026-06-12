/**
 * Tab identity, labels, visibility and hash-routing slugs in one place.
 * App.tsx and BottomNav.tsx previously each carried their own copy of the
 * label/visibility switches, which could silently drift apart.
 */

export type AppTab = "rules" | "picks" | "live" | "table" | "league";

export const appNavItems: Array<{ id: AppTab; label: string; step: string; helper: string }> = [
  { id: "rules", label: "Rules", step: "01", helper: "Read first" },
  { id: "league", label: "League", step: "02", helper: "Join or create" },
  { id: "picks", label: "Picks", step: "03", helper: "Your four picks" },
  { id: "live", label: "Live", step: "04", helper: "Match centre" },
  { id: "table", label: "Table", step: "05", helper: "Bragging rights" },
];

export const tabSlugs: Record<AppTab, string> = {
  rules: "scoring",
  league: "overview",
  picks: "entry",
  live: "matches",
  table: "table",
};

export function tabFromHash(hash: string): AppTab | null {
  const slug = hash.replace(/^#/, "");
  const match = (Object.entries(tabSlugs) as Array<[AppTab, string]>).find(([, value]) => value === slug);
  return match?.[0] ?? null;
}

export function getNavLabel(tab: AppTab, tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  if (!tournamentStarted) return appNavItems.find((item) => item.id === tab)?.label ?? tab;

  switch (tab) {
    case "rules":
      return "Scoring";
    case "league":
      return "Overview";
    case "picks":
      return hasCurrentEntrant ? "My entry" : "Entry";
    case "live":
      return "Matches";
    case "table":
      return "Table";
    default:
      return tab;
  }
}

export function getNavHelper(item: (typeof appNavItems)[number], tournamentStarted: boolean) {
  if (!tournamentStarted) return item.helper;

  switch (item.id) {
    case "rules":
      return "Scoring guide";
    case "league":
      return "League hub";
    case "picks":
      return "Locked";
    case "live":
      return "Match centre";
    case "table":
      return "Scores";
    default:
      return item.helper;
  }
}

/** After lock, devices without an entry lose the Picks tab. */
export function isTabVisible(tab: AppTab, tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  return !(tab === "picks" && tournamentStarted && !hasCurrentEntrant);
}

export function getVisibleNavItems(tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  return appNavItems.filter((item) => isTabVisible(item.id, tournamentStarted, hasCurrentEntrant));
}
