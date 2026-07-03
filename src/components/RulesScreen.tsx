import { AlertTriangle, CheckCircle2, KeyRound, ListChecks, Lock, Medal, Sparkles, Trophy, UserRound } from "lucide-react";
import { predictionCategories } from "../data/predictions";
import { maybeGetTeam } from "../data/teams";
import { defaultScoringConfig } from "../lib/scoring";
import { TeamFlag } from "./TeamFlag";

interface RulesScreenProps {
  prizePotLabel: string;
  accepted: boolean;
  canViewLeaderboard: boolean;
  tournamentStarted: boolean;
  onAccept: () => void;
  onViewLeaderboard: () => void;
}

const matchRules = [
  { label: "Group win", value: defaultScoringConfig.groupWin },
  { label: "Group draw", value: defaultScoringConfig.groupDraw },
  { label: "Any loss", value: 0 },
  { label: "Knockout win in normal time", value: defaultScoringConfig.knockoutNormalWin },
  { label: "Knockout win after ET or pens", value: defaultScoringConfig.knockoutEtPensWin },
];

const matchBonusRules = [
  { label: "Clean sheet", value: defaultScoringConfig.cleanSheetBonus },
  { label: "Win by 3+ goals", value: defaultScoringConfig.statementWinBonus },
  { label: "Pot 3/4 beats Pot 1/2", value: defaultScoringConfig.giantSlayerBonus },
  { label: "Big pot-gap upset", value: defaultScoringConfig.majorGiantSlayerBonus },
];

const deductionRules = [
  { label: "Red card", value: defaultScoringConfig.redCardDeduction },
  { label: "Own goal", value: defaultScoringConfig.ownGoalDeduction },
];

const advancementRules = [
  { label: "Advance from group", value: defaultScoringConfig.advanceFromGroup },
  { label: "Reach quarter-final", value: defaultScoringConfig.reachQuarterFinal },
  { label: "Reach semi-final", value: defaultScoringConfig.reachSemiFinal },
  { label: "Reach final", value: defaultScoringConfig.reachFinal },
  { label: "Win tournament", value: defaultScoringConfig.winTournament },
];

const heroTeamIds = ["eng", "jpn", "nor", "gha", "bra", "arg"];

function formatPoints(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function RulesScreen({ prizePotLabel, accepted, canViewLeaderboard, tournamentStarted, onAccept, onViewLeaderboard }: RulesScreenProps) {
  const heroTeams = heroTeamIds.flatMap((teamId) => {
    const team = maybeGetTeam(teamId);
    return team ? [team] : [];
  });
  const primaryCtaLabel = tournamentStarted
    ? "View the live table"
    : accepted
      ? "Continue to league setup"
      : "I get it - join or create";

  if (tournamentStarted) {
    const sections = [
      { title: "Match results", rules: matchRules },
      { title: "Stage bonuses", rules: advancementRules },
      { title: "Match bonuses", rules: matchBonusRules },
      { title: "Deductions", rules: deductionRules },
    ];

    return (
      <section className="screen-stack scoring-reference">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Scoring guide</p>
              <h2>How points are won and lost</h2>
            </div>
            <span className="mini-badge">{prizePotLabel}</span>
          </div>
          <div className="scoring-reference-grid">
            {sections.map((section) => (
              <section className="scoring-reference-group" key={section.title}>
                <h3>{section.title}</h3>
                {section.rules.map((rule) => (
                  <div className="score-line" key={rule.label}>
                    <span>{rule.label}</span>
                    <b className={rule.value < 0 ? "negative" : ""}>{formatPoints(rule.value)}</b>
                  </div>
                ))}
              </section>
            ))}
            <section className="scoring-reference-group bonus-note">
              <h3>The +10 bonus</h3>
              <p>Your +10 banks at the end of the tournament if your bonus country finishes top of the goal race. Until then the table shows it as "on track" — it never sits inside your total early.</p>
            </section>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Locked in</p>
              <h2>How the league runs now</h2>
            </div>
          </div>
          <ul className="rules-list">
            <li>Picks and bonus picks are locked. Everyone's selections are revealed on the table.</li>
            <li>Eliminated countries keep their earned points and stop scoring.</li>
            <li>Your entry stays alive while any of your four countries can still score.</li>
          </ul>
        </div>

        {canViewLeaderboard ? (
          <button className="primary-cta" type="button" onClick={onViewLeaderboard}>
            <CheckCircle2 size={18} />
            View the live table
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="screen-stack">
      <div className="hero-panel rules-hero">
        <div className="broadcast-strap">
          <span>Rules first</span>
          <span>{accepted ? "Cleared" : "Before picks"}</span>
        </div>
        <div className="hero-copy">
          <p className="section-kicker">PickFour</p>
          <h1>Four picks. One bonus punt.</h1>
          <p>
            {tournamentStarted
              ? "The picks are locked and the league table is live. Catch up on the rules, then follow the scores and everyone’s picks."
              : "Learn the rules, sign up, join with an invite code or create your own league, then pick one country from each pot."}
          </p>
          <div className="hero-flag-strip" aria-label="Featured country badges">
            {heroTeams.map((team) => (
              <span className="hero-flag-chip" key={team.id}>
                <TeamFlag team={team} />
                <strong>{team.code}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="lock-banner">
          <Lock size={16} />
          <span>{tournamentStarted ? "Locked · table live" : "Locks 11 Jun · 19:55 UK"}</span>
        </div>
      </div>

      <div className="panel journey-path-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">The journey</p>
            <h2>{tournamentStarted ? "From picks to live table" : "From link to locked picks"}</h2>
          </div>
          <span className="mini-badge">{tournamentStarted ? "Live now" : "4 steps"}</span>
        </div>
        <div className="journey-path-grid">
          {tournamentStarted ? (
            <>
              <article>
                <ListChecks size={18} />
                <strong>Check the table</strong>
                <small>See every entrant, their points, and the full revealed pick set.</small>
              </article>
              <article>
                <Trophy size={18} />
                <strong>Follow live matches</strong>
                <small>Scores refresh through the tournament feed as games kick off.</small>
              </article>
              <article>
                <Medal size={18} />
                <strong>Track bonuses</strong>
                <small>The highest-scoring country race is worth a single +10 swing.</small>
              </article>
              <article>
                <KeyRound size={18} />
                <strong>Share the link</strong>
                <small>Anyone can view the live league now. No new entries, no edits.</small>
              </article>
            </>
          ) : (
            <>
              <article>
                <ListChecks size={18} />
                <strong>Read rules</strong>
                <small>Know the scoring before anyone starts choosing countries.</small>
              </article>
              <article>
                <UserRound size={18} />
                <strong>Sign up</strong>
                <small>Add email and display name so the league knows who you are.</small>
              </article>
              <article>
                <KeyRound size={18} />
                <strong>Join or create</strong>
                <small>Use the group-chat code, or start a league and share the link.</small>
              </article>
              <article>
                <Trophy size={18} />
                <strong>Pick four</strong>
                <small>One from each pot, duplicates allowed across players, plus a +10 top-scorer bonus from any tournament country.</small>
              </article>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">How it works</p>
            <h2>Simple enough for kickoff</h2>
          </div>
          <span className="mini-badge">{prizePotLabel}</span>
        </div>
        <div className="rule-step-grid">
          <article className="rule-step-card">
            <ListChecks size={18} />
            <strong>Pick your four</strong>
            <small>One country from each seeded pot. Duplicate picks are allowed.</small>
          </article>
          <article className="rule-step-card">
            <Medal size={18} />
            <strong>Add the bonus pick</strong>
            <small>Choose any tournament country to finish highest-scoring for a single +10 bonus.</small>
          </article>
          <article className="rule-step-card">
            <Trophy size={18} />
            <strong>Follow the table</strong>
            <small>Your score is your four countries, match bonuses and the +10 top-scorer pick.</small>
          </article>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Points</p>
            <h2>Match scoring</h2>
          </div>
        </div>
        <div className="score-rule-grid">
          {matchRules.map((rule) => (
            <article className="score-rule-card" key={rule.label}>
              <span>{rule.label}</span>
              <strong>{formatPoints(rule.value)}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Stage bonuses</p>
            <h2>Advancement points</h2>
          </div>
        </div>
        <div className="score-rule-grid advancement">
          {advancementRules.map((rule) => (
            <article className="score-rule-card" key={rule.label}>
              <span>{rule.label}</span>
              <strong>{formatPoints(rule.value)}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Match bonuses</p>
            <h2>A little extra needle</h2>
          </div>
        </div>
        <div className="score-rule-grid advancement">
          {matchBonusRules.map((rule) => (
            <article className="score-rule-card" key={rule.label}>
              <span>{rule.label}</span>
              <strong>{formatPoints(rule.value)}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Deductions</p>
            <h2>Keep it tidy</h2>
          </div>
          <AlertTriangle size={21} />
        </div>
        <div className="score-rule-grid advancement">
          {deductionRules.map((rule) => (
            <article className="score-rule-card deduction" key={rule.label}>
              <span>{rule.label}</span>
              <strong>{formatPoints(rule.value)}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Prediction bonuses</p>
            <h2>Highest-scoring team only</h2>
          </div>
          <span className="mini-badge">+10 pts</span>
        </div>
        <div className="bonus-grid">
          {predictionCategories.map((category) => (
            <article className="bonus-card" key={category.id}>
                <Medal size={17} />
                <span>
                  <strong>{category.label}</strong>
                  <small>Correct pick banks +10 when the tournament ends</small>
                </span>
              </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Lock rules</p>
            <h2>No edits after 19:55</h2>
          </div>
        </div>
        <ul className="rules-list">
          <li>Picks and predictions stay editable until 19:55 UK, five minutes before the first match.</li>
          <li>Other players can see you have entered, but your countries and bonus pick stay hidden until kickoff.</li>
          <li>Once locked, country picks and bonus picks cannot be changed.</li>
          <li>If a country is eliminated, it keeps its earned points and stops scoring.</li>
          <li>Your entry stays alive while any of your four selected countries can still score.</li>
        </ul>
      </div>

      <button className="primary-cta" type="button" onClick={onAccept}>
        {accepted || tournamentStarted ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
        {primaryCtaLabel}
      </button>
      {canViewLeaderboard ? (
        <button className="secondary-cta" type="button" onClick={onViewLeaderboard}>
          View leaderboards
        </button>
      ) : null}
    </section>
  );
}
