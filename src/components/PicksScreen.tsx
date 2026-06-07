import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { getTeam, getTeamsByPot, teams } from "../data/teams";
import { canEditPicks, validateOnePickPerPot } from "../lib/scoring";
import type { Entrant, League, Pot, PredictionCategory } from "../types";
import { TeamCard } from "./TeamCard";
import { TeamFlag } from "./TeamFlag";

interface PicksScreenProps {
  entry: Entrant;
  league: League;
  prizePotLabel: string;
  rulesAccepted: boolean;
  selectedPot: Pot;
  onSelectPot: (pot: Pot) => void;
  onPickTeam: (pot: Pot, teamId: string) => void;
  onPrediction: (category: PredictionCategory, value: string) => void;
  onConfirm: () => void;
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
  const editable = rulesAccepted && canEditPicks(new Date(), league.lockTimeIso) && !league.locked;
  const complete = validateOnePickPerPot(entry.picks);
  const selectedTeam = getTeam(entry.picks[selectedPot]);
  const potTeams = useMemo(() => getTeamsByPot(selectedPot), [selectedPot]);
  const bonusTeam = teams.find((team) => team.name === entry.predictions.highest_scoring_team);
  const bonusTeamsByPot = useMemo(
    () => ([1, 2, 3, 4] as Pot[]).map((pot) => ({ pot, teams: getTeamsByPot(pot) })),
    [],
  );

  return (
    <section className="screen-stack">
      <div className="hero-panel pick-hero">
        <div className="broadcast-strap">
          <span>{prizePotLabel}</span>
          <span>{editable ? "Picks open" : rulesAccepted ? "Picks locked" : "Read rules"}</span>
        </div>
        <div className="hero-copy">
          <p className="section-kicker">Pick one from each pot</p>
          <h1>Build your four-country ticket.</h1>
          <p>
            One favourite, one heavyweight, one chaos pick, one long shot. Lock them before kickoff and let the group chat
            do the rest.
          </p>
        </div>
        <div className="lock-banner">
          <Lock size={16} />
          <span>Locks 11 Jun · 20:00 UK</span>
        </div>
      </div>

      <div className="pot-strip" role="tablist" aria-label="Seeded pots">
        {([1, 2, 3, 4] as Pot[]).map((pot) => {
          const team = getTeam(entry.picks[pot]);
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
              <strong>{team.shortName}</strong>
              <em><TeamFlag team={team} /></em>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Currently browsing</p>
            <h2>Pot {selectedPot}: {selectedTeam.pot === selectedPot ? selectedTeam.name : "Choose a team"}</h2>
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

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Bonus slip</p>
            <h2>Pick your bonus country</h2>
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

      <button className="primary-cta" type="button" disabled={!editable || !complete} onClick={onConfirm}>
        <Sparkles size={18} />
        {editable ? "Confirm my picks" : "Picks locked"}
      </button>
    </section>
  );
}
