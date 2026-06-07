import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type View = "rules" | "league" | "picks" | "bonus" | "live" | "table";
type Theme = "dark" | "light";

const views: Array<{ id: View; label: string }> = [
  { id: "rules", label: "Rules" },
  { id: "league", label: "League" },
  { id: "picks", label: "Picks" },
  { id: "bonus", label: "Bonus" },
  { id: "live", label: "Live" },
  { id: "table", label: "Table" },
];

const teams = [
  ["ENG", "England", "#fff7eb", "#d91f3d"],
  ["JPN", "Japan", "#fff7eb", "#d91f3d"],
  ["NOR", "Norway", "#d91f3d", "#15396f"],
  ["GHA", "Ghana", "#f1c52c", "#0a7441"],
  ["ARG", "Argentina", "#7ec8ed", "#f4c43a"],
  ["BRA", "Brazil", "#f4d21f", "#0f8f4c"],
  ["FRA", "France", "#184f9d", "#e83445"],
  ["GER", "Germany", "#171717", "#f5ca26"],
  ["CRO", "Croatia", "#fff7eb", "#d91f3d"],
  ["SWE", "Sweden", "#1167aa", "#f4c43a"],
  ["MEX", "Mexico", "#0f7a43", "#d91f3d"],
  ["NED", "Netherlands", "#ef6b28", "#184f9d"],
];

const themeVars = {
  dark: {
    "--app": "#0b0e0d", "--panel": "#121615", "--panel2": "#1a201d", "--paper": "#f7f0e6", "--text": "#f8f1e6", "--muted": "rgba(248,241,230,.58)", "--line": "rgba(248,241,230,.12)", "--red": "#e0193d", "--green": "#72df84",
  },
  light: {
    "--app": "#fffaf1", "--panel": "#ffffff", "--panel2": "#eee4d5", "--paper": "#fff7eb", "--text": "#10110f", "--muted": "rgba(16,17,15,.58)", "--line": "rgba(16,17,15,.12)", "--red": "#d7193f", "--green": "#0d7a43",
  },
} as const;

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10">
        <div className="absolute left-1 top-6 h-3 w-8 rounded-b bg-[#050607]" />
        <div className="absolute left-0 top-5 h-4 w-10 rounded-[50%] bg-[#050607]" />
        {[0, 1, 2, 3].map((i) => <span key={i} className="absolute top-0 h-7 w-2.5 rounded-sm bg-[#fff7eb]" style={{ left: `${12 + i * 5}px`, transform: `rotate(${[-18, -6, 8, 20][i]}deg)` }} />)}
      </div>
      <div><p className="font-heading text-2xl font-black uppercase leading-none">Pick<span className="text-[var(--red)]">Four</span></p><p className="text-[10px] font-black uppercase text-[var(--red)]">Pick 4</p></div>
    </div>
  );
}

function Badge({ team, small = false }: { team: string[]; small?: boolean }) {
  return (
    <div className={`${small ? "h-11 w-11" : "h-16 w-14"} relative grid place-items-center overflow-hidden rounded-2xl border border-black/10 bg-[#fff7eb] shadow-sm`}>
      <span className="absolute inset-0" style={{ background: team[2] }} />
      <span className="absolute -right-4 top-0 h-full w-10 rotate-12" style={{ background: team[3] }} />
      <b className="relative rounded-md border border-black/20 bg-white/90 px-1.5 text-[10px] text-[#10110f]">{team[0]}</b>
    </div>
  );
}

function Stepper({ view, setView }: { view: View; setView: (view: View) => void }) {
  const current = views.findIndex((item) => item.id === view);
  return (
    <div className="grid grid-cols-6 gap-1">
      {views.map((item, index) => (
        <button key={item.id} type="button" onClick={() => setView(item.id)} className="grid justify-items-center gap-1">
          <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-black ${view === item.id ? "border-[var(--red)] bg-[var(--red)] text-white" : index < current ? "border-[var(--green)] bg-[var(--green)] text-[#071012]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]"}`}>{index + 1}</span>
          <span className={`text-[9px] font-black ${view === item.id ? "text-[var(--red)]" : "text-[var(--muted)]"}`}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function Picks() {
  const [pot, setPot] = useState(3);
  const visible = useMemo(() => teams.slice(pot === 3 ? 4 : 0, pot === 3 ? 12 : 8), [pot]);
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-[var(--panel)] p-4">
        <p className="rounded-full bg-[var(--text)] px-3 py-1 text-[10px] font-black uppercase text-[var(--app)]">Step 3 of 6</p>
        <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-none">Build your four.</h1>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">One from each pot, then one bonus slip. Clear, guided, no dead ends.</p>
      </section>
      <div className="grid grid-cols-4 gap-2">
        {teams.slice(0, 4).map((team, index) => (
          <button key={team[0]} type="button" onClick={() => setPot(index + 1)} className="rounded-2xl bg-[var(--paper)] p-2 text-center text-[#10110f]">
            <p className="text-[10px] font-black uppercase text-[var(--red)]">Pot {index + 1}</p><div className="mt-2 flex justify-center"><Badge team={team} /></div><b className="mt-2 block truncate text-[10px]">{team[1]}</b>
          </button>
        ))}
      </div>
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--muted)]">Browse teams</p><b className="rounded-full bg-[var(--green)] px-2 py-1 text-[10px] text-[#071012]">Pot {pot}</b></div>
        <div className="mt-3 flex gap-2">{[1, 2, 3, 4].map((item) => <button key={item} onClick={() => setPot(item)} className={`h-9 flex-1 rounded-xl text-xs font-black ${pot === item ? "bg-[var(--red)] text-white" : "bg-[var(--panel2)] text-[var(--muted)]"}`}>Pot {item}</button>)}</div>
        <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">{visible.map((team) => <div key={team[0]} className="grid justify-items-center gap-2"><Badge team={team} /><b className="max-w-[64px] truncate text-[10px]">{team[1]}</b></div>)}</div>
      </section>
    </div>
  );
}

function Content({ view, setView }: { view: View; setView: (view: View) => void }) {
  if (view === "picks") return <Picks />;
  if (view === "rules") return <Journey title="Rules first." kicker="Before picks" body="A short, visual scoring explainer before any sign-up or league action." action="I’ve read the rules" next={() => setView("league")} items={["Pick one country from each pot", "Duplicate picks are allowed", "Picks lock at tournament start"]} />;
  if (view === "league") return <Journey title="Join the room." kicker="Email and league" body="Sign up with email, paste the invite code, then move straight into picks." action="Join and pick" next={() => setView("picks")} items={["Magic link email", "Invite code THEBOYS24", "Create league for organisers"]} />;
  if (view === "bonus") return <Journey title="Choose the bonus slip." kicker="+10 highest scorer" body="The bonus gets its own focused step so players do not miss it." action="Save picks" next={() => setView("live")} items={["Brazil selected", "All countries searchable", "Editable until lock"]} />;
  if (view === "live") return <Journey title="Watch it move." kicker="Live rank" body="Rank, matches, and bonus race sit together so the friend competition feels alive." action="Open table" next={() => setView("table")} items={["2nd · 51 pts", "ENG 3-0 CRO", "Brazil chasing bonus"]} />;
  return <Journey title="Bragging rights." kicker="League table" body="The table is expandable, but the key values are always visible on mobile." action="Back to picks" next={() => setView("picks")} items={["Declan 51 pts", "3 alive · 41 country · 10 bonus", "Global table available"]} />;
}

function Journey({ title, kicker, body, action, next, items }: { title: string; kicker: string; body: string; action: string; next: () => void; items: string[] }) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-[var(--panel)] p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--muted)]">{kicker}</p><h1 className="mt-2 font-heading text-4xl font-black uppercase leading-none">{title}</h1><p className="mt-3 text-sm leading-5 text-[var(--muted)]">{body}</p></section>
      {items.map((item) => <div key={item} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-sm font-black">{item}</div>)}
      <button onClick={next} className="w-full rounded-2xl bg-[var(--red)] px-4 py-4 text-sm font-black uppercase text-white">{action}</button>
    </div>
  );
}

export const PickFourMobileJourney = () => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [view, setView] = useState<View>("picks");
  return (
    <main className="grid min-h-screen place-items-center bg-[#050607] p-4 font-body">
      <div className="h-[908px] w-[398px] overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--app)] text-[var(--text)] shadow-[0_30px_90px_rgba(0,0,0,.45)]" style={themeVars[theme] as CSSProperties}>
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-5"><Logo /><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-black">{theme}</button></header>
        <main className="px-5 py-5"><Stepper view={view} setView={setView} /><div className="mt-6 h-[680px] overflow-hidden"><Content view={view} setView={setView} /></div></main>
        <nav className="grid grid-cols-6 border-t border-[var(--line)] bg-[var(--panel)] px-2 py-3">{views.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`rounded-xl px-1 py-2 text-[9px] font-black ${view === item.id ? "bg-[var(--red)] text-white" : "text-[var(--muted)]"}`}>{item.label}</button>)}</nav>
      </div>
    </main>
  );
};
