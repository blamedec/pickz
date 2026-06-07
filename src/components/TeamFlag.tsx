import type { Team } from "../types";

interface TeamFlagProps {
  team: Team;
  className?: string;
}

function Star({ fill = "#10110f" }: { fill?: string }) {
  return (
    <polygon
      points="32,14 36.1,25.4 48.2,25.8 38.7,33.3 42.1,45 32,38.4 21.9,45 25.3,33.3 15.8,25.8 27.9,25.4"
      fill={fill}
    />
  );
}

function FlagArt({ team }: { team: Team }) {
  const code = team.code.toUpperCase();
  const primary = team.primaryColor;
  const secondary = team.secondaryColor;

  switch (code) {
    case "ENG":
      return (
        <>
          <rect width="64" height="48" fill="#fffaf1" />
          <rect x="27" width="10" height="48" fill="#cf142b" />
          <rect y="19" width="64" height="10" fill="#cf142b" />
        </>
      );
    case "JPN":
      return (
        <>
          <rect width="64" height="48" fill="#fffaf1" />
          <circle cx="32" cy="24" r="13" fill="#bc002d" />
        </>
      );
    case "NOR":
      return (
        <>
          <rect width="64" height="48" fill="#ef2b2d" />
          <rect y="18" width="64" height="12" fill="#fffaf1" />
          <rect x="18" width="12" height="48" fill="#fffaf1" />
          <rect y="21" width="64" height="6" fill="#002868" />
          <rect x="21" width="6" height="48" fill="#002868" />
        </>
      );
    case "GHA":
      return (
        <>
          <rect width="64" height="16" fill="#ce1126" />
          <rect y="16" width="64" height="16" fill="#fcd116" />
          <rect y="32" width="64" height="16" fill="#006b3f" />
          <Star />
        </>
      );
    case "BRA":
      return (
        <>
          <rect width="64" height="48" fill="#009c3b" />
          <polygon points="32,6 58,24 32,42 6,24" fill="#ffdf00" />
          <circle cx="32" cy="24" r="11" fill="#002776" />
        </>
      );
    case "FRA":
      return (
        <>
          <rect width="21.34" height="48" fill="#002395" />
          <rect x="21.34" width="21.34" height="48" fill="#fffaf1" />
          <rect x="42.68" width="21.34" height="48" fill="#ed2939" />
        </>
      );
    case "ARG":
      return (
        <>
          <rect width="64" height="16" fill="#74acdf" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#74acdf" />
          <circle cx="32" cy="24" r="6" fill="#f6b40e" />
        </>
      );
    case "GER":
      return (
        <>
          <rect width="64" height="16" fill="#10110f" />
          <rect y="16" width="64" height="16" fill="#dd0000" />
          <rect y="32" width="64" height="16" fill="#ffce00" />
        </>
      );
    case "BEL":
      return (
        <>
          <rect width="21.34" height="48" fill="#10110f" />
          <rect x="21.34" width="21.34" height="48" fill="#fdda24" />
          <rect x="42.68" width="21.34" height="48" fill="#ef3340" />
        </>
      );
    case "CRO":
      return (
        <>
          <rect width="64" height="16" fill="#ff0000" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#0c2fff" />
          {Array.from({ length: 16 }).map((_, i) => (
            <rect
              key={i}
              x={24 + (i % 4) * 4}
              y={16 + Math.floor(i / 4) * 4}
              width="4"
              height="4"
              fill={(i + Math.floor(i / 4)) % 2 === 0 ? "#ff0000" : "#fffaf1"}
            />
          ))}
        </>
      );
    case "MAR":
      return (
        <>
          <rect width="64" height="48" fill="#c1272d" />
          <polygon points="32,13 35.1,22.1 44.8,22.1 36.9,27.8 39.9,37 32,31.3 24.1,37 27.1,27.8 19.2,22.1 28.9,22.1" fill="none" stroke="#006233" strokeWidth="2" />
        </>
      );
    case "SWE":
      return (
        <>
          <rect width="64" height="48" fill="#006aa7" />
          <rect y="18" width="64" height="10" fill="#fecc02" />
          <rect x="20" width="10" height="48" fill="#fecc02" />
        </>
      );
    case "ESP":
      return (
        <>
          <rect width="64" height="12" fill="#c60b1e" />
          <rect y="12" width="64" height="24" fill="#ffc400" />
          <rect y="36" width="64" height="12" fill="#c60b1e" />
        </>
      );
    case "POR":
      return (
        <>
          <rect width="26" height="48" fill="#046a38" />
          <rect x="26" width="38" height="48" fill="#da291c" />
          <circle cx="26" cy="24" r="7" fill="#ffdf00" />
        </>
      );
    case "NED":
      return (
        <>
          <rect width="64" height="16" fill="#ae1c28" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#21468b" />
        </>
      );
    case "CAN":
      return (
        <>
          <rect width="64" height="48" fill="#fffaf1" />
          <rect width="16" height="48" fill="#d52b1e" />
          <rect x="48" width="16" height="48" fill="#d52b1e" />
          <polygon points="32,9 35,20 44,18 38,26 42,34 32,29 22,34 26,26 20,18 29,20" fill="#d52b1e" />
        </>
      );
    case "MEX":
      return (
        <>
          <rect width="21.34" height="48" fill="#006847" />
          <rect x="21.34" width="21.34" height="48" fill="#fffaf1" />
          <rect x="42.68" width="21.34" height="48" fill="#ce1126" />
          <circle cx="32" cy="24" r="5" fill="#8b5a2b" />
        </>
      );
    case "USA":
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} y={i * 7} width="64" height="4" fill="#d42339" />
          ))}
          <rect width="30" height="25" fill="#213065" />
          <circle cx="10" cy="8" r="2" fill="#fffaf1" />
          <circle cx="20" cy="8" r="2" fill="#fffaf1" />
          <circle cx="10" cy="17" r="2" fill="#fffaf1" />
          <circle cx="20" cy="17" r="2" fill="#fffaf1" />
        </>
      );
    case "SUI":
      return (
        <>
          <rect width="64" height="48" fill="#d72b2c" />
          <rect x="28" y="12" width="8" height="24" fill="#fffaf1" />
          <rect x="20" y="20" width="24" height="8" fill="#fffaf1" />
        </>
      );
    case "COL":
    case "ECU":
      return (
        <>
          <rect width="64" height="24" fill="#fbd632" />
          <rect y="24" width="64" height="12" fill="#21418c" />
          <rect y="36" width="64" height="12" fill="#ce1126" />
        </>
      );
    case "URU":
      return (
        <>
          <rect width="64" height="48" fill="#fffaf1" />
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={i} y={6 + i * 12} width="64" height="6" fill="#003da5" />
          ))}
          <rect width="24" height="24" fill="#fffaf1" />
          <circle cx="12" cy="12" r="6" fill="#f6b40e" />
        </>
      );
    case "KOR":
      return (
        <>
          <rect width="64" height="48" fill="#fffaf1" />
          <g transform="rotate(-24 32 24)">
            <path d="M21 24a11 11 0 0 1 22 0H21z" fill="#cd2e3a" />
            <path d="M43 24a11 11 0 0 1-22 0H43z" fill="#0047a0" />
            <circle cx="26.5" cy="24" r="5.5" fill="#0047a0" />
            <circle cx="37.5" cy="24" r="5.5" fill="#cd2e3a" />
          </g>
          <g stroke="#10110f" strokeWidth="2" strokeLinecap="round">
            <path d="M14 12h8M14 17h8M14 22h8" />
            <path d="M42 30h8M42 35h8M42 40h8" />
          </g>
        </>
      );
    case "RSA":
      return (
        <>
          <rect width="64" height="24" fill="#de3831" />
          <rect y="24" width="64" height="24" fill="#002395" />
          <polygon points="0,0 30,24 0,48" fill="#10110f" />
          <polygon points="0,6 22,24 0,42" fill="#ffb612" />
          <polygon points="0,10 18,24 0,38" fill="#007a4d" />
          <rect x="24" y="20" width="40" height="8" fill="#fffaf1" />
        </>
      );
    case "SEN":
      return (
        <>
          <rect width="21.34" height="48" fill="#00853f" />
          <rect x="21.34" width="21.34" height="48" fill="#fdef42" />
          <rect x="42.68" width="21.34" height="48" fill="#e31b23" />
          <Star fill="#00853f" />
        </>
      );
    case "IRN":
      return (
        <>
          <rect width="64" height="16" fill="#239f40" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#da0000" />
          <circle cx="32" cy="24" r="5" fill="#da0000" />
        </>
      );
    case "AUT":
      return (
        <>
          <rect width="64" height="16" fill="#d72b2c" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#d72b2c" />
        </>
      );
    case "AUS":
      return (
        <>
          <rect width="64" height="48" fill="#012169" />
          <rect width="30" height="24" fill="#0b2f6b" />
          <path d="M0 0l30 24M30 0L0 24" stroke="#fffaf1" strokeWidth="5" />
          <path d="M0 0l30 24M30 0L0 24" stroke="#c8102e" strokeWidth="2" />
          <Star fill="#fffaf1" />
          <circle cx="49" cy="13" r="3" fill="#fffaf1" />
        </>
      );
    case "PAN":
      return (
        <>
          <rect width="32" height="24" fill="#fffaf1" />
          <rect x="32" width="32" height="24" fill="#d21034" />
          <rect y="24" width="32" height="24" fill="#005293" />
          <rect x="32" y="24" width="32" height="24" fill="#fffaf1" />
          <circle cx="16" cy="12" r="5" fill="#005293" />
          <circle cx="48" cy="36" r="5" fill="#d21034" />
        </>
      );
    case "EGY":
      return (
        <>
          <rect width="64" height="16" fill="#ce1126" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#10110f" />
          <circle cx="32" cy="24" r="5" fill="#c09300" />
        </>
      );
    case "ALG":
      return (
        <>
          <rect width="32" height="48" fill="#006233" />
          <rect x="32" width="32" height="48" fill="#fffaf1" />
          <circle cx="34" cy="24" r="10" fill="#d21034" />
          <circle cx="38" cy="24" r="8" fill="#fffaf1" />
          <polygon points="40,17 42,22 47,22 43,25 45,30 40,27 35,30 37,25 33,22 38,22" fill="#d21034" />
        </>
      );
    case "SCO":
      return (
        <>
          <rect width="64" height="48" fill="#005eb8" />
          <path d="M-4 0L64 52M68 0L0 52" stroke="#fffaf1" strokeWidth="9" />
        </>
      );
    case "PAR":
      return (
        <>
          <rect width="64" height="16" fill="#d52b1e" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#0038a8" />
          <circle cx="32" cy="24" r="5" fill="#f6b40e" />
        </>
      );
    case "TUN":
      return (
        <>
          <rect width="64" height="48" fill="#e70013" />
          <circle cx="32" cy="24" r="13" fill="#fffaf1" />
          <circle cx="30" cy="24" r="7" fill="#e70013" />
          <circle cx="33" cy="24" r="6" fill="#fffaf1" />
          <polygon points="39,18 41,23 46,23 42,26 44,31 39,28 34,31 36,26 32,23 37,23" fill="#e70013" />
        </>
      );
    case "CIV":
      return (
        <>
          <rect width="21.34" height="48" fill="#f77f00" />
          <rect x="21.34" width="21.34" height="48" fill="#fffaf1" />
          <rect x="42.68" width="21.34" height="48" fill="#009e60" />
        </>
      );
    case "UZB":
      return (
        <>
          <rect width="64" height="15" fill="#0099b5" />
          <rect y="15" width="64" height="2" fill="#ce1126" />
          <rect y="17" width="64" height="14" fill="#fffaf1" />
          <rect y="31" width="64" height="2" fill="#ce1126" />
          <rect y="33" width="64" height="15" fill="#1eb53a" />
          <circle cx="12" cy="8" r="5" fill="#fffaf1" />
        </>
      );
    case "QAT":
      return (
        <>
          <rect width="64" height="48" fill="#8a1538" />
          <polygon points="0,0 19,0 12,5.3 19,10.6 12,16 19,21.3 12,26.6 19,32 12,37.3 19,42.6 12,48 0,48" fill="#fffaf1" />
        </>
      );
    case "KSA":
      return (
        <>
          <rect width="64" height="48" fill="#006c35" />
          <rect x="16" y="29" width="32" height="3" rx="1.5" fill="#fffaf1" />
          <rect x="20" y="17" width="24" height="4" rx="2" fill="#fffaf1" opacity="0.9" />
        </>
      );
    case "JOR":
      return (
        <>
          <rect width="64" height="16" fill="#10110f" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#007a3d" />
          <polygon points="0,0 32,24 0,48" fill="#ce1126" />
          <circle cx="12" cy="24" r="4" fill="#fffaf1" />
        </>
      );
    case "CUW":
      return (
        <>
          <rect width="64" height="48" fill="#002b7f" />
          <rect y="31" width="64" height="6" fill="#f9d616" />
          <circle cx="16" cy="15" r="4" fill="#fffaf1" />
          <circle cx="25" cy="12" r="3" fill="#fffaf1" />
        </>
      );
    case "HAI":
      return (
        <>
          <rect width="64" height="24" fill="#00209f" />
          <rect y="24" width="64" height="24" fill="#d21034" />
          <rect x="24" y="17" width="16" height="14" fill="#fffaf1" />
          <circle cx="32" cy="24" r="4" fill="#0d7a43" />
        </>
      );
    case "NZL":
      return (
        <>
          <rect width="64" height="48" fill="#012169" />
          <rect width="28" height="22" fill="#0b2f6b" />
          <path d="M0 0l28 22M28 0L0 22" stroke="#fffaf1" strokeWidth="5" />
          <path d="M0 0l28 22M28 0L0 22" stroke="#c8102e" strokeWidth="2" />
          <circle cx="47" cy="16" r="4" fill="#c8102e" stroke="#fffaf1" strokeWidth="1.5" />
          <circle cx="54" cy="28" r="4" fill="#c8102e" stroke="#fffaf1" strokeWidth="1.5" />
        </>
      );
    case "BIH":
      return (
        <>
          <rect width="64" height="48" fill="#002f6c" />
          <polygon points="24,0 52,48 24,48" fill="#fcd116" />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={18 + i * 5} cy={5 + i * 9} r="2.4" fill="#fffaf1" />
          ))}
        </>
      );
    case "TUR":
      return (
        <>
          <rect width="64" height="48" fill="#e30a17" />
          <circle cx="28" cy="24" r="12" fill="#fffaf1" />
          <circle cx="33" cy="24" r="10" fill="#e30a17" />
          <polygon points="42,17 44,23 50,23 45,27 47,33 42,29 37,33 39,27 34,23 40,23" fill="#fffaf1" />
        </>
      );
    case "COD":
      return (
        <>
          <rect width="64" height="48" fill="#418fde" />
          <path d="M-6 48L64 0" stroke="#f7d117" strokeWidth="15" />
          <path d="M-6 48L64 0" stroke="#c60000" strokeWidth="8" />
          <Star fill="#f7d117" />
        </>
      );
    case "IRQ":
      return (
        <>
          <rect width="64" height="16" fill="#ce1126" />
          <rect y="16" width="64" height="16" fill="#fffaf1" />
          <rect y="32" width="64" height="16" fill="#10110f" />
          <rect x="22" y="23" width="20" height="3" fill="#007a3d" />
        </>
      );
    case "CPV":
      return (
        <>
          <rect width="64" height="48" fill="#003893" />
          <rect y="26" width="64" height="5" fill="#fffaf1" />
          <rect y="31" width="64" height="5" fill="#ef3340" />
          <circle cx="21" cy="23" r="7" fill="none" stroke="#ffdf00" strokeWidth="3" strokeDasharray="2 4" />
        </>
      );
    case "CZE":
      return (
        <>
          <rect width="64" height="24" fill="#fffaf1" />
          <rect y="24" width="64" height="24" fill="#d7141a" />
          <polygon points="0,0 32,24 0,48" fill="#11457e" />
        </>
      );
    default:
      return (
        <>
          <rect width="64" height="48" fill={primary} />
          <path d="M0 48L64 0v48z" fill={secondary} opacity="0.95" />
          <rect x="26" width="12" height="48" fill="#fffaf1" opacity="0.34" />
        </>
      );
  }
}

export function TeamFlag({ team, className = "" }: TeamFlagProps) {
  const label = `${team.name} country badge`;

  return (
    <span
      className={["team-flag", `crest-${team.id}`, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 64 48" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        <FlagArt team={team} />
        <path className="flag-sticker-sheen" d="M0 0h64v14c-16 5-34 7-64 4z" />
        <path className="flag-sticker-fold" d="M50 48h14V34c-3.3 6.2-7.9 10.8-14 14z" />
        <rect className="flag-sticker-edge" x="0.75" y="0.75" width="62.5" height="46.5" rx="7" />
      </svg>
    </span>
  );
}
