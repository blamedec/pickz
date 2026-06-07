import type { Entrant, League, ThemeMode, UserProfile } from "../types";

const ENTRY_KEY = "pot-to-glory:v2:entry";
const THEME_KEY = "pickfour:theme";
const RULES_ACCEPTED_KEY = "pot-to-glory:v2:rules-accepted";
const LEAGUES_KEY = "pot-to-glory:v2:leagues";
const ACTIVE_LEAGUE_KEY = "pot-to-glory:v2:active-league";
const PROFILE_KEY = "pot-to-glory:v2:profile";
const LOCAL_IDENTITY_KEY = "pot-to-glory:v2:local-identity";

export function loadEntry(fallback: Entrant): Entrant {
  const raw = localStorage.getItem(ENTRY_KEY);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as Entrant;
  } catch {
    return fallback;
  }
}

export function saveEntry(entry: Entrant) {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(entry));
}

export function loadTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

export function saveTheme(theme: ThemeMode) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadRulesAccepted(): boolean {
  return localStorage.getItem(RULES_ACCEPTED_KEY) === "true";
}

export function saveRulesAccepted(accepted: boolean) {
  localStorage.setItem(RULES_ACCEPTED_KEY, String(accepted));
}

export function loadLeagues(fallback: League[] = []): League[] {
  const raw = localStorage.getItem(LEAGUES_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as League[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map((league) => ({ ...league, creatorEmail: league.creatorEmail ?? fallback[0]?.creatorEmail ?? "" }))
      : fallback;
  } catch {
    return fallback;
  }
}

export function saveLeagues(leagues: League[]) {
  localStorage.setItem(LEAGUES_KEY, JSON.stringify(leagues));
}

export function loadActiveLeagueId(fallback = ""): string {
  return localStorage.getItem(ACTIVE_LEAGUE_KEY) || fallback;
}

export function saveActiveLeagueId(leagueId: string) {
  localStorage.setItem(ACTIVE_LEAGUE_KEY, leagueId);
}

export function loadProfile(fallback: UserProfile): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return fallback;

  try {
    return { ...fallback, ...(JSON.parse(raw) as UserProfile) };
  } catch {
    return fallback;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalIdentity(): string {
  const saved = localStorage.getItem(LOCAL_IDENTITY_KEY);
  if (saved) return saved;

  const identity = crypto.randomUUID();
  localStorage.setItem(LOCAL_IDENTITY_KEY, identity);
  return identity;
}
