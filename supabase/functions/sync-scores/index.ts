import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";
const ESPN_SCOREBOARD_BY_DAY_URL = (dateCode: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateCode}&limit=80`;
const ESPN_SUMMARY_URL = (eventId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
const FOCUSED_SCOREBOARD_DAYS = [-1, 0, 1, 2];
const SUMMARY_FETCH_BEFORE_MS = 30 * 60 * 1000;
const SUMMARY_FETCH_AFTER_MS = 5 * 60 * 60 * 1000;

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

type MatchStage = "group" | "round_of_32" | "round_of_16" | "quarter_final" | "semi_final" | "final";
type TeamStatus = "active" | "eliminated" | "champion";

type TeamRow = {
  id: string;
  espn_id: string;
  name: string;
  short_name: string;
  code: string;
  group_letter: string;
  pot: number;
};

type EspnCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
  };
};

type EspnDetail = {
  redCard?: boolean;
  ownGoal?: boolean;
  team?: { id?: string };
};

type EspnEvent = {
  id?: string;
  date?: string;
  season?: { slug?: string; name?: string };
  competitions?: Array<{
    date?: string;
    status?: { displayClock?: string; type?: { name?: string; completed?: boolean; state?: string } };
    competitors?: EspnCompetitor[];
    details?: EspnDetail[];
    notes?: Array<{ headline?: string }>;
  }>;
};

type EspnStatus = NonNullable<NonNullable<EspnEvent["competitions"]>[number]["status"]>;

type Discipline = {
  homeRedCards: number;
  awayRedCards: number;
  homeOwnGoals: number;
  awayOwnGoals: number;
};

type ParsedMatch = {
  espn_match_id: string;
  stage: MatchStage;
  group_letter: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  winner_team_id: string | null;
  win_method: "normal" | "extra_time" | "penalties" | null;
  starts_at: string;
  status: "scheduled" | "live" | "completed";
  home_red_cards: number;
  away_red_cards: number;
  home_own_goals: number;
  away_own_goals: number;
  raw_payload: EspnEvent;
  processed_at: string | null;
  updated_at: string;
};

type ScoreAccumulator = {
  team_id: string;
  points: number;
  table_points: number;
  match_points: number;
  clean_sheet_bonus_points: number;
  statement_win_bonus_points: number;
  giant_slayer_bonus_points: number;
  major_giant_slayer_bonus_points: number;
  red_cards: number;
  own_goals: number;
  red_card_deduction_points: number;
  own_goal_deduction_points: number;
  discipline_deduction_points: number;
  stage_bonus_points: number;
  champion_bonus_points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  status: TeamStatus;
  stage_reached: MatchStage | "pre_tournament";
  last_update: string;
  updated_at: string;
};

type SupabaseClient = ReturnType<typeof createClient>;

type LeagueRow = {
  id: string;
};

type EntrantRow = {
  id: string;
  league_id: string;
  display_name: string;
};

type PickRow = {
  entrant_id: string;
  league_id: string;
  team_id: string;
  pot: number;
};

type PredictionRow = {
  entrant_id: string;
  pick_value: string;
  category: string;
};

type SnapshotRow = {
  entrant_id: string;
  country_points: number;
  prediction_points: number;
  total_points: number;
  active_teams: number;
  rank: number;
};

const stageRank: Record<ScoreAccumulator["stage_reached"], number> = {
  pre_tournament: 0,
  group: 1,
  round_of_32: 2,
  round_of_16: 3,
  quarter_final: 4,
  semi_final: 5,
  final: 6,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expectedToken = Deno.env.get("SYNC_SCORES_TOKEN");
  const authHeader = request.headers.get("Authorization") ?? "";

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Missing Supabase environment" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, espn_id, name, short_name, code, group_letter, pot");

  if (teamsError) {
    return Response.json({ error: "Could not load teams", detail: teamsError.message }, { status: 500, headers: corsHeaders });
  }

  const teamRows = (teams ?? []) as TeamRow[];
  const teamByEspnId = new Map(teamRows.map((team) => [team.espn_id, team]));

  let events: EspnEvent[];
  try {
    events = await fetchMergedEspnEvents();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("ESPN fetch failed", { error: detail });
    return Response.json({ error: "ESPN fetch failed", detail }, { status: 502, headers: corsHeaders });
  }

  const parsedMatches = events.flatMap((event) => parseEspnEvent(event, teamByEspnId));

  for (const match of parsedMatches) {
    const { error } = await supabase.from("matches").upsert(match, {
      onConflict: "espn_match_id",
    });

    if (error) {
      console.error("match upsert failed", { espnMatchId: match.espn_match_id, error });
    }
  }

  const scoreRows = rebuildScores(teamRows, parsedMatches);
  const { error: scoreError } = await supabase.from("team_scores").upsert(
    scoreRows.map((score) => ({
      ...score,
      stage_reached: score.stage_reached === "pre_tournament" ? null : score.stage_reached,
    })),
    { onConflict: "team_id" },
  );

  if (scoreError) {
    return Response.json({ error: "Score rebuild failed", detail: scoreError.message }, { status: 500, headers: corsHeaders });
  }

  // Joint leaders share the goal race: a tie at the top must not hand the
  // +10 to whichever team happens to sort first.
  const topGoals = Math.max(0, ...scoreRows.map((score) => score.goals_for));
  const predictionLeaders =
    topGoals > 0
      ? scoreRows
          .filter((score) => score.goals_for === topGoals)
          .map((score) => teamRows.find((team) => team.id === score.team_id)?.name)
          .filter((name): name is string => Boolean(name))
          .sort()
      : [];

  if (predictionLeaders.length > 0) {
    const { error: leaderError } = await supabase.from("stat_leaders").upsert(
      {
        category: "highest_scoring_team",
        leader_value: predictionLeaders.join(" & "),
        metric_value: topGoals,
        source: "espn_sync",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "category" },
    );

    if (leaderError) {
      console.error("stat leader upsert failed", leaderError);
    }
  }

  let snapshotSummary: { inserted: number; leagues: number; error?: string } = { inserted: 0, leagues: 0 };
  try {
    snapshotSummary = await snapshotLeaderboards(supabase, scoreRows, predictionLeaders);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    snapshotSummary = { inserted: 0, leagues: 0, error: detail };
    console.error("leaderboard snapshot failed", { error: detail });
  }

  return Response.json(
    {
      ok: true,
      fetched: events.length,
      parsed: parsedMatches.length,
      completed: parsedMatches.filter((match) => match.status === "completed").length,
      score_rows: scoreRows.length,
      leaderboard_snapshots: snapshotSummary,
      synced_at: new Date().toISOString(),
    },
    { headers: corsHeaders },
  );
});

async function snapshotLeaderboards(supabase: SupabaseClient, scoreRows: ScoreAccumulator[], predictionLeaders: string[]) {
  const [leagueResult, entrantResult, pickResult, predictionResult, snapshotResult] = await Promise.all([
    supabase.from("leagues").select("id"),
    supabase.from("entrants").select("id, league_id, display_name"),
    supabase.from("team_picks").select("entrant_id, league_id, team_id, pot"),
    supabase.from("prediction_picks").select("entrant_id, pick_value, category").eq("category", "highest_scoring_team"),
    supabase
      .from("leaderboard_snapshots")
      .select("entrant_id, country_points, prediction_points, total_points, active_teams, rank")
      .order("snapshotted_at", { ascending: false })
      .limit(5000),
  ]);

  if (leagueResult.error) throw new Error(leagueResult.error.message);
  if (entrantResult.error) throw new Error(entrantResult.error.message);
  if (pickResult.error) throw new Error(pickResult.error.message);
  if (predictionResult.error) throw new Error(predictionResult.error.message);
  if (snapshotResult.error) throw new Error(snapshotResult.error.message);

  // The +10 banks only once the tournament is decided; until then leaderboard
  // totals carry banked country points only (the app shows "on track" separately).
  const tournamentDecided = scoreRows.some((score) => score.status === "champion");
  const scoresByTeam = new Map(scoreRows.map((score) => [score.team_id, score]));
  const entrantsByLeague = new Map<string, EntrantRow[]>();
  const picksByEntrant = new Map<string, string[]>();
  const predictionByEntrant = new Map<string, string>();
  const latestSnapshotByEntrant = new Map<string, SnapshotRow>();

  for (const entrant of (entrantResult.data ?? []) as EntrantRow[]) {
    entrantsByLeague.set(entrant.league_id, [...(entrantsByLeague.get(entrant.league_id) ?? []), entrant]);
  }

  for (const pick of (pickResult.data ?? []) as PickRow[]) {
    picksByEntrant.set(pick.entrant_id, [...(picksByEntrant.get(pick.entrant_id) ?? []), pick.team_id]);
  }

  for (const prediction of (predictionResult.data ?? []) as PredictionRow[]) {
    predictionByEntrant.set(prediction.entrant_id, prediction.pick_value);
  }

  for (const snapshot of (snapshotResult.data ?? []) as SnapshotRow[]) {
    if (!latestSnapshotByEntrant.has(snapshot.entrant_id)) {
      latestSnapshotByEntrant.set(snapshot.entrant_id, snapshot);
    }
  }

  const inserts: Array<{
    league_id: string;
    entrant_id: string;
    country_points: number;
    prediction_points: number;
    total_points: number;
    active_teams: number;
    rank: number;
  }> = [];

  for (const league of (leagueResult.data ?? []) as LeagueRow[]) {
    const leagueEntrants = entrantsByLeague.get(league.id) ?? [];
    const rows = leagueEntrants
      .map((entrant) => {
        const teamIds = picksByEntrant.get(entrant.id) ?? [];
        const countryPoints = teamIds.reduce((total, teamId) => total + (scoresByTeam.get(teamId)?.points ?? 0), 0);
        const entrantPrediction = predictionByEntrant.get(entrant.id);
        const predictionPoints = tournamentDecided && entrantPrediction && predictionLeaders.includes(entrantPrediction) ? 10 : 0;
        const activeTeams = teamIds.filter((teamId) => {
          const status = scoresByTeam.get(teamId)?.status ?? "active";
          return status === "active" || status === "champion";
        }).length;

        return {
          league_id: league.id,
          entrant_id: entrant.id,
          displayName: entrant.display_name,
          country_points: countryPoints,
          prediction_points: predictionPoints,
          total_points: countryPoints + predictionPoints,
          active_teams: activeTeams,
          rank: 0,
        };
      })
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.active_teams !== a.active_teams) return b.active_teams - a.active_teams;
        if (b.country_points !== a.country_points) return b.country_points - a.country_points;
        return a.displayName.localeCompare(b.displayName);
      });

    let currentRank = 0;
    rows.forEach((row, index) => {
      const previous = rows[index - 1];
      const tiedWithPrevious = Boolean(
        previous &&
          previous.total_points === row.total_points &&
          previous.active_teams === row.active_teams &&
          previous.country_points === row.country_points &&
          previous.prediction_points === row.prediction_points,
      );
      if (!tiedWithPrevious) currentRank = index + 1;
      row.rank = currentRank;

      const latest = latestSnapshotByEntrant.get(row.entrant_id);
      const changed =
        !latest ||
        latest.rank !== row.rank ||
        latest.total_points !== row.total_points ||
        latest.country_points !== row.country_points ||
        latest.prediction_points !== row.prediction_points ||
        latest.active_teams !== row.active_teams;

      if (changed) {
        inserts.push({
          league_id: row.league_id,
          entrant_id: row.entrant_id,
          country_points: row.country_points,
          prediction_points: row.prediction_points,
          total_points: row.total_points,
          active_teams: row.active_teams,
          rank: row.rank,
        });
      }
    });
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("leaderboard_snapshots").insert(inserts);
    if (error) throw new Error(error.message);
  }

  return { inserted: inserts.length, leagues: ((leagueResult.data ?? []) as LeagueRow[]).length };
}

async function fetchMergedEspnEvents() {
  const tournamentResponse = await fetch(ESPN_SCOREBOARD_URL);
  if (!tournamentResponse.ok) {
    throw new Error(`Tournament scoreboard returned ${tournamentResponse.status}`);
  }

  const tournamentPayload = (await tournamentResponse.json()) as { events?: EspnEvent[] };
  const eventGroups = [tournamentPayload.events ?? []];

  const focusedEventGroups = await Promise.all(
    focusedScoreboardUrls(new Date()).map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error("focused ESPN fetch failed", { url, status: response.status });
          return [];
        }

        const payload = (await response.json()) as { events?: EspnEvent[] };
        return payload.events ?? [];
      } catch (error) {
        console.error("focused ESPN fetch error", { url, error });
        return [];
      }
    }),
  );

  eventGroups.push(...focusedEventGroups);

  const merged = new Map<string, EspnEvent>();
  for (const event of eventGroups.flat()) {
    if (!event.id) continue;
    merged.set(event.id, event);
  }

  await mergeSummaryEvents(merged, new Date());

  return [...merged.values()];
}

function focusedScoreboardUrls(now: Date) {
  return FOCUSED_SCOREBOARD_DAYS.map((offset) => ESPN_SCOREBOARD_BY_DAY_URL(formatEspnDateCode(addUtcDays(now, offset))));
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatEspnDateCode(value: Date) {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

async function mergeSummaryEvents(eventsById: Map<string, EspnEvent>, now: Date) {
  const currentEvents = [...eventsById.values()].filter((event) => shouldFetchSummary(event, now));

  await Promise.all(
    currentEvents.map(async (event) => {
      if (!event.id) return;

      try {
        const response = await fetch(ESPN_SUMMARY_URL(event.id));
        if (!response.ok) {
          console.error("ESPN summary fetch failed", { eventId: event.id, status: response.status });
          return;
        }

        const payload = (await response.json()) as { header?: EspnEvent };
        if (!payload.header?.id) return;

        eventsById.set(payload.header.id, normalizeSummaryHeader(payload.header));
      } catch (error) {
        console.error("ESPN summary fetch error", { eventId: event.id, error });
      }
    }),
  );
}

function shouldFetchSummary(event: EspnEvent, now: Date) {
  const status = event.competitions?.[0]?.status?.type;
  if (status?.state === "in" || status?.completed) return true;

  const startsAt = event.date ?? event.competitions?.[0]?.date;
  if (!startsAt) return false;

  const deltaMs = now.getTime() - new Date(startsAt).getTime();
  return deltaMs >= -SUMMARY_FETCH_BEFORE_MS && deltaMs <= SUMMARY_FETCH_AFTER_MS;
}

function normalizeSummaryHeader(header: EspnEvent): EspnEvent {
  return {
    ...header,
    date: header.date ?? header.competitions?.[0]?.date,
  };
}

// Goals-only matches — the third-place playoff. Their GOALS still feed the
// highest-scoring-team (+10) race, but they award no PickFour points, do not
// move the table, and can never crown a champion. Belt-and-braces: an
// explicit ESPN event id forces goals-only if keyword detection ever misses.
// Add the id from `node scripts/audit-scoring.mjs` §0.
const GOALS_ONLY_MATCH_IDS = new Set<string>([
  // "738012", // England v France third-place playoff — fill in if needed
]);

// ESPN often labels the third-place match "3rd Place" / "3rd Place Final"
// (note the trailing "Final" — the trap this must catch before stage code).
const THIRD_PLACE_PATTERN = /\b(3rd|third)\b[\s-]*place|\bbronze\b|play[\s-]?off for third/i;

function eventLabelText(event: EspnEvent): string {
  const notes = (event.competitions?.[0]?.notes ?? []).map((note) => note?.headline ?? "").join(" ");
  return `${event.season?.slug ?? ""} ${event.season?.name ?? ""} ${notes}`;
}

function isThirdPlacePlayoff(event: EspnEvent): boolean {
  return THIRD_PLACE_PATTERN.test(eventLabelText(event));
}

function isGoalsOnlyMatch(match: ParsedMatch): boolean {
  return GOALS_ONLY_MATCH_IDS.has(match.espn_match_id) || isThirdPlacePlayoff(match.raw_payload);
}

function parseEspnEvent(event: EspnEvent, teamByEspnId: Map<string, TeamRow>): ParsedMatch[] {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === "home") ?? competitors[0];
  const away = competitors.find((competitor) => competitor.homeAway === "away") ?? competitors.find((competitor) => competitor !== home);

  const startsAt = event.date ?? competition?.date;

  if (!event.id || !startsAt || !home?.team?.id || !away?.team?.id) {
    return [];
  }

  const homeTeam = teamByEspnId.get(home.team.id) ?? null;
  const awayTeam = teamByEspnId.get(away.team.id) ?? null;
  const homeScore = Number.parseInt(home.score ?? "0", 10) || 0;
  const awayScore = Number.parseInt(away.score ?? "0", 10) || 0;
  const status = statusFromEspn(competition?.status);
  const stage = stageFromSeason(event.season);
  const discipline = parseDiscipline(competition?.details, home.team.id, away.team.id);
  const winnerTeamId = getWinnerTeamId(home, away, homeTeam, awayTeam, homeScore, awayScore);

  return [
    {
      espn_match_id: event.id,
      stage,
      group_letter: stage === "group" ? homeTeam?.group_letter ?? awayTeam?.group_letter ?? null : null,
      home_team_id: homeTeam?.id ?? null,
      away_team_id: awayTeam?.id ?? null,
      home_score: homeScore,
      away_score: awayScore,
      winner_team_id: status === "completed" ? winnerTeamId : null,
      win_method: stage !== "group" && status === "completed" && winnerTeamId ? (homeScore === awayScore ? "penalties" : "normal") : null,
      starts_at: startsAt,
      status,
      home_red_cards: discipline.homeRedCards,
      away_red_cards: discipline.awayRedCards,
      home_own_goals: discipline.homeOwnGoals,
      away_own_goals: discipline.awayOwnGoals,
      raw_payload: event,
      processed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
  ];
}

function statusFromEspn(status?: EspnStatus): ParsedMatch["status"] {
  if (status?.type?.completed) return "completed";
  if (status?.type?.state === "in" || status?.type?.name === "STATUS_IN_PROGRESS") return "live";
  return "scheduled";
}

function stageFromSeason(season?: EspnEvent["season"]): MatchStage {
  const value = `${season?.slug ?? ""} ${season?.name ?? ""}`.toLowerCase();

  // Safety net: a third-place playoff must never fall through to "final"
  // (its label can literally read "3rd Place Final") and crown a champion.
  if (THIRD_PLACE_PATTERN.test(value)) return "semi_final";
  if (value.includes("round-of-32") || value.includes("round of 32")) return "round_of_32";
  if (value.includes("round-of-16") || value.includes("round of 16")) return "round_of_16";
  if (value.includes("quarterfinal") || value.includes("quarter-final") || value.includes("quarter final")) return "quarter_final";
  if (value.includes("semifinal") || value.includes("semi-final") || value.includes("semi final")) return "semi_final";
  if (value.includes("final")) return "final";

  return "group";
}

function emptyDiscipline(): Discipline {
  return {
    homeRedCards: 0,
    awayRedCards: 0,
    homeOwnGoals: 0,
    awayOwnGoals: 0,
  };
}

function parseDiscipline(details: EspnDetail[] | undefined, homeEspnId: string, awayEspnId: string) {
  const discipline = emptyDiscipline();

  for (const detail of details ?? []) {
    if (detail.redCard) {
      if (detail.team?.id === homeEspnId) discipline.homeRedCards += 1;
      if (detail.team?.id === awayEspnId) discipline.awayRedCards += 1;
    }

    if (detail.ownGoal) {
      // ESPN credits an own-goal scoring play to the side that benefits, so
      // the -1 belongs to the OTHER side — the team whose player scored it.
      if (detail.team?.id === homeEspnId) discipline.awayOwnGoals += 1;
      if (detail.team?.id === awayEspnId) discipline.homeOwnGoals += 1;
    }
  }

  return discipline;
}

function getWinnerTeamId(
  home: EspnCompetitor,
  away: EspnCompetitor,
  homeTeam: TeamRow | null,
  awayTeam: TeamRow | null,
  homeScore: number,
  awayScore: number,
) {
  if (home.winner) return homeTeam?.id ?? null;
  if (away.winner) return awayTeam?.id ?? null;
  if (homeScore > awayScore) return homeTeam?.id ?? null;
  if (awayScore > homeScore) return awayTeam?.id ?? null;
  return null;
}

function rebuildScores(teams: TeamRow[], matches: ParsedMatch[]) {
  const scores = new Map<string, ScoreAccumulator>(
    teams.map((team) => [
      team.id,
      {
        team_id: team.id,
        points: 0,
        table_points: 0,
        match_points: 0,
        clean_sheet_bonus_points: 0,
        statement_win_bonus_points: 0,
        giant_slayer_bonus_points: 0,
        major_giant_slayer_bonus_points: 0,
        red_cards: 0,
        own_goals: 0,
        red_card_deduction_points: 0,
        own_goal_deduction_points: 0,
        discipline_deduction_points: 0,
        stage_bonus_points: 0,
        champion_bonus_points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        clean_sheets: 0,
        status: "active",
        stage_reached: "pre_tournament",
        last_update: "Pre-tournament",
        updated_at: new Date().toISOString(),
      },
    ]),
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const reachedStageByTeam = new Map<string, ScoreAccumulator["stage_reached"]>();
  const championTeamIds = new Set<string>();
  const knockoutParticipantIds = new Set<string>();
  const roundOf32ParticipantIds = new Set<string>();

  for (const match of matches) {
    if (match.stage === "group" || isGoalsOnlyMatch(match)) continue;
    for (const teamId of [match.home_team_id, match.away_team_id]) {
      if (!teamId) continue;
      knockoutParticipantIds.add(teamId);
      if (match.stage === "round_of_32") roundOf32ParticipantIds.add(teamId);
    }
  }

  function markStage(teamId: string, stage: ScoreAccumulator["stage_reached"]) {
    const current = reachedStageByTeam.get(teamId) ?? "pre_tournament";
    if (stageRank[stage] > stageRank[current]) {
      reachedStageByTeam.set(teamId, stage);
    }
  }

  for (const match of matches.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())) {
    if (!match.home_team_id || !match.away_team_id) continue;

    const home = scores.get(match.home_team_id);
    const away = scores.get(match.away_team_id);
    const homeTeam = teamsById.get(match.home_team_id);
    const awayTeam = teamsById.get(match.away_team_id);
    if (!home || !away || !homeTeam || !awayTeam) continue;

    // Goals-only match (third-place playoff): its goals feed the +10 race,
    // but it earns no points, no table movement, no stage/elimination/champion.
    if (isGoalsOnlyMatch(match)) {
      if (match.status === "completed") {
        home.goals_for += match.home_score;
        home.goals_against += match.away_score;
        away.goals_for += match.away_score;
        away.goals_against += match.home_score;
      }
      continue;
    }

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
    const homeGiantSlayerBonus = calculateGiantSlayerBonus(homeWon, homeTeam.pot, awayTeam.pot);
    const awayGiantSlayerBonus = calculateGiantSlayerBonus(awayWon, awayTeam.pot, homeTeam.pot);
    const homeDisciplinePoints = match.home_red_cards * SCORING.redCardDeduction + match.home_own_goals * SCORING.ownGoalDeduction;
    const awayDisciplinePoints = match.away_red_cards * SCORING.redCardDeduction + match.away_own_goals * SCORING.ownGoalDeduction;
    const homePoints = calculateMatchPoints({
      stage: match.stage,
      teamScore: match.home_score,
      opponentScore: match.away_score,
      advanced: homeWon,
      winMethod,
      teamPot: homeTeam.pot,
      opponentPot: awayTeam.pot,
      redCards: match.home_red_cards,
      ownGoals: match.home_own_goals,
    });
    const awayPoints = calculateMatchPoints({
      stage: match.stage,
      teamScore: match.away_score,
      opponentScore: match.home_score,
      advanced: awayWon,
      winMethod,
      teamPot: awayTeam.pot,
      opponentPot: homeTeam.pot,
      redCards: match.away_red_cards,
      ownGoals: match.away_own_goals,
    });

    home.points += homePoints;
    away.points += awayPoints;
    home.match_points += homePoints;
    away.match_points += awayPoints;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;
    home.red_cards += match.home_red_cards;
    away.red_cards += match.away_red_cards;
    home.own_goals += match.home_own_goals;
    away.own_goals += match.away_own_goals;
    home.red_card_deduction_points += match.home_red_cards * SCORING.redCardDeduction;
    away.red_card_deduction_points += match.away_red_cards * SCORING.redCardDeduction;
    home.own_goal_deduction_points += match.home_own_goals * SCORING.ownGoalDeduction;
    away.own_goal_deduction_points += match.away_own_goals * SCORING.ownGoalDeduction;
    home.discipline_deduction_points += homeDisciplinePoints;
    away.discipline_deduction_points += awayDisciplinePoints;

    if (match.away_score === 0) {
      home.clean_sheets += 1;
      home.clean_sheet_bonus_points += SCORING.cleanSheetBonus;
    }
    if (match.home_score === 0) {
      away.clean_sheets += 1;
      away.clean_sheet_bonus_points += SCORING.cleanSheetBonus;
    }
    if (homeWon && match.home_score - match.away_score >= 3) {
      home.statement_win_bonus_points += SCORING.statementWinBonus;
    }
    if (awayWon && match.away_score - match.home_score >= 3) {
      away.statement_win_bonus_points += SCORING.statementWinBonus;
    }
    if (homeGiantSlayerBonus > 0) {
      home.giant_slayer_bonus_points += SCORING.giantSlayerBonus;
      home.major_giant_slayer_bonus_points += homeGiantSlayerBonus - SCORING.giantSlayerBonus;
    }
    if (awayGiantSlayerBonus > 0) {
      away.giant_slayer_bonus_points += SCORING.giantSlayerBonus;
      away.major_giant_slayer_bonus_points += awayGiantSlayerBonus - SCORING.giantSlayerBonus;
    }

    if (match.home_score > match.away_score) {
      home.table_points += 3;
      home.wins += 1;
      away.losses += 1;
    } else if (match.home_score < match.away_score) {
      away.table_points += 3;
      away.wins += 1;
      home.losses += 1;
    } else if (match.stage === "group") {
      home.table_points += 1;
      away.table_points += 1;
      home.draws += 1;
      away.draws += 1;
    } else {
      if (homeWon) {
        home.wins += 1;
        away.losses += 1;
      } else if (awayWon) {
        away.wins += 1;
        home.losses += 1;
      }
    }

    home.last_update = `Last result: ${homeTeam.short_name} ${match.home_score}-${match.away_score} ${awayTeam.short_name}`;
    away.last_update = home.last_update;

    if (match.stage === "final" && match.winner_team_id) {
      championTeamIds.add(match.winner_team_id);
    }
    if (match.stage !== "group" && match.winner_team_id) {
      const loserId = match.winner_team_id === match.home_team_id ? match.away_team_id : match.home_team_id;
      const loser = scores.get(loserId);
      if (loser) loser.status = "eliminated";
    }
  }

  // Group-stage exits: once the full round-of-32 field is known, any team
  // that appears in no knockout tie is out of the tournament.
  const knockoutFieldKnown = roundOf32ParticipantIds.size >= 32;

  for (const score of scores.values()) {
    const stageReached = reachedStageByTeam.get(score.team_id) ?? score.stage_reached;
    score.stage_reached = stageReached;
    score.stage_bonus_points = calculateStageBonus(stageReached);
    score.points += score.stage_bonus_points;

    if (knockoutFieldKnown && score.status === "active" && !knockoutParticipantIds.has(score.team_id)) {
      score.status = "eliminated";
      score.last_update = "Out at the group stage";
    }

    if (championTeamIds.has(score.team_id)) {
      score.status = "champion";
      score.champion_bonus_points = SCORING.winTournament;
      score.points += score.champion_bonus_points;
      score.last_update = "Champion bonus confirmed";
    }
  }

  return [...scores.values()];
}

function calculateMatchPoints(match: {
  stage: MatchStage;
  teamScore: number;
  opponentScore: number;
  winMethod: "normal" | "extra_time" | "penalties";
  advanced: boolean;
  teamPot: number;
  opponentPot: number;
  redCards: number;
  ownGoals: number;
}) {
  const wonMatch = match.stage === "group" ? match.teamScore > match.opponentScore : match.advanced;
  let points = 0;

  if (match.stage === "group") {
    if (match.teamScore > match.opponentScore) points += SCORING.groupWin;
    if (match.teamScore === match.opponentScore) points += SCORING.groupDraw;
  } else if (match.advanced) {
    points += match.winMethod === "normal" ? SCORING.knockoutNormalWin : SCORING.knockoutEtPensWin;
  }

  if (match.opponentScore === 0) points += SCORING.cleanSheetBonus;
  if (wonMatch && match.teamScore - match.opponentScore >= 3) points += SCORING.statementWinBonus;
  points += calculateGiantSlayerBonus(wonMatch, match.teamPot, match.opponentPot);
  points += match.redCards * SCORING.redCardDeduction + match.ownGoals * SCORING.ownGoalDeduction;

  return points;
}

function calculateGiantSlayerBonus(wonMatch: boolean, teamPot: number, opponentPot: number) {
  if (!wonMatch || teamPot < 3 || opponentPot > 2) return 0;
  return SCORING.giantSlayerBonus + (teamPot - opponentPot >= 2 ? SCORING.majorGiantSlayerBonus : 0);
}

function calculateStageBonus(stage: ScoreAccumulator["stage_reached"]) {
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
