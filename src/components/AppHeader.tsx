import { Check, ChevronDown, LogIn, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getEntryFeeLabel, getPrizePotLabel } from "../lib/money";
import type { League, ThemeMode, UserProfile } from "../types";

interface AppHeaderProps {
  league: League | null;
  leagues: League[];
  activeLeagueId: string;
  profile: UserProfile;
  prizePotLabel: string;
  theme: ThemeMode;
  tournamentStarted: boolean;
  currentEntrantId: string | null;
  onSelectLeague: (leagueId: string) => void;
  onJoinLeague: (inviteCode: string) => void | Promise<void>;
  onFindEntry: (profile: UserProfile) => Promise<{ found: boolean; message: string }>;
  onOpenLeagueHub: () => void;
  onToggleTheme: () => void;
}

export function AppHeader({
  league,
  leagues,
  activeLeagueId,
  profile,
  prizePotLabel,
  theme,
  tournamentStarted,
  currentEntrantId,
  onSelectLeague,
  onJoinLeague,
  onFindEntry,
  onOpenLeagueHub,
  onToggleTheme,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [findEmail, setFindEmail] = useState(profile.email);
  const [findName, setFindName] = useState(profile.name);
  const [findBusy, setFindBusy] = useState(false);
  const [findMessage, setFindMessage] = useState("");
  const profileName = profile.name.trim() || "Spectator";
  const leagueControlLabel = tournamentStarted
    ? currentEntrantId
      ? "My entry"
      : "Log in"
    : league
      ? leagues.length > 1
        ? `${leagues.length} leagues`
        : league.inviteCode
      : "Join";

  function joinFromHeader() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    onJoinLeague(code);
    setJoinCode("");
    setMenuOpen(false);
  }

  async function findFromHeader() {
    const email = findEmail.trim().toLowerCase();
    const name = findName.trim() || profile.name || email.split("@")[0] || "Player";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFindMessage("Use the same email you entered before picks locked.");
      return;
    }

    setFindBusy(true);
    setFindMessage("Checking the entry list...");
    try {
      const result = await onFindEntry({
        ...profile,
        email,
        name,
        role: profile.role || "joiner",
      });
      setFindMessage(result.message);
    } catch (error) {
      setFindMessage(error instanceof Error ? error.message : "Could not check that email. Try again in a minute.");
    } finally {
      setFindBusy(false);
    }
  }

  useEffect(() => {
    setFindEmail(profile.email);
    setFindName(profile.name);
  }, [profile.email, profile.name]);

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <img className="brand-logo-image" src="/icons/pickfour-logo.png" alt="" width="512" height="512" />
        </div>
        <div>
          <p className="brand-name">Pick<span>Four</span></p>
          <p className="league-name">{league?.name ?? "Four picks. One league."}</p>
        </div>
      </div>

      <div className="header-actions" aria-label="League controls">
        <button
          className="code-chip"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="league-switcher-menu"
          aria-label={league ? "Open league switcher" : "Join a league"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {leagueControlLabel}
          <ChevronDown size={14} />
        </button>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle light and dark mode">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="header-league-menu" id="league-switcher-menu">
          <div className="menu-meta">
            <span>
              <strong>{profileName}</strong>
              <small>
                {tournamentStarted
                  ? currentEntrantId
                    ? "Entry recognised"
                    : "Viewing as spectator"
                  : profile.role === "creator"
                    ? "Organiser account"
                    : "Player account"}
              </small>
            </span>
            <b>{prizePotLabel}</b>
          </div>
          {league ? (
            <p className="menu-helper">
              {tournamentStarted ? "Viewing" : "Active league"}: <strong>{league.name}</strong> · invite{" "}
              <strong>{league.inviteCode}</strong>
            </p>
          ) : null}
          <div className="header-league-list">
            {leagues.length > 0 ? (
              leagues.map((item) => {
                const active = item.id === activeLeagueId;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={active ? "header-league-option active" : "header-league-option"}
                    onClick={() => {
                      onSelectLeague(item.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.inviteCode} · {getEntryFeeLabel(item)} · {getPrizePotLabel(item, 0)}</small>
                    </span>
                    {active ? <Check size={16} /> : null}
                  </button>
                );
              })
            ) : (
              <div className="menu-empty-state">
                <strong>No leagues yet</strong>
                <small>
                  {tournamentStarted
                    ? "Entries are closed, but you can still open a league with an invite code."
                    : "Join with a code or create one from the League tab."}
                </small>
              </div>
            )}
          </div>
          {tournamentStarted ? (
            <div className="header-find-entry">
              <label className="header-join-row">
                <span>Email used for picks</span>
                <input value={findEmail} inputMode="email" autoComplete="email" onChange={(event) => setFindEmail(event.target.value)} placeholder="Email used for picks" />
              </label>
              <label className="header-join-row">
                <span>Name, optional</span>
                <input value={findName} autoComplete="name" onChange={(event) => setFindName(event.target.value)} placeholder="e.g. Declan" />
              </label>
              <button className="header-join-button" type="button" onClick={findFromHeader} disabled={findBusy}>
                <LogIn size={15} />
                {findBusy ? "Checking..." : "Log in to entry"}
              </button>
              {findMessage ? <p className="header-find-message">{findMessage}</p> : null}
            </div>
          ) : (
            <>
              <label className="header-join-row">
                <span>Join league</span>
                <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Invite code" />
              </label>
              <button className="header-join-button" type="button" onClick={joinFromHeader}>
                <LogIn size={15} />
                Join
              </button>
            </>
          )}
          <button
            className="header-manage-button"
            type="button"
            onClick={() => {
              onOpenLeagueHub();
              setMenuOpen(false);
            }}
          >
            <Plus size={15} />
            {tournamentStarted ? "Open overview" : "Manage leagues"}
          </button>
        </div>
      ) : null}
    </header>
  );
}
