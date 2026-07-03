import { AlertTriangle, CheckCircle2, Copy, KeyRound, Layers, Link2, Lock, Mail, Settings, Trash2, Trophy, Unlock, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPence, getEntryFeeLabel, getPrizePotLabel, parseEntryFeeToPence } from "../lib/money";
import { apiConfigured, authEmailLinksEnabled, demoMode, supabase } from "../lib/supabase";
import type { Entrant, League, LeagueCreateInput, UserProfile, UserRole } from "../types";

interface LeagueScreenProps {
  league: League | null;
  leagues: League[];
  activeLeagueId: string;
  entrants: Entrant[];
  profile: UserProfile;
  isLeagueCreator: boolean;
  currentEntrantId: string | null;
  pendingInviteCode: string | null;
  prizePotLabel: string;
  tournamentStarted: boolean;
  onSelectLeague: (leagueId: string) => void;
  onProfileChange: (profile: UserProfile) => void;
  onCreateLeague: (settings: LeagueCreateInput, profile: UserProfile) => Promise<void> | void;
  onJoinLeague: (inviteCode: string, profile: UserProfile) => Promise<void> | void;
  onGoToPicks: () => void;
  onRemoveEntrant: (entrantId: string) => Promise<void> | void;
  onToggleLocked: () => Promise<void> | void;
}

function getAuthRedirectUrl() {
  const withTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);
  const configuredRedirect =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
    (import.meta.env.VITE_SITE_URL as string | undefined);

  if (configuredRedirect) {
    try {
      return withTrailingSlash(new URL(configuredRedirect).origin);
    } catch {
      return withTrailingSlash(configuredRedirect);
    }
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "https://pickfour.vercel.app/";
  }

  return withTrailingSlash(window.location.origin);
}

function isPlaceholderName(name: string) {
  return name.trim().toLowerCase() === "player";
}

function getRoleLabel(role: UserRole) {
  return role === "creator" ? "league organiser" : "player";
}

type LeagueActionMode = UserRole | null;

export function LeagueScreen({
  league,
  leagues,
  activeLeagueId,
  entrants,
  profile,
  isLeagueCreator,
  currentEntrantId,
  pendingInviteCode,
  prizePotLabel,
  tournamentStarted,
  onSelectLeague,
  onProfileChange,
  onCreateLeague,
  onJoinLeague,
  onGoToPicks,
  onRemoveEntrant,
  onToggleLocked,
}: LeagueScreenProps) {
  const [profileEmail, setProfileEmail] = useState(profile.email);
  const [profileName, setProfileName] = useState(profile.name);
  const [profileRole, setProfileRole] = useState<UserRole>(profile.role);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newEntryFee, setNewEntryFee] = useState("");
  const [noMaxMembers, setNoMaxMembers] = useState(league ? league.maxEntrants === null : true);
  const [maxMembers, setMaxMembers] = useState(String(league?.maxEntrants ?? 30));
  const [joinCode, setJoinCode] = useState("");
  const [addLeagueMode, setAddLeagueMode] = useState<LeagueActionMode>(null);
  const [notice, setNotice] = useState(apiConfigured ? "Connected to the live PickFour backend." : "Supabase is not configured for this build.");
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Entrant | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const draftEntryFeePence = parseEntryFeeToPence(newEntryFee);
  const draftEntrantCount = 1;
  const draftPrizePotLabel = `${formatPence(draftEntryFeePence * draftEntrantCount)} pot`;
  const parsedMaxMembers = Math.max(1, draftEntrantCount, Number.parseInt(maxMembers, 10) || draftEntrantCount);
  const draftEmail = profileEmail.trim().toLowerCase();
  const draftName = profileName.trim();
  const savedName = profile.name.trim();
  const profileLabel = getRoleLabel(profileRole).replace(/^./, (letter) => letter.toUpperCase());
  const profileDisplayName = draftName && !isPlaceholderName(draftName)
    ? draftName
    : savedName && !isPlaceholderName(savedName) ? savedName : "Add your display name";
  const profileEmailLabel = draftEmail || profile.email || "Add email to sign up";
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail);
  const emailError = profileAttempted && (!draftEmail || !emailLooksValid) ? "Use a real email so your entry follows you." : "";
  const nameError = profileAttempted && (!draftName || isPlaceholderName(draftName)) ? "Add the name your mates will recognise." : "";
  const leagueAccessLabel = !league
    ? profileRole === "creator" ? "Creating league" : "Joining by code"
    : tournamentStarted ? "Tournament mode" : isLeagueCreator ? "Can manage setup" : "Can make picks";
  const accountHelperCopy = league
    ? tournamentStarted
      ? "The tournament has started, so entries are closed. Invite links now open the revealed table."
      : "No email verification is needed to play. Use the same email on any device and PickFour will find the leagues tied to it."
    : tournamentStarted
      ? "The tournament has started, so sign-ups and new leagues are closed. Use a league invite link to view the table."
      : profileRole === "creator"
        ? "Add your email and display name first, then create the league in the next panel. No verification needed; your email is the recovery key for later."
        : pendingInviteCode
          ? `Add your email and display name, then join ${pendingInviteCode} and make your picks.`
          : "Add your email and display name first, then paste the invite code in the next panel. No verification needed; your email is the recovery key for later.";
  const shareUrl = league ? `${window.location.origin}/?join=${league.inviteCode}` : "";
  const inviteMessage = league
    ? `Join my PickFour league: ${league.name}\n\nLink: ${shareUrl}\nInvite code: ${league.inviteCode}\n\nPick one country from each pot before the 19:55 UK lock.`
    : "";
  const hasSignedUp = Boolean(profile.email || draftEmail);
  const pendingInviteJoin = Boolean(pendingInviteCode && !league && profileRole === "joiner" && !tournamentStarted);
  const activeLeagueRoute = league ? addLeagueMode : profileRole;
  const showJoinPanel = !tournamentStarted && activeLeagueRoute === "joiner" && (!pendingInviteJoin || Boolean(league));
  const showCreatePanel = !tournamentStarted && activeLeagueRoute === "creator";

  function entrantHasCompleteEntry(entrant: Entrant) {
    return Boolean(
      entrant.entryComplete ??
        (entrant.picks[1] && entrant.picks[2] && entrant.picks[3] && entrant.picks[4] && entrant.predictions.highest_scoring_team),
    );
  }

  function getEntrantStatus(entrant: Entrant) {
    const isCurrentEntrant = entrant.id === currentEntrantId;
    const complete = entrantHasCompleteEntry(entrant);

    if (complete && isCurrentEntrant) return "Your picks are in";
    if (complete) return league?.locked ? "Picks revealed" : "Picks in, sealed until the 19:55 lock";
    if (isCurrentEntrant) return "You still need to make picks";
    return "Entered, picks still needed";
  }

  useEffect(() => {
    setProfileEmail(profile.email);
    setProfileName(isPlaceholderName(profile.name) ? "" : profile.name);
    setProfileRole(profile.role);
  }, [profile]);

  useEffect(() => {
    setNoMaxMembers(league ? league.maxEntrants === null : true);
    setMaxMembers(String(league?.maxEntrants ?? 30));
  }, [league]);

  useEffect(() => {
    if (!pendingInviteCode) return;
    setJoinCode(pendingInviteCode);
    setProfileRole("joiner");
    setAddLeagueMode("joiner");
    setNotice(`Invite code ${pendingInviteCode} is waiting. Add your details, then join.`);
  }, [pendingInviteCode]);

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
    setProfileAttempted(true);
    if (!draftEmail || !emailLooksValid || !draftName || isPlaceholderName(draftName)) {
      setNotice(`Add your email and display name before ${action}.`);
      return null;
    }

    return saveProfileDraft();
  }

  function saveDetails() {
    const nextProfile = requireProfileReady("continuing");
    if (!nextProfile) return;

    setNotice(`Details saved for ${nextProfile.name}. Now join with a code or create the league.`);
  }

  async function createLeague() {
    const nextProfile = requireProfileReady("creating a league");
    if (!nextProfile) return;

    const settings = {
      name: newLeagueName.trim() || "New PickFour League",
      entryFeePence: draftEntryFeePence,
      inviteOpen: true,
      maxEntrants: noMaxMembers ? null : parsedMaxMembers,
    };
    setBusy(true);
    try {
      await onCreateLeague(settings, nextProfile);
      setNewLeagueName("");
      setNewEntryFee("");
      setNoMaxMembers(true);
      setMaxMembers("30");
      setAddLeagueMode(null);
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
    const nextProfile = requireProfileReady("joining a league");
    if (!nextProfile) return;

    const code = (pendingInviteCode || joinCode).trim().toUpperCase();
    if (!code) {
      setNotice("Enter an invite code first.");
      return;
    }
    setBusy(true);
    try {
      await onJoinLeague(code, nextProfile);
      setAddLeagueMode(null);
      setNotice("Joined league and added it to My leagues.");
      setJoinCode("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not join that league.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailLink() {
    const nextProfile = requireProfileReady("requesting a return link");
    if (!nextProfile) return;

    if (!supabase || demoMode) {
      setNotice("Details saved. You can carry on here; email links are only needed when you want PickFour to find your leagues on another device.");
      return;
    }

    const redirectUrl = getAuthRedirectUrl();
    const inviteCode = pendingInviteCode || league?.inviteCode || "";
    const leagueName = league?.name || (inviteCode ? `invite ${inviteCode}` : "your PickFour leagues");
    const roleLabel = getRoleLabel(nextProfile.role);
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: nextProfile.email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            app_name: "PickFour",
            display_name: nextProfile.name,
            username: nextProfile.name,
            role: nextProfile.role,
            role_label: roleLabel,
            league_name: leagueName,
            invite_code: inviteCode,
            return_url: redirectUrl,
            sign_in_reason: "Get back to your leagues, picks and tables.",
            cta_label: "Open PickFour",
          },
        },
      });

      setNotice(
        error
          ? `Email sign-up failed: ${error.message}`
          : `Nice, we sent a PickFour sign-in link to ${nextProfile.email}. Use it on any device to get back to your leagues; you can carry on here now.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? `Email sign-up failed: ${error.message}` : "Email sign-up failed. Try again in a minute.");
    } finally {
      setAuthBusy(false);
    }
  }

  function chooseProfileRole(role: UserRole) {
    setProfileRole(role);
    setAddLeagueMode(role);
    onProfileChange({
      ...profile,
      email: profileEmail.trim().toLowerCase() || profile.email,
      name: profileName.trim() || (isPlaceholderName(profile.name) ? "" : profile.name),
      role,
    });
  }

  async function copyInvite() {
    if (!inviteMessage) return;
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setNotice(`Invite copied with link and code ${league?.inviteCode}.`);
    } catch {
      setNotice(`Copy failed. Share this manually: ${shareUrl} · code ${league?.inviteCode}`);
    }
  }

  async function confirmRemoveEntrant() {
    if (!removeTarget) return;

    setRemoveBusy(true);
    try {
      await onRemoveEntrant(removeTarget.id);
      setNotice(`${removeTarget.name} has been removed from this league.`);
      setRemoveTarget(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove that entry.");
    } finally {
      setRemoveBusy(false);
    }
  }

  function renderEntrantsPanel() {
    if (!league) return null;

    return (
      <div className="panel entrants-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Players entered</p>
            <h2>Who is in?</h2>
          </div>
          <span className="mini-badge">{entrants.length} players</span>
        </div>
        <p className="helper-copy">
          Names are visible now. Picks and the +10 bonus stay sealed until the lock, so the reveal still has a bit of needle.
        </p>
        {entrants.length > 0 ? (
          <div className="entrant-list">
            {entrants.map((entrant) => {
              const isCurrentEntrant = entrant.id === currentEntrantId;
              const canRemove = isLeagueCreator && !isCurrentEntrant;

              return (
                <article className="entrant-row" key={entrant.id}>
                  <span className="avatar" style={{ background: entrant.avatarColor }} />
                  <span className="entrant-copy">
                    <strong>{entrant.name}{isCurrentEntrant ? " · you" : ""}</strong>
                    <small>{getEntrantStatus(entrant)}</small>
                  </span>
                  {canRemove ? (
                    <button className="entry-remove-button" type="button" onClick={() => setRemoveTarget(entrant)}>
                      <Trash2 size={15} />
                      Remove
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state compact-empty-state">
            <strong>No one has joined yet</strong>
            <small>Share the invite link and entrants will appear here.</small>
          </div>
        )}
        {removeTarget ? (
          <div className="remove-confirm" role="dialog" aria-modal="true" aria-label={`Remove ${removeTarget.name}`}>
            <AlertTriangle size={18} />
            <span>
              <strong>Are you sure you want to delete {removeTarget.name}'s entry?</strong>
              <small>This removes their entry, four picks and bonus from this league. They can rejoin with the invite code if needed.</small>
            </span>
            <div className="remove-confirm-actions">
              <button className="secondary-cta" type="button" onClick={() => setRemoveTarget(null)} disabled={removeBusy}>
                Cancel
              </button>
              <button className="danger-cta" type="button" onClick={confirmRemoveEntrant} disabled={removeBusy}>
                {removeBusy ? "Deleting..." : "Delete entry"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderMyLeaguesPanel() {
    if (leagues.length === 0) return null;

    return (
      <div className="panel my-leagues-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">My leagues</p>
            <h2>Switch friend groups</h2>
          </div>
          <span className="mini-badge">{leagues.length} joined</span>
        </div>
        <p className="helper-copy">Each league keeps its own table, picks and invite link. Switch here whenever the group chat changes.</p>
        <div className="joined-league-list">
          {leagues.map((item) => {
            const active = item.id === activeLeagueId;
            const detail = active
              ? `${item.inviteCode} · ${getEntryFeeLabel(item)} · ${getPrizePotLabel(item, entrants.length)}`
              : `${item.inviteCode} · ${getEntryFeeLabel(item)} · switch to view entrants`;

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
                  <small>{detail}</small>
                </span>
                <span className="joined-league-state">{active ? "Active" : item.locked ? "Locked" : "Open"}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderAddLeaguePanel() {
    if (!league) return null;

    return (
      <div className="panel add-league-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">More leagues</p>
            <h2>Add another group</h2>
          </div>
          <span className="mini-badge">Multi-league</span>
        </div>
        <div className="league-route-map compact-route-map">
          <button
            type="button"
            className={addLeagueMode === "joiner" ? "league-route-card active" : "league-route-card"}
            onClick={() => chooseProfileRole("joiner")}
          >
            <KeyRound size={18} />
            <span>
              <strong>Join another league</strong>
              <small>Add an office, family or mates league without leaving this one.</small>
            </span>
          </button>
          <button
            type="button"
            className={addLeagueMode === "creator" ? "league-route-card active" : "league-route-card"}
            onClick={() => chooseProfileRole("creator")}
          >
            <Trophy size={18} />
            <span>
              <strong>Create another league</strong>
              <small>Start a separate friend group with its own invite link and table.</small>
            </span>
          </button>
        </div>
        <p className="helper-copy">Your picks, leaderboard and invite code stay separate for each league.</p>
      </div>
    );
  }

  function renderLeagueRoomPanel() {
    if (!league) return null;

    return (
      <div className="panel league-room-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{isLeagueCreator ? "Invite friends" : "League room"}</p>
            <h2>{isLeagueCreator ? "Share the join link" : league.name}</h2>
          </div>
          <span className="mini-badge">{prizePotLabel}</span>
        </div>
        <div className="share-panel">
          <span>
            <Link2 size={17} />
            <strong>{league.name}</strong>
          </span>
          <code>{shareUrl}</code>
          <div className="share-actions">
            <button className="secondary-cta" type="button" onClick={copyInvite}>
              <Copy size={17} />
              Copy invite
            </button>
            <button className="primary-cta" type="button" onClick={onGoToPicks}>
              Make my picks
            </button>
          </div>
          <small>
            Friends can use the link or paste the code. Code: <strong>{league.inviteCode}</strong>.
          </small>
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
      </div>
    );
  }

  return (
    <section
      className={`screen-stack league-screen ${league ? "has-league" : "no-league"} ${
        profileRole === "creator" ? "is-organiser" : "is-player"
      }`}
    >
      {!league && tournamentStarted ? (
        <div className="panel onboarding-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Tournament mode</p>
              <h2>Entries are closed</h2>
            </div>
            <span className="mini-badge">Live</span>
          </div>
          <p className="helper-copy">
            The World Cup has started, so no one can create a new league, join as a new entrant, or edit picks. Use a league invite link to view the revealed table.
          </p>
        </div>
      ) : !league ? (
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
                <strong>Create a league</strong>
                <small>Name it, set the entry fee, then send friends the private link.</small>
              </span>
            </button>
          </div>
          <p className="helper-copy">
            PickFour works best as a friend-league ritual: one organiser creates the league, everyone else joins with the invite code.
          </p>
        </div>
      ) : null}

      {renderLeagueRoomPanel()}
      {renderEntrantsPanel()}
      {renderMyLeaguesPanel()}
      {renderAddLeaguePanel()}

      {(!tournamentStarted || league) ? (
      <div className="panel account-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Account</p>
            <h2>{hasSignedUp ? "Your PickFour account" : "Add your details"}</h2>
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
        <div className="form-grid compact-form">
          <p className="helper-copy">{accountHelperCopy}</p>
          <label>
            <span>Email</span>
            <input
              value={profileEmail}
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              onChange={(event) => setProfileEmail(event.target.value)}
            />
            {emailError ? <small className="field-error">{emailError}</small> : null}
          </label>
          <label>
            <span>Name</span>
            <input
              value={profileName}
              autoComplete="name"
              placeholder="e.g. Declan"
              aria-invalid={Boolean(nameError)}
              onChange={(event) => setProfileName(event.target.value)}
            />
            {nameError ? <small className="field-error">{nameError}</small> : null}
          </label>
          <div className="account-actions">
            {pendingInviteJoin ? (
              <button className="primary-cta" type="button" onClick={joinLeague} disabled={busy}>
                {busy ? "Joining..." : "Join league and make picks"}
              </button>
            ) : (
              <button className="secondary-cta" type="button" onClick={saveDetails}>
                <CheckCircle2 size={17} />
                Save details
              </button>
            )}
            {authEmailLinksEnabled ? (
              <button className="secondary-cta subtle" type="button" onClick={sendEmailLink} disabled={authBusy}>
                <Mail size={17} />
                {authBusy ? "Sending..." : "Email me my PickFour link"}
              </button>
            ) : null}
          </div>
          <small className="optional-auth-copy">
            Your email is saved with your entry. If you swap phones or clear your browser, enter the same email and name to bring your leagues back.
          </small>
        </div>
      </div>
      ) : null}

      {showJoinPanel ? (
      <div className="panel join-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{league ? "Join another" : "Join league"}</p>
            <h2>{league ? "Add another invite code" : "Paste the invite code"}</h2>
          </div>
        </div>
        {pendingInviteCode ? (
          <p className="pending-invite-copy">Invite code <strong>{pendingInviteCode}</strong> is ready to join once your details are in.</p>
        ) : null}
        <p className="helper-copy">Got a join link? Open it and the code will wait here. Got a code from the group chat? Paste it below.</p>
        <div className="form-grid">
          <label>
            <span>Invite code</span>
            <input
              value={joinCode}
              autoComplete="off"
              placeholder="e.g. DHSDFF"
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
          </label>
          <button className={league ? "secondary-cta" : "primary-cta"} type="button" onClick={joinLeague} disabled={busy}>
            {busy ? "Joining..." : league ? "Join another league" : "Join league"}
          </button>
        </div>
        <p className="admin-notice">{notice}</p>
      </div>
      ) : null}

      {showCreatePanel ? (
        <div className="panel create-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">{league ? "Create another" : "Create league"}</p>
              <h2>{league ? "Start another friend group" : "Start a league"}</h2>
            </div>
          </div>
          <p className="helper-copy">
            {league
              ? "Create a separate league for another group chat. We will switch you into it straight away so you can share the new link."
              : "Create a league, then copy the private join link. Friends can sign up, join, and make picks before the lock."}
          </p>
          <div className="form-grid">
            <label>
              <span>New league name</span>
              <input
                value={newLeagueName}
                placeholder="e.g. Sunday League Lads"
                onChange={(event) => setNewLeagueName(event.target.value)}
              />
            </label>
            <label>
              <span>Entry fee per person</span>
              <input
                inputMode="decimal"
                value={newEntryFee}
                placeholder="e.g. 5"
                onChange={(event) => setNewEntryFee(event.target.value)}
                aria-describedby="entry-fee-preview"
              />
            </label>
            <div className="pot-preview full-pot-preview" id="entry-fee-preview">
              <span>Full pot</span>
              <strong>{draftPrizePotLabel}</strong>
              <small>{formatPence(draftEntryFeePence)} entry × {draftEntrantCount} organiser</small>
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
                  placeholder="e.g. 30"
                  onChange={(event) => setMaxMembers(event.target.value)}
                />
              </label>
            ) : null}
            <button className={league ? "secondary-cta" : "primary-cta"} type="button" onClick={createLeague} disabled={busy}>
              {busy ? "Creating..." : league ? "Create another league" : "Create league"}
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
          <li>Clean sheet +1, win by 3+ goals +2, Pot 3/4 beating Pot 1/2 +2, plus +1 more for a big pot-gap upset.</li>
          <li>Red cards are -2 and own goals are -1 for the country involved.</li>
          <li>Advance from group +3, quarter-final +5, semi-final +7, final +10, champion +15.</li>
          <li>Correct highest-scoring team in the tournament is worth +10, banked when the tournament ends.</li>
          <li>Once the tournament starts, picks are locked and everyone can finally see who backed who.</li>
        </ul>
      </div>
      ) : null}
    </section>
  );
}
