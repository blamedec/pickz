import { ArrowDown, ArrowUp, ChevronDown, Minus } from "lucide-react";
import { useState } from "react";
import { maybeGetTeam } from "../data/teams";
import type { Entrant, GlobalLeaderboardEntry, LeaderboardRow, League, Pot } from "../types";
import { TeamFlag } from "./TeamFlag";

interface LeaderboardScreenProps {
  rows: LeaderboardRow[];
  entrants: Entrant[];
  globalRows: GlobalLeaderboardEntry[];
  leagues: League[];
  activeLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
}

type BoardMode = "league" | "global";

const boardModes: Array<{ id: BoardMode; label: string }> = [
  { id: "league", label: "League" },
  { id: "global", label: "Global" },
];

const potOrder = [1, 2, 3, 4] as Pot[];

export function LeaderboardScreen({ rows, entrants, globalRows, leagues, activeLeagueId, onSelectLeague }: LeaderboardScreenProps) {
  const [mode, setMode] = useState<BoardMode>("league");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const activeLeague = leagues.find((league) => league.id === activeLeagueId) ?? leagues[0] ?? null;

  function renderPickDrawer(picks: Entrant["picks"], bonusTeamName: string, ownerId: string) {
    return (
      <div className="pick-drawer" id={`pick-drawer-${ownerId}`}>
        <div className="pick-pill-grid">
          {potOrder.map((pot) => {
            const team = maybeGetTeam(picks[pot]);
            return (
              <span className="pick-pill" key={`${ownerId}-${pot}`}>
                <small>Pot {pot}</small>
                <strong>{team ? <TeamFlag team={team} /> : null} {team?.shortName ?? "Pending"}</strong>
              </span>
            );
          })}
        </div>
        <span className="prediction-chip">Bonus +10: {bonusTeamName || "Pending"}</span>
      </div>
    );
  }

  return (
    <section className="screen-stack">
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{mode === "global" ? "Global leaderboard" : "League table"}</p>
            <h2>{mode === "global" ? "Across every league" : activeLeague?.name ?? "Friend bragging rights"}</h2>
          </div>
          <span className="mini-badge">{mode === "league" ? `${entrants.length} players` : "Country + bonus"}</span>
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
            {leagues.length > 1 ? (
              <label className="table-league-select">
                <span>Active league</span>
                <select value={activeLeague?.id ?? ""} onChange={(event) => onSelectLeague(event.target.value)}>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {rows.length > 0 ? (
              rows.map((row) => (
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
              ))
            ) : (
              <div className="empty-state">
                <strong>No submitted entries yet</strong>
                <small>{activeLeague ? "Submit four country picks to start this league table." : "Create or join a league, then submit four country picks to start the table."}</small>
              </div>
            )}
          </div>
        ) : null}

        {mode === "global" ? (
          <div className="global-leaderboard">
            {globalRows.length > 0 ? (
              globalRows.map((row) => {
                const bonusTeam = maybeGetTeam(row.bonusTeamId);
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
                      <span className="top-pick-chip">{bonusTeam ? <TeamFlag team={bonusTeam} /> : null} {bonusTeam?.code ?? "TBC"}</span>
                      <span className="points-stack">
                        <strong>{row.totalPoints}</strong>
                        <small>{row.countryPoints}+{row.predictionPoints}</small>
                      </span>
                      <ChevronDown className="row-chevron" size={15} />
                    </button>
                    {expandedId === row.id ? renderPickDrawer(row.picks, bonusTeam?.name ?? "", row.id) : null}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <strong>Global leaderboard starts at zero</strong>
                <small>Once real entrants submit picks across live leagues, the global view will show the overall table without fake names.</small>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
