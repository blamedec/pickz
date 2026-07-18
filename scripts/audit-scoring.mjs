/**
 * Read-only scoring audit for PickFour production data.
 *
 * Pulls teams, matches and team_scores over the public REST API (GET only)
 * plus the league snapshot via league-api's read action, then recomputes
 * every team's score from the stored match rows using the CORRECTED rules:
 *
 *   - own goals deducted from the team whose player scored them
 *     (re-derived from each match's raw ESPN payload where available)
 *   - group-stage exits eliminated once the full round-of-32 field is known
 *   - goal-race ties treated as joint leaders for the +10
 *
 * It never writes anything. Reports:
 *   1. own-goal attribution: stored vs corrected, per match
 *   2. per-team diffs: stored team_scores vs corrected recomputation
 *   3. teams that should be eliminated but are stored as active
 *   4. the goal race, including joint leaders
 *   5. what removing the pot-gap upset bonuses would change (decision aid)
 *   6. per-entrant totals: current vs corrected, with rank moves
 *
 * Usage:
 *   node scripts/audit-scoring.mjs [--league GCHYKF] [--no-entrants]
 * Env overrides: SUPABASE_URL, SUPABASE_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://xtipajfuubqitttbrrjv.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? "sb_publishable_XEbUG3Eii5KykGQYoYqWoQ_TSaa-Zjh";
const args = process.argv.slice(2);
const INVITE_CODE = args[args.indexOf("--league") + 1] && args.includes("--league") ? args[args.indexOf("--league") + 1] : "GCHYKF";
const SKIP_ENTRANTS = args.includes("--no-entrants");

const SCORING = {
  groupWin: 3,
  groupDraw: 1,
  knockoutNormalWin: 3,
  knockoutEtPensWin: 2,
  cleanSheetBonus: 1,
  statementWinBonus: 2,
  giantSlayerBonus: 2,
  majorGiantSlayerBonus: 1,
  redCardDeduction: -2,
  ownGoalDeduction: -1,
  advanceFromGroup: 3,
  reachQuarterFinal: 5,
  reachSemiFinal: 7,
  reachFinal: 10,
  winTournament: 15,
};

const stageRank = { pre_tournament: 0, group: 1, round_of_32: 2, round_of_16: 3, quarter_final: 4, semi_final: 5, final: 6 };

// Matches the league does not count — the third-place playoff. Mirrors the
// exclusion in sync-scores / worldCupApi so the audit reflects reality.
const EXCLUDED_ESPN_MATCH_IDS = new Set([
  // "738012", // England v France third-place playoff — fill in if needed
]);
const THIRD_PLACE_PATTERN = /\b(3rd|third)\b[\s-]*place|\bbronze\b|play[\s-]?off for third/i;
function isThirdPlaceMatch(match) {
  if (EXCLUDED_ESPN_MATCH_IDS.has(match.espn_match_id)) return true;
  const season = match.raw_payload?.season ?? {};
  const notes = (match.raw_payload?.competitions?.[0]?.notes ?? []).map((note) => note?.headline ?? "").join(" ");
  return THIRD_PLACE_PATTERN.test(`${season.slug ?? ""} ${season.name ?? ""} ${notes}`);
}

async function restGet(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

/** Corrected own-goal attribution, re-derived from the raw ESPN payload. */
function reparseDiscipline(match, teamsByEspnId, teamsById) {
  const details = match.raw_payload?.competitions?.[0]?.details;
  if (!Array.isArray(details)) return null; // no evidence stored; keep DB values

  const homeEspnId = teamsById.get(match.home_team_id)?.espn_id;
  const awayEspnId = teamsById.get(match.away_team_id)?.espn_id;
  if (!homeEspnId || !awayEspnId) return null;

  const result = { homeRedCards: 0, awayRedCards: 0, homeOwnGoals: 0, awayOwnGoals: 0 };
  for (const detail of details) {
    if (detail.redCard) {
      if (detail.team?.id === homeEspnId) result.homeRedCards += 1;
      if (detail.team?.id === awayEspnId) result.awayRedCards += 1;
    }
    if (detail.ownGoal) {
      // ESPN credits the own-goal play to the side that benefits.
      if (detail.team?.id === homeEspnId) result.awayOwnGoals += 1;
      if (detail.team?.id === awayEspnId) result.homeOwnGoals += 1;
    }
  }
  return result;
}

function calculateGiantSlayer(won, teamPot, opponentPot, config = SCORING) {
  if (!won || teamPot < 3 || opponentPot > 2) return 0;
  return config.giantSlayerBonus + (teamPot - opponentPot >= 2 ? config.majorGiantSlayerBonus : 0);
}

function calculateStageBonus(stage) {
  switch (stage) {
    case "round_of_32":
    case "round_of_16":
      return SCORING.advanceFromGroup;
    case "quarter_final":
      return SCORING.reachQuarterFinal;
    case "semi_final":
      return SCORING.reachSemiFinal;
    case "final":
      return SCORING.reachFinal;
    default:
      return 0;
  }
}

/** Port of the fixed sync-scores rebuild, fed by DB match rows. */
function rebuildScores(teams, allMatches, { withGiantSlayer = true } = {}) {
  const config = withGiantSlayer ? SCORING : { ...SCORING, giantSlayerBonus: 0, majorGiantSlayerBonus: 0 };
  const matches = allMatches.filter((match) => !isThirdPlaceMatch(match));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const scores = new Map(
    teams.map((team) => [
      team.id,
      { team_id: team.id, points: 0, match_points: 0, giant_slayer_points: 0, own_goals: 0, red_cards: 0, goals_for: 0, status: "active", stage_reached: "pre_tournament" },
    ]),
  );
  const reached = new Map();
  const knockoutParticipants = new Set();
  const r32Participants = new Set();
  const championIds = new Set();

  const markStage = (teamId, stage) => {
    const current = reached.get(teamId) ?? "pre_tournament";
    if (stageRank[stage] > stageRank[current]) reached.set(teamId, stage);
  };

  for (const match of matches) {
    if (match.stage === "group") continue;
    for (const teamId of [match.home_team_id, match.away_team_id]) {
      if (!teamId) continue;
      knockoutParticipants.add(teamId);
      if (match.stage === "round_of_32") r32Participants.add(teamId);
    }
  }

  const ordered = [...matches].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  for (const match of ordered) {
    if (!match.home_team_id || !match.away_team_id) continue;
    const home = scores.get(match.home_team_id);
    const away = scores.get(match.away_team_id);
    const homeTeam = teamsById.get(match.home_team_id);
    const awayTeam = teamsById.get(match.away_team_id);
    if (!home || !away || !homeTeam || !awayTeam) continue;

    if (match.stage !== "group") {
      markStage(match.home_team_id, match.stage);
      markStage(match.away_team_id, match.stage);
    }
    if (match.status !== "completed") continue;
    if (match.stage === "group") {
      markStage(match.home_team_id, "group");
      markStage(match.away_team_id, "group");
    }

    const homeWon = match.winner_team_id === match.home_team_id || (!match.winner_team_id && match.home_score > match.away_score);
    const awayWon = match.winner_team_id === match.away_team_id || (!match.winner_team_id && match.away_score > match.home_score);
    const winMethod = match.win_method ?? (match.stage !== "group" && match.home_score === match.away_score ? "penalties" : "normal");

    for (const [side, mine, theirs, won, pot, oppPot] of [
      ["home", home, away, homeWon, homeTeam.pot, awayTeam.pot],
      ["away", away, home, awayWon, awayTeam.pot, homeTeam.pot],
    ]) {
      const myScore = side === "home" ? match.home_score : match.away_score;
      const theirScore = side === "home" ? match.away_score : match.home_score;
      const redCards = side === "home" ? match.audit_home_red_cards : match.audit_away_red_cards;
      const ownGoals = side === "home" ? match.audit_home_own_goals : match.audit_away_own_goals;

      let points = 0;
      if (match.stage === "group") {
        if (myScore > theirScore) points += config.groupWin;
        if (myScore === theirScore) points += config.groupDraw;
      } else if (won) {
        points += winMethod === "normal" ? config.knockoutNormalWin : config.knockoutEtPensWin;
      }
      if (theirScore === 0) points += config.cleanSheetBonus;
      const wonMatch = match.stage === "group" ? myScore > theirScore : won;
      if (wonMatch && myScore - theirScore >= 3) points += config.statementWinBonus;
      const slayer = calculateGiantSlayer(wonMatch, pot, oppPot, config);
      points += slayer;
      points += redCards * config.redCardDeduction + ownGoals * config.ownGoalDeduction;

      mine.points += points;
      mine.match_points += points;
      mine.giant_slayer_points += slayer;
      mine.goals_for += myScore;
      mine.own_goals += ownGoals;
      mine.red_cards += redCards;
    }

    if (match.stage === "final" && match.winner_team_id) championIds.add(match.winner_team_id);
    if (match.stage !== "group" && match.winner_team_id) {
      const loserId = match.winner_team_id === match.home_team_id ? match.away_team_id : match.home_team_id;
      const loser = scores.get(loserId);
      if (loser) loser.status = "eliminated";
    }
  }

  const knockoutFieldKnown = r32Participants.size >= 32;
  for (const score of scores.values()) {
    const stageReached = reached.get(score.team_id) ?? "pre_tournament";
    score.stage_reached = stageReached;
    score.points += calculateStageBonus(stageReached);
    if (knockoutFieldKnown && score.status === "active" && !knockoutParticipants.has(score.team_id)) {
      score.status = "eliminated";
    }
    if (championIds.has(score.team_id)) {
      score.status = "champion";
      score.points += SCORING.winTournament;
    }
  }

  return { scores, knockoutFieldKnown, r32Count: r32Participants.size };
}

function label(teamsById, id) {
  return teamsById.get(id)?.short_name ?? id ?? "?";
}

async function main() {
  console.log(`PickFour scoring audit — ${SUPABASE_URL} (read-only)\n`);

  const [teams, matches, storedScores] = await Promise.all([
    restGet("teams?select=id,espn_id,name,short_name,code,group_letter,pot"),
    restGet("matches?select=*&order=starts_at.asc"),
    restGet("team_scores?select=*"),
  ]);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const teamsByEspnId = new Map(teams.map((team) => [team.espn_id, team]));
  const storedByTeam = new Map(storedScores.map((row) => [row.team_id, row]));
  console.log(`teams: ${teams.length} · matches: ${matches.length} (${matches.filter((m) => m.status === "completed").length} completed) · team_scores: ${storedScores.length}\n`);

  // ---- 0. exclusion check: is the third-place playoff being kept out? ------
  console.log("== 0. Third-place / excluded matches ==");
  const finals = matches.filter((m) => m.stage === "final");
  const thirdPlace = matches.filter(isThirdPlaceMatch);
  for (const match of finals) {
    const flagged = isThirdPlaceMatch(match);
    console.log(
      `  stage=final  id=${match.espn_match_id}  ${label(teamsById, match.home_team_id)} v ${label(teamsById, match.away_team_id)}  (${match.starts_at?.slice(0, 10)}, ${match.status})` +
        `${flagged ? "  <- detected as THIRD-PLACE, will be excluded" : "  <- treated as THE FINAL (crowns champion)"}`,
    );
  }
  for (const match of thirdPlace) {
    console.log(`  excluded: id=${match.espn_match_id}  ${label(teamsById, match.home_team_id)} v ${label(teamsById, match.away_team_id)}  (${match.starts_at?.slice(0, 10)}, ${match.status})`);
  }
  const realFinals = finals.filter((match) => !isThirdPlaceMatch(match));
  if (realFinals.length > 1) {
    console.log("  !! More than one match still classed as THE FINAL — add the third-place id to EXCLUDED_ESPN_MATCH_IDS in sync-scores + worldCupApi + this script.");
  }
  console.log(`--> ${thirdPlace.length} match(es) kept out of scoring; ${realFinals.length} real final(s) remaining.\n`);

  // ---- 1. own-goal attribution --------------------------------------------
  console.log("== 1. Own-goal attribution (stored vs corrected) ==");
  let ownGoalIssues = 0;
  for (const match of matches) {
    const reparsed = reparseDiscipline(match, teamsByEspnId, teamsById);
    match.audit_home_red_cards = reparsed ? reparsed.homeRedCards : match.home_red_cards ?? 0;
    match.audit_away_red_cards = reparsed ? reparsed.awayRedCards : match.away_red_cards ?? 0;
    match.audit_home_own_goals = reparsed ? reparsed.homeOwnGoals : match.home_own_goals ?? 0;
    match.audit_away_own_goals = reparsed ? reparsed.awayOwnGoals : match.away_own_goals ?? 0;

    const storedOg = (match.home_own_goals ?? 0) + (match.away_own_goals ?? 0);
    const auditOg = match.audit_home_own_goals + match.audit_away_own_goals;
    if (storedOg === 0 && auditOg === 0) continue;

    const matchLabel = `${label(teamsById, match.home_team_id)} ${match.home_score}-${match.away_score} ${label(teamsById, match.away_team_id)} (${match.starts_at?.slice(0, 10)})`;
    const stored = `stored: ${label(teamsById, match.home_team_id)} ${match.home_own_goals ?? 0} / ${label(teamsById, match.away_team_id)} ${match.away_own_goals ?? 0}`;
    const corrected = reparsed
      ? `corrected: ${label(teamsById, match.home_team_id)} ${match.audit_home_own_goals} / ${label(teamsById, match.away_team_id)} ${match.audit_away_own_goals}`
      : "corrected: (no raw details stored — needs a manual check)";
    const changed = reparsed && (match.audit_home_own_goals !== (match.home_own_goals ?? 0) || match.audit_away_own_goals !== (match.away_own_goals ?? 0));
    if (changed) ownGoalIssues += 1;
    console.log(`${changed ? "✗" : "·"} ${matchLabel}\n    ${stored} · ${corrected}`);
  }
  console.log(ownGoalIssues > 0 ? `--> ${ownGoalIssues} match(es) have own goals on the wrong team.\n` : "--> no own-goal discrepancies detectable from stored payloads.\n");

  // ---- 2 + 3. recompute and diff -------------------------------------------
  const { scores: rebuilt, knockoutFieldKnown, r32Count } = rebuildScores(teams, matches);

  console.log("== 2. Team score diffs (stored vs corrected recomputation) ==");
  let diffs = 0;
  for (const team of [...teams].sort((a, b) => a.name.localeCompare(b.name))) {
    const stored = storedByTeam.get(team.id);
    const fresh = rebuilt.get(team.id);
    if (!stored || !fresh) continue;
    const fields = [
      ["points", stored.points ?? 0, fresh.points],
      ["own_goals", stored.own_goals ?? 0, fresh.own_goals],
      ["goals_for", stored.goals_for ?? 0, fresh.goals_for],
      ["status", stored.status ?? "active", fresh.status],
    ].filter(([, a, b]) => a !== b);
    if (fields.length === 0) continue;
    diffs += 1;
    console.log(`✗ ${team.short_name}: ${fields.map(([name, a, b]) => `${name} ${a} -> ${b}`).join(" · ")}`);
  }
  console.log(diffs > 0 ? `--> ${diffs} team(s) will change when the fixed sync runs.\n` : "--> stored team_scores already match the corrected rules.\n");

  console.log("== 3. Eliminations ==");
  console.log(`round-of-32 field: ${r32Count}/32 known -> group-stage elimination ${knockoutFieldKnown ? "ACTIVE" : "waiting (field not complete yet)"}`);
  const shouldBeOut = [...rebuilt.values()].filter((score) => score.status === "eliminated" && (storedByTeam.get(score.team_id)?.status ?? "active") === "active");
  for (const score of shouldBeOut) console.log(`✗ ${label(teamsById, score.team_id)} should be eliminated (stored: active)`);
  console.log(shouldBeOut.length === 0 ? "--> no missing eliminations.\n" : `--> ${shouldBeOut.length} team(s) missing elimination.\n`);

  // ---- 4. goal race ---------------------------------------------------------
  console.log("== 4. Goal race (corrected) ==");
  const race = [...rebuilt.values()].sort((a, b) => b.goals_for - a.goals_for).slice(0, 6);
  const topGoals = race[0]?.goals_for ?? 0;
  for (const row of race) {
    console.log(`${row.goals_for === topGoals && topGoals > 0 ? "*" : " "} ${label(teamsById, row.team_id)} — ${row.goals_for} goals`);
  }
  const jointLeaders = race.filter((row) => row.goals_for === topGoals && topGoals > 0);
  console.log(`--> ${jointLeaders.length > 1 ? `JOINT leaders: ${jointLeaders.map((row) => label(teamsById, row.team_id)).join(" & ")} (all their backers get the +10)` : `leader: ${label(teamsById, race[0]?.team_id)}`}\n`);

  // ---- 5. pot-gap upset impact ---------------------------------------------
  console.log("== 5. Pot-gap upset bonus (decision aid: what removing it changes) ==");
  const { scores: withoutSlayer } = rebuildScores(teams, matches, { withGiantSlayer: false });
  const slayerTeams = [...rebuilt.values()].filter((score) => score.giant_slayer_points > 0);
  for (const score of slayerTeams) {
    console.log(`  ${label(teamsById, score.team_id)}: +${score.giant_slayer_points} from upsets (would drop ${score.points} -> ${withoutSlayer.get(score.team_id).points})`);
  }
  console.log(slayerTeams.length === 0 ? "  (no team has earned it yet)\n" : "");

  // ---- 6. entrant impact ----------------------------------------------------
  if (!SKIP_ENTRANTS) {
    console.log(`== 6. Entrant impact (league ${INVITE_CODE}) ==`);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/league-api`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-league", identityKey: "scoring-audit-readonly", inviteCode: INVITE_CODE }),
      });
      if (!response.ok) throw new Error(`league-api -> ${response.status}`);
      const payload = await response.json();
      const entrants = payload.entrants ?? [];

      const jointLeaderNames = jointLeaders.map((row) => teamsById.get(row.team_id)?.name).filter(Boolean);
      const tournamentDecided = [...rebuilt.values()].some((score) => score.status === "champion");
      const totalFor = (entrant, useStored) => {
        const country = Object.values(entrant.picks ?? {}).reduce((total, teamId) => {
          if (!teamId) return total;
          const row = useStored ? storedByTeam.get(teamId) : rebuilt.get(teamId);
          return total + (row?.points ?? 0);
        }, 0);
        const onTrack = jointLeaderNames.includes(entrant.predictions?.highest_scoring_team);
        // Stored view mirrors what users currently see (live +10 in totals);
        // corrected view banks the +10 only once the tournament is decided.
        const bonus = useStored ? (onTrack ? 10 : 0) : tournamentDecided && onTrack ? 10 : 0;
        return { country, onTrack, total: country + bonus };
      };

      const rows = entrants.map((entrant) => ({
        name: entrant.name,
        stored: totalFor(entrant, true),
        corrected: totalFor(entrant, false),
      }));
      const rank = (list, key) => [...list].sort((a, b) => b[key].total - a[key].total);
      const storedOrder = rank(rows, "stored").map((row) => row.name);
      const correctedOrder = rank(rows, "corrected").map((row) => row.name);

      for (const row of rank(rows, "corrected")) {
        const moved = storedOrder.indexOf(row.name) - correctedOrder.indexOf(row.name);
        const delta = row.corrected.total - row.stored.total;
        console.log(
          `  ${String(correctedOrder.indexOf(row.name) + 1).padStart(2)}. ${row.name.padEnd(18)} ${String(row.corrected.total).padStart(4)} pts` +
            `${delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}${row.corrected.onTrack && !tournamentDecided ? " [+10 on track]" : ""}${moved !== 0 ? ` [${moved > 0 ? "up" : "down"} ${Math.abs(moved)}]` : ""}`,
        );
      }
      console.log("  (corrected totals = banked points only; the +10 banks at the end — 'on track' marks current race leaders' backers)");
    } catch (error) {
      console.log(`  entrant impact unavailable: ${error.message}`);
    }
  }

  console.log("\nAudit complete. Nothing was written.");
}

await main();
