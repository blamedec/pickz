import { CheckCircle2, Clock3, Lock, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTeamsByPot, maybeGetTeam, teams } from "../data/teams";
import { canEditPicks, validateOnePickPerPot } from "../lib/scoring";
import type { Entrant, League, Pot, PredictionCategory } from "../types";
import { TeamCard } from "./TeamCard";
import { TeamFlag } from "./TeamFlag";

interface PicksScreenProps {
  entry: Entrant;
  league: League | null;
  prizePotLabel: string;
  rulesAccepted: boolean;
  selectedPot: Pot;
  onSelectPot: (pot: Pot) => void;
  onPickTeam: (pot: Pot, teamId: string) => void;
  onPrediction: (category: PredictionCategory, value: string) => void;
  onConfirm: () => Promise<void> | void;
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

export function PicksScreen({
  entry,
  league,
  prizePotLabel,
  rulesAccepted,
  selectedPot,
  onSelectPot,
  onPickTeam,
  onPrediction,
  onConfirm,
}: PicksScreenProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState(() => (league ? formatCountdown(league.lockTimeIso) : "Locked"));
  const editable = Boolean(league) && rulesAccepted && canEditPicks(new Date(), league!.lockTimeIso) && !league!.locked;
  const complete = validateOnePickPerPot(entry.picks);
  const selectedTeam = maybeGetTeam(entry.picks[selectedPot]);
  const potTeams = useMemo(() => getTeamsByPot(selectedPot), [selectedPot]);
  const bonusTeam = teams.find((team) => team.name === entry.predictions.highest_scoring_team);
  const bonusComplete = Boolean(bonusTeam);
  const bonusTeamsByPot = useMemo(
    () => ([1, 2, 3, 4] as Pot[]).map((pot) => ({ pot, teams: getTeamsByPot(pot) })),
    [],
  );
  const pickReview = useMemo(
    () =>
      ([1, 2, 3, 4] as Pot[]).map((pot) => ({
        pot,
        team: maybeGetTeam(entry.picks[pot]),
      })),
    [entry.picks],
  );

  useEffect(() => {
    if (!league) return;

    setCountdown(formatCountdown(league.lockTimeIso));
    const timer = window.setInterval(() => setCountdown(formatCountdown(league.lockTimeIso)), 30_000);
    return () => window.clearInterval(timer);
  }, [league]);

  useEffect(() => {
    setReviewOpen(false);
  }, [entry.picks, entry.predictions.highest_scoring_team]);

  async function finalisePicks() {
    setSaving(true);
    try {
      await onConfirm();
      setReviewOpen(false);
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
            <p>Your four country slips and bonus pick will save once you have a competition room.</p>
          </div>
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
            One country from each pot. Duplicates are allowed, swaps are open until kickoff, and the bonus slip is worth +10.
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
            <h2>Your slips from the hat</h2>
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
          <small className="picked-team-label">{bonusTeam ? <><TeamFlag team={bonusTeam} className="inline-crest" /> {bonusTeam.name}</> : "Choose highest-scoring team"}</small>
        </div>
        <p className="edit-window-note">
          Your saved picks stay editable until the countdown reaches zero. After kickoff, the league locks automatically.
        </p>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Bonus slip</p>
            <h2>Back the top scorers</h2>
          </div>
          <span className="mini-badge">+10 pts</span>
        </div>
        <div className="bonus-selector">
          <div className="bonus-selected">
            <span className="flag-badge">{bonusTeam ? <TeamFlag team={bonusTeam} /> : "?"}</span>
            <span>
                <small>Highest-scoring team</small>
              <strong>{bonusTeam?.name ?? entry.predictions.highest_scoring_team}</strong>
            </span>
          </div>
          <label className="bonus-dropdown">
            <span>Choose from all teams</span>
            <select
              value={bonusTeam?.id ?? ""}
              disabled={!editable}
              aria-label="Highest-scoring team bonus"
              onChange={(event) => {
                const team = teams.find((item) => item.id === event.target.value);
                if (team) {
                  onPrediction("highest_scoring_team", team.name);
                }
              }}
            >
              <option value="" disabled>
                Select a bonus team
              </option>
              {bonusTeamsByPot.map((group) => (
                <optgroup key={group.pot} label={`Pot ${group.pot}`}>
                  {group.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} · {team.code} · Group {team.group}
                    </option>
                  ))}
                </optgroup>
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
          <span className="prediction-chip">Bonus +10: {bonusTeam?.name ?? "Missing"}</span>
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

      <button
        className="primary-cta"
        type="button"
        disabled={!editable || !complete || !bonusComplete}
        onClick={() => setReviewOpen(true)}
      >
        <Sparkles size={18} />
        {!editable ? "Picks locked" : complete && bonusComplete ? "Review and finalise" : "Pick one team from each pot"}
      </button>
    </section>
  );
}
