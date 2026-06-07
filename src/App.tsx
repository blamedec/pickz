import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav, type AppTab } from "./components/BottomNav";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { LeagueScreen } from "./components/LeagueScreen";
import { LiveScreen } from "./components/LiveScreen";
import { PicksScreen } from "./components/PicksScreen";
import { RulesScreen } from "./components/RulesScreen";
import { TeamFlag } from "./components/TeamFlag";
import { maybeGetTeam } from "./data/teams";
import {
  createLeague as createLeagueApi,
  joinLeague as joinLeagueApi,
  listLeagues as listLeaguesApi,
  setLeagueLocked,
  submitEntry,
} from "./lib/leagueApi";
import { getPrizePotLabel } from "./lib/money";
import { buildLeaderboard, canEditPicks, validateOnePickPerPot } from "./lib/scoring";
import {
  loadActiveLeagueId,
  loadEntry,
  loadLeagues,
  loadLocalIdentity,
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
import { apiConfigured, demoMode, supabase } from "./lib/supabase";
import { buildScoresFromFixtures, fetchWorldCupFixtures, getCorrectPredictionFromScores, getCurrentFixtures } from "./lib/worldCupApi";
import type { Entrant, League, LeagueApiPayload, LeagueCreateInput, Pot, PredictionCategory, TeamScore, ThemeMode, UserProfile, WorldCupFixture } from "./types";

const appNavItems: Array<{ id: AppTab; label: string; step: string; helper: string }> = [
  { id: "rules", label: "Rules", step: "01", helper: "Read first" },
  { id: "league", label: "League", step: "02", helper: "Join or create" },
  { id: "picks", label: "Picks", step: "03", helper: "Your four slips" },
  { id: "live", label: "Live", step: "04", helper: "Match centre" },
  { id: "table", label: "Table", step: "05", helper: "Bragging rights" },
];

const potOrder = [1, 2, 3, 4] as Pot[];

const defaultProfile: UserProfile = {
  id: "local-player",
  email: "",
  name: "Player",
  role: "joiner",
};

function createEmptyEntry(profile: UserProfile): Entrant {
  return {
    id: "local-entry",
    name: profile.name || "Player",
    avatarColor: "#e71d36",
    picks: { 1: null, 2: null, 3: null, 4: null },
    predictions: { highest_scoring_team: "" },
  };
}

function mergeLeagueWithLocalCodes(next: League, current: League[]) {
  const existing = current.find((league) => league.id === next.id);
  return { ...next, adminCode: next.adminCode ?? existing?.adminCode };
}

function formatFixtureScore(fixture: WorldCupFixture) {
  return fixture.status === "scheduled" ? "vs" : `${fixture.home.score}-${fixture.away.score}`;
}

function formatFixtureTime(fixture: WorldCupFixture) {
  if (fixture.status === "live") return fixture.displayClock || "Live";
  if (fixture.status === "completed") return "FT";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fixture.startsAt));
}

function getBonusRace(scores: Record<string, TeamScore>) {
  return Object.values(scores)
    .flatMap((score) => {
      const team = maybeGetTeam(score.teamId);
      return team ? [{ score, team }] : [];
    })
    .sort((a, b) => b.score.goalsFor - a.score.goalsFor || b.score.points - a.score.points)
    .slice(0, 5);
}

function DesktopSidebar({
  activeTab,
  entry,
  hasLeague,
  rulesAccepted,
  onChange,
}: {
  activeTab: AppTab;
  entry: Entrant;
  hasLeague: boolean;
  rulesAccepted: boolean;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <aside className="desktop-sidebar" aria-label="PickFour sections">
      <nav className="desktop-step-nav">
        {appNavItems.map((item) => {
          const disabled =
            (item.id !== "rules" && !rulesAccepted) ||
            (item.id === "picks" && (!rulesAccepted || !hasLeague)) ||
            ((item.id === "live" || item.id === "table") && !hasLeague);
          return (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? "desktop-step active" : "desktop-step"}
              disabled={disabled}
              aria-current={activeTab === item.id ? "page" : undefined}
              onClick={() => onChange(item.id)}
            >
              <span>{item.step}</span>
              <strong>{item.label}</strong>
              <small>{item.helper}</small>
            </button>
          );
        })}
      </nav>

      {hasLeague ? (
        <section className="sidebar-pick-slip" aria-label="Your four picks">
          <p className="section-kicker">Your four slips</p>
          <div className="sidebar-pick-grid">
            {potOrder.map((pot) => {
              const team = maybeGetTeam(entry.picks[pot]);
              return (
                <button key={pot} type="button" className="sidebar-pick" onClick={() => onChange("picks")}>
                  <small>Pot {pot}</small>
                  <strong>{team ? team.shortName : "Choose"}</strong>
                  <span>{team ? <TeamFlag team={team} /> : "?"}</span>
                </button>
              );
            })}
          </div>
          <div className="sidebar-bonus">
            <small>Bonus +10</small>
            <strong>{entry.predictions.highest_scoring_team || "Highest scorers"}</strong>
          </div>
        </section>
      ) : (
        <section className="sidebar-pick-slip sidebar-start-card" aria-label="Start PickFour">
          <p className="section-kicker">Start here</p>
          <strong>Read it. Join it. Pick four.</strong>
          <small>Use the invite code from the group chat, or create the tournament and send your own link.</small>
          <button type="button" className="secondary-cta" onClick={() => onChange(rulesAccepted ? "league" : "rules")}>
            {rulesAccepted ? "Join or create" : "Read rules first"}
          </button>
        </section>
      )}
    </aside>
  );
}

function DesktopRail({
  entry,
  fixtures,
  leaderboard,
  league,
  rulesAccepted,
  liveError,
  liveLoading,
  scores,
  onChange,
}: {
  entry: Entrant;
  fixtures: WorldCupFixture[];
  leaderboard: ReturnType<typeof buildLeaderboard>;
  league: League | null;
  rulesAccepted: boolean;
  liveError: string | null;
  liveLoading: boolean;
  scores: Record<string, TeamScore>;
  onChange: (tab: AppTab) => void;
}) {
  const currentFixtures = getCurrentFixtures(fixtures).slice(0, 4);
  const bonusRace = getBonusRace(scores);
  const leadingGoals = bonusRace[0]?.score.goalsFor ?? 0;
  const playerRank = leaderboard.find((row) => row.entrant.id === entry.id);
  const picksComplete = validateOnePickPerPot(entry.picks) && Boolean(entry.predictions.highest_scoring_team);

  if (!league) {
    return (
      <aside className="desktop-rail" aria-label="PickFour setup guide">
        <section className="rail-panel journey-rail">
          <div className="rail-heading">
            <h2>Get playing</h2>
            <span>Setup</span>
          </div>
          <ol className="rail-journey-list">
            <li>
              <strong>Read the rules</strong>
              <small>Four country picks, one bonus pick, locked at tournament start.</small>
            </li>
            <li>
              <strong>Sign up</strong>
              <small>Add your email and display name so your entry follows you.</small>
            </li>
            <li>
              <strong>Join or create</strong>
              <small>Paste an invite code, or start a tournament and share the link.</small>
            </li>
          </ol>
          <button className="primary-cta" type="button" onClick={() => onChange(rulesAccepted ? "league" : "rules")}>
            {rulesAccepted ? "Join or create league" : "Read rules first"}
          </button>
        </section>
        <section className="rail-panel disclaimer-rail">
          <strong>Unofficial fantasy game</strong>
          <p>PickFour is not affiliated with FIFA, the World Cup, tournament organisers, broadcasters, or national associations.</p>
        </section>
      </aside>
    );
  }

  if (!picksComplete) {
    return (
      <aside className="desktop-rail" aria-label="PickFour picks guide">
        <section className="rail-panel journey-rail">
          <div className="rail-heading">
            <h2>Next up</h2>
            <span>Picks</span>
          </div>
          <ol className="rail-journey-list">
            {potOrder.map((pot) => {
              const team = maybeGetTeam(entry.picks[pot]);
              return (
                <li key={pot} className={team ? "complete" : ""}>
                  <strong>Pot {pot}</strong>
                  <small>{team ? `${team.name} selected` : "Choose one country from this pot."}</small>
                </li>
              );
            })}
            <li className={entry.predictions.highest_scoring_team ? "complete" : ""}>
              <strong>Bonus +10</strong>
              <small>{entry.predictions.highest_scoring_team || "Pick the highest-scoring team."}</small>
            </li>
          </ol>
          <button className="primary-cta" type="button" onClick={() => onChange("picks")}>
            Make your picks
          </button>
        </section>
      </aside>
    );
  }

  return (
    <aside className="desktop-rail" aria-label="Live PickFour context">
      <section className="rail-panel live-rail">
        <div className="rail-heading">
          <h2>Match feed</h2>
          <span>{liveLoading ? "Refreshing" : currentFixtures.some((fixture) => fixture.status === "live") ? "Live" : "Next"}</span>
        </div>
        {currentFixtures.length > 0 ? (
          <div className="rail-match-list">
            {currentFixtures.map((fixture) => {
              const homeTeam = maybeGetTeam(fixture.home.id);
              const awayTeam = maybeGetTeam(fixture.away.id);

              return (
                <article className="rail-match" key={fixture.id}>
                  <small>{formatFixtureTime(fixture)}</small>
                  <strong className="rail-match-teams">
                    <span className="rail-team">
                      {homeTeam ? <TeamFlag team={homeTeam} /> : null}
                      {fixture.home.shortName}
                    </span>
                    <b>{formatFixtureScore(fixture)}</b>
                    <span className="rail-team away">
                      {awayTeam ? <TeamFlag team={awayTeam} /> : null}
                      {fixture.away.shortName}
                    </span>
                  </strong>
                  <em>{fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll("_", " ")}</em>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rail-empty">Fixtures will appear as the live feed warms up.</p>
        )}
        {liveError ? <p className="rail-warning">{liveError}</p> : null}
      </section>

      <section className="rail-panel rank-rail">
        <div className="rail-heading">
          <h2>{league ? league.name : "League table"}</h2>
          <button type="button" onClick={() => onChange("table")}>Open</button>
        </div>
        <div className="rank-rail-hero">
          <strong>#{playerRank?.rank ?? "-"}</strong>
          <span>{playerRank?.totalPoints ?? 0} pts</span>
          <small>{playerRank?.activeTeams ?? 0} alive · {playerRank?.predictionPoints ?? 0} bonus</small>
        </div>
        <div className="rail-leaders">
          {leaderboard.slice(0, 4).map((row) => (
            <button key={row.entrant.id} type="button" onClick={() => onChange("table")}>
              <span>{row.rank}</span>
              <strong>{row.entrant.name}</strong>
              <b>{row.totalPoints}</b>
            </button>
          ))}
          {leaderboard.length === 0 ? <p className="rail-empty">Submit picks to start the table.</p> : null}
        </div>
      </section>

      <section className="rail-panel bonus-rail">
        <div className="rail-heading">
          <h2>Highest scorers</h2>
          <span>+10</span>
        </div>
        {leadingGoals > 0 ? (
          <div className="bonus-bars">
            {bonusRace.map(({ score, team }, index) => (
              <div className="bonus-bar" key={team.id}>
                <span>{index + 1}</span>
                <strong><TeamFlag team={team} /> {team.code}</strong>
                <i><em style={{ width: `${Math.max(8, (score.goalsFor / leadingGoals) * 100)}%` }} /></i>
                <b>{score.goalsFor} GF</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="rail-empty">The bonus race starts from real goals.</p>
        )}
      </section>

      <section className="rail-panel disclaimer-rail">
        <strong>Unofficial fantasy game</strong>
        <p>PickFour is not affiliated with FIFA, the World Cup, tournament organisers, broadcasters, or national associations.</p>
      </section>
    </aside>
  );
}

function MobileJourneyStepper({
  activeTab,
  hasLeague,
  rulesAccepted,
  onChange,
}: {
  activeTab: AppTab;
  hasLeague: boolean;
  rulesAccepted: boolean;
  onChange: (tab: AppTab) => void;
}) {
  const activeIndex = appNavItems.findIndex((item) => item.id === activeTab);

  return (
    <nav className="mobile-stepper" aria-label="PickFour journey">
      {appNavItems.map((item, index) => {
        const disabled =
          (item.id !== "rules" && !rulesAccepted) ||
          (item.id === "picks" && (!rulesAccepted || !hasLeague)) ||
          ((item.id === "live" || item.id === "table") && !hasLeague);
        const state = index < activeIndex ? "done" : activeTab === item.id ? "active" : "";

        return (
          <button
            key={item.id}
            type="button"
            className={["mobile-step", state].filter(Boolean).join(" ")}
            disabled={disabled}
            aria-current={activeTab === item.id ? "step" : undefined}
            onClick={() => onChange(item.id)}
          >
            <span>{index + 1}</span>
            <strong>{item.label}</strong>
          </button>
        );
      })}
    </nav>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [rulesAccepted, setRulesAccepted] = useState(() => loadRulesAccepted());
  const [activeTab, setActiveTab] = useState<AppTab>(() => (loadRulesAccepted() ? "league" : "rules"));
  const [selectedPot, setSelectedPot] = useState<Pot>(1);
  const [localIdentity] = useState(() => loadLocalIdentity());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(defaultProfile));
  const [leagues, setLeagues] = useState<League[]>(() => loadLeagues([]));
  const [activeLeagueId, setActiveLeagueId] = useState(() => loadActiveLeagueId(""));
  const [entry, setEntry] = useState<Entrant>(() => loadEntry(createEmptyEntry(loadProfile(defaultProfile))));
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<WorldCupFixture[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [appNotice, setAppNotice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const handledJoinCodeRef = useRef<string | null>(null);
  const league = useMemo(() => leagues.find((item) => item.id === activeLeagueId) ?? leagues[0] ?? null, [activeLeagueId, leagues]);

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
    saveActiveLeagueId(league?.id ?? "");
  }, [league?.id]);

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
    let active = true;

    async function refreshLiveData() {
      try {
        setLiveLoading(true);
        const nextFixtures = await fetchWorldCupFixtures();
        if (!active) return;
        setFixtures(nextFixtures);
        setLiveError(null);
      } catch (error) {
        if (!active) return;
        setLiveError(error instanceof Error ? error.message : "Could not load World Cup fixtures.");
      } finally {
        if (active) setLiveLoading(false);
      }
    }

    refreshLiveData();
    const timer = window.setInterval(refreshLiveData, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!apiConfigured) return;

    let active = true;

    async function refreshLeagues() {
      try {
        const payloads = await listLeaguesApi(localIdentity);
        if (!active) return;

        setLeagues((current) => payloads.map((payload) => mergeLeagueWithLocalCodes(payload.league, current)));

        const selectedPayload =
          payloads.find((payload) => payload.league.id === activeLeagueId) ??
          payloads[0] ??
          null;

        if (selectedPayload) {
          applyLeaguePayload(selectedPayload);
        } else {
          setEntrants([]);
          setEntry(createEmptyEntry(profile));
        }
      } catch (error) {
        if (active) setAppNotice(error instanceof Error ? error.message : "Could not load your leagues.");
      }
    }

    refreshLeagues();

    return () => {
      active = false;
    };
  }, [localIdentity]);

  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get("join")?.trim().toUpperCase();
    if (!inviteCode || handledJoinCodeRef.current === inviteCode) return;
    handledJoinCodeRef.current = inviteCode;
    joinLeague(inviteCode).catch((error) => {
      setAppNotice(error instanceof Error ? error.message : "Could not join from invite link.");
    });
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  const teamScores = useMemo(() => buildScoresFromFixtures(fixtures), [fixtures]);
  const correctPredictions = useMemo(() => getCorrectPredictionFromScores(teamScores), [teamScores]);
  const leaderboard = useMemo(() => buildLeaderboard(entrants, teamScores, correctPredictions), [correctPredictions, entrants, teamScores]);
  const prizePotLabel = useMemo(() => (league ? getPrizePotLabel(league, entrants.length) : "£0 pot"), [entrants.length, league]);
  const editable = Boolean(league) && rulesAccepted && canEditPicks(new Date(), league!.lockTimeIso) && !league!.locked;
  const isLeagueCreator = Boolean(league?.adminCode);

  function applyLeaguePayload(payload: LeagueApiPayload) {
    const payloadLeague = payload.adminCode ? { ...payload.league, adminCode: payload.adminCode } : payload.league;

    setLeagues((current) => {
      const nextLeague = mergeLeagueWithLocalCodes(payloadLeague, current);
      const exists = current.some((item) => item.id === nextLeague.id);
      return exists ? current.map((item) => (item.id === nextLeague.id ? nextLeague : item)) : [...current, nextLeague];
    });
    setActiveLeagueId(payloadLeague.id);
    setEntrants(payload.entrants);

    const currentEntrant = payload.entrants.find((entrant) => entrant.id === payload.currentEntrantId);
    setEntry(currentEntrant ?? createEmptyEntry(profile));
  }

  function pickTeam(pot: Pot, teamId: string) {
    if (!editable) return;
    setEntry((current) => ({ ...current, picks: { ...current.picks, [pot]: teamId } }));
  }

  function updatePrediction(category: PredictionCategory, value: string) {
    if (!editable) return;
    setEntry((current) => ({ ...current, predictions: { ...current.predictions, [category]: value } }));
  }

  async function confirmPicks() {
    if (!league) return;

    if (!apiConfigured) {
      setAppNotice("Supabase is not configured for this build.");
      return;
    }

    try {
      const payload = await submitEntry(localIdentity, league.id, { ...entry, name: profile.name || entry.name });
      applyLeaguePayload(payload);
      setConfirmed(true);
      window.setTimeout(() => setConfirmed(false), 1800);
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not save picks.");
    }
  }

  function acceptRules() {
    setRulesAccepted(true);
    setActiveTab("league");
  }

  async function createLeague(settings: LeagueCreateInput) {
    if (!apiConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }

    const payload = await createLeagueApi(localIdentity, settings, {
      name: profile.name || "Player",
      email: profile.email,
      avatarColor: entry.avatarColor,
    });
    applyLeaguePayload(payload);
    setActiveTab(rulesAccepted ? "picks" : "rules");
  }

  async function joinLeague(inviteCode: string) {
    if (!apiConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }

    const payload = await joinLeagueApi(localIdentity, inviteCode, {
      name: profile.name || "Player",
      email: profile.email,
      avatarColor: entry.avatarColor,
    });
    applyLeaguePayload(payload);
    setActiveTab(rulesAccepted ? "picks" : "rules");
  }

  async function toggleActiveLeagueLocked() {
    if (!league?.adminCode) return;
    const payload = await setLeagueLocked(localIdentity, league.id, league.adminCode, !league.locked);
    applyLeaguePayload(payload);
  }

  function selectLeague(leagueId: string) {
    setActiveLeagueId(leagueId);
    if (!apiConfigured) return;

    listLeaguesApi(localIdentity)
      .then((payloads) => {
        const payload = payloads.find((item) => item.league.id === leagueId);
        if (payload) applyLeaguePayload(payload);
      })
      .catch((error) => setAppNotice(error instanceof Error ? error.message : "Could not switch leagues."));
  }

  function changeTab(tab: AppTab) {
    if (tab !== "rules" && !rulesAccepted) {
      setActiveTab("rules");
      return;
    }
    if (tab === "picks" && !league) {
      setActiveTab("league");
      return;
    }
    if (tab === "picks" && !rulesAccepted) {
      setActiveTab("rules");
      return;
    }
    if ((tab === "live" || tab === "table") && !league) {
      setActiveTab(rulesAccepted ? "league" : "rules");
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
            canViewLeaderboard={Boolean(league)}
            onAccept={acceptRules}
            onViewLeaderboard={() => changeTab("table")}
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
            scores={teamScores}
            leaderboard={leaderboard}
            fixtures={fixtures}
            liveLoading={liveLoading}
            liveError={liveError}
            locked={league?.locked ?? false}
          />
        );
      case "table":
        return (
          <LeaderboardScreen
            rows={leaderboard}
            entrants={entrants}
            globalRows={[]}
            leagues={leagues}
            activeLeagueId={league?.id ?? ""}
            onSelectLeague={selectLeague}
          />
        );
      case "league":
        return (
          <LeagueScreen
            league={league}
            leagues={leagues}
            activeLeagueId={league?.id ?? ""}
            entrants={entrants}
            profile={profile}
            isLeagueCreator={isLeagueCreator}
            prizePotLabel={prizePotLabel}
            onSelectLeague={selectLeague}
            onProfileChange={setProfile}
            onCreateLeague={createLeague}
            onJoinLeague={joinLeague}
            onToggleLocked={toggleActiveLeagueLocked}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <div className="app-frame">
        <AppHeader
          league={league}
          leagues={leagues}
          activeLeagueId={league?.id ?? ""}
          profile={profile}
          prizePotLabel={prizePotLabel}
          theme={theme}
          onSelectLeague={selectLeague}
          onJoinLeague={joinLeague}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        />

        <MobileJourneyStepper
          activeTab={activeTab}
          hasLeague={Boolean(league)}
          rulesAccepted={rulesAccepted}
          onChange={changeTab}
        />

        {league ? (
          <div className="app-live-ticker" aria-label="Tournament ticker">
            <span>{liveLoading ? "Refreshing feed" : "Tournament feed"}</span>
            {getCurrentFixtures(fixtures).slice(0, 3).map((fixture) => (
              <strong key={fixture.id}>
                {formatFixtureTime(fixture)} · {fixture.home.shortName} {formatFixtureScore(fixture)} {fixture.away.shortName}
              </strong>
            ))}
            {fixtures.length === 0 ? <strong>Waiting for ESPN fixtures</strong> : null}
          </div>
        ) : null}

        <div className="app-body">
          <DesktopSidebar
            activeTab={activeTab}
            entry={entry}
            hasLeague={Boolean(league)}
            rulesAccepted={rulesAccepted}
            onChange={changeTab}
          />

          <main className="app-main" ref={mainRef}>
            {confirmed ? (
              <div className="toast-burst" role="status">
                Picks saved to your league.
              </div>
            ) : null}
            {appNotice ? (
              <div className="app-notice" role="status">
                {appNotice}
                <button type="button" onClick={() => setAppNotice(null)}>Dismiss</button>
              </div>
            ) : null}
            {renderScreen()}
          </main>

          <DesktopRail
            entry={entry}
            fixtures={fixtures}
            leaderboard={leaderboard}
            league={league}
            rulesAccepted={rulesAccepted}
            liveError={liveError}
            liveLoading={liveLoading}
            scores={teamScores}
            onChange={changeTab}
          />
        </div>

        <BottomNav active={activeTab} rulesAccepted={rulesAccepted} hasLeague={Boolean(league)} onChange={changeTab} />
      </div>
    </div>
  );
}

export default App;
