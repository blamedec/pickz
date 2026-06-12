import { CheckCircle2, Mail, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../types";

interface EntryLoginFormProps {
  profile: UserProfile;
  introTitle: string;
  introCopy: string;
  onFindEntry: (profile: UserProfile) => Promise<{ found: boolean; message: string }>;
}

/**
 * The email-only entry login, shared by the overview card and the My Entry
 * page. Email is the identity key; the name is cosmetic and restored from
 * the saved entry on a match.
 */
export function EntryLoginForm({ profile, introTitle, introCopy, onFindEntry }: EntryLoginFormProps) {
  const [email, setEmail] = useState(profile.email);
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail(profile.email);
    setName(profile.name);
  }, [profile.email, profile.name]);

  async function submit() {
    const lookupEmail = email.trim().toLowerCase();
    const lookupName = name.trim() || profile.name || lookupEmail.split("@")[0] || "Player";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupEmail)) {
      setMessage("Use the same email you entered before picks locked.");
      return;
    }

    setBusy(true);
    setMessage("Checking the entry list...");
    try {
      const result = await onFindEntry({ ...profile, email: lookupEmail, name: lookupName, role: profile.role || "joiner" });
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check that email. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="find-entry-intro">
        <Mail size={18} />
        <span>
          <strong>{introTitle}</strong>
          <small>{introCopy}</small>
        </span>
      </div>
      <form
        className="find-entry-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label>
          <span>Email used for entry</span>
          <input
            value={email}
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Name, optional</span>
          <input value={name} autoComplete="name" placeholder="e.g. Declan" onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="primary-cta" type="submit" disabled={busy}>
          {busy ? <Search size={17} /> : <CheckCircle2 size={17} />}
          {busy ? "Checking..." : "Log in to entry"}
        </button>
      </form>
      {message ? <p className="lookup-message">{message}</p> : null}
    </>
  );
}
