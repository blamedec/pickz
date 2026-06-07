import { Zap } from "lucide-react";
import { getTeam } from "../data/teams";
import type { Entrant, TeamScore } from "../types";
import { TeamFlag } from "./TeamFlag";

interface StatsScreenProps {
  entry: Entrant;
  scores: Record<string, TeamScore>;
}

export function StatsScreen({ entry, scores }: StatsScreenProps) {
  const teamGoalRows = Object.values(scores)
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, 6);
  const leadingTeam = getTeam(teamGoalRows[0]?.teamId ?? "bra");

  return (
    <section className="screen-stack">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Bonus race</p>
            <h2>Highest-scoring team</h2>
          </div>
          <span className="mini-badge">+10 pts</span>
        </div>
        <article className="stat-card wide">
          <Zap size={18} />
          <span>
            <small>Current leader</small>
            <strong><TeamFlag team={leadingTeam} /> {leadingTeam.name}</strong>
            <em>{teamGoalRows[0]?.goalsFor ?? 0} goals scored</em>
          </span>
          <b>{entry.predictions.highest_scoring_team === leadingTeam.name ? "+10" : "chasing"}</b>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Country stats</p>
            <h2>Most goals</h2>
          </div>
        </div>
        <div className="mini-table">
          {teamGoalRows.map((score, index) => (
            <div className="mini-table-row" key={score.teamId}>
              <span>{index + 1}</span>
              <strong><TeamFlag team={getTeam(score.teamId)} /> {getTeam(score.teamId).name}</strong>
              <em>{score.goalsFor} GF</em>
              <small>{score.cleanSheets} CS</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
