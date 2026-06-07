import { Check, ChevronDown, LogIn, Moon, Sun, Trophy } from "lucide-react";
import { useState } from "react";
import { getEntryFeeLabel, getPrizePotLabel } from "../lib/money";
import type { League, ThemeMode, UserProfile } from "../types";

interface AppHeaderProps {
  league: League;
  leagues: League[];
  activeLeagueId: string;
  profile: UserProfile;
  prizePotLabel: string;
  theme: ThemeMode;
  onSelectLeague: (leagueId: string) => void;
  onJoinLeague: (inviteCode: string) => void;
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
          <Trophy size={18} />
        </div>
        <div>
          <p className="brand-name">Pot To Glory</p>
          <p className="league-name">{league.name}</p>
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
          {league.inviteCode}
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
              <small>{profile.role === "creator" ? "Creator profile" : "Joiner profile"}</small>
            </span>
            <b>{prizePotLabel}</b>
          </div>
          <div className="header-league-list">
            {leagues.map((item) => {
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
                    <small>{item.inviteCode} · {getEntryFeeLabel(item)} · {getPrizePotLabel(item, 10)}</small>
                  </span>
                  {active ? <Check size={16} /> : null}
                </button>
              );
            })}
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
