import { useMemo, useState, type CSSProperties } from "react";
type ThemeMode = "dark" | "light";
type ProductView = "rules" | "league" | "picks" | "live" | "table";
type TeamBadge = {
  code: string;
  name: string;
  pot: number;
};
type Entrant = {
  rank: number;
  name: string;
  points: number;
  alive: number;
  country: number;
  bonus: number;
  trend: number;
};
const views: Array<{
  id: ProductView;
  label: string;
  step: string;
}> = [{
  id: "rules",
  label: "Rules",
  step: "01"
}, {
  id: "league",
  label: "League",
  step: "02"
}, {
  id: "picks",
  label: "Picks",
  step: "03"
}, {
  id: "live",
  label: "Live",
  step: "04"
}, {
  id: "table",
  label: "Table",
  step: "05"
}];
const selectedPicks: TeamBadge[] = [{
  code: "ENG",
  name: "England",
  pot: 1
}, {
  code: "JPN",
  name: "Japan",
  pot: 2
}, {
  code: "NOR",
  name: "Norway",
  pot: 3
}, {
  code: "GHA",
  name: "Ghana",
  pot: 4
}];
const teamGrid: TeamBadge[] = [{
  code: "ARG",
  name: "Argentina",
  pot: 1
}, {
  code: "BRA",
  name: "Brazil",
  pot: 1
}, {
  code: "FRA",
  name: "France",
  pot: 1
}, {
  code: "GER",
  name: "Germany",
  pot: 1
}, {
  code: "BEL",
  name: "Belgium",
  pot: 2
}, {
  code: "CRO",
  name: "Croatia",
  pot: 2
}, {
  code: "MAR",
  name: "Morocco",
  pot: 2
}, {
  code: "SWE",
  name: "Sweden",
  pot: 4
}, {
  code: "CAN",
  name: "Canada",
  pot: 1
}, {
  code: "ESP",
  name: "Spain",
  pot: 1
}, {
  code: "MEX",
  name: "Mexico",
  pot: 1
}, {
  code: "NED",
  name: "Netherlands",
  pot: 1
}];
const leaderboard: Entrant[] = [{
  rank: 1,
  name: "Mike",
  points: 58,
  alive: 4,
  country: 48,
  bonus: 10,
  trend: 2
}, {
  rank: 2,
  name: "Declan",
  points: 51,
  alive: 3,
  country: 41,
  bonus: 10,
  trend: 1
}, {
  rank: 3,
  name: "Jack",
  points: 47,
  alive: 4,
  country: 47,
  bonus: 0,
  trend: -1
}, {
  rank: 4,
  name: "Soph",
  points: 47,
  alive: 3,
  country: 47,
  bonus: 0,
  trend: 0
}, {
  rank: 5,
  name: "Tom",
  points: 45,
  alive: 3,
  country: 45,
  bonus: 0,
  trend: 1
}, {
  rank: 6,
  name: "Dan",
  points: 43,
  alive: 3,
  country: 43,
  bonus: 0,
  trend: -1
}];
const liveMatches = [{
  minute: "62'",
  home: "ENG",
  away: "CRO",
  score: "3-0",
  note: "+3 live"
}, {
  minute: "HT",
  home: "JPN",
  away: "SWE",
  score: "0-0",
  note: "+1 live"
}, {
  minute: "74'",
  home: "NOR",
  away: "FRA",
  score: "0-2",
  note: "chasing"
}];
const bonusRace = [{
  code: "ENG",
  name: "England",
  goals: 11,
  color: "#e0193d"
}, {
  code: "BRA",
  name: "Brazil",
  goals: 10,
  color: "#009c3b"
}, {
  code: "FRA",
  name: "France",
  goals: 9,
  color: "#2d68c4"
}, {
  code: "BEL",
  name: "Belgium",
  goals: 8,
  color: "#f0c531"
}];
const rulesSteps = [{
  n: "1",
  heading: "Make an account",
  desc: "Sign up with your email. Takes about thirty seconds. Go on."
}, {
  n: "2",
  heading: "Get in a league",
  desc: "Start one or paste in the invite code from the group chat. You know the one."
}, {
  n: "3",
  heading: "Pick one from each pot",
  desc: "Choose one country from Pots 1, 2, 3 and 4. Your picks. Your call. No lucky dip."
}, {
  n: "4",
  heading: "Locks at kick-off",
  desc: "Once the tournament starts, that is your lot. No swaps, no excuses."
}, {
  n: "5",
  heading: "Highest score takes the glory",
  desc: "Points follow your teams through the groups and knockouts. Simple as."
}, {
  n: "★",
  heading: "Bonus pick",
  desc: "Name your highest-scoring team for an extra +10. Bragging rights at a premium."
}];
const themeVars: Record<ThemeMode, CSSProperties> = {
  dark: {
    "--pf-canvas": "#050607",
    "--pf-app": "#0b0e0d",
    "--pf-panel": "#121615",
    "--pf-panel-2": "#171c19",
    "--pf-paper": "#f7f0e6",
    "--pf-paper-2": "#ebe3d4",
    "--pf-text": "#f8f1e6",
    "--pf-text-dark": "#10110f",
    "--pf-muted": "rgba(248, 241, 230, 0.52)",
    "--pf-line": "rgba(248, 241, 230, 0.10)",
    "--pf-red": "#e0193d",
    "--pf-green": "#72df84",
    "--pf-amber": "#f0c531",
    "--pf-shadow": "0 30px 90px rgba(0,0,0,.42)"
  } as CSSProperties,
  light: {
    "--pf-canvas": "#f0ebe0",
    "--pf-app": "#fffaf1",
    "--pf-panel": "#ffffff",
    "--pf-panel-2": "#f4ecde",
    "--pf-paper": "#fffaf1",
    "--pf-paper-2": "#ebe1d1",
    "--pf-text": "#10110f",
    "--pf-text-dark": "#10110f",
    "--pf-muted": "rgba(16, 17, 15, 0.52)",
    "--pf-line": "rgba(16, 17, 15, 0.10)",
    "--pf-red": "#d7193f",
    "--pf-green": "#0d7a43",
    "--pf-amber": "#d99c1c",
    "--pf-shadow": "0 24px 70px rgba(42,33,18,.14)"
  } as CSSProperties
};

// ─── Black top hat illustration (visual motif only) ───────────────────────────
function HatIcon({
  size = 32,
  color = "currentColor",
  opacity = 1
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{
    opacity,
    display: "block",
    flexShrink: 0
  }}>
      {/* Brim */}
      <rect x={3} y={28} width={34} height={5} rx={2.5} fill={color} />
      {/* Crown */}
      <rect x={11} y={10} width={18} height={18} rx={2} fill={color} />
      {/* Band highlight */}
      <rect x={11} y={22} width={18} height={3} rx={1} fill="rgba(255,255,255,0.12)" />
    </svg>;
}

// ─── Flag SVG renderer ────────────────────────────────────────────────────────
function FlagSVG({
  code,
  size
}: {
  code: string;
  size: "sm" | "md";
}) {
  const w = size === "sm" ? 36 : 56;
  const h = size === "sm" ? 36 : 40;
  const r = 8;
  const flagContent = (() => {
    switch (code) {
      case "ENG":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="England flag">
            <rect width={w} height={h} fill="#ffffff" rx={r} />
            <rect x={w * 0.42} y={0} width={w * 0.16} height={h} fill="#cf142b" />
            <rect x={0} y={h * 0.42} width={w} height={h * 0.16} fill="#cf142b" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "JPN":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Japan flag">
            <rect width={w} height={h} fill="#ffffff" rx={r} />
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.28} fill="#bc002d" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "NOR":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Norway flag">
            <rect width={w} height={h} fill="#ef2b2d" rx={r} />
            <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="#ffffff" />
            <rect x={w * 0.28} y={0} width={w * 0.16} height={h} fill="#ffffff" />
            <rect x={0} y={h * 0.42} width={w} height={h * 0.16} fill="#002868" />
            <rect x={w * 0.32} y={0} width={w * 0.08} height={h} fill="#002868" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "GHA":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Ghana flag">
            <rect width={w} height={h} fill="#006b3f" rx={r} />
            <rect x={0} y={0} width={w} height={h / 3} fill="#ce1126" rx={r} />
            <rect x={0} y={h / 3} width={w} height={h / 3} fill="#fcd116" />
            <polygon points={`${w / 2},${h * 0.3} ${w * 0.54},${h * 0.44} ${w * 0.58},${h * 0.44} ${w * 0.55},${h * 0.52} ${w * 0.57},${h * 0.62} ${w / 2},${h * 0.56} ${w * 0.43},${h * 0.62} ${w * 0.45},${h * 0.52} ${w * 0.42},${h * 0.44} ${w * 0.46},${h * 0.44}`} fill="#000000" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "ARG":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Argentina flag">
            <rect width={w} height={h} fill="#74acdf" rx={r} />
            <rect x={0} y={h / 3} width={w} height={h / 3} fill="#ffffff" />
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.14} fill="#f6b40e" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "BRA":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Brazil flag">
            <rect width={w} height={h} fill="#009c3b" rx={r} />
            <polygon points={`${w / 2},${h * 0.1} ${w * 0.92},${h / 2} ${w / 2},${h * 0.9} ${w * 0.08},${h / 2}`} fill="#ffdf00" />
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.22} fill="#002776" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "FRA":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="France flag">
            <rect width={w} height={h} fill="#ed2939" rx={r} />
            <rect x={0} y={0} width={w * 0.67} height={h} fill="#ffffff" />
            <rect x={0} y={0} width={w * 0.33} height={h} fill="#002395" rx={r} />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "GER":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Germany flag">
            <rect width={w} height={h} fill="#ffce00" rx={r} />
            <rect x={0} y={0} width={w} height={h / 3} fill="#000000" rx={r} />
            <rect x={0} y={h / 3} width={w} height={h / 3} fill="#dd0000" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "BEL":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Belgium flag">
            <rect width={w} height={h} fill="#ef3340" rx={r} />
            <rect x={0} y={0} width={w * 0.67} height={h} fill="#fdda24" />
            <rect x={0} y={0} width={w * 0.33} height={h} fill="#000000" rx={r} />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "CRO":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Croatia flag">
            <rect width={w} height={h} fill="#ffffff" rx={r} />
            <rect x={0} y={0} width={w} height={h * 0.33} fill="#cc0000" />
            <rect x={0} y={h * 0.67} width={w} height={h * 0.33} fill="#003087" />
            {[0, 1, 2, 3, 4].map(col => [0, 1, 2, 3, 4].map(row => <rect key={`${col}-${row}`} x={w * 0.32 + col * w * 0.072} y={h * 0.28 + row * h * 0.09} width={w * 0.072} height={h * 0.09} fill={(col + row) % 2 === 0 ? "#cc0000" : "#ffffff"} opacity={0.9} />))}
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "MAR":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Morocco flag">
            <rect width={w} height={h} fill="#c1272d" rx={r} />
            <polygon points={`${w / 2},${h * 0.22} ${w * 0.538},${h * 0.41} ${w * 0.65},${h * 0.41} ${w * 0.562},${h * 0.516} ${w * 0.595},${h * 0.7} ${w * 0.5},${h * 0.606} ${w * 0.405},${h * 0.7} ${w * 0.438},${h * 0.516} ${w * 0.35},${h * 0.41} ${w * 0.462},${h * 0.41}`} fill="none" stroke="#006233" strokeWidth={1.5} />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "SWE":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Sweden flag">
            <rect width={w} height={h} fill="#006aa7" rx={r} />
            <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="#fecc02" />
            <rect x={w * 0.28} y={0} width={w * 0.16} height={h} fill="#fecc02" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "CAN":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Canada flag">
            <rect width={w} height={h} fill="#ffffff" rx={r} />
            <rect x={0} y={0} width={w * 0.25} height={h} fill="#d52b1e" />
            <rect x={w * 0.75} y={0} width={w * 0.25} height={h} fill="#d52b1e" />
            <polygon points={`${w / 2},${h * 0.15} ${w * 0.55},${h * 0.35} ${w * 0.72},${h * 0.32} ${w * 0.62},${h * 0.5} ${w * 0.68},${h * 0.52} ${w / 2},${h * 0.85} ${w * 0.32},${h * 0.52} ${w * 0.38},${h * 0.5} ${w * 0.28},${h * 0.32} ${w * 0.45},${h * 0.35}`} fill="#d52b1e" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "ESP":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Spain flag">
            <rect width={w} height={h} fill="#c60b1e" rx={r} />
            <rect x={0} y={h * 0.25} width={w} height={h * 0.5} fill="#ffc400" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "MEX":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Mexico flag">
            <rect width={w} height={h} fill="#ffffff" rx={r} />
            <rect x={0} y={0} width={w * 0.33} height={h} fill="#006847" rx={r} />
            <rect x={w * 0.67} y={0} width={w * 0.33} height={h} fill="#ce1126" />
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.14} fill="#8b4513" opacity={0.5} />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "NED":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Netherlands flag">
            <rect width={w} height={h} fill="#21468b" rx={r} />
            <rect x={0} y={0} width={w} height={h / 3} fill="#ae1c28" rx={r} />
            <rect x={0} y={h / 3} width={w} height={h / 3} fill="#ffffff" />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      case "POR":
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Portugal flag">
            <rect width={w} height={h} fill="#da291c" rx={r} />
            <rect x={0} y={0} width={w * 0.4} height={h} fill="#006600" rx={r} />
            <circle cx={w * 0.4} cy={h / 2} r={Math.min(w, h) * 0.18} fill="#ffff00" opacity={0.85} />
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
      default:
        return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`${code} flag`}>
            <rect width={w} height={h} fill="#d1d5db" rx={r} />
            <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fontSize={size === "sm" ? 10 : 12} fontWeight="900" fontFamily="Inter, sans-serif" fill="#374151">
              {code}
            </text>
            <rect width={w} height={h} rx={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
          </svg>;
    }
  })();
  return <div className="shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,.16)]" style={{
    borderRadius: r,
    width: w,
    height: h
  }} aria-label={`${code} flag`}>
      {flagContent}
    </div>;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({
  compact = false
}: {
  compact?: boolean;
}) {
  return <div className="flex items-center gap-2.5">
      <div className={compact ? "grid grid-cols-2 gap-[3px]" : "grid grid-cols-2 gap-1"}>
        {(["#e0193d", "var(--pf-text)", "var(--pf-text)", "#e0193d"] as string[]).map((bg, i) => <div key={i} className={compact ? "h-[9px] w-[9px] rounded-[2px]" : "h-[12px] w-[12px] rounded-[3px]"} style={{
        background: bg
      }} />)}
      </div>
      <div>
        <p className={compact ? "font-heading text-xl font-black uppercase leading-none" : "font-heading text-3xl font-black uppercase leading-none"}>
          Pick<span style={{
          color: "var(--pf-red)"
        }}>Four</span>
        </p>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{
        color: "var(--pf-muted)"
      }}>
          The sweepstake you actually win
        </p>
      </div>
      <HatIcon size={compact ? 22 : 30} color="var(--pf-text)" opacity={0.18} />
    </div>;
}

// ─── Country Badge ────────────────────────────────────────────────────────────
function CountryBadge({
  team,
  compact = false
}: {
  team: TeamBadge;
  compact?: boolean;
}) {
  return <div className="flex flex-col items-center gap-1.5">
      <FlagSVG code={team.code} size={compact ? "sm" : "md"} />
    </div>;
}

// ─── Review controls ─────────────────────────────────────────────────────────
function ReviewControls({
  theme,
  view,
  onTheme,
  onView
}: {
  theme: ThemeMode;
  view: ProductView;
  onTheme: (t: ThemeMode) => void;
  onView: (v: ProductView) => void;
}) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{
    borderColor: "var(--pf-line)",
    background: "var(--pf-panel)",
    boxShadow: "var(--pf-shadow)"
  }}>
      <div className="flex items-center gap-3">
        <HatIcon size={36} color="var(--pf-text)" opacity={0.22} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em]" style={{
          color: "var(--pf-muted)"
        }}>
            Four picks. No rubbish draws. You vs your mates.
          </p>
          <p className="mt-1 text-sm font-bold">The sweepstake where your picks are actually yours.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl p-1" style={{
        background: "var(--pf-panel-2)"
      }}>
          {(["dark", "light"] as ThemeMode[]).map(item => <button key={item} type="button" onClick={() => onTheme(item)} className="rounded-lg px-4 py-2 text-xs font-black uppercase" style={{
          background: theme === item ? "var(--pf-red)" : "transparent",
          color: theme === item ? "#ffffff" : "var(--pf-muted)"
        }}>
              {item}
            </button>)}
        </div>
        <div className="flex rounded-xl p-1" style={{
        background: "var(--pf-panel-2)"
      }}>
          {views.map(item => <button key={item.id} type="button" onClick={() => onView(item.id)} className="rounded-lg px-3 py-2 text-xs font-black uppercase" style={{
          background: view === item.id ? "var(--pf-text)" : "transparent",
          color: view === item.id ? "var(--pf-app)" : "var(--pf-muted)"
        }}>
              {item.label}
            </button>)}
        </div>
      </div>
    </div>;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function JourneyStepper({
  view,
  onView
}: {
  view: ProductView;
  onView: (v: ProductView) => void;
}) {
  const activeIndex = views.findIndex(item => item.id === view);
  return <div className="grid grid-cols-5 gap-2">
      {views.map((item, index) => <button key={item.id} type="button" onClick={() => onView(item.id)} className="text-center">
          <span className="mx-auto grid h-8 w-8 place-items-center rounded-full border text-xs font-black" style={{
        borderColor: view === item.id ? "var(--pf-red)" : index < activeIndex ? "var(--pf-green)" : "var(--pf-line)",
        background: view === item.id ? "var(--pf-red)" : index < activeIndex ? "var(--pf-green)" : "var(--pf-panel)",
        color: view === item.id ? "#ffffff" : index < activeIndex ? "#071012" : "var(--pf-muted)"
      }}>
            {index + 1}
          </span>
          <span className="mt-2 block text-[10px] font-black" style={{
        color: view === item.id ? "var(--pf-red)" : "var(--pf-muted)"
      }}>
            {item.label}
          </span>
        </button>)}
    </div>;
}

// ─── Numbered rules steps ─────────────────────────────────────────────────────
function RulesSteps({
  onNext
}: {
  onNext: () => void;
}) {
  return <div className="space-y-3">
      {rulesSteps.map(step => <div key={step.n} className="flex gap-4 rounded-2xl border p-4" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-panel)"
    }}>
          <span className="mt-0.5 shrink-0 font-heading text-3xl font-black leading-none" style={{
        color: step.n === "★" ? "var(--pf-amber)" : "var(--pf-red)",
        minWidth: 28
      }}>
            {step.n}
          </span>
          <div>
            <p className="text-sm font-black leading-tight">{step.heading}</p>
            <p className="mt-0.5 text-xs leading-5" style={{
          color: "var(--pf-muted)"
        }}>
              {step.desc}
            </p>
          </div>
        </div>)}
      <button type="button" onClick={onNext} className="flex w-full items-center justify-center text-white" style={{
      background: "var(--pf-red)",
      height: 48,
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 600,
      paddingLeft: 24,
      paddingRight: 24
    }}>
        Join a league
      </button>
    </div>;
}

// ─── Pick cards ───────────────────────────────────────────────────────────────
function PickCards({
  compact = false
}: {
  compact?: boolean;
}) {
  return <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 gap-2"}>
      {selectedPicks.map(team => <div key={team.code} className="rounded-2xl border p-2 text-center shadow-sm" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-paper)",
      color: "var(--pf-text-dark)"
    }}>
          <p className="text-[10px] font-black uppercase" style={{
        color: "var(--pf-red)"
      }}>
            Pot {team.pot}
          </p>
          <div className="mt-2 flex justify-center">
            <FlagSVG code={team.code} size={compact ? "sm" : "md"} />
          </div>
          <p className="mt-2 truncate text-[10px] font-black">
            {compact ? team.code : team.name}
          </p>
        </div>)}
    </div>;
}

// ─── Bonus race bar chart ─────────────────────────────────────────────────────
function BonusRace() {
  return <div className="space-y-3">
      {bonusRace.map((team, index) => <div key={team.code} className="grid grid-cols-[22px_42px_1fr_48px] items-center gap-2 text-xs">
          <span className="font-black" style={{
        color: "var(--pf-muted)"
      }}>
            {index + 1}
          </span>
          <span className="font-black">{team.code}</span>
          <div className="h-3 rounded-full" style={{
        background: "var(--pf-panel-2)"
      }}>
            <div className="h-3 rounded-full" style={{
          width: `${team.goals / 11 * 100}%`,
          background: team.color
        }} />
          </div>
          <span className="text-right font-black">{team.goals} GF</span>
        </div>)}
    </div>;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardRows({
  compact = false
}: {
  compact?: boolean;
}) {
  return <div className="overflow-hidden rounded-2xl border" style={{
    borderColor: "var(--pf-line)"
  }}>
      <div className={compact ? "grid grid-cols-[26px_1fr_42px] px-3 py-2 text-[9px] font-black uppercase" : "grid grid-cols-[36px_1fr_54px_70px_52px] gap-2 px-4 py-3 text-[10px] font-black uppercase"} style={{
      background: "var(--pf-panel-2)",
      color: "var(--pf-muted)"
    }}>
        <span>#</span>
        <span>Player</span>
        <span>Pts</span>
        {!compact ? <span className="col-span-2 text-right">Split / Move</span> : null}
      </div>
      {leaderboard.map(row => <div key={row.name} className={compact ? "grid grid-cols-[26px_1fr_42px] items-center border-t px-3 py-3 text-xs" : "grid grid-cols-[36px_1fr_54px_70px_52px] items-center gap-2 border-t px-4 py-3 text-sm"} style={{
      borderColor: "var(--pf-line)",
      background: row.name === "Declan" ? "color-mix(in srgb, var(--pf-red) 14%, transparent)" : "var(--pf-panel)"
    }}>
          <span className="font-black">{row.rank}</span>
          <span className="min-w-0">
            <span className="block truncate font-black">
              {row.name}
              {row.name === "Declan" ? " (You)" : ""}
            </span>
            <span className="block truncate text-[10px] font-bold" style={{
          color: "var(--pf-muted)"
        }}>
              {row.alive} alive · {row.country} pts · {row.bonus} bonus
            </span>
          </span>
          <span className="font-black">{row.points}</span>
          {!compact ? <span className="text-xs font-black">
              {row.country}
              <span style={{
          color: "var(--pf-muted)"
        }}>/{row.bonus}</span>
            </span> : null}
          {!compact ? <span className="font-black" style={{
        color: row.trend > 0 ? "var(--pf-green)" : row.trend < 0 ? "var(--pf-red)" : "var(--pf-muted)"
      }}>
              {row.trend > 0 ? `+${row.trend}` : row.trend || "–"}
            </span> : null}
        </div>)}
    </div>;
}

// ─── Mobile content views ─────────────────────────────────────────────────────
function MobileContent({
  view,
  onView
}: {
  view: ProductView;
  onView: (v: ProductView) => void;
}) {
  const [activePot, setActivePot] = useState(1);
  const filteredTeams = useMemo(() => teamGrid.filter(team => team.pot === activePot).slice(0, 8), [activePot]);
  if (view === "rules") {
    return <div className="space-y-4">
        <section className="rounded-2xl p-4" style={{
        background: "var(--pf-panel)"
      }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{
              background: "var(--pf-text)",
              color: "var(--pf-app)"
            }}>
                How it works
              </p>
              <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-none">
                Here is how it works. It is simple.
              </h1>
              <p className="mt-2 text-xs leading-5" style={{
              color: "var(--pf-muted)"
            }}>
                Four picks. You choose them. No lucky dip, no rubbish draws, no moaning about San Marino.
              </p>
            </div>
            <HatIcon size={56} color="var(--pf-text)" opacity={0.12} />
          </div>
        </section>
        {rulesSteps.map(step => <div key={step.n} className="flex gap-4 rounded-2xl border p-4" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
            <span className="mt-0.5 shrink-0 font-heading text-2xl font-black leading-none" style={{
          color: step.n === "★" ? "var(--pf-amber)" : "var(--pf-red)",
          minWidth: 24
        }}>
              {step.n}
            </span>
            <div>
              <p className="text-sm font-black leading-tight">{step.heading}</p>
              <p className="mt-0.5 text-xs leading-5" style={{
            color: "var(--pf-muted)"
          }}>
                {step.desc}
              </p>
            </div>
          </div>)}
        <button type="button" onClick={() => onView("league")} className="flex w-full items-center justify-center text-white" style={{
        background: "var(--pf-red)",
        height: 48,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        paddingLeft: 24,
        paddingRight: 24
      }}>
          Join a league
        </button>
      </div>;
  }
  if (view === "league") {
    return <div className="space-y-4">
        <section className="rounded-2xl p-4" style={{
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Step 2 of 5
          </p>
          <h1 className="mt-2 font-heading text-4xl font-black uppercase leading-none">Get yourself in.</h1>
          <p className="mt-3 text-sm leading-5" style={{
          color: "var(--pf-muted)"
        }}>
            Sign up, drop in the invite code from the group chat. You are moments away from someone's undoing.
          </p>
        </section>
        <div className="rounded-2xl border p-4" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <label className="block text-[10px] font-black uppercase" style={{
          color: "var(--pf-muted)"
        }}>
            Email
          </label>
          <div className="mt-2 rounded-xl px-3 py-3 text-sm font-bold" style={{
          background: "var(--pf-panel-2)"
        }}>
            declan@example.com
          </div>
          <label className="mt-4 block text-[10px] font-black uppercase" style={{
          color: "var(--pf-muted)"
        }}>
            Invite code
          </label>
          <div className="mt-2 rounded-xl px-3 py-3 text-sm font-black" style={{
          background: "var(--pf-paper)",
          color: "var(--pf-text-dark)"
        }}>
            THEBOYS24
          </div>
        </div>
        <button type="button" onClick={() => onView("picks")} className="flex w-full items-center justify-center text-white" style={{
        background: "var(--pf-red)",
        height: 48,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        paddingLeft: 24,
        paddingRight: 24
      }}>
          Join and make my picks
        </button>
      </div>;
  }
  if (view === "live") {
    return <div className="space-y-4">
        <section className="rounded-2xl p-4" style={{
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Your live position
          </p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="font-heading text-6xl leading-none">2</strong>
            <span className="mb-2 text-xl font-black">nd</span>
          </div>
          <p className="mt-1 text-sm font-black" style={{
          color: "var(--pf-green)"
        }}>
            Up one since last update · 51 pts — looking tasty
          </p>
        </section>
        {liveMatches.map(match => <div key={match.minute} className="grid grid-cols-[42px_1fr_56px_1fr] items-center rounded-2xl p-4 text-sm font-black" style={{
        background: "var(--pf-panel)"
      }}>
            <span style={{
          color: "var(--pf-red)"
        }}>{match.minute}</span>
            <span>{match.home}</span>
            <span className="text-xl">{match.score}</span>
            <span>{match.away}</span>
          </div>)}
        <section className="rounded-2xl p-4" style={{
        background: "var(--pf-panel)"
      }}>
          <h2 className="font-heading text-2xl font-black uppercase">Who is banging them in</h2>
          <div className="mt-4">
            <BonusRace />
          </div>
        </section>
      </div>;
  }
  if (view === "table") {
    return <div className="space-y-4">
        <section className="rounded-2xl p-4" style={{
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Your league
          </p>
          <h1 className="mt-2 font-heading text-4xl font-black uppercase leading-none">
            Who is bragging tonight?
          </h1>
        </section>
        <LeaderboardRows compact />
      </div>;
  }

  // picks view
  return <div className="space-y-4">
      <section className="rounded-2xl p-4" style={{
      background: "var(--pf-panel)"
    }}>
        <p className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{
        background: "var(--pf-text)",
        color: "var(--pf-app)"
      }}>
          Step 3 of 5
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-none">Pick your four. Try not to bottle it.</h1>
        <p className="mt-3 text-sm leading-5" style={{
        color: "var(--pf-muted)"
      }}>
          One from each pot. Swap them until kick-off. Then it is all on you.
        </p>
      </section>
      <PickCards />
      <section className="rounded-2xl border p-3" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-panel)"
    }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Browse by pot
          </p>
          <p className="rounded-full px-2 py-1 text-[10px] font-black" style={{
          background: "var(--pf-green)",
          color: "#071012"
        }}>
            Pot {activePot}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4].map(pot => <button key={pot} type="button" onClick={() => setActivePot(pot)} className="h-9 flex-1 rounded-xl text-xs font-black" style={{
          background: pot === activePot ? "var(--pf-red)" : "var(--pf-panel-2)",
          color: pot === activePot ? "#ffffff" : "var(--pf-muted)"
        }}>
              Pot {pot}
            </button>)}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
          {filteredTeams.map(team => <button key={team.code} type="button" className="grid justify-items-center gap-1.5">
              <FlagSVG code={team.code} size="sm" />
              <span className="max-w-[64px] truncate text-[10px] font-black">{team.name}</span>
            </button>)}
        </div>
      </section>
      <section className="rounded-2xl p-4" style={{
      background: "var(--pf-panel)"
    }}>
        <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
        color: "var(--pf-muted)"
      }}>
          Bonus pick +10 — back yourself
        </p>
        <div className="mt-3 flex items-center gap-3">
          <FlagSVG code="BRA" size="sm" />
          <strong>Brazil</strong>
          <span className="text-xs" style={{
          color: "var(--pf-muted)"
        }}>
            Top scorers bonus
          </span>
        </div>
      </section>
    </div>;
}

// ─── Mobile shell ─────────────────────────────────────────────────────────────
function MobileApp({
  theme,
  view,
  onView
}: {
  theme: ThemeMode;
  view: ProductView;
  onView: (v: ProductView) => void;
}) {
  return <div className="flex h-[944px] w-[360px] shrink-0 flex-col overflow-hidden rounded-[28px] border" style={{
    borderColor: "var(--pf-line)",
    background: "var(--pf-app)",
    color: "var(--pf-text)",
    boxShadow: "var(--pf-shadow)"
  }}>
      <header className="flex items-center justify-between border-b px-5 py-5" style={{
      borderColor: "var(--pf-line)"
    }}>
        <Logo compact />
        <span className="rounded-full border px-3 py-1 text-xs font-black" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          12 players
        </span>
      </header>
      <main className="flex-1 overflow-hidden px-5 py-5">
        <JourneyStepper view={view} onView={onView} />
        <div className="mt-6 h-[690px] overflow-y-auto">
          <MobileContent view={view} onView={onView} />
        </div>
      </main>
      <nav className="grid grid-cols-5 border-t px-2 py-3" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-panel)"
    }}>
        {views.map(item => <button key={item.id} type="button" onClick={() => onView(item.id)} className="rounded-xl px-1 py-2 text-[10px] font-black" style={{
        background: view === item.id ? "var(--pf-red)" : "transparent",
        color: view === item.id ? "#ffffff" : "var(--pf-muted)"
      }}>
            {item.label}
          </button>)}
      </nav>
      <span className="sr-only">{theme}</span>
    </div>;
}

// ─── Desktop main area ────────────────────────────────────────────────────────
function DesktopMain({
  view,
  onView
}: {
  view: ProductView;
  onView: (v: ProductView) => void;
}) {
  if (view === "rules") {
    return <section className="rounded-2xl border p-6" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-panel)"
    }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
            color: "var(--pf-muted)"
          }}>
              How it works
            </p>
            <h1 className="mt-2 font-heading text-5xl font-black uppercase leading-none">
              Here is how it works. It is simple.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6" style={{
            color: "var(--pf-muted)"
          }}>
              Pick one country from each pot, name your bonus pick, then watch the chaos unfold. Your picks. Your call. Locks at kick-off.
            </p>
          </div>
          <HatIcon size={80} color="var(--pf-text)" opacity={0.1} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {rulesSteps.map(step => <div key={step.n} className="flex gap-4 rounded-2xl p-4" style={{
          background: "var(--pf-panel-2)"
        }}>
              <span className="mt-0.5 shrink-0 font-heading text-3xl font-black leading-none" style={{
            color: step.n === "★" ? "var(--pf-amber)" : "var(--pf-red)",
            minWidth: 28
          }}>
                {step.n}
              </span>
              <div>
                <p className="text-sm font-black leading-tight">{step.heading}</p>
                <p className="mt-1 text-xs leading-5" style={{
              color: "var(--pf-muted)"
            }}>
                  {step.desc}
                </p>
              </div>
            </div>)}
        </div>
        <button type="button" onClick={() => onView("league")} className="mt-5 flex items-center justify-center text-white" style={{
        background: "var(--pf-red)",
        height: 48,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        paddingLeft: 24,
        paddingRight: 24
      }}>
          Join a league
        </button>
      </section>;
  }
  if (view === "league") {
    return <section className="grid grid-cols-[1.1fr_.9fr] gap-4">
        <div className="rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Account and league
          </p>
          <h1 className="mt-2 font-heading text-5xl font-black uppercase leading-none">Right. Let's go.</h1>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl px-4 py-3 text-sm font-bold" style={{
            background: "var(--pf-panel-2)"
          }}>
              Email · declan@example.com
            </div>
            <div className="rounded-xl px-4 py-3 text-sm font-black" style={{
            background: "var(--pf-paper)",
            color: "var(--pf-text-dark)"
          }}>
              Invite code · THEBOYS24
            </div>
            <button type="button" onClick={() => onView("picks")} className="flex items-center justify-center text-white" style={{
            background: "var(--pf-red)",
            height: 48,
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            paddingLeft: 24,
            paddingRight: 24
          }}>
              Join the league
            </button>
          </div>
        </div>
        <div className="rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Your group
          </p>
          <h2 className="mt-2 font-heading text-3xl font-black uppercase">The Boys League</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {[{
            label: "members",
            value: "12"
          }, {
            label: "locked in",
            value: "8"
          }, {
            label: "kitty",
            value: "£0"
          }, {
            label: "picks",
            value: "Open"
          }].map(stat => <div key={stat.label} className="rounded-xl p-3" style={{
            background: "var(--pf-panel-2)"
          }}>
                <strong className="block text-base">{stat.value}</strong>
                <span style={{
              color: "var(--pf-muted)"
            }}>{stat.label}</span>
              </div>)}
          </div>
        </div>
      </section>;
  }
  if (view === "picks") {
    return <section className="grid grid-cols-[220px_minmax(320px,1fr)] gap-4">
        <div className="min-w-0 rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Your four picks
          </p>
          <h1 className="mt-2 font-heading text-4xl font-black uppercase leading-none">Try not to bottle it.</h1>
          <div className="mt-5">
            <PickCards compact />
          </div>
          <div className="mt-4 rounded-2xl p-4" style={{
          background: "var(--pf-panel-2)"
        }}>
            <p className="text-[10px] font-black uppercase" style={{
            color: "var(--pf-muted)"
          }}>
              Bonus +10 — back yourself
            </p>
            <div className="mt-3 flex items-center gap-3">
              <FlagSVG code="BRA" size="sm" />
              <strong>Brazil</strong>
              <span className="text-sm" style={{
              color: "var(--pf-muted)"
            }}>
                top scorers
              </span>
            </div>
          </div>
        </div>
        <div className="min-w-[320px] rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
              color: "var(--pf-muted)"
            }}>
                Choose a country
              </p>
              <h2 className="font-heading text-3xl font-black uppercase leading-none">Make your picks</h2>
            </div>
            <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black" style={{
            background: "var(--pf-green)",
            color: "#071012"
          }}>
              Pot 1
            </span>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {teamGrid.slice(0, 12).map(team => <button key={team.code} type="button" className="min-w-0 rounded-xl p-1 transition hover:bg-[var(--pf-panel-2)]">
                <FlagSVG code={team.code} size="md" />
                <span className="mt-2 block max-w-full truncate text-center text-[10px] font-black">{team.name}</span>
              </button>)}
          </div>
        </div>
      </section>;
  }
  if (view === "live") {
    return <section className="grid grid-cols-[.9fr_1.1fr] gap-4">
        <div className="rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            Your live position
          </p>
          <div className="mt-3 flex items-end gap-3">
            <strong className="font-heading text-7xl leading-none">2</strong>
            <span className="mb-3 text-2xl font-black">nd</span>
            <strong className="mb-4" style={{
            color: "var(--pf-green)"
          }}>
              +1
            </strong>
          </div>
          <p className="text-sm" style={{
          color: "var(--pf-muted)"
        }}>
            51 pts · 3 alive · 41 country · 10 bonus — looking dangerous
          </p>
        </div>
        <div className="rounded-2xl border p-5" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          <h2 className="font-heading text-3xl font-black uppercase">Matches in play</h2>
          <div className="mt-4 space-y-3">
            {liveMatches.map(match => <div key={match.minute} className="grid grid-cols-[48px_1fr_64px_1fr_70px] rounded-xl p-3 text-sm font-black" style={{
            background: "var(--pf-panel-2)"
          }}>
                <span style={{
              color: "var(--pf-red)"
            }}>{match.minute}</span>
                <span>{match.home}</span>
                <span>{match.score}</span>
                <span>{match.away}</span>
                <span style={{
              color: "var(--pf-green)"
            }}>{match.note}</span>
              </div>)}
          </div>
        </div>
      </section>;
  }

  // table
  return <section className="rounded-2xl border p-5" style={{
    borderColor: "var(--pf-line)",
    background: "var(--pf-panel)"
  }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{
          color: "var(--pf-muted)"
        }}>
            League standings
          </p>
          <h1 className="mt-2 font-heading text-5xl font-black uppercase leading-none">Who is insufferable right now?</h1>
        </div>
        <button type="button" className="flex items-center justify-center border" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel-2)",
        height: 48,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        paddingLeft: 24,
        paddingRight: 24
      }}>
          My league / Global
        </button>
      </div>
      <div className="mt-5">
        <LeaderboardRows />
      </div>
    </section>;
}

// ─── Desktop shell ────────────────────────────────────────────────────────────
function DesktopApp({
  view,
  onView
}: {
  view: ProductView;
  onView: (v: ProductView) => void;
}) {
  return <div className="min-h-[944px] min-w-[1000px] flex-1 overflow-hidden rounded-[28px] border" style={{
    borderColor: "var(--pf-line)",
    background: "var(--pf-app)",
    color: "var(--pf-text)",
    boxShadow: "var(--pf-shadow)"
  }}>
      <header className="flex items-center justify-between border-b px-6 py-5" style={{
      borderColor: "var(--pf-line)",
      background: "var(--pf-panel)"
    }}>
        <Logo />
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-black" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel-2)"
      }}>
          <span>The Boys League</span>
          <span style={{
          color: "var(--pf-muted)"
        }}>12 players</span>
        </div>
        <button type="button" className="flex items-center justify-center text-white" style={{
        background: "var(--pf-red)",
        height: 48,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        paddingLeft: 24,
        paddingRight: 24
      }}>
          Get your mates in
        </button>
      </header>

      <div className="grid min-h-[850px] grid-cols-[132px_minmax(0,1fr)_250px] gap-4 p-4">
        {/* Left sidebar */}
        <aside className="flex flex-col gap-3 rounded-2xl border p-3" style={{
        borderColor: "var(--pf-line)",
        background: "var(--pf-panel)"
      }}>
          {views.map(item => <button key={item.id} type="button" onClick={() => onView(item.id)} className="rounded-xl px-3 py-3 text-left text-xs font-black uppercase" style={{
          background: view === item.id ? "var(--pf-red)" : "transparent",
          color: view === item.id ? "#ffffff" : "var(--pf-muted)"
        }}>
              {item.step} · {item.label}
            </button>)}
          <div className="mt-auto rounded-xl p-3" style={{
          background: "var(--pf-panel-2)"
        }}>
            <p className="text-[10px] font-black uppercase tracking-[.14em]" style={{
            color: "var(--pf-muted)"
          }}>
              Your picks
            </p>
            <div className="mt-3">
              <PickCards compact />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-4 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden rounded-2xl border p-3" style={{
          borderColor: "var(--pf-line)",
          background: "var(--pf-panel)"
        }}>
            <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{
            background: "var(--pf-green)",
            color: "#071012"
          }}>
              In play
            </span>
            {liveMatches.map(match => <span key={`${match.home}-${match.away}`} className="shrink-0 border-l pl-3 text-xs font-black" style={{
            borderColor: "var(--pf-line)"
          }}>
                <strong style={{
              color: "var(--pf-red)"
            }}>{match.minute}</strong>
                <span> {match.home} </span>
                <strong className="text-base">{match.score}</strong>
                <span> {match.away}</span>
              </span>)}
          </div>
          <DesktopMain view={view} onView={onView} />
          <section className="grid grid-cols-[.82fr_1.18fr] gap-4">
            <div className="min-w-0 rounded-2xl border p-4" style={{
            borderColor: "var(--pf-line)",
            background: "var(--pf-panel)"
          }}>
              <h3 className="font-heading text-2xl font-black uppercase">Group H</h3>
              {["ESP 6", "URU 4", "KSA 1", "CPV 0"].map((row, index) => <div key={row} className="mt-2 grid grid-cols-[24px_1fr_34px] rounded-xl px-3 py-2 text-xs font-black" style={{
              background: "var(--pf-panel-2)"
            }}>
                  <span>{index + 1}</span>
                  <span>{row.split(" ")[0]}</span>
                  <span>{row.split(" ")[1]}</span>
                </div>)}
            </div>
            <div className="min-w-0 rounded-2xl border p-4" style={{
            borderColor: "var(--pf-line)",
            background: "var(--pf-panel)"
          }}>
              <h3 className="font-heading text-2xl font-black uppercase">Knockout stage</h3>
              <div className="mt-4 grid grid-cols-[1fr_28px_1fr_28px_1fr] items-center gap-2 text-xs font-black">
                <div className="space-y-2">
                  {["ENG 3", "CRO 0", "NOR 0", "FRA 2"].map(item => <div key={item} className="rounded-lg p-2" style={{
                  background: "var(--pf-panel-2)"
                }}>
                      {item}
                    </div>)}
                </div>
                <div className="h-px" style={{
                background: "var(--pf-line)"
              }} />
                <div className="space-y-8">
                  {["ENG", "FRA"].map(item => <div key={item} className="rounded-lg p-3" style={{
                  background: "color-mix(in srgb, var(--pf-red) 14%, transparent)"
                }}>
                      {item}
                    </div>)}
                </div>
                <div className="h-px" style={{
                background: "var(--pf-line)"
              }} />
                <div className="rounded-xl p-5 text-center" style={{
                border: "1px solid color-mix(in srgb, var(--pf-amber) 40%, transparent)",
                background: "color-mix(in srgb, var(--pf-amber) 10%, transparent)"
              }}>
                  Final
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Right sidebar */}
        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border p-4" style={{
          borderColor: "var(--pf-line)",
          background: "var(--pf-panel)"
        }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-black uppercase">Match feed</h3>
              <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{
              background: "var(--pf-green)",
              color: "#071012"
            }}>
                Live
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {liveMatches.map(match => <div key={match.minute} className="rounded-xl p-3 text-sm font-black" style={{
              background: "var(--pf-panel-2)"
            }}>
                  <div className="grid grid-cols-[40px_1fr_54px_1fr]">
                    <span style={{
                  color: "var(--pf-red)"
                }}>{match.minute}</span>
                    <span>{match.home}</span>
                    <span>{match.score}</span>
                    <span>{match.away}</span>
                  </div>
                  <p className="mt-2 text-right text-xs" style={{
                color: "var(--pf-green)"
              }}>
                    {match.note}
                  </p>
                </div>)}
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{
          borderColor: "var(--pf-line)",
          background: "var(--pf-panel)"
        }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-black uppercase">Who is banging them in</h3>
              <span className="rounded-full px-2 py-1 text-[10px] font-black text-white" style={{
              background: "var(--pf-red)"
            }}>
                +10
              </span>
            </div>
            <div className="mt-4">
              <BonusRace />
            </div>
          </section>

          {/* Disclaimer footer panel */}
          <section className="rounded-2xl border p-4" style={{
          borderColor: "var(--pf-line)",
          background: "var(--pf-panel-2)"
        }}>
            <p className="text-[10px] leading-4" style={{
            color: "var(--pf-muted)",
            fontSize: "10px"
          }}>
              PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup,
              tournament organisers, broadcasters, or national associations.
            </p>
          </section>
        </aside>
      </div>
    </div>;
}

// ─── Root export ──────────────────────────────────────────────────────────────
export const PickFourOverhaulDirection = () => {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [view, setView] = useState<ProductView>("picks");
  return <div className="min-h-screen w-full overflow-auto p-5 font-body" style={{
    ...(themeVars[theme] as React.CSSProperties),
    background: "var(--pf-canvas)",
    color: "var(--pf-text)"
  }}>
      <div className="mx-auto max-w-[1400px]">
        <ReviewControls theme={theme} view={view} onTheme={setTheme} onView={setView} />
        <div className="flex gap-4 overflow-x-auto pb-2">
          <MobileApp theme={theme} view={view} onView={setView} />
          <DesktopApp view={view} onView={setView} />
        </div>
        {/* Mobile disclaimer footer */}
        <p className="mt-6 text-center" style={{
        color: "var(--pf-muted)",
        fontSize: "10px",
        lineHeight: 1.5
      }}>
          PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup,
          tournament organisers, broadcasters, or national associations.
        </p>
      </div>
    </div>;
};
