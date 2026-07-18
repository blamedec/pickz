import { Crown, Share2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { maybeGetTeam, teams } from "../data/teams";
import type { LeaderboardRow, Pot, TeamScore } from "../types";
import { TeamFlag } from "./TeamFlag";

interface WinnerShowcaseProps {
  leagueName: string;
  leaderboard: LeaderboardRow[];
  scores: Record<string, TeamScore>;
  currentEntrantId: string | null;
}

const potOrder: Pot[] = [1, 2, 3, 4];

/**
 * The end-of-tournament moment: crowns the person who won the friend league.
 * Renders only once a champion country exists (the real final is decided),
 * so it can never fire early off a group or third-place result.
 */
export function WinnerShowcase({ leagueName, leaderboard, scores, currentEntrantId }: WinnerShowcaseProps) {
  const [shareNotice, setShareNotice] = useState("");

  const championTeam = useMemo(() => {
    const row = Object.values(scores).find((score) => score.status === "champion");
    return row ? maybeGetTeam(row.teamId) : null;
  }, [scores]);

  const winners = useMemo(() => leaderboard.filter((row) => row.rank === 1), [leaderboard]);
  const podium = useMemo(() => leaderboard.filter((row) => row.rank >= 2 && row.rank <= 3).slice(0, 3), [leaderboard]);

  if (!championTeam || winners.length === 0) return null;

  const joint = winners.length > 1;
  const headline = joint ? winners.map((row) => row.entrant.name).join(" & ") : winners[0].entrant.name;
  const youWon = winners.some((row) => row.entrant.id === currentEntrantId);

  async function shareResult() {
    const lines = [
      `🏆 ${leagueName} — final result`,
      ...winners.map((row) => `1. ${row.entrant.name} — ${row.totalPoints} pts 👑`),
      ...podium.map((row) => `${row.rank}. ${row.entrant.name} — ${row.totalPoints} pts`),
    ];
    const text = [...lines, "pickfour.vercel.app"].join("\n");

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNotice("Result copied, paste it in the group chat.");
      window.setTimeout(() => setShareNotice(""), 3000);
    } catch {
      // share sheet dismissed; nothing to clean up
    }
  }

  return (
    <div className="winner-showcase">
      <div className="broadcast-strap winner-strap">
        <span>
          <Trophy size={13} /> Tournament complete
        </span>
        <span>
          {championTeam.code} lifted the World Cup
        </span>
      </div>

      <div className="winner-crown-row">
        <Crown size={30} aria-hidden="true" />
        <p className="section-kicker">{joint ? "PickFour joint champions" : "PickFour champion"}</p>
      </div>
      <h1 className="winner-name">{headline}{youWon ? " · that's you" : ""}</h1>
      <p className="winner-sub">
        {joint ? "Level at the top when the whistle went." : "No one else had this lot when it mattered."} {winners[0].totalPoints} points.
      </p>

      {winners.map((row) => (
        <div className="winner-entry" key={row.entrant.id}>
          <div className="winner-flags">
            {potOrder.map((pot) => {
              const team = maybeGetTeam(row.entrant.picks[pot]);
              return (
                <span className="winner-flag" key={`${row.entrant.id}-${pot}`}>
                  {team ? <TeamFlag team={team} /> : null}
                  <small>{team?.code ?? "—"}</small>
                </span>
              );
            })}
          </div>
          <div className="winner-entry-meta">
            {row.predictionPoints > 0 ? <span className="winner-bonus-chip">+10 bonus banked</span> : null}
            <span className="winner-total">{row.totalPoints} pts</span>
          </div>
        </div>
      ))}

      {podium.length > 0 ? (
        <div className="winner-podium">
          {podium.map((row) => (
            <div className="winner-podium-row" key={row.entrant.id}>
              <span className={`winner-medal medal-${row.rank}`}>{row.rank}</span>
              <strong>{row.entrant.name}</strong>
              <b>{row.totalPoints} pts</b>
            </div>
          ))}
        </div>
      ) : null}

      <button className="primary-cta winner-share" type="button" onClick={shareResult}>
        <Share2 size={17} />
        Copy result for the group chat
      </button>
      {shareNotice ? <p className="lookup-message winner-share-notice">{shareNotice}</p> : null}
    </div>
  );
}
