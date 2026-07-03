import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Minus, Search, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { maybeGetTeam, teams } from "../data/teams";
import type { Entrant, GlobalLeaderboardEntry, LeaderboardRow, League, Pot, TeamScore } from "../types";
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
  const [nameFilter, setNameFilter] = useState("");
  const activeLeague = leagues.find((league) => league.id === activeLeagueId) ?? leagues[0] ?? null;
  const availableBoardModes = globalRows.length > 0 ? boardModes : boardModes.filter((item) => item.id === "league");
  const showSearch = rows.length > 6;
  const filteredRows = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => row.entrant.name.toLowerCase().includes(query));
  }, [nameFilter, rows]);
  const myRow = currentEntrantId ? rows.find((row) => row.entrant.id === currentEntrantId) ?? null : null;
  const leaderPoints = rows[0]?.totalPoints ?? 0;
  const tiedRanks = useMemo(() => {
    const counts = new Map<number, number>();
    for (const row of rows) counts.set(row.rank, (counts.get(row.rank) ?? 0) + 1);
    return new Set([...counts.entries()].filter(([, count]) => count > 1 && count <= 4).map(([rank]) => rank));
  }, [rows]);
  const twinNamesByEntrant = useMemo(() => {
    const signatureFor = (row: LeaderboardRow) =>
      JSON.stringify([Object.values(row.entrant.picks).slice().sort(), row.entrant.predictions.highest_scoring_team]);
    const groups = new Map<string, string[]>();
    for (const row of rows) {
      const signature = signatureFor(row);
      groups.set(signature, [...(groups.get(signature) ?? []), row.entrant.name]);
    }

    const result = new Map<string, string[]>();
    for (const row of rows) {
      const names = groups.get(signatureFor(row)) ?? [];
      if (names.length > 1) result.set(row.entrant.id, names.filter((name) => name !== row.entrant.name));
    }
    return result;
  }, [rows]);
  const [shareNotice, setShareNotice] = useState("");

  async function shareTable() {
    const lines = rows.slice(0, 5).map((row) => `${row.rank}. ${row.entrant.name} — ${row.totalPoints} pts`);
    if (myRow && myRow.rank > 5) lines.push(`…you: #${myRow.rank} (${myRow.totalPoints} pts)`);
    const text = [`${activeLeague?.name ?? "PickFour"} — live table`, ...lines, "pickfour.vercel.app"].join("\n");

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNotice("Table copied, paste it in the group chat.");
      window.setTimeout(() => setShareNotice(""), 3000);
    } catch {
      // user dismissed the share sheet; nothing to clean up
    }
  }

  useEffect(() => {
    if (mode === "global" && globalRows.length === 0) setMode("league");
  }, [globalRows.length, mode]);

  function renderPickDrawer(picks: Entrant["picks"], bonusTeamName: string, ownerId: string, privateRow = false) {
    const behind = leaderPoints - (rows.find((row) => row.entrant.id === ownerId)?.totalPoints ?? leaderPoints);

    if (privateRow) {
      return (
        <div className="pick-drawer pick-drawer-private" id={`pick-drawer-${ownerId}`}>
          <strong>Picks are sealed until the lock</strong>
          <small>Everyone's four countries and +10 bonus reveal when the tournament starts. No peeking, no mind games.</small>
        </div>
      );
    }

    const bonusTeam = teams.find((team) => team.name === bonusTeamName) ?? null;
    const bonusGoals = bonusTeam ? scores[bonusTeam.id]?.goalsFor ?? 0 : 0;

    return (
      <div className="pick-drawer" id={`pick-drawer-${ownerId}`}>
        <div className="pick-pill-grid">
          {potOrder.map((pot) => {
            const team = maybeGetTeam(picks[pot]);
            const score = team ? scores[team.id] : undefined;
            return (
              <span className={score?.status === "eliminated" ? "pick-pill pick-out" : "pick-pill"} key={`${ownerId}-${pot}`}>
                <small>
                  Pot {pot}
                  {score?.status === "eliminated" ? <em className="status-chip eliminated">Out</em> : null}
                  {score?.status === "champion" ? <em className="status-chip champion">Champions</em> : null}
                </small>
                <strong>{team ? <TeamFlag team={team} /> : null} {team?.shortName ?? "Pending"}</strong>
                {team ? (
                  <em>
                    {score?.points ?? 0}&nbsp;pts · {score?.goalsFor ?? 0}&nbsp;{(score?.goalsFor ?? 0) === 1 ? "goal" : "goals"} · {score?.cleanSheets ?? 0}&nbsp;{(score?.cleanSheets ?? 0) === 1 ? "clean sheet" : "clean sheets"}{(score?.redCards ?? 0) > 0 ? ` · ${score!.redCards} red${score!.redCards === 1 ? "" : "s"}` : ""}{(score?.ownGoals ?? 0) > 0 ? ` · ${score!.ownGoals} own goal${score!.ownGoals === 1 ? "" : "s"}` : ""}
                  </em>
                ) : null}
              </span>
            );
          })}
        </div>
        <span className="prediction-chip">
          Bonus +10: {bonusTeam ? <>{bonusTeam.name} · {bonusGoals} {bonusGoals === 1 ? "goal" : "goals"} in the race</> : bonusTeamName || "Pending"}
        </span>
        {behind > 0 ? <span className="drawer-behind">{behind} {behind === 1 ? "point" : "points"} behind the leader</span> : null}
        {(twinNamesByEntrant.get(ownerId) ?? []).length > 0 ? (
          <span className="twin-chip">
            Rival twins: same four countries and bonus as {(twinNamesByEntrant.get(ownerId) ?? []).join(" & ")}. Tie-breaks come down to the run-in.
          </span>
        ) : null}
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
        {mode === "league" ? (
          <div className="table-toolbar">
            {showSearch ? (
              <label className="table-search">
                <Search size={15} aria-hidden="true" />
                <input
                  value={nameFilter}
                  placeholder="Search players"
                  aria-label="Search players by name"
                  onChange={(event) => setNameFilter(event.target.value)}
                />
              </label>
            ) : null}
            {myRow ? (
              <button
                className="table-tool-button"
                type="button"
                onClick={() => {
                  setNameFilter("");
                  setExpandedId(myRow.entrant.id);
                }}
              >
                Find me · #{myRow.rank}
              </button>
            ) : null}
            {rows.length > 0 ? (
              <button className="table-tool-button" type="button" onClick={shareTable}>
                <Share2 size={14} />
                Share
              </button>
            ) : null}
            <button className="table-tool-button tool-overview" type="button" onClick={onOpenOverview}>
              <ArrowLeft size={14} />
              Overview
            </button>
          </div>
        ) : null}
        {shareNotice ? <p className="share-notice" role="status">{shareNotice}</p> : null}
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
              <div className="skeleton-list" role="status" aria-label="Loading the table">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : filteredRows.length > 0 ? (
              filteredRows.map((row) => {
                const ownRow = row.entrant.id === currentEntrantId;
                const privateRow = !picksVisible && !ownRow;
                const twinNames = picksVisible ? twinNamesByEntrant.get(row.entrant.id) ?? [] : [];
                const rowDetail = privateRow
                  ? "Picks sealed until the lock"
                  : !picksVisible
                    ? "Your picks are saved · rivals stay hidden"
                    : `${row.activeTeams} alive${row.predictionPoints > 0 ? ` · +${row.predictionPoints} bonus banked` : row.bonusOnTrack ? " · +10 on track" : ""}${twinNames.length > 0 ? ` · twins with ${twinNames.join(" & ")}` : ""}`;

                return (
                  <div className="expandable-row" key={row.entrant.id}>
                    <button
                      type="button"
                      className={["leader-row row-trigger", ownRow ? "own-row" : ""].filter(Boolean).join(" ")}
                      aria-expanded={expandedId === row.entrant.id}
                      aria-controls={`pick-drawer-${row.entrant.id}`}
                      onClick={() => setExpandedId(expandedId === row.entrant.id ? null : row.entrant.id)}
                    >
                      <span className={picksVisible && row.rank <= 3 ? `rank-number medal-${row.rank}` : "rank-number"}>
                        {picksVisible ? (tiedRanks.has(row.rank) ? `=${row.rank}` : row.rank) : "-"}
                      </span>
                      <span className="avatar avatar-initial" style={{ background: row.entrant.avatarColor }} aria-hidden="true">
                        {row.entrant.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="leader-name">
                        <strong>{row.entrant.name}{ownRow ? " · you" : ""}</strong>
                        <small>{rowDetail}</small>
                      </span>
                      <span className="movement">
                        {picksVisible && row.movement > 0 ? <ArrowUp size={14} /> : picksVisible && row.movement < 0 ? <ArrowDown size={14} /> : null}
                      </span>
                      <strong className="leader-points">{row.totalPoints}</strong>
                      <ChevronDown className="row-chevron" size={15} />
                    </button>
                    {expandedId === row.entrant.id ? renderPickDrawer(row.entrant.picks, row.entrant.predictions.highest_scoring_team, row.entrant.id, privateRow) : null}
                  </div>
                );
              })
            ) : rows.length > 0 ? (
              <div className="empty-state">
                <strong>No players match "{nameFilter.trim()}"</strong>
                <small>Check the spelling, or clear the search to see the whole table.</small>
              </div>
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
