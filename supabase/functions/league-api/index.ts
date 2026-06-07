import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const LOCK_TIME_ISO = "2026-06-11T19:00:00.000Z";
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const AVATAR_COLORS = ["#e71d36", "#1f7a4d", "#0c3b73", "#f2b705", "#7c3aed", "#0891b2", "#f97316"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Connection": "keep-alive",
};

type Pot = 1 | 2 | 3 | 4;
type PicksByPot = Record<Pot, string | null>;

type LeagueAction =
  | "list-leagues"
  | "get-league"
  | "create-league"
  | "join-league"
  | "submit-entry"
  | "set-lock";

type LeagueRequest = {
  action?: LeagueAction;
  identityKey?: string;
  leagueId?: string;
  inviteCode?: string;
  displayName?: string;
  email?: string;
  avatarColor?: string;
  settings?: {
    name?: string;
    entryFeePence?: number;
    inviteOpen?: boolean;
    maxEntrants?: number | null;
  };
  picks?: PicksByPot;
  prediction?: string;
  adminCode?: string;
  locked?: boolean;
};

type SupabaseClient = ReturnType<typeof createClient>;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase service environment." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = (await request.json()) as LeagueRequest;
    const identityHash = await getIdentityHash(body.identityKey);

    switch (body.action) {
      case "list-leagues":
        return json({ leagues: await listLeagues(supabase, identityHash) });
      case "get-league":
        return json(await getLeaguePayload(supabase, identityHash, body));
      case "create-league":
        return json(await createLeague(supabase, identityHash, body), 201);
      case "join-league":
        return json(await joinLeague(supabase, identityHash, body));
      case "submit-entry":
        return json(await submitEntry(supabase, identityHash, body));
      case "set-lock":
        return json(await setLock(supabase, identityHash, body));
      default:
        return json({ error: "Unknown league action." }, 400);
    }
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected API error.";
    console.error("league-api error", { status, message });
    return json({ error: message }, status);
  }
});

async function listLeagues(supabase: SupabaseClient, identityHash: string) {
  const { data: entrants, error: entrantError } = await supabase
    .from("entrants")
    .select("league_id")
    .eq("local_identity_hash", identityHash);

  if (entrantError) throw new ApiError(entrantError.message, 500);

  const leagueIds = [...new Set((entrants ?? []).map((entrant) => entrant.league_id as string))];
  const payloads = [];

  for (const leagueId of leagueIds) {
    payloads.push(await getLeaguePayload(supabase, identityHash, { leagueId }));
  }

  return payloads;
}

async function createLeague(supabase: SupabaseClient, identityHash: string, body: LeagueRequest) {
  const settings = body.settings ?? {};
  const name = cleanLeagueName(settings.name);
  const entryFeePence = Math.max(0, Math.round(settings.entryFeePence ?? 0));
  const maxEntrants = settings.maxEntrants === null ? null : Math.max(1, Math.round(settings.maxEntrants ?? 30));
  const adminCode = createCode(14);
  const adminCodeHash = await sha256(adminCode);

  let insertedLeague: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const inviteCode = createCode(6);
    const { data, error } = await supabase
      .from("leagues")
      .insert({
        name,
        invite_code: inviteCode,
        admin_code_hash: adminCodeHash,
        creator_email: cleanEmail(body.email),
        entry_fee_pence: entryFeePence,
        prize_pot: `${entryFeePence}`,
        invite_open: settings.inviteOpen ?? true,
        max_entrants: settings.inviteOpen === false ? maxEntrants : settings.maxEntrants === null ? null : maxEntrants,
        lock_time: LOCK_TIME_ISO,
        picks_locked: false,
      })
      .select("*")
      .single();

    if (!error) {
      insertedLeague = data;
      break;
    }

    if (error.code !== "23505") throw new ApiError(error.message, 500);
  }

  if (!insertedLeague) throw new ApiError("Could not generate a unique invite code.", 500);

  await upsertEntrant(supabase, insertedLeague.id as string, identityHash, body);
  return { ...(await getLeaguePayload(supabase, identityHash, { leagueId: insertedLeague.id as string })), adminCode };
}

async function joinLeague(supabase: SupabaseClient, identityHash: string, body: LeagueRequest) {
  const league = await findLeague(supabase, body);

  const { count: existingCount, error: countError } = await supabase
    .from("entrants")
    .select("id", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (countError) throw new ApiError(countError.message, 500);

  const { data: existingEntrant, error: existingError } = await supabase
    .from("entrants")
    .select("id")
    .eq("league_id", league.id)
    .eq("local_identity_hash", identityHash)
    .maybeSingle();

  if (existingError) throw new ApiError(existingError.message, 500);
  if (!existingEntrant && league.max_entrants !== null && (existingCount ?? 0) >= league.max_entrants) {
    throw new ApiError("This league is full.", 409);
  }

  await upsertEntrant(supabase, league.id as string, identityHash, body);
  return getLeaguePayload(supabase, identityHash, { leagueId: league.id as string });
}

async function submitEntry(supabase: SupabaseClient, identityHash: string, body: LeagueRequest) {
  const league = await findLeague(supabase, body);
  if (league.picks_locked || Date.now() >= new Date(league.lock_time as string).getTime()) {
    throw new ApiError("Picks are locked for this league.", 423);
  }

  const picks = validatePicks(body.picks);
  await validatePickPots(supabase, picks);
  const prediction = await validatePrediction(supabase, body.prediction);
  const entrant = await upsertEntrant(supabase, league.id as string, identityHash, body);

  const pickRows = ([1, 2, 3, 4] as Pot[]).map((pot) => ({
    entrant_id: entrant.id,
    league_id: league.id,
    team_id: picks[pot],
    pot,
    updated_at: new Date().toISOString(),
  }));

  const { error: pickError } = await supabase.from("team_picks").upsert(pickRows, {
    onConflict: "entrant_id,pot",
  });

  if (pickError) throw new ApiError(pickError.message, 500);

  const { error: predictionError } = await supabase.from("prediction_picks").upsert(
    {
      entrant_id: entrant.id,
      league_id: league.id,
      category: "highest_scoring_team",
      pick_value: prediction,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entrant_id,category" },
  );

  if (predictionError) throw new ApiError(predictionError.message, 500);

  return getLeaguePayload(supabase, identityHash, { leagueId: league.id as string });
}

async function setLock(supabase: SupabaseClient, identityHash: string, body: LeagueRequest) {
  const league = await findLeague(supabase, body);
  const suppliedHash = await sha256(body.adminCode ?? "");
  if (suppliedHash !== league.admin_code_hash) {
    throw new ApiError("Only the league organiser can change lock status.", 403);
  }

  const { error } = await supabase
    .from("leagues")
    .update({ picks_locked: body.locked === true, updated_at: new Date().toISOString() })
    .eq("id", league.id);

  if (error) throw new ApiError(error.message, 500);

  return getLeaguePayload(supabase, identityHash, { leagueId: league.id as string });
}

async function getLeaguePayload(supabase: SupabaseClient, identityHash: string, body: LeagueRequest) {
  const league = await findLeague(supabase, body);

  const { data: entrants, error: entrantsError } = await supabase
    .from("entrants")
    .select("id, display_name, avatar_color, local_identity_hash")
    .eq("league_id", league.id)
    .order("created_at", { ascending: true });

  if (entrantsError) throw new ApiError(entrantsError.message, 500);

  const entrantIds = (entrants ?? []).map((entrant) => entrant.id as string);
  const { data: picks, error: picksError } = entrantIds.length
    ? await supabase.from("team_picks").select("entrant_id, team_id, pot").in("entrant_id", entrantIds)
    : { data: [], error: null };

  if (picksError) throw new ApiError(picksError.message, 500);

  const { data: predictions, error: predictionError } = entrantIds.length
    ? await supabase.from("prediction_picks").select("entrant_id, pick_value, category").in("entrant_id", entrantIds)
    : { data: [], error: null };

  if (predictionError) throw new ApiError(predictionError.message, 500);

  const picksByEntrant = new Map<string, PicksByPot>();
  const predictionsByEntrant = new Map<string, string>();

  for (const entrant of entrants ?? []) {
    picksByEntrant.set(entrant.id as string, { 1: null, 2: null, 3: null, 4: null });
  }

  for (const pick of picks ?? []) {
    const pot = pick.pot as Pot;
    const entrantPicks = picksByEntrant.get(pick.entrant_id as string);
    if (entrantPicks && pot >= 1 && pot <= 4) entrantPicks[pot] = pick.team_id as string;
  }

  for (const prediction of predictions ?? []) {
    if (prediction.category === "highest_scoring_team") {
      predictionsByEntrant.set(prediction.entrant_id as string, prediction.pick_value as string);
    }
  }

  const mappedEntrants = (entrants ?? []).map((entrant) => ({
    id: entrant.id as string,
    name: entrant.display_name as string,
    avatarColor: entrant.avatar_color as string,
    picks: picksByEntrant.get(entrant.id as string) ?? { 1: null, 2: null, 3: null, 4: null },
    predictions: {
      highest_scoring_team: predictionsByEntrant.get(entrant.id as string) ?? "",
    },
  }));

  const currentEntrant = (entrants ?? []).find((entrant) => entrant.local_identity_hash === identityHash);

  return {
    league: mapLeague(league),
    entrants: mappedEntrants,
    currentEntrantId: (currentEntrant?.id as string | undefined) ?? null,
  };
}

async function findLeague(supabase: SupabaseClient, body: LeagueRequest) {
  const query = supabase.from("leagues").select("*");
  const { data, error } = body.leagueId
    ? await query.eq("id", body.leagueId).single()
    : await query.eq("invite_code", normalizeInviteCode(body.inviteCode)).single();

  if (error) throw new ApiError("League not found.", 404);
  return data as Record<string, unknown>;
}

async function upsertEntrant(supabase: SupabaseClient, leagueId: string, identityHash: string, body: LeagueRequest) {
  const { data, error } = await supabase
    .from("entrants")
    .upsert(
      {
        league_id: leagueId,
        local_identity_hash: identityHash,
        display_name: cleanDisplayName(body.displayName),
        avatar_color: cleanColor(body.avatarColor),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id,local_identity_hash" },
    )
    .select("id")
    .single();

  if (error) throw new ApiError(error.message, 500);
  return data as { id: string };
}

function validatePicks(picks?: PicksByPot): Record<Pot, string> {
  if (!picks || !picks[1] || !picks[2] || !picks[3] || !picks[4]) {
    throw new ApiError("Pick exactly one team from each pot.", 400);
  }

  return {
    1: picks[1],
    2: picks[2],
    3: picks[3],
    4: picks[4],
  };
}

async function validatePickPots(supabase: SupabaseClient, picks: Record<Pot, string>) {
  const teamIds = Object.values(picks);
  const { data, error } = await supabase.from("teams").select("id, pot").in("id", teamIds);

  if (error) throw new ApiError(error.message, 500);

  const potByTeamId = new Map((data ?? []).map((team) => [team.id as string, team.pot as number]));
  for (const pot of [1, 2, 3, 4] as Pot[]) {
    if (potByTeamId.get(picks[pot]) !== pot) {
      throw new ApiError(`Pot ${pot} pick is invalid.`, 400);
    }
  }
}

async function validatePrediction(supabase: SupabaseClient, prediction?: string) {
  const value = (prediction ?? "").trim();
  if (!value) throw new ApiError("Choose a highest-scoring team bonus pick.", 400);

  const { data, error } = await supabase
    .from("teams")
    .select("name")
    .or(`id.eq.${escapeFilterValue(value)},name.eq.${escapeFilterValue(value)}`)
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500);
  if (!data) throw new ApiError("Bonus team is not recognised.", 400);
  return data.name as string;
}

async function getIdentityHash(identityKey?: string) {
  const clean = (identityKey ?? "").trim();
  if (clean.length < 16) throw new ApiError("Missing player identity.", 400);
  return sha256(clean);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createCode(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

function normalizeInviteCode(value?: string) {
  const clean = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{4,12}$/.test(clean)) throw new ApiError("Invite code is invalid.", 400);
  return clean;
}

function cleanLeagueName(value?: string) {
  const clean = (value ?? "").trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 120) throw new ApiError("League name must be 2-120 characters.", 400);
  return clean;
}

function cleanDisplayName(value?: string) {
  const clean = (value ?? "Player").trim().replace(/\s+/g, " ").slice(0, 60);
  return clean.length >= 2 ? clean : "Player";
}

function cleanEmail(value?: string) {
  return (value ?? "").trim().toLowerCase().slice(0, 254);
}

function cleanColor(value?: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value! : AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function mapLeague(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    inviteCode: row.invite_code as string,
    creatorEmail: (row.creator_email as string | null) ?? "",
    entryFeePence: row.entry_fee_pence as number,
    prizePot: row.prize_pot as string,
    inviteOpen: row.invite_open as boolean,
    maxEntrants: row.max_entrants as number | null,
    lockTimeIso: row.lock_time as string,
    locked: row.picks_locked as boolean,
  };
}

function escapeFilterValue(value: string) {
  return value.replace(/["'(),]/g, "");
}

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: corsHeaders,
  });
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
