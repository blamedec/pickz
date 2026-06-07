import { CheckCircle2, KeyRound, ListChecks, Lock, Medal, Sparkles, Trophy, UserRound } from "lucide-react";
import { predictionCategories } from "../data/predictions";
import { maybeGetTeam } from "../data/teams";
import { defaultScoringConfig } from "../lib/scoring";
import { TeamFlag } from "./TeamFlag";

interface RulesScreenProps {
  prizePotLabel: string;
  accepted: boolean;
  canViewLeaderboard: boolean;
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

const advancementRules = [
  { label: "Advance from group", value: defaultScoringConfig.advanceFromGroup },
  { label: "Reach quarter-final", value: defaultScoringConfig.reachQuarterFinal },
  { label: "Reach semi-final", value: defaultScoringConfig.reachSemiFinal },
  { label: "Reach final", value: defaultScoringConfig.reachFinal },
  { label: "Win tournament", value: defaultScoringConfig.winTournament },
];

const heroTeamIds = ["eng", "jpn", "nor", "gha", "bra", "arg"];

export function RulesScreen({ prizePotLabel, accepted, canViewLeaderboard, onAccept, onViewLeaderboard }: RulesScreenProps) {
  const heroTeams = heroTeamIds.flatMap((teamId) => {
    const team = maybeGetTeam(teamId);
    return team ? [team] : [];
  });

  return (
    <section className="screen-stack">
      <div className="hero-panel rules-hero">
        <div className="broadcast-strap">
          <span>Rules first</span>
          <span>{accepted ? "Cleared" : "Before picks"}</span>
        </div>
        <div className="hero-copy">
          <p className="section-kicker">PickFour</p>
          <h1>Four picks. No lucky dip.</h1>
          <p>
            Learn the rules, sign up, join with an invite code or create your own tournament, then pull four country slips from the hat.
          </p>
          <div className="hero-flag-strip" aria-label="Featured country slips">
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
          <span>Locks 11 Jun · 20:00 UK</span>
        </div>
      </div>

      <div className="panel journey-path-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">The journey</p>
            <h2>From link to locked picks</h2>
          </div>
          <span className="mini-badge">4 steps</span>
        </div>
        <div className="journey-path-grid">
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
            <small>Use the group-chat code, or start a tournament and share the link.</small>
          </article>
          <article>
            <Trophy size={18} />
            <strong>Pick four</strong>
            <small>One from each pot, duplicates allowed, plus the +10 top-scorer bonus.</small>
          </article>
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
            <strong>Add the bonus slip</strong>
            <small>Choose the highest-scoring team for a single +10 bonus.</small>
          </article>
          <article className="rule-step-card">
            <Trophy size={18} />
            <strong>Follow the table</strong>
            <small>Your score is your four countries plus any bonus points.</small>
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
              <strong>+{rule.value}</strong>
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
              <strong>+{rule.value}</strong>
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
                  <small>Correct team adds +10</small>
                </span>
              </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Lock rules</p>
            <h2>No edits after kickoff</h2>
          </div>
        </div>
        <ul className="rules-list">
          <li>Picks and predictions stay editable until the first World Cup match starts.</li>
          <li>Once locked, country picks and bonus picks cannot be changed.</li>
          <li>If a country is eliminated, it keeps its earned points and stops scoring.</li>
          <li>Your entry stays alive while any of your four selected countries can still score.</li>
        </ul>
      </div>

      <div className="panel disclaimer-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Unofficial fantasy project</p>
            <h2>Fan-made and independent</h2>
          </div>
        </div>
        <p className="helper-copy">
          PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup,
          tournament organisers, broadcasters, or national associations.
        </p>
      </div>

      <button className="primary-cta" type="button" onClick={onAccept}>
        {accepted ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
        {accepted ? "Continue to league setup" : "I get it - join or create"}
      </button>
      {canViewLeaderboard ? (
        <button className="secondary-cta" type="button" onClick={onViewLeaderboard}>
          View leaderboards
        </button>
      ) : null}
    </section>
  );
}
