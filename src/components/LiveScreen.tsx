import { ArrowUp, Radio, ShieldAlert, Trophy, Zap } from "lucide-react";
import { useMemo } from "react";
import { getTeam } from "../data/teams";
import type { Entrant, LeaderboardRow, TeamScore } from "../types";
import { TeamFlag } from "./TeamFlag";

interface LiveScreenProps {
  entry: Entrant;
  scores: Record<string, TeamScore>;
  leaderboard: LeaderboardRow[];
  liveEvents: ReadonlyArray<{ id: string; teamId: string; text: string; minute: string; tone: string }>;
  locked: boolean;
  onToggleLocked: () => void;
}

export function LiveScreen({ entry, scores, leaderboard, liveEvents, locked, onToggleLocked }: LiveScreenProps) {
  const myRank = leaderboard.find((row) => row.entrant.id === entry.id);
  const pickedTeamIds = useMemo(() => new Set(Object.values(entry.picks)), [entry.picks]);
  const scoreRows = useMemo(
    () =>
      Object.values(scores).map((score) => {
        const team = getTeam(score.teamId);
        return {
          score,
          team,
          goalDifference: score.goalsFor - score.goalsAgainst,
          picked: pickedTeamIds.has(score.teamId),
        };
      }),
    [pickedTeamIds, scores],
  );
  const groupStandings = useMemo(() => {
    const grouped = scoreRows.reduce<Record<string, typeof scoreRows>>((acc, row) => {
      acc[row.team.group] = [...(acc[row.team.group] ?? []), row];
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
      .map(([group, rows]) => ({
        group,
        rows: rows
          .slice()
          .sort((a, b) => b.score.points - a.score.points || b.goalDifference - a.goalDifference || b.score.goalsFor - a.score.goalsFor),
      }));
  }, [scoreRows]);
  const liveMatchRows = useMemo(() => {
    const picked = Object.values(entry.picks);
    const opponentIds = ["cro", "swe", "fra", "bra"];
    const minutes = ["62'", "HT", "74'", "FT"];
    const stages = ["R16", "R16", "QF", "R16"];

    return picked.map((teamId, index) => {
      const opponentId = opponentIds[index] === teamId ? "arg" : opponentIds[index];
      const team = getTeam(teamId);
      const opponent = getTeam(opponentId);
      const teamScore = scores[teamId]?.goalsFor ?? index;
      const opponentScore = scores[opponentId]?.goalsFor ?? index + 1;
      const displayTeamScore = Math.min(3, Math.max(0, teamScore - 8));
      const displayOpponentScore = Math.min(3, Math.max(0, opponentScore - 8));
      const leading = displayTeamScore > displayOpponentScore;
      const level = displayTeamScore === displayOpponentScore;

      return {
        id: `${teamId}-${opponentId}`,
        team,
        opponent,
        minute: minutes[index],
        stage: stages[index],
        score: `${displayTeamScore}-${displayOpponentScore}`,
        impact: leading ? "+3 live" : level ? "+1 live" : "chasing",
      };
    });
  }, [entry.picks, scores]);
  const highestScoringRows = useMemo(
    () =>
      scoreRows
        .slice()
        .sort((a, b) => b.score.goalsFor - a.score.goalsFor || b.score.points - a.score.points || b.goalDifference - a.goalDifference)
        .slice(0, 10),
    [scoreRows],
  );
  const leadingGoalTeam = highestScoringRows[0]?.team;

  return (
    <section className="screen-stack">
      <div className="score-hero">
        <div className="score-glow" aria-hidden="true" />
        <div className="broadcast-strap live">
          <span>
            <Radio size={13} /> Live updates
          </span>
          <span>{locked ? "Tournament mode" : "Pre-tournament"}</span>
        </div>
        <p className="section-kicker">Your rank</p>
        <div className="rank-row">
          <strong>#{myRank?.rank ?? "-"}</strong>
          <span>
            {myRank?.totalPoints ?? 0}
            <small> pts</small>
          </span>
        </div>
        <p className="score-caption">
          {myRank?.activeTeams ?? 0} countries still alive. Knocked-out teams keep their points and stop scoring.
        </p>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Group standings</p>
            <h2>All pots in play</h2>
          </div>
          <button className="text-button" type="button" onClick={onToggleLocked}>
            {locked ? "Unlock demo" : "Lock demo"}
          </button>
        </div>
        <div className="group-standings-grid">
          {groupStandings.map((group) => (
            <article className="group-card" key={group.group}>
              <div className="group-card-head">
                <strong>Group {group.group}</strong>
                <small>Pts</small>
              </div>
              {group.rows.map((row, index) => (
                <div className={row.picked ? "standing-row picked" : "standing-row"} key={row.team.id}>
                  <span>{index + 1}</span>
                  <strong><TeamFlag team={row.team} /> {row.team.shortName}</strong>
                  <small>{row.score.wins}-{row.score.draws}-{row.score.losses}</small>
                  <b>{row.score.points}</b>
                </div>
              ))}
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Live knockout table</p>
            <h2>Current matches</h2>
          </div>
          <Trophy size={21} />
        </div>
        <div className="live-match-table">
          {liveMatchRows.map((row) => (
            <div className="live-match-row" key={row.id}>
              <span className="match-minute">{row.minute}</span>
              <span className="match-teams">
                <strong><TeamFlag team={row.team} /> {row.team.shortName}</strong>
                <small><TeamFlag team={row.opponent} /> {row.opponent.shortName}</small>
              </span>
              <strong className="match-score">{row.score}</strong>
              <span className="match-impact">
                <small>{row.stage}</small>
                <b>{row.impact}</b>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Highest-scoring team</p>
            <h2>Bonus race standings</h2>
          </div>
          <span className="mini-badge">+10 pts</span>
        </div>
        {leadingGoalTeam ? (
          <article className="stat-card wide">
            <Zap size={18} />
            <span>
              <small>Current leader</small>
              <strong><TeamFlag team={leadingGoalTeam} /> {leadingGoalTeam.name}</strong>
              <em>{highestScoringRows[0].score.goalsFor} goals scored</em>
            </span>
            <b>{entry.predictions.highest_scoring_team === leadingGoalTeam.name ? "+10" : "chasing"}</b>
          </article>
        ) : null}
        <div className="mini-table live-table">
          {highestScoringRows.map((row, index) => (
            <div className={row.picked ? "mini-table-row picked" : "mini-table-row"} key={row.team.id}>
              <span>{index + 1}</span>
              <strong><TeamFlag team={row.team} /> {row.team.name}</strong>
              <em>{row.score.goalsFor} GF</em>
              <small>{row.score.cleanSheets} CS</small>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Matchday ticker</p>
            <h2>Point swings</h2>
          </div>
          <span className="live-dot">Live</span>
        </div>
        <div className="event-list">
          {liveEvents.map((event) => {
            const team = getTeam(event.teamId);
            return (
              <div className={`event-row ${event.tone}`} key={event.id}>
                <span className="event-flag"><TeamFlag team={team} /></span>
                <span>
                  <strong>{event.text}</strong>
                  <small>{event.minute} · {team.name}</small>
                </span>
                {event.tone === "out" ? <ShieldAlert size={18} /> : event.tone === "bonus" ? <Trophy size={18} /> : <ArrowUp size={18} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
