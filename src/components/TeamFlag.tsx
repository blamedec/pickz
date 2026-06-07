import type { Team } from "../types";

interface TeamFlagProps {
  team: Team;
  className?: string;
}

export function TeamFlag({ team, className = "" }: TeamFlagProps) {
  const customFlagClass = team.id === "eng" || team.id === "sco" ? team.id : "emoji";
  const label = `${team.name} flag`;

  return (
    <span className={["team-flag", customFlagClass, className].filter(Boolean).join(" ")} role="img" aria-label={label}>
      {customFlagClass === "emoji" ? team.flag : null}
    </span>
  );
}
