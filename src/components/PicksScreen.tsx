import { ArrowRight, CheckCircle2, Clock3, Lock, Radio, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTeamsByPot, maybeGetTeam, teams } from "../data/teams";
import { fixtureTimeLabel, nextFixtureForTeam, stageReachedLabel } from "../lib/fixtureDisplay";
import { formatSignedPoints, getPointsOnOffer, getTeamMatchLedger, getTeamPointsBreakdown } from "../lib/matchImpact";
import { canEditPicks, validateOnePickPerPot } from "../lib/scoring";
import { isFixtureInKickoffWindow } from "../lib/worldCupApi";
import type { Entrant, LeaderboardRow, League, Pot, PredictionCategory, Team, TeamScore, UserProfile, WorldCupFixture } from "../types";
import { MetricKey } from "./MetricKey";
import { EntryLoginForm } from "./EntryLoginForm";
import { TeamCard } from "./TeamCard";
import { TeamFlag } from "./TeamFlag";

interface PicksScreenProps {
  entry: Entrant;
  league: League | null;
  scores: Record<string, TeamScore>;
  fixtures: WorldCupFixture[];
  leaderboardRow: LeaderboardRow | null;
  correctBonusTeamNames: string[];
  prizePotLabel: string;
  rulesAccepted: boolean;
  selectedPot: Pot;
  profile: UserProfile;
  onFindEntry: (profile: UserProfile) => Promise<{ found: boolean; message: string }>;
  onSelectPot: (pot: Pot) => void;
  onPickTeam: (pot: Pot, teamId: string) => void;
  onPrediction: (category: PredictionCategory, value: string) => void;
  onConfirm: () => Promise<void> | void;
  onGoToLeague: () => void;
  onGoToLive: () => void;
}

function formatCountdown(lockTimeIso: string) {
  const remaining = Math.max(0, new Date(lockTimeIso).getTime() - Date.now());
  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (remaining <= 0) return "Locked";
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLockTime(lockTimeIso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(lockTimeIso));
}

function signedPoints(value = 0) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function getOrdinal(position: number) {
  const mod100 = position % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`;
  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

function teamStatusChip(score?: TeamScore) {
  if (score?.status === "champion") return { className: "status-chip champion", label: "Champions" };
  if (score?.status === "eliminated") return { className: "status-chip eliminated", label: "Out" };
  return { className: "status-chip alive", label: "Still in" };
}

function formatLedgerDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

const offerShortLabels: Record<string, string> = {
  Win: "Win",
  Draw: "Draw",
  "Clean sheet": "CS",
  "Win on pens / extra time": "ET/pens win",
};

function offerSummary(fixture: WorldCupFixture) {
  return getPointsOnOffer(fixture)
    .map((offer) => `${offerShortLabels[offer.label] ?? offer.label} +${offer.points}`)
    .join(" · ");
}

function runInSortTime(row: { out: boolean; fixture?: WorldCupFixture }) {
  if (row.out) return Number.POSITIVE_INFINITY;
  if (!row.fixture) return Number.POSITIVE_INFINITY - 1;
  if (row.fixture.status === "live") return 0;
  if (isFixtureInKickoffWindow(row.fixture)) return 1;
  return new Date(row.fixture.startsAt).getTime();
}

function nextFixtureLabel(team: Team, fixtures: WorldCupFixture[]) {
  const next = nextFixtureForTeam(team.id, fixtures);
  if (!next) return null;

  const opponent = next.home.id === team.id ? next.away : next.home;
  if (next.status === "live") return `Live now vs ${opponent.shortName}`;
  if (isFixtureInKickoffWindow(next)) return `Kicking off vs ${opponent.shortName}`;
  return `Next: ${new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(next.startsAt))} vs ${opponent.shortName}`;
}

export function PicksScreen({
  entry,
  league,
  scores,
  fixtures,
  leaderboardRow,
  correctBonusTeamNames,
  prizePotLabel,
  rulesAccepted,
  selectedPot,
  profile,
  onFindEntry,
  onSelectPot,
  onPickTeam,
  onPrediction,
  onConfirm,
  onGoToLeague,
  onGoToLive,
}: PicksScreenProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState(() => (league ? formatCountdown(league.lockTimeIso) : "Locked"));
  const editable = Boolean(league) && rulesAccepted && canEditPicks(new Date(), league!.lockTimeIso) && !league!.locked;
  const complete = validateOnePickPerPot(entry.picks);
  const selectedTeam = maybeGetTeam(entry.picks[selectedPot]);
  const entrySignature = useMemo(
    () => JSON.stringify({ picks: entry.picks, bonus: entry.predictions.highest_scoring_team }),
    [entry.picks, entry.predictions.highest_scoring_team],
  );
  const potTeams = useMemo(() => getTeamsByPot(selectedPot), [selectedPot]);
  const pickReview = useMemo(
    () =>
      ([1, 2, 3, 4] as Pot[]).map((pot) => ({
        pot,
        team: maybeGetTeam(entry.picks[pot]),
      })),
    [entry.picks],
  );
  const bonusOptions = useMemo(
    () => teams.slice().sort((a, b) => a.pot - b.pot || a.name.localeCompare(b.name)),
    [],
  );
  const bonusTeam = bonusOptions.find((team) => team.name === entry.predictions.highest_scoring_team) ?? null;
  const bonusComplete = Boolean(bonusTeam);
  const lockedPickRows = useMemo(
    () =>
      pickReview.map(({ pot, team }) => ({
        pot,
        team,
        score: team ? scores[team.id] : undefined,
      })),
    [pickReview, scores],
  );
  const bonusScore = bonusTeam ? scores[bonusTeam.id] : undefined;
  const bonusLeading = Boolean(bonusTeam && correctBonusTeamNames.includes(bonusTeam.name));
  const bonusBanked = (leaderboardRow?.predictionPoints ?? 0) > 0;
  const bonusOnTrack = bonusLeading && !bonusBanked;
  const ledgerByTeam = useMemo(
    () =>
      new Map(
        Object.values(entry.picks)
          .filter((teamId): teamId is string => Boolean(teamId))
          .map((teamId) => [teamId, getTeamMatchLedger(teamId, fixtures)]),
      ),
    [entry.picks, fixtures],
  );
  const runIn = useMemo(
    () =>
      Object.values(entry.picks)
        .flatMap((teamId) => {
          const team = maybeGetTeam(teamId);
          if (!team) return [];
          const score = scores[team.id];
          const out = score?.status === "eliminated";
          return [{ team, score, out, fixture: out ? undefined : nextFixtureForTeam(team.id, fixtures) }];
        })
        .sort((a, b) => runInSortTime(a) - runInSortTime(b)),
    [entry.picks, fixtures, scores],
  );
  const latestScoringEvent = useMemo(() => {
    const all = [...ledgerByTeam.values()].flat();
    return all.sort((a, b) => new Date(b.fixture.startsAt).getTime() - new Date(a.fixture.startsAt).getTime())[0] ?? null;
  }, [ledgerByTeam]);
  const bonusRace = useMemo(() => {
    if (!bonusTeam) return null;

    const standings = Object.values(scores)
      .slice()
      .sort((a, b) => b.goalsFor - a.goalsFor || b.points - a.points);
    const index = standings.findIndex((row) => row.teamId === bonusTeam.id);
    if (index === -1) return null;

    const leaderGoals = standings[0]?.goalsFor ?? 0;
    return {
      position: index + 1,
      goals: standings[index].goalsFor,
      gap: leaderGoals - standings[index].goalsFor,
    };
  }, [bonusTeam, scores]);
  const primaryCtaLabel = !editable
    ? "Picks locked"
    : !complete ? "Pick one country from each pot"
      : !bonusComplete ? "Choose your +10 bonus team"
        : saveComplete ? "Review saved picks"
          : "Review and finalise";

  useEffect(() => {
    if (!league) return;

    setCountdown(formatCountdown(league.lockTimeIso));
    const timer = window.setInterval(() => setCountdown(formatCountdown(league.lockTimeIso)), 30_000);
    return () => window.clearInterval(timer);
  }, [league]);

  useEffect(() => {
    setReviewOpen(false);
    setSaveComplete(Boolean(savedSignature) && savedSignature === entrySignature);
  }, [entrySignature, savedSignature]);

  async function finalisePicks() {
    setSaving(true);
    try {
      await onConfirm();
      setSavedSignature(entrySignature);
      setReviewOpen(false);
      setSaveComplete(true);
    } finally {
      setSaving(false);
    }
  }

  if (!league) {
    return (
      <section className="screen-stack">
        <div className="hero-panel pick-hero">
          <div className="broadcast-strap">
            <span>Set up first</span>
            <span>No league selected</span>
          </div>
          <div className="hero-copy">
            <p className="section-kicker">Pick one from each pot</p>
            <h1>Get yourself in a league first.</h1>
            <p>Your four country picks and +10 bonus will save once you have a competition room.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!editable) {
    return (
      <section className="screen-stack my-entry-screen">
        <div className="hero-panel pick-hero locked-entry-hero">
          <div className="broadcast-strap">
            <span>{prizePotLabel}</span>
            <span>Picks locked</span>
          </div>
          <div className="hero-copy">
            <p className="section-kicker">Your entry</p>
            <h1>{complete ? "Your picks are locked." : "Find your entry."}</h1>
            <p>
              {complete
                ? `This is your saved ${league.name} entry. No more edits now, just scoreboard nerves.`
                : "This device is not linked to an entry yet. Log in below with your entry email, or browse everyone's picks on the table."}
            </p>
          </div>
          <div className="lock-banner">
            <Lock size={16} />
            <span>Tournament mode</span>
            <small>{formatLockTime(league.lockTimeIso)}</small>
          </div>
        </div>

        {complete ? (
          <div className="panel run-in-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Next up for you</p>
                <h2>Your run-in</h2>
              </div>
              <span className="mini-badge">{runIn.filter((row) => !row.out).length} still in</span>
            </div>
            <div className="run-in-list">
              {runIn.map((row) => {
                const opponent = row.fixture
                  ? row.fixture.home.id === row.team.id
                    ? row.fixture.away
                    : row.fixture.home
                  : null;
                return (
                  <div className={row.out ? "run-in-row out" : "run-in-row"} key={row.team.id}>
                    <TeamFlag team={row.team} />
                    <span className="run-in-team">
                      <strong>{row.team.name}</strong>
                      <small>
                        {row.out
                          ? "Out of the tournament"
                          : row.fixture && opponent
                            ? `${fixtureTimeLabel(row.fixture)} v ${opponent.shortName}`
                            : "Next fixture TBC"}
                      </small>
                    </span>
                    {!row.out && row.fixture ? <span className="run-in-offer">{offerSummary(row.fixture)}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {complete ? (
          <div className="panel entry-breakdown-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Points breakdown</p>
                <h2>Your entry, item by item</h2>
              </div>
              <div className="panel-action-row">
                <MetricKey />
                <CheckCircle2 className="success-icon" size={22} />
              </div>
            </div>

            <div className="entry-score-overview">
              <span>
                <small>Rank</small>
                <strong>#{leaderboardRow?.rank ?? 1}</strong>
              </span>
              <span>
                <small>Total</small>
                <strong>{leaderboardRow?.totalPoints ?? 0}</strong>
              </span>
              <span>
                <small>Countries</small>
                <strong>{leaderboardRow?.countryPoints ?? 0}</strong>
              </span>
              <span>
                <small>Bonus</small>
                <strong>{leaderboardRow?.predictionPoints ?? 0}</strong>
              </span>
            </div>

            <p className="entry-receipt-line">
              {leaderboardRow?.countryPoints ?? 0} from your four countries + {leaderboardRow?.predictionPoints ?? 0} bonus banked ={" "}
              <b>{leaderboardRow?.totalPoints ?? 0} points</b>
              {bonusOnTrack ? " · +10 on track" : ""}
              {latestScoringEvent ? (
                <>
                  {" "}· Latest: {latestScoringEvent.fixture.home.shortName} {latestScoringEvent.fixture.home.score}-{latestScoringEvent.fixture.away.score}{" "}
                  {latestScoringEvent.fixture.away.shortName}{" "}
                  <b className={latestScoringEvent.impact.total < 0 ? "negative" : ""}>{formatSignedPoints(latestScoringEvent.impact.total)}</b>
                </>
              ) : null}
            </p>

            <div className="entry-country-breakdown">
              {lockedPickRows.map(({ pot, team, score }) => {
                const items = getTeamPointsBreakdown(score);
                const chip = teamStatusChip(score);
                const ledger = team ? ledgerByTeam.get(team.id) ?? [] : [];
                const nextLabel = team ? nextFixtureLabel(team, fixtures) : null;
                return (
                  <article className="entry-country-card" key={pot}>
                    <div className="entry-country-head">
                      <span>{team ? <TeamFlag team={team} /> : <X size={17} />}</span>
                      <div>
                        <small>Pot {pot} · <em className={chip.className}>{chip.label}</em></small>
                        <strong>{team?.name ?? "Missing"}</strong>
                      </div>
                      <b>{score?.points ?? 0} pts</b>
                    </div>
                    <div className="entry-country-meta">
                      <span>W/D/L {score?.wins ?? 0}/{score?.draws ?? 0}/{score?.losses ?? 0}</span>
                      <span>Goals {score?.goalsFor ?? 0} · Conceded {score?.goalsAgainst ?? 0}</span>
                      <span>Clean sheets {score?.cleanSheets ?? 0} · Reds {score?.redCards ?? 0}</span>
                      <span>{stageReachedLabel(score?.stageReached ?? "pre_tournament")}</span>
                    </div>
                    <div className="entry-points-grid">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <span className={item.points < 0 ? "negative" : ""} key={`${pot}-${item.label}`}>
                            <small>{item.label}</small>
                            <strong>{signedPoints(item.points)}</strong>
                          </span>
                        ))
                      ) : (
                        <span className="empty-breakdown">
                          <small>No points scored yet</small>
                          <strong>0</strong>
                        </span>
                      )}
                    </div>
                    {ledger.length > 0 ? (
                      <div className="entry-match-ledger">
                        {ledger.map(({ fixture, impact }) => (
                          <div className="ledger-row" key={fixture.id}>
                            <small>{formatLedgerDate(fixture.startsAt)}</small>
                            <span>
                              {fixture.home.shortName} {fixture.home.score}-{fixture.away.score} {fixture.away.shortName}
                            </span>
                            <b className={impact.total < 0 ? "negative" : impact.total === 0 ? "zero" : ""}>
                              {formatSignedPoints(impact.total)}
                            </b>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {nextLabel ? <p className="entry-next-fixture">{nextLabel}</p> : null}
                  </article>
                );
              })}
            </div>

            <div className="bonus-breakdown-card">
              <span>{bonusTeam ? <TeamFlag team={bonusTeam} /> : <X size={17} />}</span>
              <div>
                <small>Highest-scoring team bonus</small>
                <strong>{bonusTeam?.name ?? (entry.predictions.highest_scoring_team || "Pending")}</strong>
                <em>
                  {bonusBanked
                    ? "+10 banked: your bonus country finished top of the goal race."
                    : bonusOnTrack
                      ? `${correctBonusTeamNames.length > 1 ? "Joint top" : "Top"} of the goal race. The +10 banks at full time of the final if they stay there.`
                      : bonusRace && correctBonusTeamNames.length > 0
                        ? `${getOrdinal(bonusRace.position)} in the goal race with ${bonusRace.goals} goals, ${bonusRace.gap > 0 ? `${bonusRace.gap} behind ${correctBonusTeamNames.join(" & ")}` : `level with ${correctBonusTeamNames.join(" & ")}`}. Your +10 banks at the end if they finish top.`
                        : `${bonusScore?.goalsFor ?? 0} goals so far. Your +10 banks at the end if your bonus country finishes top of the goal race.`}
                </em>
              </div>
              <b className={bonusOnTrack ? "on-track" : ""}>{bonusBanked ? "+10" : bonusOnTrack ? "on track" : "+0"}</b>
            </div>
            <p className="edit-window-note">This breakdown stays available after the tournament, so your final score has a permanent audit trail.</p>
          </div>
        ) : (
          <div className="panel">
            <EntryLoginForm
              profile={profile}
              introTitle="Log in to your entry"
              introCopy="Enter the email you used when you joined. Your row, run-in and points ledger appear here."
              onFindEntry={onFindEntry}
            />
            <p className="helper-copy compact-copy">No entry? The table is still public — browse everyone's revealed picks.</p>
          </div>
        )}

        <div className="saved-next-actions locked-entry-actions">
          <button className="primary-cta" type="button" onClick={onGoToLive}>
            <Radio size={18} />
            Open matches
            <ArrowRight size={17} />
          </button>
          <button className="secondary-cta" type="button" onClick={onGoToLeague}>
            Back to overview
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <div className="hero-panel pick-hero">
        <div className="broadcast-strap">
          <span>{prizePotLabel}</span>
          <span>{editable ? "Picks open" : rulesAccepted ? "Picks locked" : "Read rules"}</span>
        </div>
        <div className="hero-copy">
          <p className="section-kicker">Pick one from each pot</p>
          <h1>Make your four picks.</h1>
          <p>
            One country from each pot. Duplicates are allowed across players, swaps are open until the lock, and your +10 bonus can be any country in the tournament.
          </p>
        </div>
        <div className="lock-banner">
          <Clock3 size={16} />
          <span>{editable ? `${countdown} left to edit` : "Picks locked"}</span>
          <small>{formatLockTime(league.lockTimeIso)}</small>
        </div>
      </div>

      <div className="pot-strip" role="tablist" aria-label="Seeded pots">
        {([1, 2, 3, 4] as Pot[]).map((pot) => {
          const team = maybeGetTeam(entry.picks[pot]);
          return (
            <button
              key={pot}
              type="button"
              role="tab"
              aria-selected={selectedPot === pot}
              className={selectedPot === pot ? "pot-slot active" : "pot-slot"}
              onClick={() => onSelectPot(pot)}
            >
              <span>Pot {pot}</span>
              <strong>{team?.shortName ?? "Choose"}</strong>
              <em>{team ? <TeamFlag team={team} /> : "?"}</em>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Currently browsing</p>
            <h2>Pot {selectedPot}: {selectedTeam?.pot === selectedPot ? selectedTeam.name : "Choose your country"}</h2>
          </div>
          {complete ? <CheckCircle2 className="success-icon" size={22} /> : null}
        </div>
        <div className="team-grid">
          {potTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              selected={entry.picks[selectedPot] === team.id}
              disabled={!editable}
              onClick={() => onPickTeam(selectedPot, team.id)}
            />
          ))}
        </div>
      </div>

      <div className="panel pick-progress-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Before you finalise</p>
            <h2>Your four picks</h2>
          </div>
          <span className={complete && bonusComplete ? "mini-badge ready" : "mini-badge"}>{complete && bonusComplete ? "Ready" : "Incomplete"}</span>
        </div>
        <div className="pick-progress-grid">
          {pickReview.map(({ pot, team }) => (
            <button
              type="button"
              className={team ? "pick-progress-item complete" : "pick-progress-item"}
              key={pot}
              onClick={() => onSelectPot(pot)}
            >
              <span>{team ? <CheckCircle2 size={15} /> : <X size={15} />}</span>
              <strong>Pot {pot}</strong>
              <small className="picked-team-label">{team ? <><TeamFlag team={team} className="inline-crest" /> {team.name}</> : "Choose a country"}</small>
            </button>
          ))}
        </div>
        <div className={bonusComplete ? "bonus-progress complete" : "bonus-progress"}>
          <span>{bonusComplete ? <CheckCircle2 size={15} /> : <X size={15} />}</span>
          <strong>Bonus</strong>
          <small className="picked-team-label">{bonusTeam ? <><TeamFlag team={bonusTeam} className="inline-crest" /> {bonusTeam.name}</> : "Choose any tournament team"}</small>
        </div>
        <p className="edit-window-note">
          Your saved picks stay editable until the countdown reaches zero. After 19:55 UK, the league locks automatically.
        </p>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Bonus pick</p>
            <h2>Back the top scorers</h2>
          </div>
          <span className="mini-badge">+10 pts</span>
        </div>
        <div className="bonus-selector">
          <div className="bonus-selected">
            <span className="flag-badge">{bonusTeam ? <TeamFlag team={bonusTeam} /> : "?"}</span>
            <span>
              <small>Highest-scoring team in the tournament</small>
              <strong>{bonusTeam?.name ?? "Choose any country"}</strong>
            </span>
          </div>
          <label className="bonus-dropdown">
            <span>Choose any tournament country</span>
            <select
              value={bonusTeam?.id ?? ""}
              disabled={!editable}
              aria-label="Highest-scoring team bonus"
              onChange={(event) => {
                const team = bonusOptions.find((item) => item.id === event.target.value);
                if (team) {
                  onPrediction("highest_scoring_team", team.name);
                }
              }}
            >
              <option value="" disabled>
                Select any team
              </option>
              {bonusOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  Pot {team.pot}: {team.name} · {team.code} · Group {team.group}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {reviewOpen ? (
        <div className="panel confirm-picks-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Final check</p>
              <h2>Save these picks?</h2>
            </div>
            <Lock size={19} />
          </div>
          <div className="pick-pill-grid">
            {pickReview.map(({ pot, team }) => (
              <span className="pick-pill" key={`review-${pot}`}>
                <small>Pot {pot}</small>
                <strong>{team ? <TeamFlag team={team} /> : null} {team?.shortName ?? "Missing"}</strong>
              </span>
            ))}
          </div>
          <span className="prediction-chip">Bonus +10: {bonusTeam?.name ?? "Missing"} to finish as the tournament's highest-scoring team</span>
          <p className="edit-window-note">This saves your entry now. You can still come back and change it before {formatLockTime(league.lockTimeIso)}.</p>
          <div className="confirmation-actions">
            <button className="secondary-cta" type="button" onClick={() => setReviewOpen(false)}>
              Keep editing
            </button>
            <button className="primary-cta" type="button" disabled={saving} onClick={finalisePicks}>
              <Sparkles size={18} />
              {saving ? "Saving..." : "Save confirmed picks"}
            </button>
          </div>
        </div>
      ) : null}

      {saveComplete ? (
        <div className="panel saved-next-panel" role="status">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Picks saved</p>
              <h2>You are in. Next stop?</h2>
            </div>
            <CheckCircle2 className="success-icon" size={22} />
          </div>
          <p className="helper-copy">
            Your entry is saved to {league.name}. You can still come back, change picks, and save again until {formatLockTime(league.lockTimeIso)}.
          </p>
          <div className="saved-next-actions">
            <button className="primary-cta" type="button" onClick={onGoToLive}>
              <Radio size={18} />
              Go to live match centre
              <ArrowRight size={17} />
            </button>
            <button className="secondary-cta" type="button" onClick={onGoToLeague}>
              Back to league room
            </button>
          </div>
        </div>
      ) : null}

      <button
        className="primary-cta"
        type="button"
        disabled={!editable || !complete || !bonusComplete}
        onClick={() => setReviewOpen(true)}
      >
        <Sparkles size={18} />
        {primaryCtaLabel}
      </button>
    </section>
  );
}
