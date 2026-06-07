import { BarChart3, ListChecks, Radio, ScrollText, Shield } from "lucide-react";

export type AppTab = "rules" | "picks" | "live" | "table" | "league";

const tabs: Array<{ id: AppTab; label: string; icon: typeof ListChecks }> = [
  { id: "rules", label: "Rules", icon: ScrollText },
  { id: "picks", label: "Picks", icon: ListChecks },
  { id: "live", label: "Live", icon: Radio },
  { id: "table", label: "Table", icon: BarChart3 },
  { id: "league", label: "League", icon: Shield },
];

interface BottomNavProps {
  active: AppTab;
  rulesAccepted: boolean;
  onChange: (tab: AppTab) => void;
}

export function BottomNav({ active, rulesAccepted, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const disabled = tab.id === "picks" && !rulesAccepted;
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
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
