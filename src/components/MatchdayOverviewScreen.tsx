import { ArrowRight, ArrowDown, ArrowUp, CheckCircle2, Mail, Minus, Radio, Search, Trophy, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { maybeGetTeam, teams } from "../data/teams";
import { fixtureScoreLabel, fixtureTimeLabel, nextFixtureForTeam } from "../lib/fixtureDisplay";
import { bonusBackers, buildBonusBackerCounts, buildPickCounts, rowsForTeam } from "../lib/leagueInsights";
import { formatSignedPoints, getFixtureSideImpact } from "../lib/matchImpact";
import { getCurrentFixtures, isFixtureInKickoffWindow } from "../lib/worldCupApi";
import type { Entrant, LeaderboardRow, LeaderboardSnapshot, League, Team, TeamScore, UserProfile, WorldCupFixture } from "../types";
import { TeamFlag } from "./TeamFlag";

interface MatchdayOverviewScreenProps {
  league: League;
  entry: Entrant;
  entrants: Entrant[];
  currentEntrantId: string | null;
  leaderboard: LeaderboardRow[];
  scores: Record<string, TeamScore>;
  snapshots: LeaderboardSnapshot[];
  fixtures: WorldCupFixture[];
  liveLoading: boolean;
  liveError: string | null;
  liveSyncedAt: Date | null;
  profile: UserProfile;
  onFindEntry: (profile: UserProfile) => Promise<{ found: boolean; message: string }>;
  onOpenTable: () => void;
  onOpenMatches: () => void;
  onOpenScoring: () => void;
  onOpenEntry: () => void;
}

type ImpactFixture = {
  fixture: WorldCupFixture;
  homeCount: number;
  awayCount: number;
  bonusBackers: number;
  stake: number;
};

function entrantNamesForTeam(leaderboard: LeaderboardRow[], teamId: string) {
  return rowsForTeam(leaderboard, teamId)
    .map((row) => row.entrant.name)
    .sort((a, b) => a.localeCompare(b));
}

function EntrantNameCloud({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <small className="none-picked">No one has this lot</small>;
  }

  return (
    <span className="entrant-chip-list">
      {names.map((name) => (
        <small key={name}>{name}</small>
      ))}
    </span>
  );
}

function teamFixtureTime(row: { fixture?: WorldCupFixture }) {
  if (!row.fixture) return Number.POSITIVE_INFINITY;
  if (row.fixture.status === "live") return 0;
  if (isFixtureInKickoffWindow(row.fixture)) return 1;
  return new Date(row.fixture.startsAt).getTime();
}

function getMovementLabel(movement: number) {
  if (movement > 0) return `Up ${movement}`;
  if (movement < 0) return `Down ${Math.abs(movement)}`;
  return "Steady";
}

function MovementIcon({ movement }: { movement: number }) {
  if (movement > 0) return <ArrowUp size={15} />;
  if (movement < 0) return <ArrowDown size={15} />;
  return <Minus size={15} />;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="rank-sparkline empty" aria-hidden="true" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const coords = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 100,
    y: 34 - ((value - min) / range) * 28,
  }));
  const points = coords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg className="rank-sparkline" viewBox="0 0 100 40" role="img" aria-label="Points trend">
      <polygon className="sparkline-area" points={`0,38 ${points} 100,38`} />
      <polyline points={points} />
      <circle className="sparkline-dot" cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="3" />
    </svg>
  );
}

export function MatchdayOverviewScreen({
  league,
  entry,
  entrants,
  currentEntrantId,
  leaderboard,
  scores,
  snapshots,
  fixtures,
  liveLoading,
  liveError,
  liveSyncedAt,
  profile,
  onFindEntry,
  onOpenTable,
  onOpenMatches,
  onOpenScoring,
  onOpenEntry,
}: MatchdayOverviewScreenProps) {
  const [lookupEmail, setLookupEmail] = useState(profile.email);
  const [lookupName, setLookupName] = useState(profile.name);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [selectedSpreadTeamId, setSelectedSpreadTeamId] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [expandedImpactFixtureId, setExpandedImpactFixtureId] = useState<string | null>(null);
  const [impactKeyOpen, setImpactKeyOpen] = useState(false);
  const currentFixtures = useMemo(() => getCurrentFixtures(fixtures), [fixtures]);
  const topRow = leaderboard[0] ?? null;
  const myRow = currentEntrantId ? leaderboard.find((row) => row.entrant.id === currentEntrantId) ?? null : null;
  const completedCount = useMemo(() => fixtures.filter((fixture) => fixture.status === "completed").length, [fixtures]);
  const completeEntrantCount = useMemo(() => entrants.filter((entrant) => entrant.entryComplete).length, [entrants]);
  const scoreRows = useMemo(
    () =>
      Object.values(scores).flatMap((score) => {
        const team = maybeGetTeam(score.teamId);
        if (!team) return [];
        return { team, score };
      }),
    [scores],
  );
  const highestScoring = useMemo(
    () => scoreRows.slice().sort((a, b) => b.score.goalsFor - a.score.goalsFor || b.score.points - a.score.points || a.team.name.localeCompare(b.team.name))[0] ?? null,
    [scoreRows],
  );
  const hasBonusRaceLeader = Boolean(highestScoring && highestScoring.score.goalsFor > 0);
  const pickCounts = useMemo(() => buildPickCounts(leaderboard), [leaderboard]);
  const maxPickCount = Math.max(1, ...pickCounts.values());
  const pickSpreadRows = useMemo(
    () =>
      teams
        .map((team) => ({
          team,
          count: pickCounts.get(team.id) ?? 0,
          score: scores[team.id],
        }))
        .sort((a, b) => b.count - a.count || (b.score?.points ?? 0) - (a.score?.points ?? 0) || a.team.name.localeCompare(b.team.name)),
    [pickCounts, scores],
  );
  const selectedSpreadTeam = selectedSpreadTeamId ? pickSpreadRows.find((row) => row.team.id === selectedSpreadTeamId) ?? null : null;
  const bonusBackerCounts = useMemo(() => buildBonusBackerCounts(leaderboard), [leaderboard]);
  const fixturesThatMatter = useMemo<ImpactFixture[]>(() => {
    const upcoming = fixtures.filter(
      (fixture) => fixture.status !== "completed" && new Date(fixture.startsAt).getTime() >= Date.now(),
    );
    const pool = [...new Map([...currentFixtures, ...upcoming].map((fixture) => [fixture.id, fixture])).values()].slice(0, 16);

    return pool
      .map((fixture) => {
        const homeCount = fixture.home.id ? pickCounts.get(fixture.home.id) ?? 0 : 0;
        const awayCount = fixture.away.id ? pickCounts.get(fixture.away.id) ?? 0 : 0;
        const bonusBackers = (bonusBackerCounts.get(fixture.home.name) ?? 0) + (bonusBackerCounts.get(fixture.away.name) ?? 0);
        return {
          fixture,
          homeCount,
          awayCount,
          bonusBackers,
          stake: homeCount + awayCount + bonusBackers,
          live: fixture.status === "live" || isFixtureInKickoffWindow(fixture),
        };
      })
      .sort(
        (a, b) =>
          Number(b.live) - Number(a.live) ||
          b.stake - a.stake ||
          new Date(a.fixture.startsAt).getTime() - new Date(b.fixture.startsAt).getTime(),
      )
      .slice(0, 4);
  }, [bonusBackerCounts, currentFixtures, fixtures, pickCounts]);
  const latestResults = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.status === "completed")
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
        .slice(0, 4)
        .map((fixture) => ({
          fixture,
          homeImpact: getFixtureSideImpact(fixture, "home"),
          awayImpact: getFixtureSideImpact(fixture, "away"),
        })),
    [fixtures],
  );
  const myTeamRows = useMemo(
    () =>
      Object.values(entry.picks)
        .flatMap((teamId) => {
          const team = maybeGetTeam(teamId);
          if (!team) return [];
          const fixture = nextFixtureForTeam(team.id, fixtures, 2 * 60 * 60 * 1000);
          return { team, score: scores[team.id], fixture };
        })
        .sort((a, b) => teamFixtureTime(a) - teamFixtureTime(b)),
    [entry.picks, fixtures, scores],
  );
  const pressureStory = useMemo(() => {
    const lead = fixturesThatMatter[0];
    return lead && lead.stake > 0 ? lead : null;
  }, [fixturesThatMatter]);
  const biggestSwing = useMemo(() => {
    let best: { teamName: string; total: number; fixture: WorldCupFixture } | null = null;
    for (const { fixture, homeImpact, awayImpact } of latestResults) {
      for (const [side, impact] of [["home", homeImpact], ["away", awayImpact]] as const) {
        if (!impact) continue;
        if (!best || Math.abs(impact.total) > Math.abs(best.total)) {
          best = {
            teamName: side === "home" ? fixture.home.shortName : fixture.away.shortName,
            total: impact.total,
            fixture,
          };
        }
      }
    }
    return best && best.total !== 0 ? best : null;
  }, [latestResults]);
  const nextChance = useMemo(
    () => (myRow ? myTeamRows.find((row) => row.fixture && row.score?.status !== "eliminated") ?? null : null),
    [myRow, myTeamRows],
  );
  const mySnapshots = useMemo(
    () =>
      currentEntrantId
        ? snapshots
            .filter((snapshot) => snapshot.entrantId === currentEntrantId)
            .sort((a, b) => new Date(a.snapshottedAt).getTime() - new Date(b.snapshottedAt).getTime())
        : [],
    [currentEntrantId, snapshots],
  );
  const snapshotPoints = mySnapshots.map((snapshot) => snapshot.totalPoints).slice(-14);
  const lastSnapshot = mySnapshots[mySnapshots.length - 1];
  const lastUpdated = snapshots.length > 0
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date([...snapshots].sort((a, b) => new Date(b.snapshottedAt).getTime() - new Date(a.snapshottedAt).getTime())[0].snapshottedAt))
    : "";

  useEffect(() => {
    setLookupEmail(profile.email);
    setLookupName(profile.name);
  }, [profile.email, profile.name]);

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = lookupEmail.trim().toLowerCase();
    const name = lookupName.trim() || profile.name || email.split("@")[0] || "Player";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLookupMessage("Use the same email you entered before the picks locked.");
      return;
    }

    setLookupBusy(true);
    setLookupMessage("Checking the entry list...");
    try {
      const result = await onFindEntry({
        ...profile,
        email,
        name,
        role: profile.role || "joiner",
      });
      setLookupMessage(result.message);
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : "Could not check that email. Try again in a minute.");
    } finally {
      setLookupBusy(false);
    }
  }

  return (
    <section className="screen-stack matchday-overview">
      <div className="score-hero overview-hero">
        <div className="broadcast-strap live">
          <span>
            <Radio size={13} /> {liveLoading ? "Refreshing feed" : "Tournament live"}
          </span>
          <span>
            {liveSyncedAt && !liveLoading
              ? `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(liveSyncedAt)}`
              : league.name}
          </span>
        </div>
        <div className="overview-hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">{league.name}</p>
            <h1>Follow the damage.</h1>
            <p>
              {completedCount} {completedCount === 1 ? "result" : "results"} scored · {completeEntrantCount} entries in the league.
            </p>
          </div>
          <div className="overview-score-card">
            <small>{myRow ? "Your rank" : "Current leader"}</small>
            <strong>{myRow ? `#${myRow.rank}` : topRow ? `#${topRow.rank}` : "-"}</strong>
            <span>{myRow ? `${myRow.totalPoints} pts` : topRow ? `${topRow.entrant.name} · ${topRow.totalPoints} pts` : "Waiting for scores"}</span>
            {myRow ? (
              <em className={myRow.movement !== 0 ? "movement-chip active" : "movement-chip"}>
                <MovementIcon movement={myRow.movement} /> {getMovementLabel(myRow.movement)}
              </em>
            ) : null}
          </div>
        </div>
        {liveError ? <p className="feed-warning">{liveError}</p> : null}
      </div>

      <div className="story-strip">
        {pressureStory ? (
          <button className="story-card" type="button" onClick={onOpenMatches}>
            <small>{pressureStory.fixture.status === "live" ? "Live pressure" : "Tonight's pressure"}</small>
            <strong>
              {pressureStory.fixture.home.shortName} v {pressureStory.fixture.away.shortName}
            </strong>
            <span>
              {pressureStory.stake} {pressureStory.stake === 1 ? "entry needs" : "entries need"} this one
              {pressureStory.bonusBackers > 0 ? " · +10 race involved" : ""}
            </span>
          </button>
        ) : null}
        {biggestSwing ? (
          <button className="story-card" type="button" onClick={onOpenMatches}>
            <small>Biggest swing</small>
            <strong>
              {biggestSwing.teamName} {formatSignedPoints(biggestSwing.total)}
            </strong>
            <span>
              from {biggestSwing.fixture.home.shortName} {biggestSwing.fixture.home.score}-{biggestSwing.fixture.away.score} {biggestSwing.fixture.away.shortName}
            </span>
          </button>
        ) : null}
        {nextChance ? (
          <button className="story-card" type="button" onClick={onOpenEntry}>
            <small>Your next chance</small>
            <strong>
              {nextChance.team.shortName}
              {nextChance.fixture ? ` v ${(nextChance.fixture.home.id === nextChance.team.id ? nextChance.fixture.away : nextChance.fixture.home).shortName}` : ""}
            </strong>
            <span>{nextChance.fixture ? fixtureTimeLabel(nextChance.fixture) : "Fixture TBC"}</span>
          </button>
        ) : hasBonusRaceLeader && highestScoring ? (
          <button className="story-card" type="button" onClick={onOpenMatches}>
            <small>+10 goal race</small>
            <strong>{highestScoring.team.shortName} leads</strong>
            <span>{highestScoring.score.goalsFor} goals scored so far</span>
          </button>
        ) : null}
      </div>

      <div className="panel overview-impact-card">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Matches that matter</p>
            <h2>{fixturesThatMatter.some((item) => item.fixture.status === "live") ? "Live impact" : "Coming up next"}</h2>
          </div>
          <div className="panel-action-row">
            <button className="text-button impact-key-button" type="button" aria-expanded={impactKeyOpen} onClick={() => setImpactKeyOpen((open) => !open)}>
              Key
            </button>
            <button className="text-button" type="button" onClick={onOpenMatches}>
              Match centre <ArrowRight size={14} />
            </button>
          </div>
        </div>
        {impactKeyOpen ? (
          <div className="impact-key-panel">
            <strong>Orange bars show PickFour interest.</strong>
            <span>The number is how many league entries own that team. Bigger bar, louder group chat.</span>
          </div>
        ) : null}
        {fixturesThatMatter.length > 0 ? (
          <div className="impact-fixture-grid">
            {fixturesThatMatter.map(({ fixture, homeCount, awayCount, bonusBackers, stake }, index) => {
              const homeTeam = maybeGetTeam(fixture.home.id);
              const awayTeam = maybeGetTeam(fixture.away.id);
              const expanded = expandedImpactFixtureId === fixture.id;
              const homeNames = fixture.home.id ? entrantNamesForTeam(leaderboard, fixture.home.id) : [];
              const awayNames = fixture.away.id ? entrantNamesForTeam(leaderboard, fixture.away.id) : [];
              const pickStake = homeCount + awayCount;
              const stakeLabel =
                stake === 0
                  ? "Neutral watch — no league stake"
                  : [
                      pickStake > 0 ? `${pickStake} ${pickStake === 1 ? "entry" : "entries"} on this match` : "",
                      bonusBackers > 0 ? "+10 race involved" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ");
              return (
                <article className={index === 0 ? "impact-fixture lead" : "impact-fixture"} key={fixture.id}>
                  <button className="impact-fixture-trigger" type="button" aria-expanded={expanded} onClick={() => setExpandedImpactFixtureId((current) => (current === fixture.id ? null : fixture.id))}>
                    <span className="impact-status">{fixtureTimeLabel(fixture)}</span>
                    <span className="impact-scoreline">
                      <strong>{homeTeam ? <TeamFlag team={homeTeam} /> : null} {fixture.home.shortName}</strong>
                      <b>{fixtureScoreLabel(fixture)}</b>
                      <strong>{awayTeam ? <TeamFlag team={awayTeam} /> : null} {fixture.away.shortName}</strong>
                    </span>
                    <span className="impact-bars">
                      <span className="impact-bar-row">
                        <small>{fixture.home.shortName}</small>
                        <span className="impact-bar-track" aria-hidden="true">
                          <i style={{ width: `${Math.max(6, (homeCount / maxPickCount) * 100)}%` }} />
                        </span>
                        <b aria-label={`${homeCount} PickFour entries have ${fixture.home.shortName}`}>{homeCount}</b>
                      </span>
                      <span className="impact-bar-row">
                        <small>{fixture.away.shortName}</small>
                        <span className="impact-bar-track" aria-hidden="true">
                          <i style={{ width: `${Math.max(6, (awayCount / maxPickCount) * 100)}%` }} />
                        </span>
                        <b aria-label={`${awayCount} PickFour entries have ${fixture.away.shortName}`}>{awayCount}</b>
                      </span>
                    </span>
                    <span className={stake === 0 ? "impact-stake neutral" : "impact-stake"}>{stakeLabel}</span>
                  </button>
                  {expanded ? (
                    <div className="impact-entrant-panel">
                      <div>
                        <strong>{homeTeam ? <TeamFlag team={homeTeam} className="inline-crest" /> : null} {fixture.home.shortName}</strong>
                        <EntrantNameCloud names={homeNames} />
                      </div>
                      <div>
                        <strong>{awayTeam ? <TeamFlag team={awayTeam} className="inline-crest" /> : null} {fixture.away.shortName}</strong>
                        <EntrantNameCloud names={awayNames} />
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state compact-empty-state">
            <strong>No upcoming fixtures loaded</strong>
            <small>The match centre will fill from the live feed as fixtures are published.</small>
          </div>
        )}
      </div>

      <div className="overview-grid">
        <div className="panel overview-my-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">{myRow ? "Your entry" : "Log in"}</p>
              <h2>{myRow ? "Your next pressure points" : "Get your score on this device"}</h2>
            </div>
            <button className="text-button" type="button" onClick={myRow ? onOpenEntry : onOpenTable}>
              {myRow ? "My entry" : "Browse"} <ArrowRight size={14} />
            </button>
          </div>
          {myRow ? (
            <>
              <div className="entry-score-strip">
                <span>
                  <small>Rank</small>
                  <strong>#{myRow.rank}</strong>
                </span>
                <span>
                  <small>Total</small>
                  <strong>{myRow.totalPoints}</strong>
                </span>
                <span>
                  <small>Country</small>
                  <strong>{myRow.countryPoints}</strong>
                </span>
                <span>
                  <small>Alive</small>
                  <strong>{myRow.activeTeams}</strong>
                </span>
              </div>
              {snapshotPoints.length >= 2 ? (
                <div className="rank-trend-card">
                  <span>
                    <strong>Rank history</strong>
                    <small>{lastUpdated ? `Updated ${lastUpdated}` : "Updates after scored results"}</small>
                  </span>
                  <Sparkline values={snapshotPoints} />
                </div>
              ) : null}
              <div className="my-watch-compact">
                {myTeamRows.map((row) => (
                  <button type="button" key={row.team.id} onClick={onOpenMatches} aria-label={`Open match centre for ${row.team.name}`}>
                    <TeamFlag team={row.team} />
                    <strong>{row.team.code}</strong>
                    <small>{row.score?.status === "eliminated" ? "Out" : row.fixture ? fixtureTimeLabel(row.fixture) : "Fixture TBC"}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="find-entry-intro">
                <Mail size={18} />
                <span>
                  <strong>No password, no faff.</strong>
                  <small>Enter the same email you used when you joined. PickFour will mark your row and show your personal watchlist.</small>
                </span>
              </div>
              <form className="find-entry-form" onSubmit={submitLookup}>
                <label>
                  <span>Email used for entry</span>
                  <input
                    value={lookupEmail}
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    onChange={(event) => setLookupEmail(event.target.value)}
                  />
                </label>
                <label>
                  <span>Name, optional</span>
                  <input
                    value={lookupName}
                    autoComplete="name"
                    placeholder="e.g. Declan"
                    onChange={(event) => setLookupName(event.target.value)}
                  />
                </label>
                <button className="primary-cta" type="submit" disabled={lookupBusy}>
                  {lookupBusy ? <Search size={17} /> : <CheckCircle2 size={17} />}
                  {lookupBusy ? "Checking..." : "Log in to entry"}
                </button>
              </form>
              {lookupMessage ? <p className="lookup-message">{lookupMessage}</p> : null}
              <p className="helper-copy compact-copy">
                Just here for the group chat? Fine too. The full table stays public now the tournament has started.
              </p>
            </>
          )}
        </div>

        <div className="panel overview-table-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">League table</p>
              <h2>Top of the group chat</h2>
            </div>
            <button className="text-button" type="button" onClick={onOpenTable}>
              Full table <ArrowRight size={14} />
            </button>
          </div>
          <div className="overview-leader-list">
            {leaderboard.slice(0, 5).map((row) => (
              <button className={row.entrant.id === currentEntrantId ? "overview-leader-row you" : "overview-leader-row"} type="button" key={row.entrant.id} onClick={onOpenTable}>
                <span>#{row.rank}</span>
                <strong>{row.entrant.name}{row.entrant.id === currentEntrantId ? " · you" : ""}</strong>
                <em>
                  <MovementIcon movement={row.movement} /> {row.totalPoints} pts
                </em>
              </button>
            ))}
            {leaderboard.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <strong>No table yet</strong>
                <small>Scores will appear here once entries and match results are available.</small>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {latestResults.length > 0 ? (
        <div className="panel overview-results-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">What changed</p>
              <h2>Latest results, scored</h2>
            </div>
            <button className="text-button" type="button" onClick={onOpenMatches}>
              All results <ArrowRight size={14} />
            </button>
          </div>
          <div className="latest-results-list">
            {latestResults.map(({ fixture, homeImpact, awayImpact }) => {
              const homeTeam = maybeGetTeam(fixture.home.id);
              const awayTeam = maybeGetTeam(fixture.away.id);
              return (
                <button className="latest-result-row" type="button" key={fixture.id} onClick={onOpenMatches}>
                  <small>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(fixture.startsAt))}</small>
                  <span className="latest-result-score">
                    <strong className="latest-result-team">
                      {homeTeam ? <TeamFlag team={homeTeam} /> : null}
                      <span>{fixture.home.shortName}</span>
                    </strong>
                    <b>{fixture.home.score}-{fixture.away.score}</b>
                    <strong className="latest-result-team">
                      {awayTeam ? <TeamFlag team={awayTeam} /> : null}
                      <span>{fixture.away.shortName}</span>
                    </strong>
                  </span>
                  <span className="latest-result-points">
                    <em className={homeImpact && homeImpact.total < 0 ? "negative" : homeImpact?.total === 0 ? "zero" : ""}>
                      {fixture.home.code} {formatSignedPoints(homeImpact?.total ?? 0)}
                    </em>
                    <em className={awayImpact && awayImpact.total < 0 ? "negative" : awayImpact?.total === 0 ? "zero" : ""}>
                      {fixture.away.code} {formatSignedPoints(awayImpact?.total ?? 0)}
                    </em>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="helper-copy compact-copy">What each country banked. Tap through for the full breakdown.</p>
        </div>
      ) : null}

      <div className="overview-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Who has who?</p>
              <h2>All countries by picks</h2>
            </div>
            <Trophy size={20} />
          </div>
          <div className="country-pick-grid">
            {(showAllCountries ? pickSpreadRows : pickSpreadRows.slice(0, 12)).map((row) => {
              return (
                <article className={row.count > 0 ? "country-pick-card" : "country-pick-card empty"} key={row.team.id}>
                  <button type="button" onClick={() => setSelectedSpreadTeamId(row.team.id)}>
                    <TeamFlag team={row.team} />
                    <strong>{row.team.shortName}</strong>
                    <small>{row.count}</small>
                  </button>
                </article>
              );
            })}
          </div>
          <button className="secondary-cta show-more-button" type="button" onClick={() => setShowAllCountries((open) => !open)}>
            {showAllCountries ? "Show fewer countries" : `Show all ${pickSpreadRows.length} countries`}
          </button>
          {selectedSpreadTeam ? (
            <div className="pick-modal-backdrop" role="presentation" onClick={() => setSelectedSpreadTeamId(null)}>
              <div className="pick-modal" role="dialog" aria-modal="true" aria-label={`${selectedSpreadTeam.team.name} PickFour entries`} onClick={(event) => event.stopPropagation()}>
                <button className="modal-close-button" type="button" onClick={() => setSelectedSpreadTeamId(null)} aria-label="Close country picks">
                  <X size={18} />
                </button>
                <div className="pick-modal-head">
                  <TeamFlag team={selectedSpreadTeam.team} />
                  <span>
                    <small>
                      Pot {selectedSpreadTeam.team.pot} · Group {selectedSpreadTeam.team.group}
                      {selectedSpreadTeam.score?.status === "eliminated" ? (
                        <em className="status-chip eliminated">Out</em>
                      ) : selectedSpreadTeam.score?.status === "champion" ? (
                        <em className="status-chip champion">Champions</em>
                      ) : (
                        <em className="status-chip alive">Still in</em>
                      )}
                    </small>
                    <strong>{selectedSpreadTeam.team.name}</strong>
                  </span>
                </div>
                {(() => {
                  const sheetScore = selectedSpreadTeam.score;
                  const sheetFixture = selectedSpreadTeam.score?.status === "eliminated" ? undefined : nextFixtureForTeam(selectedSpreadTeam.team.id, fixtures);
                  const sheetOpponent = sheetFixture
                    ? sheetFixture.home.id === selectedSpreadTeam.team.id
                      ? sheetFixture.away
                      : sheetFixture.home
                    : null;
                  const sheetBonusBackers = bonusBackers(leaderboard, selectedSpreadTeam.team.name);
                  return (
                    <div className="country-sheet-rows">
                      <div>
                        <small>This tournament</small>
                        <strong>
                          {sheetScore?.points ?? 0} pts · {sheetScore?.goalsFor ?? 0} {(sheetScore?.goalsFor ?? 0) === 1 ? "goal" : "goals"} ·{" "}
                          {sheetScore?.cleanSheets ?? 0} {(sheetScore?.cleanSheets ?? 0) === 1 ? "clean sheet" : "clean sheets"}
                        </strong>
                      </div>
                      <div>
                        <small>Next match</small>
                        <strong>
                          {selectedSpreadTeam.score?.status === "eliminated"
                            ? "Out of the tournament"
                            : sheetFixture && sheetOpponent
                              ? `${fixtureTimeLabel(sheetFixture)} v ${sheetOpponent.shortName}`
                              : "To be confirmed"}
                        </strong>
                      </div>
                      <div>
                        <small>
                          Picked by {selectedSpreadTeam.count} of {Math.max(1, leaderboard.length)}
                          {leaderboard.length > 0 ? ` (${Math.round((selectedSpreadTeam.count / leaderboard.length) * 100)}%)` : ""}
                        </small>
                        <EntrantNameCloud names={entrantNamesForTeam(leaderboard, selectedSpreadTeam.team.id)} />
                      </div>
                      <div>
                        <small>+10 goal-race backers</small>
                        {sheetBonusBackers.length > 0 ? (
                          <EntrantNameCloud names={sheetBonusBackers} />
                        ) : (
                          <span className="none-picked">No one's +10 pick</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Scoring</p>
              <h2>Why points move</h2>
            </div>
            <button className="text-button" type="button" onClick={onOpenScoring}>
              Rules <ArrowRight size={14} />
            </button>
          </div>
          <div className="overview-score-rules">
            <span><strong>+3</strong><small>group win or normal-time knockout win</small></span>
            <span><strong>+1</strong><small>clean sheet, group draw</small></span>
            <span><strong>+10</strong><small>bonus if your highest-scoring pick wins the race</small></span>
            <span><strong>-2</strong><small>red card deduction</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}
