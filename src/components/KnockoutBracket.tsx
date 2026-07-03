import { Trophy } from "lucide-react";
import { useMemo } from "react";
import { maybeGetTeam } from "../data/teams";
import { fixtureTimeLabel } from "../lib/fixtureDisplay";
import { getFixtureWinnerId } from "../lib/matchImpact";
import type { MatchStage, WorldCupFixture } from "../types";
import { TeamFlag } from "./TeamFlag";

interface KnockoutBracketProps {
  fixtures: WorldCupFixture[];
  pickedTeamIds: Set<string | null>;
  pickCounts: Map<string, number>;
}

const rounds: Array<{ stage: MatchStage; label: string; short: string; slots: number }> = [
  { stage: "round_of_32", label: "Round of 32", short: "L32", slots: 16 },
  { stage: "round_of_16", label: "Round of 16", short: "L16", slots: 8 },
  { stage: "quarter_final", label: "Quarter-finals", short: "QF", slots: 4 },
  { stage: "semi_final", label: "Semi-finals", short: "SF", slots: 2 },
  { stage: "final", label: "The final", short: "F", slots: 1 },
];

function roundStatus(found: number, slots: number, label: string) {
  if (found === 0) return `${slots} ${slots === 1 ? "place" : "places"} still to be decided`;
  if (found < slots) return `${found} of ${slots} ties set`;
  return label === "The final" ? "" : "All ties set";
}

function BracketTeamRow({
  fixture,
  side,
  winnerId,
}: {
  fixture: WorldCupFixture;
  side: "home" | "away";
  winnerId: string | null;
}) {
  const fixtureTeam = side === "home" ? fixture.home : fixture.away;
  const team = maybeGetTeam(fixtureTeam.id);
  const decided = fixture.status === "completed";
  const winner = decided && winnerId !== null && winnerId === fixtureTeam.id;
  const loser = decided && winnerId !== null && winnerId !== fixtureTeam.id;
  const showScore = fixture.status !== "scheduled" || fixtureTeam.score > 0 || (side === "home" ? fixture.away.score : fixture.home.score) > 0;

  return (
    <span className={["bracket-team", winner ? "winner" : "", loser ? "loser" : ""].filter(Boolean).join(" ")}>
      <i className="bracket-team-flag">{team ? <TeamFlag team={team} /> : <em className="flag-tbc" aria-hidden="true" />}</i>
      <strong>{fixtureTeam.shortName === "TBC" ? "To be decided" : fixtureTeam.shortName}</strong>
      <b>{showScore ? fixtureTeam.score : ""}</b>
    </span>
  );
}

export function KnockoutBracket({ fixtures, pickedTeamIds, pickCounts }: KnockoutBracketProps) {
  const fixturesByStage = useMemo(() => {
    const map = new Map<MatchStage, WorldCupFixture[]>();
    for (const fixture of fixtures) {
      if (fixture.stage === "group") continue;
      map.set(fixture.stage, [...(map.get(fixture.stage) ?? []), fixture]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [fixtures]);

  const finalFixture = fixturesByStage.get("final")?.[0] ?? null;
  const championId = finalFixture && finalFixture.status === "completed" ? getFixtureWinnerId(finalFixture) : null;
  const championTeam = maybeGetTeam(championId);

  return (
    <div className="knockout-path">
      {championTeam ? (
        <div className="champion-banner">
          <Trophy size={22} />
          <span>
            <small>World champions</small>
            <strong><TeamFlag team={championTeam} /> {championTeam.name}</strong>
          </span>
        </div>
      ) : null}

      {rounds.map((round) => {
        const roundFixtures = (fixturesByStage.get(round.stage) ?? []).slice(0, round.slots);
        // A tie is only worth a card once at least one real team is in it;
        // fully-TBC fixtures collapse into the pending count below.
        const setTies = roundFixtures.filter((fixture) => maybeGetTeam(fixture.home.id) || maybeGetTeam(fixture.away.id));
        const pending = Math.max(0, round.slots - setTies.length);
        const isFinal = round.stage === "final";

        return (
          <section className={isFinal ? "knockout-round knockout-final" : "knockout-round"} key={round.stage}>
            <header className="knockout-round-head">
              <span className="round-badge">{round.short}</span>
              <strong>{round.label}</strong>
              <small>{roundStatus(setTies.length, round.slots, round.label)}</small>
            </header>

            {setTies.length > 0 || isFinal ? (
              <div className={`knockout-grid round-${round.short.toLowerCase()}`}>
                {setTies.map((fixture) => {
                  const winnerId = fixture.status === "completed" ? getFixtureWinnerId(fixture) : null;
                  const picked = pickedTeamIds.has(fixture.home.id) || pickedTeamIds.has(fixture.away.id);
                  const entries = (fixture.home.id ? pickCounts.get(fixture.home.id) ?? 0 : 0) + (fixture.away.id ? pickCounts.get(fixture.away.id) ?? 0 : 0);

                  return (
                    <article className={picked ? "bracket-match picked" : "bracket-match"} key={fixture.id}>
                      <small className="bracket-match-meta">
                        <span>{fixtureTimeLabel(fixture)}</span>
                        {entries > 0 ? <em>{entries} {entries === 1 ? "entry" : "entries"}</em> : null}
                      </small>
                      <BracketTeamRow fixture={fixture} side="home" winnerId={winnerId} />
                      <BracketTeamRow fixture={fixture} side="away" winnerId={winnerId} />
                    </article>
                  );
                })}
                {isFinal && setTies.length === 0 ? (
                  <article className="bracket-match bracket-tbc-card final-tbc">
                    <Trophy size={18} />
                    <strong>19 July · the last match standing</strong>
                    <small>Two countries, one +15 champion bonus.</small>
                  </article>
                ) : null}
              </div>
            ) : (
              <p className="knockout-round-empty">Filled by {round.stage === "round_of_32" ? "the group stage" : "the round before"}. Ties appear here the moment they are set.</p>
            )}
            {!isFinal && setTies.length > 0 && pending > 0 ? (
              <p className="knockout-round-empty knockout-pending-row">
                {pending} more {pending === 1 ? "tie" : "ties"} still to be decided.
              </p>
            ) : null}
          </section>
        );
      })}

      <p className="bracket-note">Gold edges mark ties with this league's countries.</p>
    </div>
  );
}
