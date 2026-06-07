import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav, type AppTab } from "./components/BottomNav";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { LeagueScreen } from "./components/LeagueScreen";
import { LiveScreen } from "./components/LiveScreen";
import { PicksScreen } from "./components/PicksScreen";
import { RulesScreen } from "./components/RulesScreen";
import { correctPredictions, demoEntrants, demoLeague, demoProfile, demoTeamScores, globalLeaderboardRows, liveEvents } from "./data/demo";
import { getTeamsByPot } from "./data/teams";
import { getPrizePotLabel } from "./lib/money";
import { buildLeaderboard, canEditPicks } from "./lib/scoring";
import {
  loadActiveLeagueId,
  loadEntry,
  loadLeagues,
  loadProfile,
  loadRulesAccepted,
  loadTheme,
  saveActiveLeagueId,
  saveEntry,
  saveLeagues,
  saveProfile,
  saveRulesAccepted,
  saveTheme,
} from "./lib/storage";
import { demoMode, supabase } from "./lib/supabase";
import type { Entrant, League, LeagueCreateInput, Pot, PredictionCategory, ThemeMode, UserProfile } from "./types";

function leagueIdFromName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "new-cup-league";
}

function ownerForInviteCode(inviteCode: string) {
  return `host-${inviteCode.toLowerCase()}@pottoglory.app`;
}

function leagueFromInviteCode(inviteCode: string, fallback: League): League {
  const code = inviteCode.trim().toUpperCase() || fallback.inviteCode;

  return {
    ...fallback,
    id: `joined-${code.toLowerCase()}`,
    name: `League ${code}`,
    inviteCode: code,
    creatorEmail: ownerForInviteCode(code),
    prizePot: "£0 pot",
    entryFeePence: 0,
    inviteOpen: true,
    maxEntrants: null,
    locked: false,
  };
}

function hashString(value: string) {
  return value.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

function rotateTeamId(teamId: string, pot: Pot, shift: number) {
  const potTeams = getTeamsByPot(pot);
  const index = potTeams.findIndex((team) => team.id === teamId);
  const nextIndex = index < 0 ? shift % potTeams.length : (index + shift) % potTeams.length;
  return potTeams[nextIndex].id;
}

function buildEntrantsForLeague(league: League, entry: Entrant, profile: UserProfile): Entrant[] {
  const seed = hashString(league.id);
  const rivals = demoEntrants.filter((entrant) => entrant.id !== entry.id);
  const names = ["Nina R", "Mo", "Caitlin", "Ade", "Sofia", "Ben", "Priya", "Ollie", "Maya"];
  const activeEntry = { ...entry, name: profile.name || entry.name };

  if (league.id === demoLeague.id) {
    return [activeEntry, ...rivals];
  }

  const leagueRivals = rivals.map((entrant, index) => {
    const shift = (seed + index) % 5;
    return {
      ...entrant,
      id: `${league.id}-${entrant.id}`,
      name: names[index % names.length],
      picks: {
        1: rotateTeamId(entrant.picks[1], 1, shift),
        2: rotateTeamId(entrant.picks[2], 2, shift),
        3: rotateTeamId(entrant.picks[3], 3, shift),
        4: rotateTeamId(entrant.picks[4], 4, shift),
      },
    };
  });

  return [activeEntry, ...leagueRivals];
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [rulesAccepted, setRulesAccepted] = useState(() => loadRulesAccepted());
  const [activeTab, setActiveTab] = useState<AppTab>(() => (loadRulesAccepted() ? "picks" : "rules"));
  const [selectedPot, setSelectedPot] = useState<Pot>(1);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(demoProfile));
  const [leagues, setLeagues] = useState<League[]>(() => loadLeagues([demoLeague]));
  const [activeLeagueId, setActiveLeagueId] = useState(() => loadActiveLeagueId(demoLeague.id));
  const [entry, setEntry] = useState<Entrant>(() => loadEntry(demoEntrants[0]));
  const [confirmed, setConfirmed] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const league = useMemo(() => leagues.find((item) => item.id === activeLeagueId) ?? leagues[0] ?? demoLeague, [activeLeagueId, leagues]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveEntry(entry);
  }, [entry]);

  useEffect(() => {
    saveRulesAccepted(rulesAccepted);
  }, [rulesAccepted]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveLeagues(leagues);
  }, [leagues]);

  useEffect(() => {
    saveActiveLeagueId(league.id);
  }, [league.id]);

  useEffect(() => {
    if (!supabase || demoMode) return;

    let active = true;
    const applySessionProfile = (email?: string, id?: string) => {
      if (!email || !id || !active) return;

      setProfile((current) => ({
        ...current,
        id,
        email,
        name: current.email === email ? current.name : email.split("@")[0] || current.name,
      }));
    };

    supabase.auth.getSession().then(({ data }) => {
      applySessionProfile(data.session?.user.email, data.session?.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionProfile(session?.user.email, session?.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  const entrants = useMemo(() => buildEntrantsForLeague(league, entry, profile), [entry, league, profile]);
  const leaderboard = useMemo(() => buildLeaderboard(entrants, demoTeamScores, correctPredictions), [entrants]);
  const prizePotLabel = useMemo(() => getPrizePotLabel(league, entrants.length), [entrants.length, league]);
  const editable = rulesAccepted && canEditPicks(new Date(), league.lockTimeIso) && !league.locked;
  const isLeagueCreator = profile.role === "creator" && league.creatorEmail === profile.email;

  function pickTeam(pot: Pot, teamId: string) {
    if (!editable) return;
    setEntry((current) => ({ ...current, picks: { ...current.picks, [pot]: teamId } }));
  }

  function updatePrediction(category: PredictionCategory, value: string) {
    if (!editable) return;
    setEntry((current) => ({ ...current, predictions: { ...current.predictions, [category]: value } }));
  }

  function confirmPicks() {
    setConfirmed(true);
    window.setTimeout(() => setConfirmed(false), 1800);
  }

  function acceptRules() {
    setRulesAccepted(true);
    setActiveTab("picks");
  }

  function upsertLeague(nextLeague: League) {
    setLeagues((current) => {
      const exists = current.some((item) => item.id === nextLeague.id);
      return exists ? current.map((item) => (item.id === nextLeague.id ? nextLeague : item)) : [...current, nextLeague];
    });
    setActiveLeagueId(nextLeague.id);
  }

  function joinLeague(inviteCode: string) {
    upsertLeague(leagueFromInviteCode(inviteCode, demoLeague));
  }

  function toggleActiveLeagueLocked() {
    setLeagues((current) => current.map((item) => (item.id === league.id ? { ...item, locked: !item.locked } : item)));
  }

  function changeTab(tab: AppTab) {
    if (tab === "picks" && !rulesAccepted) {
      setActiveTab("rules");
      return;
    }
    setActiveTab(tab);
  }

  function renderScreen() {
    switch (activeTab) {
      case "rules":
        return (
          <RulesScreen
            prizePotLabel={prizePotLabel}
            accepted={rulesAccepted}
            onAccept={acceptRules}
            onViewLeaderboard={() => setActiveTab("table")}
          />
        );
      case "picks":
        return (
          <PicksScreen
            entry={entry}
            league={league}
            prizePotLabel={prizePotLabel}
            rulesAccepted={rulesAccepted}
            selectedPot={selectedPot}
            onSelectPot={setSelectedPot}
            onPickTeam={pickTeam}
            onPrediction={updatePrediction}
            onConfirm={confirmPicks}
          />
        );
      case "live":
        return (
          <LiveScreen
            entry={entry}
            scores={demoTeamScores}
            leaderboard={leaderboard}
            liveEvents={liveEvents}
            locked={league.locked}
            onToggleLocked={toggleActiveLeagueLocked}
          />
        );
      case "table":
        return <LeaderboardScreen rows={leaderboard} entrants={entrants} globalRows={globalLeaderboardRows} />;
      case "league":
        return (
          <LeagueScreen
            league={league}
            leagues={leagues}
            activeLeagueId={league.id}
            entrants={entrants}
            profile={profile}
            isLeagueCreator={isLeagueCreator}
            prizePotLabel={prizePotLabel}
            onSelectLeague={setActiveLeagueId}
            onProfileChange={setProfile}
            onCreateLeague={(settings: LeagueCreateInput) => {
              const newLeague = {
                ...demoLeague,
                id: leagueIdFromName(settings.name),
                name: settings.name,
                creatorEmail: profile.email,
                entryFeePence: settings.entryFeePence,
                prizePot: getPrizePotLabel({ ...demoLeague, entryFeePence: settings.entryFeePence }, entrants.length),
                inviteOpen: settings.inviteOpen,
                maxEntrants: settings.maxEntrants,
                inviteCode: "GLORY4",
                locked: false,
              };
              upsertLeague(newLeague);
            }}
            onJoinLeague={joinLeague}
            onToggleLocked={toggleActiveLeagueLocked}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <div className="phone-frame">
        <AppHeader
          league={league}
          leagues={leagues}
          activeLeagueId={league.id}
          profile={profile}
          prizePotLabel={prizePotLabel}
          theme={theme}
          onSelectLeague={setActiveLeagueId}
          onJoinLeague={joinLeague}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        />

        <main className="app-main" ref={mainRef}>
          {confirmed ? (
            <div className="toast-burst" role="status">
              Picks saved. The group chat has been notified.
            </div>
          ) : null}
          {renderScreen()}
        </main>

        <BottomNav active={activeTab} rulesAccepted={rulesAccepted} onChange={changeTab} />
      </div>
      <aside className="desktop-preview" aria-label="Desktop dashboard preview">
        <div className="desktop-card top">
          <span>Pot To Glory HQ</span>
          <strong>{leaderboard[0]?.entrant.name} leads by {leaderboard[0]?.totalPoints - leaderboard[1]?.totalPoints} pts</strong>
        </div>
        <div className="desktop-card chart">
          {leaderboard.slice(0, 5).map((row) => (
            <span key={row.entrant.id} style={{ height: `${Math.max(28, row.totalPoints * 3)}px`, background: row.entrant.avatarColor }} />
          ))}
        </div>
        <div className="desktop-card ticker">
          <strong>Live straps</strong>
          <small>England +3 · Brazil bonus · Ghana out</small>
        </div>
      </aside>
    </div>
  );
}

export default App;
