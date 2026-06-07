import { CheckCircle2, Copy, KeyRound, Layers, Lock, Mail, Settings, Unlock, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPence, getEntryFeeLabel, getPrizePotLabel, parseEntryFeeToPence } from "../lib/money";
import { demoMode, supabase } from "../lib/supabase";
import type { Entrant, League, LeagueCreateInput, UserProfile, UserRole } from "../types";

interface LeagueScreenProps {
  league: League;
  leagues: League[];
  activeLeagueId: string;
  entrants: Entrant[];
  profile: UserProfile;
  isLeagueCreator: boolean;
  prizePotLabel: string;
  onSelectLeague: (leagueId: string) => void;
  onProfileChange: (profile: UserProfile) => void;
  onCreateLeague: (settings: LeagueCreateInput) => void;
  onJoinLeague: (inviteCode: string) => void;
  onToggleLocked: () => void;
}

export function LeagueScreen({
  league,
  leagues,
  activeLeagueId,
  entrants,
  profile,
  isLeagueCreator,
  prizePotLabel,
  onSelectLeague,
  onProfileChange,
  onCreateLeague,
  onJoinLeague,
  onToggleLocked,
}: LeagueScreenProps) {
  const [profileEmail, setProfileEmail] = useState(profile.email);
  const [profileName, setProfileName] = useState(profile.name);
  const [profileRole, setProfileRole] = useState<UserRole>(profile.role);
  const [newLeagueName, setNewLeagueName] = useState("Saturday Football Fund");
  const [newEntryFee, setNewEntryFee] = useState("");
  const [inviteOpen, setInviteOpen] = useState(league.inviteOpen);
  const [noMaxMembers, setNoMaxMembers] = useState(league.maxEntrants === null);
  const [maxMembers, setMaxMembers] = useState(String(league.maxEntrants ?? 30));
  const [joinCode, setJoinCode] = useState(league.inviteCode);
  const [notice, setNotice] = useState("Profile and league changes are saved locally for this demo.");
  const draftEntryFeePence = parseEntryFeeToPence(newEntryFee);
  const draftPrizePotLabel = getPrizePotLabel({ ...league, entryFeePence: draftEntryFeePence }, entrants.length);
  const parsedMaxMembers = Math.max(entrants.length, Number.parseInt(maxMembers, 10) || entrants.length);
  const profileLabel = profile.role === "creator" ? "Creator profile" : "Joiner profile";
  const leagueAccessLabel = isLeagueCreator ? "Owner of this league" : "Viewing as joiner";

  useEffect(() => {
    setProfileEmail(profile.email);
    setProfileName(profile.name);
    setProfileRole(profile.role);
  }, [profile]);

  useEffect(() => {
    setInviteOpen(league.inviteOpen);
    setNoMaxMembers(league.maxEntrants === null);
    setMaxMembers(String(league.maxEntrants ?? 30));
    setJoinCode(league.inviteCode);
  }, [league]);

  function createLeague() {
    const settings = {
      name: newLeagueName.trim() || "New Cup League",
      entryFeePence: draftEntryFeePence,
      inviteOpen,
      maxEntrants: noMaxMembers ? null : parsedMaxMembers,
    };
    onCreateLeague(settings);
    setNotice(
      `League added to My leagues with ${formatPence(draftEntryFeePence)} entry, ${draftPrizePotLabel}, ${
        inviteOpen ? "open invite" : "invite code"
      } and ${settings.maxEntrants === null ? "no member cap" : `${settings.maxEntrants} max members`}.`,
    );
  }

  function joinLeague() {
    onJoinLeague(joinCode.trim().toUpperCase() || league.inviteCode);
    setNotice("Joined league by invite code and added it to My leagues.");
  }

  async function loginWithEmail() {
    const email = profileEmail.trim().toLowerCase() || profile.email;
    const nextProfile = {
      id: email.replace(/[^a-z0-9]+/g, "-"),
      email,
      name: profileName.trim() || email.split("@")[0] || "Player",
      role: profileRole,
    };

    onProfileChange(nextProfile);

    if (!supabase || demoMode) {
      setNotice(`Logged in locally as ${profileRole === "creator" ? "creator" : "joiner"} profile.`);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setNotice(error ? `Email login failed: ${error.message}` : `Magic link sent to ${email}.`);
  }

  function useCreatorProfile() {
    onProfileChange({
      id: "creator-profile",
      email: league.creatorEmail,
      name: "League Creator",
      role: "creator",
    });
  }

  function useJoinerProfile() {
    onProfileChange({
      id: "joiner-profile",
      email: "joiner@pottoglory.app",
      name: "Joiner",
      role: "joiner",
    });
  }

  return (
    <section className="screen-stack">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Profile</p>
            <h2>Email login</h2>
          </div>
          <span className="mini-badge">{profile.role === "creator" ? "Creator" : "Joiner"}</span>
        </div>
        <div className="profile-card">
          <span className="league-icon"><UserRound size={18} /></span>
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.email}</small>
            <small>{profileLabel} · {leagueAccessLabel}</small>
          </span>
        </div>
        <div className="profile-actions">
          <button type="button" className="text-button" onClick={useCreatorProfile}>Creator</button>
          <button type="button" className="text-button" onClick={useJoinerProfile}>Joiner</button>
        </div>
        <div className="form-grid compact-form">
          <label>
            <span>Email</span>
            <input value={profileEmail} inputMode="email" onChange={(event) => setProfileEmail(event.target.value)} />
          </label>
          <label>
            <span>Name</span>
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          </label>
          <label>
            <span>Profile type</span>
            <select value={profileRole} onChange={(event) => setProfileRole(event.target.value as UserRole)}>
              <option value="creator">Creator</option>
              <option value="joiner">Joiner</option>
            </select>
          </label>
          <button className="secondary-cta" type="button" onClick={loginWithEmail}>
            <Mail size={17} />
            Login with email
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">My leagues</p>
            <h2>Switch competition</h2>
          </div>
          <span className="mini-badge">{leagues.length} joined</span>
        </div>
        <div className="joined-league-list">
          {leagues.map((item) => {
            const active = item.id === activeLeagueId;

            return (
              <button
                key={item.id}
                className={active ? "joined-league-card active" : "joined-league-card"}
                type="button"
                onClick={() => onSelectLeague(item.id)}
                aria-pressed={active}
              >
                <span className="league-icon">
                  {active ? <CheckCircle2 size={18} /> : <Layers size={18} />}
                </span>
                <span className="joined-league-copy">
                  <strong>{item.name}</strong>
                  <small>{item.inviteCode} · {getEntryFeeLabel(item)} · {getPrizePotLabel(item, entrants.length)}</small>
                </span>
                <span className="joined-league-state">{active ? "Active" : item.locked ? "Locked" : "Open"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">League room</p>
            <h2>{league.name}</h2>
          </div>
          <span className="mini-badge">{prizePotLabel}</span>
        </div>
        <div className="league-grid">
          <article className="league-tile">
            <Users size={20} />
            <strong>{entrants.length} entrants</strong>
            <small>Duplicate country picks allowed</small>
          </article>
          <article className="league-tile">
            <Settings size={20} />
            <strong>{getEntryFeeLabel(league)}</strong>
            <small>{entrants.length} entrants makes {prizePotLabel}</small>
          </article>
          <article className="league-tile">
            <KeyRound size={20} />
            <strong>{league.inviteOpen ? "Open invite" : league.inviteCode}</strong>
            <small>{league.inviteOpen ? "Anyone with link can join" : "Invite code required"}</small>
          </article>
          <article className="league-tile">
            <Lock size={20} />
            <strong>{league.maxEntrants === null ? "No member cap" : `${league.maxEntrants} max`}</strong>
            <small>{league.maxEntrants === null ? "Unlimited entries" : "Entry limit enabled"}</small>
          </article>
        </div>
        <button className="secondary-cta" type="button">
          <Copy size={17} />
          Copy invite
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Join league</p>
            <h2>Enter invite code</h2>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Join with invite code</span>
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
          </label>
          <button className="secondary-cta" type="button" onClick={joinLeague}>
            Join league
          </button>
        </div>
        <p className="admin-notice">{notice}</p>
      </div>

      {profile.role === "creator" ? (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Create league</p>
              <h2>New competition setup</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>New league name</span>
              <input value={newLeagueName} onChange={(event) => setNewLeagueName(event.target.value)} />
            </label>
            <label>
              <span>Entry fee per person</span>
              <input
                inputMode="decimal"
                value={newEntryFee}
                onChange={(event) => setNewEntryFee(event.target.value)}
                aria-describedby="entry-fee-preview"
              />
            </label>
            <div className="pot-preview full-pot-preview" id="entry-fee-preview">
              <span>Full pot</span>
              <strong>{draftPrizePotLabel}</strong>
              <small>{formatPence(draftEntryFeePence)} entry × {entrants.length} entrants</small>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={inviteOpen} onChange={(event) => setInviteOpen(event.target.checked)} />
              <span>
                <strong>Open invite</strong>
                <small>Anyone with the invite link can join.</small>
              </span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={noMaxMembers}
                onChange={(event) => setNoMaxMembers(event.target.checked)}
              />
              <span>
                <strong>No max members</strong>
                <small>Let the league grow without a fixed entrant limit.</small>
              </span>
            </label>
            {!noMaxMembers ? (
              <label>
                <span>Max members</span>
                <input
                  inputMode="numeric"
                  value={maxMembers}
                  onChange={(event) => setMaxMembers(event.target.value)}
                />
              </label>
            ) : null}
            <button className="secondary-cta" type="button" onClick={createLeague}>
              Create league
            </button>
          </div>
        </div>
      ) : null}

      {isLeagueCreator ? (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Organiser controls</p>
              <h2>Lock status</h2>
            </div>
            <span className="mini-badge">{league.locked ? "Locked" : "Open"}</span>
          </div>
          <button className="secondary-cta" type="button" onClick={onToggleLocked}>
            {league.locked ? <Unlock size={17} /> : <Lock size={17} />}
            {league.locked ? "Reopen demo picks" : "Lock demo picks"}
          </button>
        </div>
      ) : null}

      <div className="panel rules-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Rules</p>
            <h2>Simple enough for kickoff</h2>
          </div>
        </div>
        <ul className="rules-list">
          <li>Pick exactly one country from Pot 1, Pot 2, Pot 3 and Pot 4.</li>
          <li>Group win is +3, draw is +1, loss is 0.</li>
          <li>Knockout normal-time win is +3; extra-time or penalties win is +2.</li>
          <li>Advance from group +3, quarter-final +5, semi-final +7, final +10, champion +15.</li>
          <li>Correct highest-scoring team bonus is +10.</li>
          <li>Once the tournament starts, picks are locked.</li>
        </ul>
      </div>
    </section>
  );
}
