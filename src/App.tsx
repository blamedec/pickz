import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav, type AppTab } from "./components/BottomNav";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { LeagueScreen } from "./components/LeagueScreen";
import { LiveScreen } from "./components/LiveScreen";
import { MatchdayOverviewScreen } from "./components/MatchdayOverviewScreen";
import { PicksScreen } from "./components/PicksScreen";
import { RulesScreen } from "./components/RulesScreen";
import { TeamFlag } from "./components/TeamFlag";
import { maybeGetTeam } from "./data/teams";
import {
  createLeague as createLeagueApi,
  getLeagueByInvite,
  joinLeague as joinLeagueApi,
  listLeagues as listLeaguesApi,
  removeEntrant as removeEntrantApi,
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
import { buildScoresFromFixtures, fetchWorldCupFixtures, getCorrectPredictionFromScores, getCurrentFixtures, isFixtureInKickoffWindow } from "./lib/worldCupApi";
import type { Entrant, LeaderboardRow, LeaderboardSnapshot, League, LeagueApiPayload, LeagueCreateInput, Pot, PredictionCategory, TeamScore, ThemeMode, UserProfile, WorldCupFixture } from "./types";

const appNavItems: Array<{ id: AppTab; label: string; step: string; helper: string }> = [
  { id: "rules", label: "Rules", step: "01", helper: "Read first" },
  { id: "league", label: "League", step: "02", helper: "Join or create" },
  { id: "picks", label: "Picks", step: "03", helper: "Your four picks" },
  { id: "live", label: "Live", step: "04", helper: "Match centre" },
  { id: "table", label: "Table", step: "05", helper: "Bragging rights" },
];

const potOrder = [1, 2, 3, 4] as Pot[];
const unofficialDisclaimer =
  "PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup, tournament organisers, broadcasters, or national associations.";
const TOURNAMENT_LOCK_TIME_ISO = "2026-06-11T18:55:00.000Z";
const PUBLIC_LEAGUE_INVITE_CODE = "GCHYKF";

const defaultProfile: UserProfile = {
  id: "local-player",
  email: "",
  name: "",
  role: "joiner",
};

type TeamScoreRow = {
  team_id: string;
  points: number;
  table_points?: number | null;
  match_points?: number | null;
  clean_sheet_bonus_points?: number | null;
  statement_win_bonus_points?: number | null;
  giant_slayer_bonus_points?: number | null;
  major_giant_slayer_bonus_points?: number | null;
  red_cards?: number | null;
  own_goals?: number | null;
  red_card_deduction_points?: number | null;
  own_goal_deduction_points?: number | null;
  discipline_deduction_points?: number | null;
  stage_bonus_points?: number | null;
  champion_bonus_points?: number | null;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  status: TeamScore["status"];
  stage_reached?: TeamScore["stageReached"] | null;
  last_update?: string | null;
  updated_at?: string | null;
};

type MatchRow = {
  espn_match_id: string;
  starts_at: string;
  stage: WorldCupFixture["stage"];
  group_letter?: string | null;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_score: number;
  away_score: number;
  winner_team_id?: string | null;
  status: WorldCupFixture["status"];
  home_red_cards?: number | null;
  away_red_cards?: number | null;
  home_own_goals?: number | null;
  away_own_goals?: number | null;
  raw_payload?: {
    competitions?: Array<{
      status?: { displayClock?: string };
      venue?: { fullName?: string };
    }>;
  } | null;
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

function getIdentityKey(profile: UserProfile, fallbackIdentity: string) {
  const email = profile.email.trim().toLowerCase();
  return email ? `email:${email}` : fallbackIdentity;
}

function hasTournamentStarted(now = Date.now()) {
  return now >= new Date(TOURNAMENT_LOCK_TIME_ISO).getTime();
}

function getJoinInviteCode() {
  return new URLSearchParams(window.location.search).get("join")?.trim().toUpperCase() ?? "";
}

function getNavHelper(item: (typeof appNavItems)[number], tournamentStarted: boolean) {
  if (!tournamentStarted) return item.helper;

  switch (item.id) {
    case "rules":
      return "Scoring guide";
    case "league":
      return "League hub";
    case "picks":
      return "Locked";
    case "live":
      return "Match centre";
    case "table":
      return "Scores";
    default:
      return item.helper;
  }
}

function getNavLabel(tab: AppTab, tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  if (!tournamentStarted) return appNavItems.find((item) => item.id === tab)?.label ?? tab;

  switch (tab) {
    case "rules":
      return "Scoring";
    case "league":
      return "Overview";
    case "picks":
      return hasCurrentEntrant ? "My entry" : "Entry";
    case "live":
      return "Matches";
    case "table":
      return "Table";
    default:
      return tab;
  }
}

function getVisibleNavItems(tournamentStarted: boolean, hasCurrentEntrant: boolean) {
  if (!tournamentStarted || hasCurrentEntrant) return appNavItems;
  return appNavItems.filter((item) => item.id !== "picks");
}

function formatFixtureScore(fixture: WorldCupFixture) {
  const hasScore = fixture.home.score > 0 || fixture.away.score > 0;
  return fixture.status === "scheduled" && !hasScore ? "vs" : `${fixture.home.score}-${fixture.away.score}`;
}

function formatFixtureTime(fixture: WorldCupFixture) {
  if (fixture.status === "live") return fixture.displayClock || "Live";
  if (fixture.status === "completed") return "FT";
  if (isFixtureInKickoffWindow(fixture)) return "Now";

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

function mapDatabaseScores(rows: TeamScoreRow[]): Record<string, TeamScore> {
  return Object.fromEntries(
    rows.map((row) => [
      row.team_id,
      {
        teamId: row.team_id,
        points: row.points ?? 0,
        tablePoints: row.table_points ?? 0,
        matchPoints: row.match_points ?? 0,
        cleanSheetBonusPoints: row.clean_sheet_bonus_points ?? 0,
        statementWinBonusPoints: row.statement_win_bonus_points ?? 0,
        giantSlayerBonusPoints: row.giant_slayer_bonus_points ?? 0,
        majorGiantSlayerBonusPoints: row.major_giant_slayer_bonus_points ?? 0,
        redCards: row.red_cards ?? 0,
        ownGoals: row.own_goals ?? 0,
        redCardDeductionPoints: row.red_card_deduction_points ?? 0,
        ownGoalDeductionPoints: row.own_goal_deduction_points ?? 0,
        disciplineDeductionPoints: row.discipline_deduction_points ?? 0,
        stageBonusPoints: row.stage_bonus_points ?? 0,
        championBonusPoints: row.champion_bonus_points ?? 0,
        wins: row.wins ?? 0,
        draws: row.draws ?? 0,
        losses: row.losses ?? 0,
        goalsFor: row.goals_for ?? 0,
        goalsAgainst: row.goals_against ?? 0,
        cleanSheets: row.clean_sheets ?? 0,
        status: row.status ?? "active",
        stageReached: row.stage_reached ?? "pre_tournament",
        lastUpdate: row.last_update ?? "Pre-tournament",
      } satisfies TeamScore,
    ]),
  );
}

function hasLiveScoreData(scores: Record<string, TeamScore> | null) {
  return Boolean(
    scores &&
      Object.values(scores).some(
        (score) =>
          score.points !== 0 ||
          score.goalsFor !== 0 ||
          score.goalsAgainst !== 0 ||
          score.redCards !== 0 ||
          score.ownGoals !== 0 ||
          score.stageReached !== "pre_tournament" ||
          score.status !== "active",
      ),
  );
}

function mapFixtureTeam(teamId: string | null | undefined, score: number, winnerTeamId?: string | null) {
  const team = maybeGetTeam(teamId);
  return {
    id: team?.id ?? null,
    espnId: team?.espnId ?? "",
    name: team?.name ?? "TBC",
    shortName: team?.shortName ?? "TBC",
    code: team?.code ?? "TBC",
    score,
    winner: Boolean(team?.id && winnerTeamId === team.id),
  };
}

function mapDatabaseFixtures(rows: MatchRow[]): WorldCupFixture[] {
  return rows
    .map((row) => {
      const competition = row.raw_payload?.competitions?.[0];
      return {
        id: row.espn_match_id,
        startsAt: row.starts_at,
        stage: row.stage,
        group: row.group_letter ?? null,
        status: row.status,
        displayClock: competition?.status?.displayClock ?? "",
        venue: competition?.venue?.fullName ?? "Venue TBC",
        home: mapFixtureTeam(row.home_team_id, row.home_score, row.winner_team_id),
        away: mapFixtureTeam(row.away_team_id, row.away_score, row.winner_team_id),
        discipline: {
          homeRedCards: row.home_red_cards ?? 0,
          awayRedCards: row.away_red_cards ?? 0,
          homeOwnGoals: row.home_own_goals ?? 0,
          awayOwnGoals: row.away_own_goals ?? 0,
        },
        source: "espn" as const,
      };
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function buildPrivateLeaderboard(entrants: Entrant[]) {
  return [...entrants]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entrant) => ({
      entrant,
      countryPoints: 0,
      predictionPoints: 0,
      totalPoints: 0,
      activeTeams: 0,
      rank: 1,
      movement: 0,
    }));
}

function applyLeaderboardMovement(rows: LeaderboardRow[], snapshots: LeaderboardSnapshot[]) {
  if (snapshots.length === 0) return rows;

  const snapshotsByEntrant = new Map<string, LeaderboardSnapshot[]>();
  for (const snapshot of snapshots) {
    snapshotsByEntrant.set(snapshot.entrantId, [...(snapshotsByEntrant.get(snapshot.entrantId) ?? []), snapshot]);
  }

  return rows.map((row) => {
    const history = (snapshotsByEntrant.get(row.entrant.id) ?? []).sort(
      (a, b) => new Date(a.snapshottedAt).getTime() - new Date(b.snapshottedAt).getTime(),
    );
    const previous = [...history]
      .reverse()
      .find(
        (snapshot) =>
          snapshot.rank !== row.rank ||
          snapshot.totalPoints !== row.totalPoints ||
          snapshot.countryPoints !== row.countryPoints ||
          snapshot.predictionPoints !== row.predictionPoints,
      );

    return {
      ...row,
      movement: previous ? previous.rank - row.rank : 0,
    };
  });
}

function DesktopSidebar({
  activeTab,
  entry,
  hasLeague,
  profileReady,
  rulesAccepted,
  tournamentStarted,
  currentEntrantId,
  onChange,
}: {
  activeTab: AppTab;
  entry: Entrant;
  hasLeague: boolean;
  profileReady: boolean;
  rulesAccepted: boolean;
  tournamentStarted: boolean;
  currentEntrantId: string | null;
  onChange: (tab: AppTab) => void;
}) {
  const hasOwnPicks = validateOnePickPerPot(entry.picks);
  const canBrowseLive = rulesAccepted || tournamentStarted;
  const visibleItems = getVisibleNavItems(tournamentStarted, Boolean(currentEntrantId));

  return (
    <aside className="desktop-sidebar" aria-label="PickFour sections">
      <nav className="desktop-step-nav">
        {visibleItems.map((item) => {
          const disabled =
            (item.id !== "rules" && !canBrowseLive) ||
            (item.id === "picks" && (!rulesAccepted || !hasLeague || (!profileReady && !tournamentStarted))) ||
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
              <strong>{getNavLabel(item.id, tournamentStarted, Boolean(currentEntrantId))}</strong>
              <small>{getNavHelper(item, tournamentStarted)}</small>
            </button>
          );
        })}
      </nav>

      {hasLeague && hasOwnPicks ? (
        <section className="sidebar-pick-slip" aria-label="Your four picks">
          <p className="section-kicker">Your four picks</p>
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
      ) : hasLeague ? (
        <section className="sidebar-pick-slip sidebar-start-card" aria-label="League view">
          <p className="section-kicker">Tournament live</p>
          <strong>The table is open.</strong>
          <small>Entries are closed now. Use the live centre and league table to follow the damage.</small>
          <button type="button" className="secondary-cta" onClick={() => onChange("table")}>
            Open table
          </button>
        </section>
      ) : (
        <section className="sidebar-pick-slip sidebar-start-card" aria-label="Start PickFour">
          <p className="section-kicker">Start here</p>
          <strong>{tournamentStarted ? "The table is live." : "Read it. Join it. Pick four."}</strong>
          <small>
            {tournamentStarted
              ? "Entries are locked. Open the live overview and follow the scores."
              : "Use the invite code from the group chat, or create the league and send your own link."}
          </small>
          <button type="button" className="secondary-cta" onClick={() => onChange(tournamentStarted ? "league" : rulesAccepted ? "league" : "rules")}>
            {tournamentStarted ? "Open overview" : rulesAccepted ? "Join or create" : "Read rules first"}
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
              <small>Four country picks, one +10 bonus from any tournament team, locked at 19:55 UK.</small>
            </li>
            <li>
              <strong>Sign up</strong>
              <small>Add your email and display name so your entry follows you.</small>
            </li>
            <li>
              <strong>Join or create</strong>
              <small>Paste an invite code, or start a league and share the link.</small>
            </li>
          </ol>
          <button className="primary-cta" type="button" onClick={() => onChange(rulesAccepted ? "league" : "rules")}>
            {rulesAccepted ? "Join or create league" : "Read rules first"}
          </button>
        </section>
      </aside>
    );
  }

  if (!picksComplete) {
    if (league.locked) {
      return (
        <aside className="desktop-rail" aria-label="Tournament live guide">
          <section className="rail-panel journey-rail">
            <div className="rail-heading">
              <h2>Tournament live</h2>
              <span>Locked</span>
            </div>
            <ol className="rail-journey-list">
              <li className="complete">
                <strong>Entries closed</strong>
                <small>No new picks, edits, joins, or leagues after the cutoff.</small>
              </li>
              <li className="complete">
                <strong>Picks revealed</strong>
                <small>Open any player on the table to see their four countries and bonus pick.</small>
              </li>
              <li className="complete">
                <strong>Live centre</strong>
                <small>Follow matches, most-backed countries, group tables and the +10 race.</small>
              </li>
            </ol>
            <button className="primary-cta" type="button" onClick={() => onChange("table")}>
              Open league table
            </button>
          </section>
        </aside>
      );
    }

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
              <small>{entry.predictions.highest_scoring_team || "Pick any tournament team to finish highest-scoring."}</small>
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
          <span>{liveLoading ? "Refreshing" : currentFixtures.some((fixture) => fixture.status === "live" || isFixtureInKickoffWindow(fixture)) ? "Live" : "Next"}</span>
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
                <b>{score.goalsFor} goals</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="rail-empty">The bonus race starts from real goals.</p>
        )}
      </section>

    </aside>
  );
}

function ScreenDisclaimer() {
  return <p className="screen-disclaimer">{unofficialDisclaimer}</p>;
}

function MobileJourneyStepper({
  activeTab,
  hasLeague,
  profileReady,
  rulesAccepted,
  tournamentStarted,
  currentEntrantId,
  onChange,
}: {
  activeTab: AppTab;
  hasLeague: boolean;
  profileReady: boolean;
  rulesAccepted: boolean;
  tournamentStarted: boolean;
  currentEntrantId: string | null;
  onChange: (tab: AppTab) => void;
}) {
  const visibleItems = getVisibleNavItems(tournamentStarted, Boolean(currentEntrantId));
  const activeIndex = visibleItems.findIndex((item) => item.id === activeTab);
  const canBrowseLive = rulesAccepted || tournamentStarted;

  return (
    <nav className="mobile-stepper" aria-label="PickFour journey">
      {visibleItems.map((item, index) => {
        const disabled =
          (item.id !== "rules" && !canBrowseLive) ||
          (item.id === "picks" && (!rulesAccepted || !hasLeague || (!profileReady && !tournamentStarted))) ||
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
            <strong>{getNavLabel(item.id, tournamentStarted, Boolean(currentEntrantId))}</strong>
          </button>
        );
      })}
    </nav>
  );
}

function TournamentLoadingScreen({ leagueName }: { leagueName: string }) {
  return (
    <section className="screen-stack tournament-loading-screen" aria-busy="true" aria-live="polite">
      <div className="panel tournament-loading-panel">
        <div className="loading-pulse-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="section-kicker">Loading league</p>
          <h1>{leagueName}</h1>
          <p>Getting the latest table, fixtures, and pick impact from the live feed.</p>
        </div>
        <div className="loading-skeleton-list" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [rulesAccepted, setRulesAccepted] = useState(() => loadRulesAccepted());
  const [activeTab, setActiveTab] = useState<AppTab>(() => (hasTournamentStarted() || loadRulesAccepted() ? "league" : "rules"));
  const [selectedPot, setSelectedPot] = useState<Pot>(1);
  const [localIdentity] = useState(() => loadLocalIdentity());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(defaultProfile));
  const [leagues, setLeagues] = useState<League[]>(() => loadLeagues([]));
  const [activeLeagueId, setActiveLeagueId] = useState(() => loadActiveLeagueId(""));
  const [entry, setEntry] = useState<Entrant>(() => loadEntry(createEmptyEntry(loadProfile(defaultProfile))));
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [currentEntrantId, setCurrentEntrantId] = useState<string | null>(null);
  const [leaguePicksVisible, setLeaguePicksVisible] = useState(false);
  const [fixtures, setFixtures] = useState<WorldCupFixture[]>([]);
  const [databaseScores, setDatabaseScores] = useState<Record<string, TeamScore> | null>(null);
  const [leaderboardSnapshots, setLeaderboardSnapshots] = useState<LeaderboardSnapshot[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveSyncedAt, setLiveSyncedAt] = useState<Date | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [leagueFetchComplete, setLeagueFetchComplete] = useState(!apiConfigured);
  const [appNotice, setAppNotice] = useState<string | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const mainRef = useRef<HTMLElement | null>(null);
  const handledJoinCodeRef = useRef<string | null>(null);
  const league = useMemo(() => leagues.find((item) => item.id === activeLeagueId) ?? leagues[0] ?? null, [activeLeagueId, leagues]);
  const identityKey = useMemo(() => getIdentityKey(profile, localIdentity), [localIdentity, profile]);
  const profileReady = Boolean(profile.email.trim() && profile.name.trim() && profile.name.trim().toLowerCase() !== "player");
  const tournamentStarted = hasTournamentStarted(nowMs);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

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
        let nextFixtures: WorldCupFixture[] = [];
        let scoreRows: { data?: unknown[] | null; error?: { message: string } | null } | null = null;

        if (supabase && apiConfigured) {
          const [matchRows, nextScoreRows] = await Promise.all([
            supabase
              .from("matches")
              .select(
                "espn_match_id, starts_at, stage, group_letter, home_team_id, away_team_id, home_score, away_score, winner_team_id, status, home_red_cards, away_red_cards, home_own_goals, away_own_goals, raw_payload",
              )
              .order("starts_at", { ascending: true }),
            supabase
              .from("team_scores")
              .select(
                "team_id, points, table_points, match_points, clean_sheet_bonus_points, statement_win_bonus_points, giant_slayer_bonus_points, major_giant_slayer_bonus_points, red_cards, own_goals, red_card_deduction_points, own_goal_deduction_points, discipline_deduction_points, stage_bonus_points, champion_bonus_points, wins, draws, losses, goals_for, goals_against, clean_sheets, status, stage_reached, last_update, updated_at",
              ),
          ]);

          scoreRows = nextScoreRows;
          if (!matchRows.error && matchRows.data?.length) {
            nextFixtures = mapDatabaseFixtures(matchRows.data as MatchRow[]);
          }
        }

        if (nextFixtures.length === 0) {
          nextFixtures = await fetchWorldCupFixtures();
        }

        if (!active) return;
        setFixtures(nextFixtures);
        if (scoreRows && !scoreRows.error && scoreRows.data?.length) {
          setDatabaseScores(mapDatabaseScores(scoreRows.data as TeamScoreRow[]));
        } else if (scoreRows?.error) {
          setDatabaseScores(null);
        }
        setLiveError(null);
        setLiveSyncedAt(new Date());
      } catch (error) {
        if (!active) return;
        setLiveError(error instanceof Error ? error.message : "Live scores are delayed. Showing the latest saved data.");
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
      setLeagueLoading(true);
      setLeagueFetchComplete(false);
      try {
        const payloads = await listLeaguesApi(identityKey, profile.email);
        if (!active) return;

        if (payloads.length === 0 && tournamentStarted && !getJoinInviteCode()) {
          const publicPayload = await getLeagueByInvite(identityKey, PUBLIC_LEAGUE_INVITE_CODE, profile.email);
          if (!active) return;

          applyLeaguePayload(publicPayload);
          setActiveTab("league");
          return;
        }

        setLeagues((current) => payloads.map((payload) => mergeLeagueWithLocalCodes(payload.league, current)));

        const selectedPayload =
          payloads.find((payload) => payload.league.id === activeLeagueId) ??
          payloads[0] ??
          null;

        if (selectedPayload) {
          applyLeaguePayload(selectedPayload);
        } else {
          setEntrants([]);
          setCurrentEntrantId(null);
          setLeaguePicksVisible(false);
          setLeaderboardSnapshots([]);
          setEntry(createEmptyEntry(profile));
        }
      } catch (error) {
        if (active) setAppNotice(error instanceof Error ? error.message : "Could not load your leagues.");
      } finally {
        if (active) {
          setLeagueLoading(false);
          setLeagueFetchComplete(true);
        }
      }
    }

    refreshLeagues();

    return () => {
      active = false;
    };
  }, [identityKey, tournamentStarted]);

  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get("join")?.trim().toUpperCase();
    if (!inviteCode || handledJoinCodeRef.current === inviteCode) return;
    handledJoinCodeRef.current = inviteCode;

    if (tournamentStarted) {
      setRulesAccepted(true);
      viewLeagueByInvite(inviteCode);
      return;
    }

    if (rulesAccepted && profileReady) {
      requestJoin(inviteCode);
      return;
    }

    setPendingInviteCode(inviteCode);
    setAppNotice(`Invite code ${inviteCode} is ready. Read the rules, add your details, then join the league.`);
    setActiveTab(rulesAccepted ? "league" : "rules");
  }, [profileReady, rulesAccepted, tournamentStarted]);

  useEffect(() => {
    if (!apiConfigured || !league?.id || leaguePicksVisible || league.locked) return;

    const lockTime = new Date(league.lockTimeIso).getTime();
    const refreshAfterLock = () => {
      void refreshLeaguePayload(league.id);
    };

    if (Date.now() >= lockTime) {
      refreshAfterLock();
      return;
    }

    const timer = window.setTimeout(refreshAfterLock, lockTime - Date.now() + 1_500);
    return () => window.clearTimeout(timer);
  }, [apiConfigured, league?.id, league?.lockTimeIso, league?.locked, leaguePicksVisible]);

  useEffect(() => {
    if (!apiConfigured || !league?.id || !tournamentStarted) return;

    const timer = window.setInterval(() => {
      void refreshLeaguePayload(league.id);
    }, 120_000);

    return () => window.clearInterval(timer);
  }, [apiConfigured, identityKey, league?.id, tournamentStarted]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  const fixtureScores = useMemo(() => buildScoresFromFixtures(fixtures), [fixtures]);
  const teamScores = useMemo(() => (hasLiveScoreData(databaseScores) ? databaseScores! : fixtureScores), [databaseScores, fixtureScores]);
  const correctPredictions = useMemo(() => getCorrectPredictionFromScores(teamScores), [teamScores]);
  const leaderboard = useMemo(() => buildLeaderboard(entrants, teamScores, correctPredictions), [correctPredictions, entrants, teamScores]);
  const leaderboardWithMovement = useMemo(() => applyLeaderboardMovement(leaderboard, leaderboardSnapshots), [leaderboard, leaderboardSnapshots]);
  const picksRevealed = Boolean(league && (leaguePicksVisible || league.locked || !canEditPicks(new Date(), league.lockTimeIso)));
  const displayLeaderboard = useMemo(() => (picksRevealed ? leaderboardWithMovement : buildPrivateLeaderboard(entrants)), [entrants, leaderboardWithMovement, picksRevealed]);
  const prizePotLabel = useMemo(() => (league ? getPrizePotLabel(league, entrants.length) : "£0 pot"), [entrants.length, league]);
  const editable = Boolean(league) && rulesAccepted && canEditPicks(new Date(), league!.lockTimeIso) && !league!.locked;
  const isLeagueCreator = Boolean(league?.adminCode);
  const shouldShowTournamentLoading = tournamentStarted && !leagueFetchComplete && entrants.length === 0;

  function applyLeaguePayload(payload: LeagueApiPayload) {
    const payloadLeague = payload.adminCode ? { ...payload.league, adminCode: payload.adminCode } : payload.league;

    setLeagues((current) => {
      const nextLeague = mergeLeagueWithLocalCodes(payloadLeague, current);
      const exists = current.some((item) => item.id === nextLeague.id);
      return exists ? current.map((item) => (item.id === nextLeague.id ? nextLeague : item)) : [...current, nextLeague];
    });
    setActiveLeagueId(payloadLeague.id);
    setEntrants(payload.entrants);
    setCurrentEntrantId(payload.currentEntrantId);
    setLeaguePicksVisible(Boolean(payload.picksVisible));
    setLeaderboardSnapshots(payload.snapshots ?? []);

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
    if (!league) {
      throw new Error("Join or create a league before saving picks.");
    }

    if (!profileReady) {
      setAppNotice("Add your email and display name before making picks. It keeps your entry recoverable later.");
      setActiveTab("league");
      throw new Error("Add email and display name before making picks.");
    }

    if (!apiConfigured) {
      setAppNotice("Supabase is not configured for this build.");
      throw new Error("Supabase is not configured for this build.");
    }
    if (tournamentStarted) {
      setAppNotice("The tournament has started, so picks are locked.");
      throw new Error("The tournament has started, so picks are locked.");
    }

    try {
      const payload = await submitEntry(identityKey, league.id, { ...entry, name: profile.name || entry.name }, profile.email);
      applyLeaguePayload(payload);
      setConfirmed(true);
      window.setTimeout(() => setConfirmed(false), 1800);
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not save picks.");
      throw error;
    }
  }

  function acceptRules() {
    setRulesAccepted(true);
    if (tournamentStarted) {
      if (league) {
        setActiveTab("league");
      } else {
        void viewLeagueByInvite(PUBLIC_LEAGUE_INVITE_CODE);
      }
      return;
    }

    setActiveTab("league");
  }

  async function viewLeagueByInvite(inviteCode: string) {
    if (!apiConfigured) {
      setAppNotice("Supabase is not configured for this build.");
      return;
    }

    try {
      const payload = await getLeagueByInvite(identityKey, inviteCode, profile.email);
      setPendingInviteCode(null);
      applyLeaguePayload(payload);
      setActiveTab("league");
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not open that league.");
      setActiveTab("league");
    }
  }

  async function createLeague(settings: LeagueCreateInput, draftProfile = profile) {
    if (!apiConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }
    if (tournamentStarted) {
      const message = "The tournament has started, so new leagues are closed.";
      setAppNotice(message);
      throw new Error(message);
    }

    setProfile(draftProfile);
    const requestIdentity = getIdentityKey(draftProfile, localIdentity);
    const payload = await createLeagueApi(requestIdentity, settings, {
      name: draftProfile.name || "Player",
      email: draftProfile.email,
      avatarColor: entry.avatarColor,
    });
    setPendingInviteCode(null);
    applyLeaguePayload(payload);
    setAppNotice("League created. Copy the invite link below, then make your own picks.");
    setActiveTab(rulesAccepted ? "league" : "rules");
  }

  async function joinLeague(inviteCode: string, draftProfile = profile) {
    if (!apiConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }
    if (tournamentStarted) {
      await viewLeagueByInvite(inviteCode);
      return;
    }

    setProfile(draftProfile);
    const requestIdentity = getIdentityKey(draftProfile, localIdentity);
    const payload = await joinLeagueApi(requestIdentity, inviteCode, {
      name: draftProfile.name || "Player",
      email: draftProfile.email,
      avatarColor: entry.avatarColor,
    });
    setPendingInviteCode(null);
    applyLeaguePayload(payload);
    setAppNotice("You are in. Pick one country from each pot, then choose your +10 bonus from any team.");
    setActiveTab(rulesAccepted ? "picks" : "rules");
  }

  async function requestJoin(inviteCode: string) {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;

    if (tournamentStarted) {
      await viewLeagueByInvite(code);
      return;
    }

    if (!rulesAccepted || !profileReady) {
      setPendingInviteCode(code);
      setAppNotice(
        rulesAccepted
          ? `Invite code ${code} is waiting. Add your email and display name before joining.`
          : `Invite code ${code} is waiting. Read the rules first, then add your details to join.`,
      );
      setActiveTab(rulesAccepted ? "league" : "rules");
      return;
    }

    try {
      await joinLeague(code);
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not join that league.");
    }
  }

  async function findEntryByProfile(nextProfile: UserProfile): Promise<{ found: boolean; message: string }> {
    if (!apiConfigured) {
      return { found: false, message: "Live league lookup is not configured in this build." };
    }

    setRulesAccepted(true);
    setProfile(nextProfile);
    const requestIdentity = getIdentityKey(nextProfile, localIdentity);
    const lookupEmail = nextProfile.email.trim().toLowerCase();

    setLeagueLoading(true);
    try {
      const payloads = await listLeaguesApi(requestIdentity, lookupEmail);
      const payload =
        (league ? payloads.find((item) => item.league.id === league.id) : null) ??
        payloads[0] ??
        (league?.inviteCode ? await getLeagueByInvite(requestIdentity, league.inviteCode, lookupEmail) : null) ??
        (tournamentStarted ? await getLeagueByInvite(requestIdentity, PUBLIC_LEAGUE_INVITE_CODE, lookupEmail) : null);

      if (payload) {
        applyLeaguePayload(payload);
      }

      if (payload?.currentEntrantId) {
        const foundEntrant = payload.entrants.find((entrant) => entrant.id === payload.currentEntrantId);
        if (foundEntrant) {
          setProfile((current) => ({
            ...current,
            email: lookupEmail,
            name: foundEntrant.name,
            role: nextProfile.role || current.role || "joiner",
          }));
        }

        return {
          found: true,
          message: `Found you as ${foundEntrant?.name ?? nextProfile.name}. Your row and watchlist are now highlighted on this device.`,
        };
      }

      return {
        found: false,
        message: "That email did not match an entry in this league. You can still browse the public table.",
      };
    } catch (error) {
      return {
        found: false,
        message: error instanceof Error ? error.message : "Could not check that email. Try again in a minute.",
      };
    } finally {
      setLeagueLoading(false);
    }
  }

  async function toggleActiveLeagueLocked() {
    if (!league?.adminCode) return;
    try {
      const payload = await setLeagueLocked(identityKey, league.id, league.adminCode, !league.locked);
      applyLeaguePayload(payload);
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not update lock status.");
    }
  }

  async function removeLeagueEntrant(entrantId: string) {
    if (!league?.adminCode) {
      throw new Error("Only the league organiser can remove entries.");
    }

    try {
      const payload = await removeEntrantApi(identityKey, league.id, league.adminCode, entrantId);
      applyLeaguePayload(payload);
      setAppNotice("Entry removed from this league.");
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not remove that entry.");
      throw error;
    }
  }

  async function refreshLeaguePayload(leagueId: string) {
    if (!apiConfigured || !leagueId) return;

    setLeagueLoading(true);
    try {
      const payloads = await listLeaguesApi(identityKey, profile.email);
      const payload = payloads.find((item) => item.league.id === leagueId);
      if (payload) applyLeaguePayload(payload);
    } catch (error) {
      setAppNotice(error instanceof Error ? error.message : "Could not refresh the league table.");
    } finally {
      setLeagueLoading(false);
    }
  }

  function selectLeague(leagueId: string) {
    setActiveLeagueId(leagueId);
    if (!apiConfigured) return;

    setLeagueLoading(true);
    listLeaguesApi(identityKey, profile.email)
      .then((payloads) => {
        const payload = payloads.find((item) => item.league.id === leagueId);
        if (payload) applyLeaguePayload(payload);
      })
      .catch((error) => setAppNotice(error instanceof Error ? error.message : "Could not switch leagues."))
      .finally(() => setLeagueLoading(false));
  }

  function changeTab(tab: AppTab) {
    const canBrowseLive = rulesAccepted || tournamentStarted;

    if (tab !== "rules" && !canBrowseLive) {
      setActiveTab("rules");
      return;
    }
    if (tab === "picks" && !league) {
      setActiveTab("league");
      return;
    }
    if (tab === "picks" && tournamentStarted && !currentEntrantId) {
      setAppNotice("Entries are locked, so this device is browsing the revealed league instead of an editable pick slip.");
      setActiveTab("league");
      return;
    }
    if (tab === "picks" && !profileReady) {
      setAppNotice("Add your email and display name first, then you can make picks.");
      setActiveTab("league");
      return;
    }
    if (tab === "picks" && !rulesAccepted) {
      setActiveTab("rules");
      return;
    }
    if ((tab === "live" || tab === "table") && !league) {
      if (tournamentStarted) {
        setAppNotice("Opening the main league...");
        void viewLeagueByInvite(PUBLIC_LEAGUE_INVITE_CODE);
        setActiveTab("league");
        return;
      }

      setActiveTab(rulesAccepted ? "league" : "rules");
      return;
    }
    setActiveTab(tab);
    if (tab === "table" && league?.id) {
      void refreshLeaguePayload(league.id);
    }
  }

  function renderScreen() {
    switch (activeTab) {
      case "rules":
        return (
          <RulesScreen
            prizePotLabel={prizePotLabel}
            accepted={rulesAccepted}
            canViewLeaderboard={Boolean(league)}
            tournamentStarted={tournamentStarted}
            onAccept={acceptRules}
            onViewLeaderboard={() => changeTab("table")}
          />
        );
      case "picks":
        return (
          <PicksScreen
            entry={entry}
            league={league}
            scores={teamScores}
            fixtures={fixtures}
            leaderboardRow={currentEntrantId ? displayLeaderboard.find((row) => row.entrant.id === currentEntrantId) ?? null : null}
            correctBonusTeamName={correctPredictions.highest_scoring_team}
            prizePotLabel={prizePotLabel}
            rulesAccepted={rulesAccepted}
            selectedPot={selectedPot}
            onSelectPot={setSelectedPot}
            onPickTeam={pickTeam}
            onPrediction={updatePrediction}
            onConfirm={confirmPicks}
            onGoToLeague={() => changeTab("league")}
            onGoToLive={() => changeTab("live")}
          />
        );
      case "live":
        return (
          <LiveScreen
            entry={entry}
            scores={teamScores}
            leaderboard={displayLeaderboard}
            fixtures={fixtures}
            liveLoading={liveLoading}
            liveError={liveError}
            locked={league?.locked ?? false}
          />
        );
      case "table":
        return (
          <LeaderboardScreen
            rows={displayLeaderboard}
            entrants={entrants}
            globalRows={[]}
            leagues={leagues}
            activeLeagueId={league?.id ?? ""}
            currentEntrantId={currentEntrantId}
            picksVisible={picksRevealed}
            scores={teamScores}
            loading={leagueLoading}
            onSelectLeague={selectLeague}
            onOpenOverview={() => changeTab("league")}
          />
        );
      case "league":
        if (tournamentStarted && league) {
          return (
            <MatchdayOverviewScreen
              league={league}
              entry={entry}
              entrants={entrants}
              currentEntrantId={currentEntrantId}
              leaderboard={displayLeaderboard}
              scores={teamScores}
              snapshots={leaderboardSnapshots}
              fixtures={fixtures}
              liveLoading={liveLoading}
              liveError={liveError}
              liveSyncedAt={liveSyncedAt}
              profile={profile}
              onFindEntry={findEntryByProfile}
              onOpenTable={() => changeTab("table")}
              onOpenMatches={() => changeTab("live")}
              onOpenScoring={() => changeTab("rules")}
              onOpenEntry={() => changeTab("picks")}
            />
          );
        }

        return (
          <LeagueScreen
            league={league}
            leagues={leagues}
            activeLeagueId={league?.id ?? ""}
            entrants={entrants}
            profile={profile}
            isLeagueCreator={isLeagueCreator}
            currentEntrantId={currentEntrantId}
            pendingInviteCode={pendingInviteCode}
            prizePotLabel={prizePotLabel}
            tournamentStarted={tournamentStarted}
            onSelectLeague={selectLeague}
            onProfileChange={setProfile}
            onCreateLeague={createLeague}
            onJoinLeague={joinLeague}
            onGoToPicks={() => changeTab("picks")}
            onRemoveEntrant={removeLeagueEntrant}
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
          tournamentStarted={tournamentStarted}
          currentEntrantId={currentEntrantId}
          onSelectLeague={selectLeague}
          onJoinLeague={requestJoin}
          onFindEntry={findEntryByProfile}
          onOpenLeagueHub={() => changeTab("league")}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        />

        {!tournamentStarted ? (
          <MobileJourneyStepper
            activeTab={activeTab}
            hasLeague={Boolean(league)}
            profileReady={profileReady}
            rulesAccepted={rulesAccepted}
            tournamentStarted={tournamentStarted}
            currentEntrantId={currentEntrantId}
            onChange={changeTab}
          />
        ) : null}

        {league ? (
          <div className="app-live-ticker" aria-label="Tournament ticker">
            <span>{liveLoading ? "Refreshing feed" : "Tournament feed"}</span>
            {getCurrentFixtures(fixtures).slice(0, 3).map((fixture) => (
              <strong key={fixture.id}>
                {formatFixtureTime(fixture)} · {fixture.home.shortName} {formatFixtureScore(fixture)} {fixture.away.shortName}
              </strong>
            ))}
            {fixtures.length === 0 ? <strong>Waiting for ESPN fixtures</strong> : null}
            {liveSyncedAt && !liveLoading ? (
              <em className="ticker-updated">
                Updated {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(liveSyncedAt)}
              </em>
            ) : null}
          </div>
        ) : null}

        <div className="app-body">
          <DesktopSidebar
            activeTab={activeTab}
            entry={entry}
            hasLeague={Boolean(league)}
            profileReady={profileReady}
            rulesAccepted={rulesAccepted}
            tournamentStarted={tournamentStarted}
            currentEntrantId={currentEntrantId}
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
            {shouldShowTournamentLoading ? <TournamentLoadingScreen leagueName={league?.name ?? "World cup Singles"} /> : renderScreen()}
            <ScreenDisclaimer />
          </main>

          <DesktopRail
            entry={entry}
            fixtures={fixtures}
            leaderboard={displayLeaderboard}
            league={league}
            rulesAccepted={rulesAccepted}
            liveError={liveError}
            liveLoading={liveLoading}
            scores={teamScores}
            onChange={changeTab}
          />
        </div>

        <BottomNav
          active={activeTab}
          rulesAccepted={rulesAccepted}
          hasLeague={Boolean(league)}
          tournamentStarted={tournamentStarted}
          currentEntrantId={currentEntrantId}
          onChange={changeTab}
        />
      </div>
    </div>
  );
}

export default App;
