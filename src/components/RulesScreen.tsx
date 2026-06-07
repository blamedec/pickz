import { CheckCircle2, ListChecks, Lock, Medal, Sparkles, Trophy } from "lucide-react";
import { predictionCategories } from "../data/demo";
import { defaultScoringConfig } from "../lib/scoring";

interface RulesScreenProps {
  prizePotLabel: string;
  accepted: boolean;
  onAccept: () => void;
  onViewLeaderboard: () => void;
}

const matchRules = [
  { label: "Group-stage win", value: defaultScoringConfig.groupWin },
  { label: "Group-stage draw", value: defaultScoringConfig.groupDraw },
  { label: "Group-stage loss", value: 0 },
  { label: "Knockout normal-time win", value: defaultScoringConfig.knockoutNormalWin },
  { label: "Knockout ET or penalties win", value: defaultScoringConfig.knockoutEtPensWin },
];

const milestoneRules = [
  { label: "Advance from group", value: defaultScoringConfig.advanceFromGroup },
  { label: "Reach quarter-final", value: defaultScoringConfig.reachQuarterFinal },
  { label: "Reach semi-final", value: defaultScoringConfig.reachSemiFinal },
  { label: "Reach final", value: defaultScoringConfig.reachFinal },
  { label: "Win tournament", value: defaultScoringConfig.winTournament },
];

export function RulesScreen({ prizePotLabel, accepted, onAccept, onViewLeaderboard }: RulesScreenProps) {
  return (
    <section className="screen-stack">
      <div className="hero-panel rules-hero">
        <div className="broadcast-strap">
          <span>Rules first</span>
          <span>{accepted ? "Cleared" : "Before picks"}</span>
        </div>
        <div className="hero-copy">
          <p className="section-kicker">Pot To Glory</p>
          <h1>Rules at a glance.</h1>
          <p>
            Pick four countries, choose one bonus team, then follow the points live through the tournament.
          </p>
        </div>
        <div className="lock-banner">
          <Lock size={16} />
          <span>Locks 11 Jun · 20:00 UK</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">How it works</p>
            <h2>Three things to know</h2>
          </div>
          <span className="mini-badge">{prizePotLabel}</span>
        </div>
        <div className="rule-step-grid">
          <article className="rule-step-card">
            <ListChecks size={18} />
            <strong>Pick 4 teams</strong>
            <small>One country from each seeded pot. Duplicate picks are allowed.</small>
          </article>
          <article className="rule-step-card">
            <Medal size={18} />
            <strong>Add bonus</strong>
            <small>Choose the highest-scoring team for a single +10 bonus.</small>
          </article>
          <article className="rule-step-card">
            <Trophy size={18} />
            <strong>Track live</strong>
            <small>Your score is your four countries plus bonus points.</small>
          </article>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Points</p>
            <h2>Match points</h2>
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
            <p className="section-kicker">Progress</p>
            <h2>Deep runs matter</h2>
          </div>
        </div>
        <div className="score-rule-grid compact">
          {milestoneRules.map((rule) => (
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

      <button className="primary-cta" type="button" onClick={onAccept}>
        {accepted ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
        {accepted ? "Rules accepted, start picking" : "I understand, start picking"}
      </button>
      <button className="secondary-cta" type="button" onClick={onViewLeaderboard}>
        View leaderboards
      </button>
    </section>
  );
}
