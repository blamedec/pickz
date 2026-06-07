import { Check, ChevronDown, LogIn, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { getEntryFeeLabel, getPrizePotLabel } from "../lib/money";
import type { League, ThemeMode, UserProfile } from "../types";

interface AppHeaderProps {
  league: League | null;
  leagues: League[];
  activeLeagueId: string;
  profile: UserProfile;
  prizePotLabel: string;
  theme: ThemeMode;
  onSelectLeague: (leagueId: string) => void;
  onJoinLeague: (inviteCode: string) => void | Promise<void>;
  onToggleTheme: () => void;
}

export function AppHeader({
  league,
  leagues,
  activeLeagueId,
  profile,
  prizePotLabel,
  theme,
  onSelectLeague,
  onJoinLeague,
  onToggleTheme,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  function joinFromHeader() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    onJoinLeague(code);
    setJoinCode("");
    setMenuOpen(false);
  }

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <svg className="brand-logo-svg" viewBox="0 0 48 48" focusable="false">
            <rect className="brand-logo-bg" width="48" height="48" rx="12" />
            <g className="brand-logo-slips">
              <rect className="slip-red" x="13" y="8" width="6" height="15" rx="1.5" transform="rotate(-14 16 15.5)" />
              <rect className="slip-gold" x="19" y="6" width="6" height="17" rx="1.5" transform="rotate(-4 22 14.5)" />
              <rect className="slip-blue" x="25" y="7" width="6" height="16" rx="1.5" transform="rotate(8 28 15)" />
              <rect className="slip-green" x="31" y="9" width="6" height="14" rx="1.5" transform="rotate(18 34 16)" />
            </g>
            <path className="brand-logo-hat" d="M13 27.5c0-2.4 2-4.3 4.4-4.3h13.2c2.4 0 4.4 1.9 4.4 4.3v4.9H13v-4.9Z" />
            <path className="brand-logo-brim" d="M8.5 31.2c0-2 1.6-3.6 3.6-3.6h23.8c2 0 3.6 1.6 3.6 3.6 0 1.4-1.1 2.5-2.5 2.5H11c-1.4 0-2.5-1.1-2.5-2.5Z" />
            <path className="brand-logo-band" d="M14.2 28h19.6v3.2H14.2z" />
          </svg>
        </div>
        <div>
          <p className="brand-name">Pick<span>Four</span></p>
          <p className="league-name">{league?.name ?? "Four slips. One league."}</p>
        </div>
      </div>

      <div className="header-actions" aria-label="League controls">
        <button
          className="code-chip"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="league-switcher-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {league?.inviteCode ?? "Join"}
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
              <strong>{profile.name}</strong>
              <small>{profile.role === "creator" ? "Organiser account" : "Player account"}</small>
            </span>
            <b>{prizePotLabel}</b>
          </div>
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
                <small>Join with a code or create one from the League tab.</small>
              </div>
            )}
          </div>
          <label className="header-join-row">
            <span>Join league</span>
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Invite code" />
          </label>
          <button className="header-join-button" type="button" onClick={joinFromHeader}>
            <LogIn size={15} />
            Join
          </button>
        </div>
      ) : null}
    </header>
  );
}
