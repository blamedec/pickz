import { CheckCircle2, Copy, KeyRound, Layers, Link2, Lock, Mail, Settings, Trophy, Unlock, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPence, getEntryFeeLabel, getPrizePotLabel, parseEntryFeeToPence } from "../lib/money";
import { apiConfigured, demoMode, supabase } from "../lib/supabase";
import type { Entrant, League, LeagueCreateInput, UserProfile, UserRole } from "../types";

interface LeagueScreenProps {
  league: League | null;
  leagues: League[];
  activeLeagueId: string;
  entrants: Entrant[];
  profile: UserProfile;
  isLeagueCreator: boolean;
  prizePotLabel: string;
  onSelectLeague: (leagueId: string) => void;
  onProfileChange: (profile: UserProfile) => void;
  onCreateLeague: (settings: LeagueCreateInput) => Promise<void> | void;
  onJoinLeague: (inviteCode: string) => Promise<void> | void;
  onToggleLocked: () => Promise<void> | void;
}

function getAuthRedirectUrl() {
  const configuredRedirect =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
    (import.meta.env.VITE_SITE_URL as string | undefined);

  if (configuredRedirect) {
    try {
      return new URL(configuredRedirect).origin;
    } catch {
      return configuredRedirect;
    }
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "https://pot-to-glory.vercel.app";
  }

  return window.location.origin;
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
  const [noMaxMembers, setNoMaxMembers] = useState(league ? league.maxEntrants === null : true);
  const [maxMembers, setMaxMembers] = useState(String(league?.maxEntrants ?? 30));
  const [joinCode, setJoinCode] = useState("");
  const [notice, setNotice] = useState(apiConfigured ? "Connected to the live PickFour backend." : "Supabase is not configured for this build.");
  const [busy, setBusy] = useState(false);
  const draftEntryFeePence = parseEntryFeeToPence(newEntryFee);
  const draftPrizePotLabel = `${formatPence(draftEntryFeePence * entrants.length)} pot`;
  const parsedMaxMembers = Math.max(1, entrants.length, Number.parseInt(maxMembers, 10) || entrants.length);
  const draftEmail = profileEmail.trim().toLowerCase();
  const draftName = profileName.trim();
  const profileLabel = profileRole === "creator" ? "League organiser" : "Player";
  const profileDisplayName = draftName || (profile.name === "Player" && !profile.email ? "Add your display name" : profile.name);
  const profileEmailLabel = draftEmail || profile.email || "Add email to sign up";
  const leagueAccessLabel = !league ? "Create or join a league" : isLeagueCreator ? "Can manage setup" : "Can make picks";
  const shareUrl = league ? `${window.location.origin}/?join=${league.inviteCode}` : "";
  const hasSignedUp = Boolean(profile.email || draftEmail);

  useEffect(() => {
    setProfileEmail(profile.email);
    setProfileName(profile.name);
    setProfileRole(profile.role);
  }, [profile]);

  useEffect(() => {
    setNoMaxMembers(league ? league.maxEntrants === null : true);
    setMaxMembers(String(league?.maxEntrants ?? 30));
  }, [league]);

  function buildDraftProfile() {
    const email = draftEmail;
    const name = draftName || (email ? email.split("@")[0] : profile.name) || "Player";

    return {
      ...profile,
      id: email ? email.replace(/[^a-z0-9]+/g, "-") : profile.id,
      email,
      name,
      role: profileRole,
    };
  }

  function saveProfileDraft() {
    const nextProfile = buildDraftProfile();
    onProfileChange(nextProfile);
    return nextProfile;
  }

  function requireProfileReady(action: string) {
    if (!draftEmail || !draftName || draftName.toLowerCase() === "player") {
      setNotice(`Add your email and display name before ${action}.`);
      return false;
    }

    saveProfileDraft();
    return true;
  }

  async function createLeague() {
    if (!requireProfileReady("creating a league")) return;

    const settings = {
      name: newLeagueName.trim() || "New Cup League",
      entryFeePence: draftEntryFeePence,
      inviteOpen: true,
      maxEntrants: noMaxMembers ? null : parsedMaxMembers,
    };
    setBusy(true);
    try {
      await onCreateLeague(settings);
      setNotice(
        `League created. Share the join link or invite code, then players can sign up and make picks.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create league.");
    } finally {
      setBusy(false);
    }
  }

  async function joinLeague() {
    if (!requireProfileReady("joining a league")) return;

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setNotice("Enter an invite code first.");
      return;
    }
    setBusy(true);
    try {
      await onJoinLeague(code);
      setNotice("Joined league and added it to My leagues.");
      setJoinCode("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not join that league.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailLink() {
    if (!draftEmail || !draftName || draftName.toLowerCase() === "player") {
      setNotice("Add your email and display name before requesting a sign-up link.");
      return;
    }
    const nextProfile = saveProfileDraft();

    if (!supabase || demoMode) {
      setNotice(`Profile saved as ${profileRole === "creator" ? "organiser" : "player"}.`);
      return;
    }

    const redirectUrl = getAuthRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: nextProfile.email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: nextProfile.name,
          role: nextProfile.role,
        },
      },
    });

    setNotice(error ? `Email sign-up failed: ${error.message}` : `Sign-up link sent to ${nextProfile.email}.`);
  }

  function chooseProfileRole(role: UserRole) {
    setProfileRole(role);
    onProfileChange({
      ...profile,
      email: profileEmail.trim().toLowerCase() || profile.email,
      name: profileName.trim() || profile.name,
      role,
    });
  }

  async function copyInvite() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setNotice(`Invite link copied: ${shareUrl}`);
  }

  return (
    <section
      className={`screen-stack league-screen ${league ? "has-league" : "no-league"} ${
        profileRole === "creator" ? "is-organiser" : "is-player"
      }`}
    >
      {!league ? (
        <div className="panel onboarding-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Next step</p>
              <h2>Sign up, then choose your route</h2>
            </div>
            <span className="mini-badge">Step 2</span>
          </div>
          <div className="league-route-map">
            <button
              type="button"
              className={profileRole === "joiner" ? "league-route-card active" : "league-route-card"}
              onClick={() => chooseProfileRole("joiner")}
            >
              <KeyRound size={18} />
              <span>
                <strong>I have an invite code</strong>
                <small>Paste the code from the group chat and go straight to picks.</small>
              </span>
            </button>
            <button
              type="button"
              className={profileRole === "creator" ? "league-route-card active" : "league-route-card"}
              onClick={() => chooseProfileRole("creator")}
            >
              <Trophy size={18} />
              <span>
                <strong>Create a tournament</strong>
                <small>Name it, set the entry fee, then send friends the private link.</small>
              </span>
            </button>
          </div>
          <p className="helper-copy">
            PickFour works best as a friend-league ritual: one organiser creates the tournament, everyone else joins with the invite code.
          </p>
        </div>
      ) : null}

      <div className="panel account-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Account</p>
            <h2>{hasSignedUp ? "Your PickFour account" : "Sign up first"}</h2>
          </div>
          <span className="mini-badge">{profileRole === "creator" ? "Organiser" : "Player"}</span>
        </div>
        <div className="profile-card">
          <span className="league-icon"><UserRound size={18} /></span>
          <span>
            <strong>{profileLabel}</strong>
            <small>{profileDisplayName}</small>
            <small>{profileEmailLabel} · {leagueAccessLabel}</small>
          </span>
        </div>
        <div className="profile-actions" aria-label="Choose how you want to use PickFour">
          <button
            type="button"
            className={profileRole === "creator" ? "role-option active" : "role-option"}
            aria-pressed={profileRole === "creator"}
            onClick={() => chooseProfileRole("creator")}
          >
            <Settings size={17} />
            <span>
              <strong>Create tournament</strong>
              <small>Set up the league, share the link, lock picks.</small>
            </span>
          </button>
          <button
            type="button"
            className={profileRole === "joiner" ? "role-option active" : "role-option"}
            aria-pressed={profileRole === "joiner"}
            onClick={() => chooseProfileRole("joiner")}
          >
            <Users size={17} />
            <span>
              <strong>I have a code</strong>
              <small>Join with a link or invite code, then make picks.</small>
            </span>
          </button>
        </div>
        <div className="form-grid compact-form">
          <p className="helper-copy">Use the same email when you come back. We send a magic link, so no password is needed.</p>
          <label>
            <span>Email</span>
            <input value={profileEmail} inputMode="email" onChange={(event) => setProfileEmail(event.target.value)} />
          </label>
          <label>
            <span>Name</span>
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          </label>
          <button className="secondary-cta" type="button" onClick={sendEmailLink}>
            <Mail size={17} />
            Send sign-up link
          </button>
        </div>
      </div>

      {leagues.length > 0 ? (
      <div className="panel my-leagues-panel">
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
          {leagues.length === 0 ? (
            <div className="empty-state">
              <strong>No leagues joined yet</strong>
              <small>Create a league or paste an invite code to get started.</small>
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      {league ? (
        <div className="panel league-room-panel">
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
              <strong>{league.inviteCode}</strong>
              <small>Invite code for manual joining</small>
            </article>
            <article className="league-tile">
              <Lock size={20} />
              <strong>{league.maxEntrants === null ? "No player limit" : `${league.maxEntrants} players max`}</strong>
              <small>{league.maxEntrants === null ? "Anyone with the link can enter" : "Player limit enabled"}</small>
            </article>
          </div>
          <div className="share-panel">
            <span>
              <Link2 size={17} />
              <strong>Share this league</strong>
            </span>
            <code>{shareUrl}</code>
            <button className="secondary-cta" type="button" onClick={copyInvite}>
              <Copy size={17} />
              Copy join link
            </button>
            <small>Send the link to friends. If they only have the code, they can paste {league.inviteCode} in Join league.</small>
          </div>
        </div>
      ) : null}

      {(!league && profileRole === "joiner") || league ? (
      <div className="panel join-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Join league</p>
            <h2>Paste the invite code</h2>
          </div>
        </div>
          <p className="helper-copy">Got a join link? Open it and you will be added automatically. Got a code? Paste it here.</p>
        <div className="form-grid">
          <label>
            <span>Invite code</span>
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
          </label>
          <button className={league ? "secondary-cta" : "primary-cta"} type="button" onClick={joinLeague} disabled={busy}>
            Join league
          </button>
        </div>
        <p className="admin-notice">{notice}</p>
      </div>
      ) : null}

      {!league && profileRole === "creator" ? (
        <div className="panel create-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Create league</p>
              <h2>Start a league</h2>
            </div>
          </div>
          <p className="helper-copy">Create a league, then copy the private join link. Friends can sign up, join, and make picks before the lock.</p>
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
            <div className="invite-method-card">
              <Link2 size={18} />
              <span>
                <strong>Private join link included</strong>
                <small>Every league gets a private link and invite code after creation.</small>
              </span>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={noMaxMembers}
                onChange={(event) => setNoMaxMembers(event.target.checked)}
              />
              <span>
                <strong>No player limit</strong>
                <small>Let anyone with the join link enter before picks lock.</small>
              </span>
            </label>
            {!noMaxMembers ? (
              <label>
                <span>Max players</span>
                <input
                  inputMode="numeric"
                  value={maxMembers}
                  onChange={(event) => setMaxMembers(event.target.value)}
                />
              </label>
            ) : null}
            <button className={league ? "secondary-cta" : "primary-cta"} type="button" onClick={createLeague} disabled={busy}>
              Create league
            </button>
          </div>
          <p className="admin-notice">{notice}</p>
        </div>
      ) : null}

      {isLeagueCreator && league ? (
        <div className="panel organiser-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Organiser controls</p>
              <h2>Lock status</h2>
            </div>
            <span className="mini-badge">{league.locked ? "Locked" : "Open"}</span>
          </div>
          <button className="secondary-cta" type="button" onClick={onToggleLocked}>
            {league.locked ? <Unlock size={17} /> : <Lock size={17} />}
            {league.locked ? "Reopen picks" : "Lock picks"}
          </button>
        </div>
      ) : null}

      {league ? (
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
      ) : null}
    </section>
  );
}
