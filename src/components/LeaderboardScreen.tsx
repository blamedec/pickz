import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { maybeGetTeam } from "../data/teams";
import type { Entrant, GlobalLeaderboardEntry, LeaderboardRow, League, Pot, TeamScore } from "../types";
import { MetricKey } from "./MetricKey";
import { TeamFlag } from "./TeamFlag";

interface LeaderboardScreenProps {
  rows: LeaderboardRow[];
  entrants: Entrant[];
  globalRows: GlobalLeaderboardEntry[];
  leagues: League[];
  activeLeagueId: string;
  currentEntrantId: string | null;
  picksVisible: boolean;
  scores: Record<string, TeamScore>;
  loading: boolean;
  onSelectLeague: (leagueId: string) => void;
  onOpenOverview: () => void;
}

type BoardMode = "league" | "global";

const boardModes: Array<{ id: BoardMode; label: string }> = [
  { id: "league", label: "League" },
  { id: "global", label: "Global" },
];

const potOrder = [1, 2, 3, 4] as Pot[];

export function LeaderboardScreen({
  rows,
  entrants,
  globalRows,
  leagues,
  activeLeagueId,
  currentEntrantId,
  picksVisible,
  scores,
  loading,
  onSelectLeague,
  onOpenOverview,
}: LeaderboardScreenProps) {
  const [mode, setMode] = useState<BoardMode>("league");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const activeLeague = leagues.find((league) => league.id === activeLeagueId) ?? leagues[0] ?? null;
  const availableBoardModes = globalRows.length > 0 ? boardModes : boardModes.filter((item) => item.id === "league");

  useEffect(() => {
    if (mode === "global" && globalRows.length === 0) setMode("league");
  }, [globalRows.length, mode]);

  function renderPickDrawer(picks: Entrant["picks"], bonusTeamName: string, ownerId: string, privateRow = false) {
    if (privateRow) {
      return (
        <div className="pick-drawer pick-drawer-private" id={`pick-drawer-${ownerId}`}>
          <strong>Picks are sealed until the lock</strong>
          <small>Everyone's four countries and +10 bonus reveal when the tournament starts. No peeking, no mind games.</small>
        </div>
      );
    }

    return (
      <div className="pick-drawer" id={`pick-drawer-${ownerId}`}>
        <div className="pick-pill-grid">
          {potOrder.map((pot) => {
            const team = maybeGetTeam(picks[pot]);
            return (
              <span className="pick-pill" key={`${ownerId}-${pot}`}>
                <small>Pot {pot}</small>
                <strong>{team ? <TeamFlag team={team} /> : null} {team?.shortName ?? "Pending"}</strong>
                {team ? (
                  <em>
                    Pts {scores[team.id]?.points ?? 0} · GF {scores[team.id]?.goalsFor ?? 0} · CS {scores[team.id]?.cleanSheets ?? 0}
                  </em>
                ) : null}
              </span>
            );
          })}
        </div>
        <MetricKey className="drawer-metric-key" />
        <span className="prediction-chip">Bonus +10: {bonusTeamName || "Pending"} tournament top-scorer pick</span>
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
          <div className="table-heading-actions">
            <button className="text-button" type="button" onClick={onOpenOverview}>
              <ArrowLeft size={14} />
              Overview
            </button>
            <span className="mini-badge">{mode === "league" ? `${entrants.length} players` : "Country + bonus"}</span>
          </div>
        </div>
        {availableBoardModes.length > 1 ? (
          <div className="segmented-control table-mode" role="tablist" aria-label="Leaderboard views">
            {availableBoardModes.map((item) => (
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
        ) : null}

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
            {loading && rows.length === 0 ? (
              <div className="empty-state">
                <strong>Loading the table</strong>
                <small>Checking the latest entrants and scores for this league.</small>
              </div>
            ) : rows.length > 0 ? (
              rows.map((row) => {
                const ownRow = row.entrant.id === currentEntrantId;
                const privateRow = !picksVisible && !ownRow;
                const rowDetail = privateRow
                  ? "Picks sealed until the lock"
                  : !picksVisible
                    ? "Your picks are saved · rivals stay hidden"
                    : `${row.activeTeams} alive · ${row.countryPoints} country · ${row.predictionPoints} bonus`;

                return (
                  <div className="expandable-row" key={row.entrant.id}>
                    <button
                      type="button"
                      className={["leader-row row-trigger", ownRow ? "own-row" : ""].filter(Boolean).join(" ")}
                      aria-expanded={expandedId === row.entrant.id}
                      aria-controls={`pick-drawer-${row.entrant.id}`}
                      onClick={() => setExpandedId(expandedId === row.entrant.id ? null : row.entrant.id)}
                    >
                      <span className="rank-number">{picksVisible ? row.rank : "-"}</span>
                      <span className="avatar" style={{ background: row.entrant.avatarColor }} />
                      <span className="leader-name">
                        <strong>{row.entrant.name}{ownRow ? " · you" : ""}</strong>
                        <small>{rowDetail}</small>
                      </span>
                      <span className="movement">
                        {picksVisible && row.movement > 0 ? <ArrowUp size={14} /> : picksVisible && row.movement < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                      </span>
                      <strong className="leader-points">{row.totalPoints}</strong>
                      <ChevronDown className="row-chevron" size={15} />
                    </button>
                    {expandedId === row.entrant.id ? renderPickDrawer(row.entrant.picks, row.entrant.predictions.highest_scoring_team, row.entrant.id, privateRow) : null}
                  </div>
                );
              })
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
                const privateRow = !picksVisible;
                return (
                  <div className="expandable-row" key={row.id}>
                    <button
                      type="button"
                      className="global-row row-trigger"
                      aria-expanded={expandedId === row.id}
                      aria-controls={`pick-drawer-${row.id}`}
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    >
                      <span className="rank-medal">#{picksVisible ? row.rank : "-"}</span>
                      <span className="avatar" style={{ background: row.avatarColor }} />
                      <span className="leader-name">
                        <strong>{row.name}</strong>
                        <small>{privateRow ? "Picks sealed until the lock" : `${row.leagueName} · ${row.activeTeams} alive`}</small>
                      </span>
                      <span className="top-pick-chip">{privateRow ? "Sealed" : <>{bonusTeam ? <TeamFlag team={bonusTeam} /> : null} {bonusTeam?.code ?? "TBC"}</>}</span>
                      <span className="points-stack">
                        <strong>{row.totalPoints}</strong>
                        <small>{row.countryPoints}+{row.predictionPoints}</small>
                      </span>
                      <ChevronDown className="row-chevron" size={15} />
                    </button>
                    {expandedId === row.id ? renderPickDrawer(row.picks, bonusTeam?.name ?? "", row.id, privateRow) : null}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <strong>Global leaderboard starts at zero</strong>
                <small>This view needs the production global leaderboard feed before beta. League tables are live now.</small>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
