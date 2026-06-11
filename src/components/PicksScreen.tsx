import { ArrowRight, CheckCircle2, Clock3, Lock, Radio, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTeamsByPot, maybeGetTeam, teams } from "../data/teams";
import { canEditPicks, validateOnePickPerPot } from "../lib/scoring";
import type { Entrant, LeaderboardRow, League, Pot, PredictionCategory, TeamScore } from "../types";
import { MetricKey } from "./MetricKey";
import { TeamCard } from "./TeamCard";
import { TeamFlag } from "./TeamFlag";

interface PicksScreenProps {
  entry: Entrant;
  league: League | null;
  scores: Record<string, TeamScore>;
  leaderboardRow: LeaderboardRow | null;
  correctBonusTeamName: string;
  prizePotLabel: string;
  rulesAccepted: boolean;
  selectedPot: Pot;
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

function stageLabel(stage: TeamScore["stageReached"]) {
  switch (stage) {
    case "round_of_32":
      return "Round of 32";
    case "round_of_16":
      return "Round of 16";
    case "quarter_final":
      return "Quarter-final";
    case "semi_final":
      return "Semi-final";
    case "final":
      return "Final";
    case "group":
      return "Group";
    case "pre_tournament":
    default:
      return "Group stage";
  }
}

function breakdownItems(score?: TeamScore) {
  if (!score) return [];

  return [
    { label: "Match points", value: score.matchPoints ?? 0 },
    { label: "Clean sheets", value: score.cleanSheetBonusPoints ?? 0 },
    { label: "Statement wins", value: score.statementWinBonusPoints ?? 0 },
    { label: "Underdog bonus", value: (score.giantSlayerBonusPoints ?? 0) + (score.majorGiantSlayerBonusPoints ?? 0) },
    { label: "Stage bonus", value: (score.stageBonusPoints ?? 0) + (score.championBonusPoints ?? 0) },
    { label: "Discipline", value: score.disciplineDeductionPoints ?? 0 },
  ].filter((item) => item.value !== 0);
}

export function PicksScreen({
  entry,
  league,
  scores,
  leaderboardRow,
  correctBonusTeamName,
  prizePotLabel,
  rulesAccepted,
  selectedPot,
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
  const bonusAwarded = Boolean(correctBonusTeamName && bonusTeam?.name === correctBonusTeamName);
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
            <h1>{complete ? "Your picks are locked." : "Entries are closed."}</h1>
            <p>
              {complete
                ? `This is your saved ${league.name} entry. No more edits now, just scoreboard nerves.`
                : "This device is not linked to a completed entry. Use the table to browse everyone now the reveal is open."}
            </p>
          </div>
          <div className="lock-banner">
            <Lock size={16} />
            <span>Tournament mode</span>
            <small>{formatLockTime(league.lockTimeIso)}</small>
          </div>
        </div>

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

            <div className="entry-country-breakdown">
              {lockedPickRows.map(({ pot, team, score }) => {
                const items = breakdownItems(score);
                return (
                  <article className="entry-country-card" key={pot}>
                    <div className="entry-country-head">
                      <span>{team ? <TeamFlag team={team} /> : <X size={17} />}</span>
                      <div>
                        <small>Pot {pot}</small>
                        <strong>{team?.name ?? "Missing"}</strong>
                      </div>
                      <b>{score?.points ?? 0} pts</b>
                    </div>
                    <div className="entry-country-meta">
                      <span>W/D/L {score?.wins ?? 0}/{score?.draws ?? 0}/{score?.losses ?? 0}</span>
                      <span>GF {score?.goalsFor ?? 0} · GA {score?.goalsAgainst ?? 0}</span>
                      <span>CS {score?.cleanSheets ?? 0} · RC {score?.redCards ?? 0}</span>
                      <span>{stageLabel(score?.stageReached ?? "pre_tournament")}</span>
                    </div>
                    <div className="entry-points-grid">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <span className={item.value < 0 ? "negative" : ""} key={`${pot}-${item.label}`}>
                            <small>{item.label}</small>
                            <strong>{signedPoints(item.value)}</strong>
                          </span>
                        ))
                      ) : (
                        <span className="empty-breakdown">
                          <small>No points scored yet</small>
                          <strong>0</strong>
                        </span>
                      )}
                    </div>
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
                  {bonusAwarded
                    ? "+10 awarded"
                    : correctBonusTeamName
                      ? `${correctBonusTeamName} currently leads the race`
                      : `${bonusScore?.goalsFor ?? 0} goals so far. +10 is awarded when the top-scorer race is settled.`}
                </em>
              </div>
              <b>{bonusAwarded ? "+10" : "+0"}</b>
            </div>
            <p className="edit-window-note">This breakdown stays available after the tournament, so your final score has a permanent audit trail.</p>
          </div>
        ) : (
          <div className="panel">
            <div className="empty-state compact-empty-state">
              <strong>No completed entry found here</strong>
              <small>The league is still viewable: open the table for everyone’s revealed picks and points.</small>
            </div>
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
