import { CalendarDays, Radio, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { maybeGetTeam } from "../data/teams";
import { getCurrentFixtures, isFixtureInKickoffWindow } from "../lib/worldCupApi";
import type { Entrant, LeaderboardRow, Team, TeamScore, WorldCupFixture } from "../types";
import { MetricKey } from "./MetricKey";
import { TeamFlag } from "./TeamFlag";

interface LiveScreenProps {
  entry: Entrant;
  scores: Record<string, TeamScore>;
  leaderboard: LeaderboardRow[];
  fixtures: WorldCupFixture[];
  liveLoading: boolean;
  liveError: string | null;
  locked: boolean;
}

function formatKickoffParts(value: string) {
  const kickoff = new Date(value);
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(kickoff);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(kickoff);

  return { date, time };
}

function formatKickoff(value: string) {
  const { date, time } = formatKickoffParts(value);
  return `${date} ${time}`;
}

const stageLabels: Record<WorldCupFixture["stage"], string> = {
  group: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  final: "Final",
};

const knockoutRounds = [
  { stage: "round_of_32", label: "Last 32", shortLabel: "L32", slots: 8 },
  { stage: "round_of_16", label: "Last 16", shortLabel: "L16", slots: 4 },
  { stage: "quarter_final", label: "Quarters", shortLabel: "QF", slots: 2 },
  { stage: "semi_final", label: "Semis", shortLabel: "SF", slots: 2 },
  { stage: "final", label: "Final", shortLabel: "Final", slots: 1 },
] as const;

function formatFixtureStage(fixture: WorldCupFixture) {
  return fixture.group ? `Group ${fixture.group}` : stageLabels[fixture.stage];
}

function formatFixtureStatus(fixture: WorldCupFixture) {
  if (fixture.status === "completed") return "FT";
  if (fixture.status === "live") return fixture.displayClock || "Live";
  if (isFixtureInKickoffWindow(fixture)) return "Awaiting live feed";
  return fixture.venue || "Venue TBC";
}

function hasConfirmedTeams(fixture: WorldCupFixture) {
  return Boolean(fixture.home.id && fixture.away.id);
}

function formatBracketMeta(fixture: WorldCupFixture) {
  if (fixture.status === "completed") return "FT";
  if (fixture.status === "live") return fixture.displayClock || "Live";
  return hasConfirmedTeams(fixture) ? formatKickoff(fixture.startsAt) : "TBC";
}

function formatBracketTeams(fixture: WorldCupFixture) {
  return hasConfirmedTeams(fixture) ? `${fixture.home.shortName} vs ${fixture.away.shortName}` : "To confirm";
}

type EntrantPick = {
  entrant: Entrant;
  row: LeaderboardRow;
};

function findTeamEntrants(leaderboard: LeaderboardRow[], teamId: string | null): EntrantPick[] {
  if (!teamId) return [];
  return leaderboard
    .filter((row) => Object.values(row.entrant.picks).includes(teamId))
    .map((row) => ({ entrant: row.entrant, row }));
}

function EntrantNameList({ people }: { people: EntrantPick[] }) {
  if (people.length === 0) {
    return <small className="none-picked">None</small>;
  }

  return (
    <span className="entrant-chip-list">
      {people.map(({ entrant, row }) => (
        <small key={entrant.id}>
          {entrant.name} <b>{row.totalPoints} pts</b>
        </small>
      ))}
    </span>
  );
}

function MatchRow({
  fixture,
  picked = false,
  expanded,
  homeEntrants,
  awayEntrants,
  onToggle,
}: {
  fixture: WorldCupFixture;
  picked?: boolean;
  expanded: boolean;
  homeEntrants: EntrantPick[];
  awayEntrants: EntrantPick[];
  onToggle: () => void;
}) {
  const homeTeam = maybeGetTeam(fixture.home.id);
  const awayTeam = maybeGetTeam(fixture.away.id);
  const awaitingLive = isFixtureInKickoffWindow(fixture);
  const hasScore = fixture.home.score > 0 || fixture.away.score > 0;
  const matchScore = fixture.status === "scheduled" && !hasScore ? "vs" : `${fixture.home.score}-${fixture.away.score}`;
  const kickoff = formatKickoffParts(fixture.startsAt);

  return (
    <article className={picked ? "live-match-card picked" : "live-match-card"}>
      <button className="live-match-row" type="button" aria-expanded={expanded} onClick={onToggle}>
        <span className="match-minute">
          <small>{fixture.status === "live" || awaitingLive ? "Live" : kickoff.date}</small>
          <strong>{fixture.status === "live" ? fixture.displayClock || "Now" : awaitingLive ? "Now" : kickoff.time}</strong>
        </span>
        <span className="match-teams">
          <strong>{homeTeam ? <TeamFlag team={homeTeam} /> : null} {fixture.home.shortName}</strong>
          <small>{awayTeam ? <TeamFlag team={awayTeam} /> : null} {fixture.away.shortName}</small>
        </span>
        <strong className="match-score">{matchScore}</strong>
        <span className="match-impact">
          <small>{formatFixtureStage(fixture)}</small>
          <b>{formatFixtureStatus(fixture)}</b>
        </span>
      </button>
      {expanded ? (
        <div className="match-entrant-panel">
          <div>
            <strong>{homeTeam ? <TeamFlag team={homeTeam} className="inline-crest" /> : null} {fixture.home.shortName}</strong>
            <EntrantNameList people={homeEntrants} />
          </div>
          <div>
            <strong>{awayTeam ? <TeamFlag team={awayTeam} className="inline-crest" /> : null} {fixture.away.shortName}</strong>
            <EntrantNameList people={awayEntrants} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function findRelevantFixture(team: Team, fixtures: WorldCupFixture[], currentFixtures: WorldCupFixture[]) {
  const current = currentFixtures.find((fixture) => fixture.home.id === team.id || fixture.away.id === team.id);
  if (current) return current;

  const now = Date.now();
  return fixtures.find((fixture) => fixture.status !== "completed" && new Date(fixture.startsAt).getTime() >= now && (fixture.home.id === team.id || fixture.away.id === team.id));
}

function formatTeamFixture(team: Team, fixture?: WorldCupFixture) {
  if (!fixture) return "Fixture TBC";
  const opponent = fixture.home.id === team.id ? fixture.away : fixture.home;
  const prefix = fixture.status === "live" ? fixture.displayClock || "Live" : isFixtureInKickoffWindow(fixture) ? "Now" : formatKickoff(fixture.startsAt);
  return `${prefix} vs ${opponent.shortName}`;
}

function fixtureSortTime(fixture?: WorldCupFixture) {
  if (!fixture) return Number.POSITIVE_INFINITY;
  if (fixture.status === "live") return 0;
  if (isFixtureInKickoffWindow(fixture)) return 1;
  return new Date(fixture.startsAt).getTime();
}

export function LiveScreen({ entry, scores, leaderboard, fixtures, liveLoading, liveError, locked }: LiveScreenProps) {
  const [expandedFixtureId, setExpandedFixtureId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const myRank = leaderboard.find((row) => row.entrant.id === entry.id);
  const pickedTeamIds = useMemo(() => new Set(Object.values(entry.picks)), [entry.picks]);
  const scoreRows = useMemo(
    () =>
      Object.values(scores).flatMap((score) => {
        const team = maybeGetTeam(score.teamId);
        if (!team) return [];
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
          .sort((a, b) => (b.score.tablePoints ?? b.score.points) - (a.score.tablePoints ?? a.score.points) || b.goalDifference - a.goalDifference || b.score.goalsFor - a.score.goalsFor),
      }));
  }, [scoreRows]);
  const currentFixtures = useMemo(() => getCurrentFixtures(fixtures), [fixtures]);
  const completedCount = useMemo(() => fixtures.filter((fixture) => fixture.status === "completed").length, [fixtures]);
  const knockoutFixtures = useMemo(() => fixtures.filter((fixture) => fixture.stage !== "group"), [fixtures]);
  const bracketRounds = useMemo(
    () =>
      knockoutRounds.map((round) => ({
        ...round,
        fixtures: knockoutFixtures.filter((fixture) => fixture.stage === round.stage).slice(0, round.slots),
      })),
    [knockoutFixtures],
  );
  const highestScoringRows = useMemo(
    () =>
      scoreRows
        .slice()
        .sort((a, b) => b.score.goalsFor - a.score.goalsFor || b.score.points - a.score.points || b.goalDifference - a.goalDifference)
        .slice(0, 10),
    [scoreRows],
  );
  const leadingGoalTeam = highestScoringRows[0]?.team;
  const leadingGoalTotal = highestScoringRows[0]?.score.goalsFor ?? 0;
  const selectedTeamRows = useMemo(
    () =>
      Object.values(entry.picks)
        .flatMap((teamId) => {
          const team = maybeGetTeam(teamId);
          if (!team) return [];
          return {
            team,
            score: scores[team.id],
            fixture: findRelevantFixture(team, fixtures, currentFixtures),
            label: team.code,
          };
        })
        .sort((a, b) => fixtureSortTime(a.fixture) - fixtureSortTime(b.fixture)),
    [currentFixtures, entry.picks, fixtures, scores],
  );
  const leaguePulseRows = useMemo(() => {
    const pickCounts = new Map<string, number>();
    for (const row of leaderboard) {
      for (const teamId of Object.values(row.entrant.picks)) {
        if (teamId) pickCounts.set(teamId, (pickCounts.get(teamId) ?? 0) + 1);
      }
    }

    return [...pickCounts.entries()]
      .flatMap(([teamId, count]) => {
        const team = maybeGetTeam(teamId);
        if (!team) return [];
        return {
          team,
          count,
          score: scores[team.id],
          fixture: findRelevantFixture(team, fixtures, currentFixtures),
          label: `${count} picks`,
        };
      })
      .sort((a, b) => b.count - a.count || (b.score?.points ?? 0) - (a.score?.points ?? 0) || a.team.name.localeCompare(b.team.name))
      .slice(0, 6);
  }, [currentFixtures, fixtures, leaderboard, scores]);

  return (
    <section className="screen-stack">
      <div className="score-hero">
        <div className="score-glow" aria-hidden="true" />
        <div className="broadcast-strap live">
          <span>
            <Radio size={13} /> ESPN World Cup feed
          </span>
          <span>{liveLoading ? "Refreshing" : locked ? "Tournament mode" : "Pre-tournament"}</span>
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
          {myRank
            ? `${myRank.activeTeams} countries still alive.`
            : locked
              ? "Viewing from the league invite link."
              : "Join a league and submit picks to enter the table."}{" "}
          Fixtures refresh automatically from the live feed.
        </p>
        {liveError ? <p className="feed-warning">{liveError}</p> : null}
      </div>

      <div className="panel watchlist-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{selectedTeamRows.length > 0 ? "Your teams" : "League pulse"}</p>
            <h2>{selectedTeamRows.length > 0 ? "Your PickFour watchlist" : "Most-backed countries"}</h2>
          </div>
          <div className="panel-action-row">
            <MetricKey />
            <span className="mini-badge">{selectedTeamRows.length > 0 ? "4 picks" : "League"}</span>
          </div>
        </div>
        <div className="watchlist-grid">
          {(selectedTeamRows.length > 0 ? selectedTeamRows : leaguePulseRows).map((row) => (
            <article className="watch-card" key={row.team.id}>
              <span className="watch-team">
                <TeamFlag team={row.team} />
                <strong>{row.team.name}</strong>
                <small>{row.label}</small>
              </span>
              <span className="watch-score">
                <strong>{row.score?.points ?? 0}</strong>
                <small>pts</small>
              </span>
              <span className="watch-meta">
                {formatTeamFixture(row.team, row.fixture)}
                <small>GF {row.score?.goalsFor ?? 0} · CS {row.score?.cleanSheets ?? 0} · RC {row.score?.redCards ?? 0}</small>
              </span>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">
              {currentFixtures.some((fixture) => fixture.status === "live" || isFixtureInKickoffWindow(fixture)) ? "Live now" : "Coming up"}
            </p>
            <h2>World Cup match centre</h2>
          </div>
          <CalendarDays size={21} />
        </div>
        {currentFixtures.length > 0 ? (
          <div className="live-match-table">
            {currentFixtures.map((fixture) => {
              const picked = pickedTeamIds.has(fixture.home.id) || pickedTeamIds.has(fixture.away.id);
              return (
                <MatchRow
                  fixture={fixture}
                  key={fixture.id}
                  picked={picked}
                  expanded={expandedFixtureId === fixture.id}
                  homeEntrants={findTeamEntrants(leaderboard, fixture.home.id)}
                  awayEntrants={findTeamEntrants(leaderboard, fixture.away.id)}
                  onToggle={() => setExpandedFixtureId((current) => (current === fixture.id ? null : fixture.id))}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>Fixture feed is warming up</strong>
            <small>Upcoming matches will appear here as ESPN publishes them.</small>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Group standings</p>
            <h2>{completedCount > 0 ? "Tables after completed matches" : "Tables open at kickoff"}</h2>
          </div>
          <span className="mini-badge">{completedCount} results</span>
        </div>
        {completedCount > 0 ? (
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
                    <b>{row.score.tablePoints ?? row.score.points}</b>
                  </div>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No completed group matches yet</strong>
            <small>The live group tables will populate from real results once the World Cup starts.</small>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Knockout picture</p>
            <h2>Bracket path</h2>
          </div>
          <Trophy size={21} />
        </div>
        {knockoutFixtures.length > 0 ? (
          <div className="bracket-tree" aria-label="Live knockout bracket tree">
            <div className="bracket-tree-track">
              {bracketRounds.map((round, roundIndex) => (
                <article className={`bracket-round depth-${roundIndex}`} key={round.stage}>
                  <strong>{round.shortLabel}</strong>
                  <small>{round.label}</small>
                  <div className="bracket-slots">
                    {Array.from({ length: round.slots }).map((_, index) => {
                      const fixture = round.fixtures[index];
                      return (
                        <span className={fixture ? "bracket-slot filled" : "bracket-slot"} key={`${round.stage}-${index}`}>
                          <small>{fixture ? formatBracketMeta(fixture) : "TBC"}</small>
                          <b>{fixture ? formatBracketTeams(fixture) : "To confirm"}</b>
                        </span>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="bracket-tree empty" aria-label="Knockout bracket tree">
            <div className="bracket-tree-track">
              {knockoutRounds.map((round, roundIndex) => (
                <article className={`bracket-round depth-${roundIndex}`} key={round.stage}>
                  <strong>{round.shortLabel}</strong>
                  <small>{round.label}</small>
                  <div className="bracket-slots">
                    {Array.from({ length: round.slots }).map((_, index) => (
                      <span className="bracket-slot" key={`${round.stage}-${index}`}>
                        <small>TBC</small>
                        <b>To confirm</b>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        <p className="bracket-note">The bracket fills from the live fixture feed as knockout places are confirmed.</p>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Highest-scoring team</p>
            <h2>Bonus race standings</h2>
          </div>
          <div className="panel-action-row">
            <MetricKey />
            <span className="mini-badge">+10 pts</span>
          </div>
        </div>
        {leadingGoalTeam && leadingGoalTotal > 0 ? (
          <>
            <article className="stat-card wide">
              <Zap size={18} />
              <span>
                <small>Current leader</small>
                <strong><TeamFlag team={leadingGoalTeam} /> {leadingGoalTeam.name}</strong>
                <em>GF {highestScoringRows[0].score.goalsFor}</em>
              </span>
              <b>{entry.predictions.highest_scoring_team === leadingGoalTeam.name ? "+10" : "chasing"}</b>
            </article>
            <p className="helper-copy bonus-race-helper">Your +10 lands if the tournament's highest-scoring team is your bonus pick.</p>
          </>
        ) : (
          <div className="empty-state">
            <strong>Waiting for the first goal</strong>
            <small>The +10 race starts from real match goals and pays out if the winner is your bonus pick.</small>
          </div>
        )}
        {leadingGoalTotal > 0 ? (
          <div className="mini-table live-table">
            {highestScoringRows.map((row, index) => (
              <div className={row.picked ? "mini-table-row picked" : "mini-table-row"} key={row.team.id}>
                <span>{index + 1}</span>
                <strong><TeamFlag team={row.team} /> {row.team.name}</strong>
                <em>GF {row.score.goalsFor}</em>
                <small>CS {row.score.cleanSheets} · RC {row.score.redCards ?? 0}</small>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Most-backed countries</p>
            <h2>Who has who?</h2>
          </div>
          <Trophy size={21} />
        </div>
        <div className="pick-owner-list">
          {leaguePulseRows.map((row) => {
            const people = findTeamEntrants(leaderboard, row.team.id);
            const expanded = expandedTeamId === row.team.id;
            return (
              <article className="pick-owner-card" key={row.team.id}>
                <button type="button" onClick={() => setExpandedTeamId((current) => (current === row.team.id ? null : row.team.id))} aria-expanded={expanded}>
                  <strong><TeamFlag team={row.team} /> {row.team.name}</strong>
                  <small>{people.length} entrants · {row.score?.points ?? 0} pts</small>
                </button>
                {expanded ? <EntrantNameList people={people} /> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
