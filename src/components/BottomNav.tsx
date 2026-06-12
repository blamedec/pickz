import { BarChart3, ListChecks, Radio, ScrollText, Shield } from "lucide-react";
import { getNavLabel, isTabVisible, type AppTab } from "../lib/navigation";

export type { AppTab };

const tabs: Array<{ id: AppTab; icon: typeof ListChecks }> = [
  { id: "rules", icon: ScrollText },
  { id: "league", icon: Shield },
  { id: "picks", icon: ListChecks },
  { id: "live", icon: Radio },
  { id: "table", icon: BarChart3 },
];

interface BottomNavProps {
  active: AppTab;
  rulesAccepted: boolean;
  hasLeague: boolean;
  tournamentStarted: boolean;
  currentEntrantId: string | null;
  onChange: (tab: AppTab) => void;
}

export function BottomNav({ active, rulesAccepted, hasLeague, tournamentStarted, currentEntrantId, onChange }: BottomNavProps) {
  const canBrowseLive = rulesAccepted || tournamentStarted;
  const hasCurrentEntrant = Boolean(currentEntrantId);
  const visibleTabs = tabs.filter((tab) => isTabVisible(tab.id, tournamentStarted, hasCurrentEntrant));

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
            <span>{getNavLabel(tab.id, tournamentStarted, hasCurrentEntrant)}</span>
          </button>
        );
      })}
    </nav>
  );
}
