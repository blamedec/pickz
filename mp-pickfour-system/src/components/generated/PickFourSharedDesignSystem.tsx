import type { CSSProperties } from "react";

type Team = {
  code: string;
  name: string;
  primary: string;
  secondary: string;
  accent?: string;
};

const teams: Team[] = [
  { code: "ENG", name: "England", primary: "#fff7eb", secondary: "#d91f3d" },
  { code: "JPN", name: "Japan", primary: "#fff7eb", secondary: "#d91f3d" },
  { code: "NOR", name: "Norway", primary: "#d91f3d", secondary: "#15396f", accent: "#fff7eb" },
  { code: "GHA", name: "Ghana", primary: "#f1c52c", secondary: "#0a7441", accent: "#111111" },
  { code: "BRA", name: "Brazil", primary: "#f4d21f", secondary: "#0f8f4c" },
  { code: "FRA", name: "France", primary: "#184f9d", secondary: "#e83445" },
];

const modes = [
  {
    name: "Dark",
    vars: {
      "--canvas": "#050607",
      "--app": "#0b0e0d",
      "--panel": "#121615",
      "--panel2": "#1a201d",
      "--paper": "#f7f0e6",
      "--text": "#f8f1e6",
      "--muted": "rgba(248,241,230,.58)",
      "--line": "rgba(248,241,230,.12)",
      "--red": "#e0193d",
      "--green": "#72df84",
      "--amber": "#f0c531",
    },
  },
  {
    name: "Light",
    vars: {
      "--canvas": "#f4efe6",
      "--app": "#fffaf1",
      "--panel": "#ffffff",
      "--panel2": "#eee4d5",
      "--paper": "#fff7eb",
      "--text": "#10110f",
      "--muted": "rgba(16,17,15,.58)",
      "--line": "rgba(16,17,15,.12)",
      "--red": "#d7193f",
      "--green": "#0d7a43",
      "--amber": "#d99c1c",
    },
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14">
        <div className="absolute left-[8%] top-[58%] h-[28%] w-[82%] rounded-b-lg bg-[#050607]" />
        <div className="absolute left-0 top-[45%] h-[32%] w-full rounded-[50%] border border-white/20 bg-[#050607]" />
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="absolute top-0 h-[62%] w-[22%] rounded-sm border border-black/30 bg-[#fff7eb]"
            style={{ left: `${26 + item * 12}%`, transform: `rotate(${[-18, -6, 8, 20][item]}deg)` }}
          />
        ))}
      </div>
      <div>
        <p className="font-heading text-4xl font-black uppercase leading-none">Pick<span style={{ color: "var(--red)" }}>Four</span></p>
        <p className="text-[11px] font-black uppercase tracking-normal" style={{ color: "var(--red)" }}>Pick 4</p>
      </div>
    </div>
  );
}

function Badge({ team, small = false }: { team: Team; small?: boolean }) {
  return (
    <div className={`${small ? "h-12 w-12 rounded-2xl" : "h-20 w-16 rounded-[20px]"} relative grid place-items-center overflow-hidden border border-black/10 bg-[#fff7eb] shadow-[0_10px_22px_rgba(0,0,0,.2)]`}>
      <div className="absolute inset-0" style={{ background: team.primary }} />
      <div className="absolute -right-4 top-0 h-full w-12 rotate-12" style={{ background: team.secondary }} />
      {team.accent ? <div className="absolute bottom-0 left-0 h-4 w-full" style={{ background: team.accent }} /> : null}
      <span className="relative rounded-md border border-black/20 bg-white/90 px-1.5 text-[11px] font-black text-[#10110f]">{team.code}</span>
    </div>
  );
}

function ButtonRow() {
  return (
    <div className="flex flex-wrap gap-3">
      <button className="rounded-xl px-5 py-3 text-xs font-black uppercase text-white" style={{ background: "var(--red)" }}>Primary action</button>
      <button className="rounded-xl border px-5 py-3 text-xs font-black uppercase" style={{ borderColor: "var(--line)", background: "var(--panel2)" }}>Secondary</button>
      <button className="rounded-xl px-4 py-2 text-xs font-black uppercase text-[#071012]" style={{ background: "var(--green)" }}>Live</button>
      <button className="rounded-xl px-4 py-2 text-xs font-black uppercase text-white" style={{ background: "var(--red)" }}>+10 bonus</button>
    </div>
  );
}

function TableMini() {
  const rows = [
    ["1", "Declan", "51", "+1"],
    ["2", "Jack", "47", "-1"],
    ["3", "Soph", "47", "-"],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)" }}>
      <div className="grid grid-cols-[36px_1fr_52px_52px] px-4 py-3 text-[10px] font-black uppercase" style={{ background: "var(--panel2)", color: "var(--muted)" }}>
        <span>#</span><span>Entrant</span><span>Pts</span><span>Trend</span>
      </div>
      {rows.map((row) => (
        <div key={row[1]} className="grid grid-cols-[36px_1fr_52px_52px] border-t px-4 py-3 text-sm" style={{ borderColor: "var(--line)", background: row[1] === "Declan" ? "color-mix(in srgb, var(--red) 18%, transparent)" : "var(--panel)" }}>
          <b>{row[0]}</b><b>{row[1]}<span className="block text-[10px]" style={{ color: "var(--muted)" }}>3 alive · 41 country · 10 bonus</span></b><b>{row[2]}</b><b style={{ color: row[3].startsWith("+") ? "var(--green)" : row[3].startsWith("-") ? "var(--red)" : "var(--muted)" }}>{row[3]}</b>
        </div>
      ))}
    </div>
  );
}

export const PickFourSharedDesignSystem = () => {
  return (
    <main className="min-h-screen bg-[#050607] p-7 font-body text-[#f8f1e6]">
      <div className="mx-auto max-w-[1376px]">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.22em] text-white/45">PickFour product system</p>
            <h1 className="mt-2 font-heading text-6xl font-black uppercase leading-none">Hat ritual. Sticker picks. Real app clarity.</h1>
          </div>
          <p className="max-w-[360px] text-sm leading-6 text-white/58">Shared components for mobile and desktop so the redesign becomes one product, not two unrelated layouts.</p>
        </header>

        <div className="mt-7 grid grid-cols-2 gap-5">
          {modes.map((mode) => (
            <section key={mode.name} className="rounded-[28px] border p-5 shadow-[0_28px_90px_rgba(0,0,0,.35)]" style={{ ...mode.vars, borderColor: "var(--line)", background: "var(--app)", color: "var(--text)" } as CSSProperties}>
              <div className="flex items-center justify-between">
                <Logo />
                <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>{mode.name} mode</span>
              </div>
              <div className="mt-6 grid grid-cols-[.85fr_1.15fr] gap-5">
                <div className="space-y-5">
                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: "var(--muted)" }}>Country badges</p>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {teams.map((team) => <div key={team.code} className="grid justify-items-center gap-2"><Badge team={team} /><b className="text-[11px]">{team.name}</b></div>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: "var(--muted)" }}>Actions and states</p>
                    <div className="mt-4"><ButtonRow /></div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: "var(--muted)" }}>Typography</p>
                    <h2 className="mt-2 font-heading text-5xl font-black uppercase leading-none">Friend bragging rights</h2>
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>Barlow Condensed for football-scoreboard headings. Inter for dense app UI, tables, forms, and controls.</p>
                  </div>
                  <TableMini />
                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--paper)", color: "#10110f" }}>
                    <b className="text-sm">Non-affiliation pattern</b>
                    <p className="mt-1 text-xs leading-5 opacity-70">PickFour is an unofficial fantasy game and is not affiliated with FIFA, the World Cup, organisers, broadcasters, or national associations.</p>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};
