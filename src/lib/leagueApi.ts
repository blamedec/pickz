import { supabasePublishableKey, supabaseUrl } from "./supabase";
import type { Entrant, LeagueApiPayload, LeagueCreateInput, PicksByPot } from "../types";

type LeagueApiAction =
  | "list-leagues"
  | "get-league"
  | "create-league"
  | "join-league"
  | "submit-entry"
  | "set-lock";

interface LeagueApiRequest {
  action: LeagueApiAction;
  identityKey: string;
  leagueId?: string;
  inviteCode?: string;
  displayName?: string;
  email?: string;
  avatarColor?: string;
  settings?: LeagueCreateInput;
  picks?: PicksByPot;
  prediction?: string;
  adminCode?: string;
  locked?: boolean;
}

interface LeagueApiListResponse {
  leagues: LeagueApiPayload[];
}

export class LeagueApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LeagueApiError";
    this.status = status;
  }
}

function assertApiConfigured() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new LeagueApiError("Supabase is not configured for this deployment.", 500);
  }
}

async function callLeagueApi<T>(body: LeagueApiRequest): Promise<T> {
  assertApiConfigured();

  const response = await fetch(`${supabaseUrl}/functions/v1/league-api`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | T | null;

  if (!response.ok) {
    throw new LeagueApiError((payload as { error?: string } | null)?.error ?? "League API request failed.", response.status);
  }

  return payload as T;
}

export async function listLeagues(identityKey: string): Promise<LeagueApiPayload[]> {
  const response = await callLeagueApi<LeagueApiListResponse>({ action: "list-leagues", identityKey });
  return response.leagues;
}

export function getLeague(identityKey: string, leagueId: string) {
  return callLeagueApi<LeagueApiPayload>({ action: "get-league", identityKey, leagueId });
}

export function getLeagueByInvite(identityKey: string, inviteCode: string) {
  return callLeagueApi<LeagueApiPayload>({ action: "get-league", identityKey, inviteCode });
}

export function createLeague(identityKey: string, settings: LeagueCreateInput, profile: { name: string; email: string; avatarColor: string }) {
  return callLeagueApi<LeagueApiPayload>({
    action: "create-league",
    identityKey,
    settings,
    displayName: profile.name,
    email: profile.email,
    avatarColor: profile.avatarColor,
  });
}

export function joinLeague(identityKey: string, inviteCode: string, profile: { name: string; email: string; avatarColor: string }) {
  return callLeagueApi<LeagueApiPayload>({
    action: "join-league",
    identityKey,
    inviteCode,
    displayName: profile.name,
    email: profile.email,
    avatarColor: profile.avatarColor,
  });
}

export function submitEntry(identityKey: string, leagueId: string, entrant: Entrant) {
  return callLeagueApi<LeagueApiPayload>({
    action: "submit-entry",
    identityKey,
    leagueId,
    displayName: entrant.name,
    avatarColor: entrant.avatarColor,
    picks: entrant.picks,
    prediction: entrant.predictions.highest_scoring_team,
  });
}

export function setLeagueLocked(identityKey: string, leagueId: string, adminCode: string, locked: boolean) {
  return callLeagueApi<LeagueApiPayload>({
    action: "set-lock",
    identityKey,
    leagueId,
    adminCode,
    locked,
  });
}
