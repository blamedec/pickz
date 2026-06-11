import { BarChart3, ListChecks, Radio, ScrollText, Shield } from "lucide-react";

export type AppTab = "rules" | "picks" | "live" | "table" | "league";

const tabs: Array<{ id: AppTab; label: string; icon: typeof ListChecks }> = [
  { id: "rules", label: "Rules", icon: ScrollText },
  { id: "league", label: "League", icon: Shield },
  { id: "picks", label: "Picks", icon: ListChecks },
  { id: "live", label: "Live", icon: Radio },
  { id: "table", label: "Table", icon: BarChart3 },
];

interface BottomNavProps {
  active: AppTab;
  rulesAccepted: boolean;
  hasLeague: boolean;
  tournamentStarted: boolean;
  currentEntrantId: string | null;
  onChange: (tab: AppTab) => void;
}

function getTabLabel(tab: AppTab, tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  if (!tournamentStarted) return tabs.find((item) => item.id === tab)?.label ?? tab;

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

export function BottomNav({ active, rulesAccepted, hasLeague, tournamentStarted, currentEntrantId, onChange }: BottomNavProps) {
  const canBrowseLive = rulesAccepted || tournamentStarted;
  const hasCurrentEntrant = Boolean(currentEntrantId);
  const visibleTabs = tournamentStarted && !hasCurrentEntrant ? tabs.filter((tab) => tab.id !== "picks") : tabs;

  return (
    <nav className={`bottom-nav tabs-${visibleTabs.length}`} aria-label="Primary navigation">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const disabled =
          (tab.id !== "rules" && !canBrowseLive) ||
          (tab.id === "picks" && (!rulesAccepted || !hasLeague || (!hasCurrentEntrant && tournamentStarted))) ||
          ((tab.id === "live" || tab.id === "table") && !hasLeague);
        return (
          <button
            key={tab.id}
            type="button"
            className={active === tab.id ? "nav-item active" : "nav-item"}
            disabled={disabled}
            aria-disabled={disabled}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={18} />
            <span>{getTabLabel(tab.id, tournamentStarted, hasCurrentEntrant)}</span>
          </button>
        );
      })}
    </nav>
  );
}
