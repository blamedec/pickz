import { CalendarDays, Radio, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { maybeGetTeam } from "../data/teams";
import { formatKickoff, formatKickoffParts, groupOrStageLabel, nextFixtureForTeam } from "../lib/fixtureDisplay";
import { bonusBackers, buildPickCounts, rowsForTeam } from "../lib/leagueInsights";
import { formatSignedPoints, getFixtureSideImpact, getPointsOnOffer } from "../lib/matchImpact";
import { getCurrentFixtures, isFixtureInKickoffWindow } from "../lib/worldCupApi";
import type { Entrant, LeaderboardRow, Team, TeamScore, WorldCupFixture } from "../types";
import { KnockoutBracket } from "./KnockoutBracket";
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

/* Match-centre rows show the venue for scheduled games on purpose
   (the kickoff time has its own cell), so this stays local rather than
   using the shared fixtureTimeLabel. */
function formatFixtureStatus(fixture: WorldCupFixture) {
  if (fixture.status === "completed") return "FT";
  if (fixture.status === "live") return fixture.displayClock || "Live";
  if (isFixtureInKickoffWindow(fixture)) return "Awaiting live feed";
  return fixture.venue || "Venue TBC";
}

type EntrantPick = {
  entrant: Entrant;
  row: LeaderboardRow;
};

function findTeamEntrants(leaderboard: LeaderboardRow[], teamId: string | null): EntrantPick[] {
  return rowsForTeam(leaderboard, teamId).map((row) => ({ entrant: row.entrant, row }));
}

function EntrantNameList({ people }: { people: EntrantPick[] }) {
  if (people.length === 0) {
    return <small className="none-picked">No one has this lot</small>;
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

function SideImpactChips({ fixture, side }: { fixture: WorldCupFixture; side: "home" | "away" }) {
  const impact = getFixtureSideImpact(fixture, side);
  if (!impact) return null;

  return (
    <span className="impact-chip-row">
      {impact.items.length > 0 ? (
        impact.items.map((item) => (
          <small className={item.points < 0 ? "impact-chip negative" : "impact-chip"} key={item.label}>
            {item.label} <b>{formatSignedPoints(item.points)}</b>
          </small>
        ))
      ) : (
        <small className="impact-chip muted-chip">No points from this match</small>
      )}
      <small className="impact-chip total-chip">
        Match total <b>{formatSignedPoints(impact.total)}</b>
      </small>
    </span>
  );
}

function PointsOnOfferRow({ fixture }: { fixture: WorldCupFixture }) {
  const offers = getPointsOnOffer(fixture);
  return (
    <p className="points-on-offer">
      <strong>Points on offer per team:</strong>{" "}
      {offers.map((item, index) => (
        <span key={item.label}>
          {index > 0 ? " · " : ""}
          {item.label} <b>{formatSignedPoints(item.points)}</b>
        </span>
      ))}
    </p>
  );
}

function BonusBackersNote({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <small className="bonus-backers-note">
      +10 bonus pick for {names.join(", ")}
    </small>
  );
}

function MatchRow({
  fixture,
  picked = false,
  expanded,
  homeEntrants,
  awayEntrants,
  homeBonusBackers,
  awayBonusBackers,
  onToggle,
}: {
  fixture: WorldCupFixture;
  picked?: boolean;
  expanded: boolean;
  homeEntrants: EntrantPick[];
  awayEntrants: EntrantPick[];
  homeBonusBackers: string[];
  awayBonusBackers: string[];
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
          <small>{groupOrStageLabel(fixture)}</small>
          <b>{formatFixtureStatus(fixture)}</b>
        </span>
      </button>
      {expanded ? (
        <div className="match-entrant-panel">
          {fixture.status !== "completed" ? <PointsOnOfferRow fixture={fixture} /> : null}
          <div>
            <strong>{homeTeam ? <TeamFlag team={homeTeam} className="inline-crest" /> : null} {fixture.home.shortName}</strong>
            <SideImpactChips fixture={fixture} side="home" />
            <EntrantNameList people={homeEntrants} />
            <BonusBackersNote names={homeBonusBackers} />
          </div>
          <div>
            <strong>{awayTeam ? <TeamFlag team={awayTeam} className="inline-crest" /> : null} {fixture.away.shortName}</strong>
            <SideImpactChips fixture={fixture} side="away" />
            <EntrantNameList people={awayEntrants} />
            <BonusBackersNote names={awayBonusBackers} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function findRelevantFixture(team: Team, fixtures: WorldCupFixture[], currentFixtures: WorldCupFixture[]) {
  const current = currentFixtures.find((fixture) => fixture.home.id === team.id || fixture.away.id === team.id);
  return current ?? nextFixtureForTeam(team.id, fixtures);
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
  const [matchFilter, setMatchFilter] = useState<"all" | "mine">("all");
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showKnockoutPath, setShowKnockoutPath] = useState(false);
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
        hasPick: rows.some((row) => row.picked),
        rows: rows
          .slice()
          .sort((a, b) => (b.score.tablePoints ?? b.score.points) - (a.score.tablePoints ?? a.score.points) || b.goalDifference - a.goalDifference || b.score.goalsFor - a.score.goalsFor),
      }))
      .sort((a, b) => Number(b.hasPick) - Number(a.hasPick) || a.group.localeCompare(b.group));
  }, [scoreRows]);
  const visibleGroupStandings = useMemo(() => {
    if (showAllGroups) return groupStandings;
    const pickedGroups = groupStandings.filter((group) => group.hasPick);
    return pickedGroups.length > 0 ? pickedGroups : groupStandings.slice(0, 4);
  }, [groupStandings, showAllGroups]);
  const currentFixtures = useMemo(() => getCurrentFixtures(fixtures), [fixtures]);
  const completedCount = useMemo(() => fixtures.filter((fixture) => fixture.status === "completed").length, [fixtures]);
  const recentResults = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "completed")
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
        .slice(0, 6),
    [fixtures],
  );
  const hasOwnPicks = useMemo(() => Object.values(entry.picks).some(Boolean), [entry.picks]);
  const liveNowCount = useMemo(
    () => currentFixtures.filter((fixture) => fixture.status === "live" || isFixtureInKickoffWindow(fixture)).length,
    [currentFixtures],
  );
  const nextKickoffLabel = useMemo(() => {
    const next = fixtures.find((fixture) => fixture.status === "scheduled" && new Date(fixture.startsAt).getTime() >= Date.now());
    if (!next) return "TBC";
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(next.startsAt));
  }, [fixtures]);
  const matchesFilter = (fixture: WorldCupFixture) =>
    matchFilter === "all" || pickedTeamIds.has(fixture.home.id) || pickedTeamIds.has(fixture.away.id);
  const visibleCurrentFixtures = currentFixtures.filter(matchesFilter);
  const visibleRecentResults = recentResults.filter(matchesFilter);
  const knockoutFixtureCount = fixtures.filter((fixture) => fixture.stage !== "group").length;
  const pickCounts = useMemo(() => buildPickCounts(leaderboard), [leaderboard]);
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
  }, [currentFixtures, fixtures, pickCounts, scores]);

  return (
    <section className="screen-stack">
      <div className={myRank ? "score-hero" : "score-hero spectator-hero"}>
        <div className="score-glow" aria-hidden="true" />
        <div className="broadcast-strap live">
          <span>
            <Radio size={13} /> ESPN World Cup feed
          </span>
          <span>{liveLoading ? "Refreshing" : locked ? "Tournament mode" : "Pre-tournament"}</span>
        </div>
        {myRank ? (
          <>
            <p className="section-kicker">Your rank</p>
            <div className="rank-row">
              <strong>#{myRank.rank}</strong>
              <span>
                {myRank.totalPoints}
                <small> pts</small>
              </span>
            </div>
            <p className="score-caption">
              {myRank.activeTeams} countries still alive. Fixtures refresh automatically from the live feed.
            </p>
          </>
        ) : (
          <>
            <p className="section-kicker">Match centre</p>
            <div className="spectator-stats">
              <span>
                <small>Live now</small>
                <strong>{liveNowCount}</strong>
              </span>
              <span>
                <small>Next kickoff</small>
                <strong>{nextKickoffLabel}</strong>
              </span>
              <span>
                <small>League leader</small>
                <strong>{leaderboard[0] ? `${leaderboard[0].entrant.name} · ${leaderboard[0].totalPoints}` : "—"}</strong>
              </span>
            </div>
            <p className={locked ? "score-caption spectator-note" : "score-caption"}>
              {locked
                ? "Viewing the public league — log in from the overview to highlight your entry."
                : "Join a league and submit picks to enter the table."}
            </p>
          </>
        )}
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
          {(selectedTeamRows.length > 0 ? selectedTeamRows : leaguePulseRows).map((row) => {
            const out = row.score?.status === "eliminated";
            return (
              <article className={out ? "watch-card out" : "watch-card"} key={row.team.id}>
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
                  {out ? "Out of the tournament" : formatTeamFixture(row.team, row.fixture)}
                  <small>{row.score?.goalsFor ?? 0} goals · CS {row.score?.cleanSheets ?? 0} · RC {row.score?.redCards ?? 0}</small>
                </span>
              </article>
            );
          })}
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
        {hasOwnPicks ? (
          <div className="segmented-control match-filter" role="tablist" aria-label="Match centre filter">
            <button type="button" role="tab" aria-selected={matchFilter === "all"} className={matchFilter === "all" ? "active" : ""} onClick={() => setMatchFilter("all")}>
              All matches
            </button>
            <button type="button" role="tab" aria-selected={matchFilter === "mine"} className={matchFilter === "mine" ? "active" : ""} onClick={() => setMatchFilter("mine")}>
              My countries
            </button>
          </div>
        ) : null}
        {visibleCurrentFixtures.length > 0 ? (
          <div className="live-match-table">
            {visibleCurrentFixtures.map((fixture) => {
              const picked = pickedTeamIds.has(fixture.home.id) || pickedTeamIds.has(fixture.away.id);
              return (
                <MatchRow
                  fixture={fixture}
                  key={fixture.id}
                  picked={picked}
                  expanded={expandedFixtureId === fixture.id}
                  homeEntrants={findTeamEntrants(leaderboard, fixture.home.id)}
                  awayEntrants={findTeamEntrants(leaderboard, fixture.away.id)}
                  homeBonusBackers={bonusBackers(leaderboard, fixture.home.name)}
                  awayBonusBackers={bonusBackers(leaderboard, fixture.away.name)}
                  onToggle={() => setExpandedFixtureId((current) => (current === fixture.id ? null : fixture.id))}
                />
              );
            })}
          </div>
        ) : liveLoading && fixtures.length === 0 ? (
          <div className="skeleton-list" role="status" aria-label="Loading matches">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : matchFilter === "mine" ? (
          <div className="empty-state">
            <strong>None of your countries in this window</strong>
            <small>Switch back to all matches, or check the road to the final below.</small>
          </div>
        ) : (
          <div className="empty-state">
            <strong>Fixture feed is warming up</strong>
            <small>Upcoming matches will appear here as ESPN publishes them.</small>
          </div>
        )}
        <p className="helper-copy match-centre-helper">Tap a match to see who needs it, what is on offer, and what each result paid out.</p>
      </div>

      {visibleRecentResults.length > 0 ? (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Full time</p>
              <h2>Latest scored results</h2>
            </div>
            <span className="mini-badge">{completedCount} played</span>
          </div>
          <div className="live-match-table">
            {visibleRecentResults.map((fixture) => {
              const picked = pickedTeamIds.has(fixture.home.id) || pickedTeamIds.has(fixture.away.id);
              return (
                <MatchRow
                  fixture={fixture}
                  key={fixture.id}
                  picked={picked}
                  expanded={expandedFixtureId === fixture.id}
                  homeEntrants={findTeamEntrants(leaderboard, fixture.home.id)}
                  awayEntrants={findTeamEntrants(leaderboard, fixture.away.id)}
                  homeBonusBackers={bonusBackers(leaderboard, fixture.home.name)}
                  awayBonusBackers={bonusBackers(leaderboard, fixture.away.name)}
                  onToggle={() => setExpandedFixtureId((current) => (current === fixture.id ? null : fixture.id))}
                />
              );
            })}
          </div>
        </div>
      ) : null}

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
            {visibleGroupStandings.map((group) => (
              <article className="group-card" key={group.group}>
                <div className="group-card-head">
                  <strong>Group {group.group}</strong>
                  <small>GD</small>
                  <small>Pts</small>
                </div>
                {group.rows.map((row, index) => (
                  <div
                    className={[row.picked ? "standing-row picked" : "standing-row", index === 2 ? "qualification-line" : ""].filter(Boolean).join(" ")}
                    key={row.team.id}
                  >
                    <span>{index + 1}</span>
                    <strong><TeamFlag team={row.team} /> {row.team.shortName}</strong>
                    <small>{row.score.wins}-{row.score.draws}-{row.score.losses}</small>
                    <em className="standing-gd">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</em>
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
        {completedCount > 0 && visibleGroupStandings.length < groupStandings.length ? (
          <button className="secondary-cta show-more-button" type="button" onClick={() => setShowAllGroups(true)}>
            Show all {groupStandings.length} groups
          </button>
        ) : null}
        {showAllGroups && completedCount > 0 ? (
          <button className="secondary-cta show-more-button" type="button" onClick={() => setShowAllGroups(false)}>
            Show fewer groups
          </button>
        ) : null}
        {completedCount > 0 ? (
          <p className="helper-copy match-centre-helper">Top two go through, plus the eight best third-placed teams. Your groups are shown first.</p>
        ) : null}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Knockout picture</p>
            <h2>Road to the final</h2>
          </div>
          <Trophy size={21} />
        </div>
        {showKnockoutPath ? (
          <>
            <KnockoutBracket fixtures={fixtures} pickedTeamIds={pickedTeamIds} pickCounts={pickCounts} />
            <button className="secondary-cta show-more-button" type="button" onClick={() => setShowKnockoutPath(false)}>
              Hide road to the final
            </button>
          </>
        ) : (
          <div className="knockout-collapsed">
            <span>
              <strong>{knockoutFixtureCount > 0 ? `${knockoutFixtureCount} ties loaded` : "Knockout path tucked away"}</strong>
              <small>The full route is long, so keep the match centre focused and open it when you want the complete picture.</small>
            </span>
            <button className="secondary-cta" type="button" onClick={() => setShowKnockoutPath(true)}>
              Show road
            </button>
          </div>
        )}
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
                <em>{highestScoringRows[0].score.goalsFor} goals scored</em>
              </span>
              <b>{entry.predictions.highest_scoring_team === leadingGoalTeam.name ? "+10" : "chasing"}</b>
            </article>
            <p className="helper-copy bonus-race-helper">Your +10 lands if your bonus country finishes top of the goal race.</p>
          </>
        ) : (
          <div className="empty-state">
            <strong>Waiting for the first goal</strong>
            <small>The +10 race starts from real match goals and pays out if the winner is your bonus pick.</small>
          </div>
        )}
        {leadingGoalTotal > 0 ? (
          <div className="bonus-race-list">
            {highestScoringRows.map((row, index) => {
              const backers = bonusBackers(leaderboard, row.team.name);
              const gap = leadingGoalTotal - row.score.goalsFor;
              return (
                <div className={row.picked ? "bonus-race-row picked" : "bonus-race-row"} key={row.team.id}>
                  <span className="bonus-race-rank">{index + 1}</span>
                  <span className="bonus-race-team">
                    <strong><TeamFlag team={row.team} /> {row.team.name}</strong>
                    <small>{backers.length > 0 ? `Bonus pick: ${backers.join(", ")}` : "No one's bonus pick"}</small>
                  </span>
                  <span className="bonus-race-goals">
                    <i aria-hidden="true"><em style={{ width: `${Math.max(8, (row.score.goalsFor / leadingGoalTotal) * 100)}%` }} /></i>
                    <b>{row.score.goalsFor} goals{gap > 0 ? ` · ${gap} behind` : ""}</b>
                  </span>
                </div>
              );
            })}
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
