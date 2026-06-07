import { Check, Lock, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { Team, TeamScore } from "../types";
import { TeamFlag } from "./TeamFlag";

interface TeamCardProps {
  team: Team;
  score?: TeamScore;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function TeamCard({ team, score, selected = false, disabled = false, compact = false, onClick }: TeamCardProps) {
  const style = {
    "--team-primary": team.primaryColor,
    "--team-secondary": team.secondaryColor,
  } as CSSProperties;
  const status = score?.status ?? "active";

  return (
    <button
      type="button"
      className={`team-card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""} ${compact ? "compact" : ""}`}
      style={style}
      onClick={onClick}
      disabled={disabled && !selected}
      aria-pressed={selected}
    >
      <span className="flag-badge" aria-hidden="true">
        <TeamFlag team={team} />
      </span>
      <span className="team-copy">
        <span className="team-meta">Pot {team.pot} · Group {team.group}</span>
        <span className="team-name">{team.name}</span>
        <span className="team-sub">
          {score ? `${score.points} pts · ${score.wins}-${score.draws}-${score.losses}` : team.code}
        </span>
      </span>
      <span className={`status-dot ${status}`} aria-label={status}>
        {selected ? <Check size={14} /> : disabled ? <Lock size={13} /> : status === "eliminated" ? <X size={13} /> : null}
      </span>
    </button>
  );
}
