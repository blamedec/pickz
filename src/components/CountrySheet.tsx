import { X } from "lucide-react";
import { maybeGetTeam } from "../data/teams";
import { fixtureTimeLabel, nextFixtureForTeam } from "../lib/fixtureDisplay";
import { bonusBackers, rowsForTeam } from "../lib/leagueInsights";
import type { LeaderboardRow, Team, TeamScore, WorldCupFixture } from "../types";
import { TeamFlag } from "./TeamFlag";

interface CountrySheetProps {
  team: Team;
  score?: TeamScore;
  leaderboard: LeaderboardRow[];
  fixtures: WorldCupFixture[];
  onClose: () => void;
}

function NameCloud({ names, emptyLabel }: { names: string[]; emptyLabel: string }) {
  if (names.length === 0) {
    return <small className="none-picked">{emptyLabel}</small>;
  }

  return (
    <span className="entrant-chip-list">
      {names.map((name) => (
        <small key={name}>{name}</small>
      ))}
    </span>
  );
}

/**
 * The one place a country is explained: status, record, next match, who
 * picked it, who staked their +10 on it. Opened from any country tile.
 */
export function CountrySheet({ team, score, leaderboard, fixtures, onClose }: CountrySheetProps) {
  const out = score?.status === "eliminated";
  const fixture = out ? undefined : nextFixtureForTeam(team.id, fixtures);
  const opponentTeam = fixture ? maybeGetTeam(fixture.home.id === team.id ? fixture.away.id : fixture.home.id) : null;
  const opponentName = fixture ? (fixture.home.id === team.id ? fixture.away.shortName : fixture.home.shortName) : null;
  const backers = rowsForTeam(leaderboard, team.id)
    .map((row) => row.entrant.name)
    .sort((a, b) => a.localeCompare(b));
  const goalRaceBackers = bonusBackers(leaderboard, team.name);
  const leagueSize = Math.max(1, leaderboard.length);
  const share = leaderboard.length > 0 ? ` (${Math.round((backers.length / leagueSize) * 100)}%)` : "";

  return (
    <div className="pick-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="pick-modal" role="dialog" aria-modal="true" aria-label={`${team.name} in this league`} onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close country details">
          <X size={18} />
        </button>
        <div className="pick-modal-head">
          <TeamFlag team={team} />
          <span>
            <small>
              Pot {team.pot} · Group {team.group}
              {out ? (
                <em className="status-chip eliminated">Out</em>
              ) : score?.status === "champion" ? (
                <em className="status-chip champion">Champions</em>
              ) : (
                <em className="status-chip alive">Still in</em>
              )}
            </small>
            <strong>{team.name}</strong>
          </span>
        </div>
        <div className="country-sheet-rows">
          <div>
            <small>This tournament</small>
            <strong>
              {score?.points ?? 0} pts · {score?.goalsFor ?? 0} {(score?.goalsFor ?? 0) === 1 ? "goal" : "goals"} · {score?.cleanSheets ?? 0}{" "}
              {(score?.cleanSheets ?? 0) === 1 ? "clean sheet" : "clean sheets"}
            </strong>
          </div>
          <div>
            <small>Next match</small>
            <strong>
              {out ? (
                "Out of the tournament"
              ) : fixture && opponentName ? (
                <>
                  {fixtureTimeLabel(fixture)} v {opponentTeam ? <TeamFlag team={opponentTeam} className="inline-crest" /> : null} {opponentName}
                </>
              ) : (
                "To be confirmed"
              )}
            </strong>
          </div>
          <div>
            <small>
              Picked by {backers.length} of {leagueSize}
              {share}
            </small>
            <NameCloud names={backers} emptyLabel="No one has this lot" />
          </div>
          <div>
            <small>+10 goal-race backers</small>
            <NameCloud names={goalRaceBackers} emptyLabel="No one's +10 pick" />
          </div>
        </div>
      </div>
    </div>
  );
}
