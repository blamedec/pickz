import { ArrowDown, ArrowUp, ChevronDown, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { getTeam } from "../data/teams";
import type { Entrant, GlobalLeaderboardEntry, LeaderboardRow, Pot } from "../types";
import { TeamFlag } from "./TeamFlag";

interface LeaderboardScreenProps {
  rows: LeaderboardRow[];
  entrants: Entrant[];
  globalRows: GlobalLeaderboardEntry[];
}

type BoardMode = "league" | "global" | "selections";

const boardModes: Array<{ id: BoardMode; label: string }> = [
  { id: "league", label: "League" },
  { id: "global", label: "Global" },
  { id: "selections", label: "Selections" },
];

const potOrder = [1, 2, 3, 4] as Pot[];

export function LeaderboardScreen({ rows, entrants, globalRows }: LeaderboardScreenProps) {
  const [mode, setMode] = useState<BoardMode>("league");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rowsByEntrant = useMemo(() => new Map(rows.map((row) => [row.entrant.id, row])), [rows]);

  function renderPickDrawer(picks: Entrant["picks"], bonusTeamName: string, ownerId: string) {
    return (
      <div className="pick-drawer" id={`pick-drawer-${ownerId}`}>
        <div className="pick-pill-grid">
          {potOrder.map((pot) => {
            const team = getTeam(picks[pot]);
            return (
              <span className="pick-pill" key={`${ownerId}-${pot}`}>
                <small>Pot {pot}</small>
                <strong><TeamFlag team={team} /> {team.shortName}</strong>
              </span>
            );
          })}
        </div>
        <span className="prediction-chip">Bonus +10: {bonusTeamName}</span>
      </div>
    );
  }

  return (
    <section className="screen-stack">
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{mode === "global" ? "Global leaderboard" : mode === "selections" ? "Player selections" : "League table"}</p>
            <h2>{mode === "global" ? "Across every league" : mode === "selections" ? "Everyone's picks" : "Friend bragging rights"}</h2>
          </div>
          <span className="mini-badge">{mode === "selections" ? `${entrants.length} players` : "Country + bonus"}</span>
        </div>
        <div className="segmented-control table-mode" role="tablist" aria-label="Leaderboard views">
          {boardModes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? "active" : ""}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "league" ? (
          <div className="leaderboard">
            {rows.map((row) => (
              <div className="expandable-row" key={row.entrant.id}>
                <button
                  type="button"
                  className="leader-row row-trigger"
                  aria-expanded={expandedId === row.entrant.id}
                  aria-controls={`pick-drawer-${row.entrant.id}`}
                  onClick={() => setExpandedId(expandedId === row.entrant.id ? null : row.entrant.id)}
                >
                  <span className="rank-number">{row.rank}</span>
                  <span className="avatar" style={{ background: row.entrant.avatarColor }} />
                  <span className="leader-name">
                    <strong>{row.entrant.name}</strong>
                    <small>{row.activeTeams} alive · {row.countryPoints} country · {row.predictionPoints} bonus</small>
                  </span>
                  <span className="movement">
                    {row.movement > 0 ? <ArrowUp size={14} /> : row.movement < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                  </span>
                  <strong className="leader-points">{row.totalPoints}</strong>
                  <ChevronDown className="row-chevron" size={15} />
                </button>
                {expandedId === row.entrant.id ? renderPickDrawer(row.entrant.picks, row.entrant.predictions.highest_scoring_team, row.entrant.id) : null}
              </div>
            ))}
          </div>
        ) : null}

        {mode === "global" ? (
          <div className="global-leaderboard">
            {globalRows.map((row) => {
              const bonusTeam = getTeam(row.bonusTeamId);
              return (
                <div className="expandable-row" key={row.id}>
                  <button
                    type="button"
                    className="global-row row-trigger"
                    aria-expanded={expandedId === row.id}
                    aria-controls={`pick-drawer-${row.id}`}
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  >
                    <span className="rank-medal">#{row.rank}</span>
                    <span className="avatar" style={{ background: row.avatarColor }} />
                    <span className="leader-name">
                      <strong>{row.name}</strong>
                      <small>{row.leagueName} · {row.activeTeams} alive</small>
                    </span>
                    <span className="top-pick-chip"><TeamFlag team={bonusTeam} /> {bonusTeam.code}</span>
                    <span className="points-stack">
                      <strong>{row.totalPoints}</strong>
                      <small>{row.countryPoints}+{row.predictionPoints}</small>
                    </span>
                    <ChevronDown className="row-chevron" size={15} />
                  </button>
                  {expandedId === row.id ? renderPickDrawer(row.picks, bonusTeam.name, row.id) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {mode === "selections" ? (
          <div className="selection-list">
            {entrants.map((entrant) => {
              const row = rowsByEntrant.get(entrant.id);
              return (
                <article className="selection-card" key={entrant.id}>
                  <div className="selection-head">
                    <span className="avatar" style={{ background: entrant.avatarColor }} />
                    <span className="leader-name">
                      <strong>{entrant.name}</strong>
                      <small>{row ? `${row.totalPoints} pts · ${row.activeTeams} alive` : "Entry pending"}</small>
                    </span>
                  </div>
                  <div className="pick-pill-grid">
                    {potOrder.map((pot) => {
                      const team = getTeam(entrant.picks[pot]);
                      return (
                        <span className="pick-pill" key={`${entrant.id}-${pot}`}>
                          <small>Pot {pot}</small>
                          <strong><TeamFlag team={team} /> {team.shortName}</strong>
                        </span>
                      );
                    })}
                  </div>
                  <div className="prediction-chip-grid">
                    <span className="prediction-chip">Bonus +10: {entrant.predictions.highest_scoring_team}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
