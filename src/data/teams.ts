import type { Team } from "../types";

export const teams: Team[] = [
  { id: "esp", espnId: "164", name: "Spain", shortName: "Spain", code: "ESP", flag: "🇪🇸", group: "H", pot: 1, primaryColor: "#c60b1e", secondaryColor: "#ffc400" },
  { id: "arg", espnId: "202", name: "Argentina", shortName: "Argentina", code: "ARG", flag: "🇦🇷", group: "J", pot: 1, primaryColor: "#74acdf", secondaryColor: "#f6b40e" },
  { id: "fra", espnId: "478", name: "France", shortName: "France", code: "FRA", flag: "🇫🇷", group: "I", pot: 1, primaryColor: "#1d3f8f", secondaryColor: "#ef3340" },
  { id: "eng", espnId: "448", name: "England", shortName: "England", code: "ENG", flag: "🏴", group: "L", pot: 1, primaryColor: "#ffffff", secondaryColor: "#cf142b", nostalgicNote: "white shirts, red trim, tournament swagger" },
  { id: "bra", espnId: "205", name: "Brazil", shortName: "Brazil", code: "BRA", flag: "🇧🇷", group: "C", pot: 1, primaryColor: "#fee000", secondaryColor: "#009c37" },
  { id: "por", espnId: "482", name: "Portugal", shortName: "Portugal", code: "POR", flag: "🇵🇹", group: "K", pot: 1, primaryColor: "#da291c", secondaryColor: "#046a38" },
  { id: "ned", espnId: "449", name: "Netherlands", shortName: "Netherlands", code: "NED", flag: "🇳🇱", group: "F", pot: 1, primaryColor: "#f36c21", secondaryColor: "#21468b" },
  { id: "bel", espnId: "459", name: "Belgium", shortName: "Belgium", code: "BEL", flag: "🇧🇪", group: "G", pot: 1, primaryColor: "#ef3340", secondaryColor: "#ffd100" },
  { id: "ger", espnId: "481", name: "Germany", shortName: "Germany", code: "GER", flag: "🇩🇪", group: "E", pot: 1, primaryColor: "#111111", secondaryColor: "#ffce00" },
  { id: "usa", espnId: "660", name: "United States", shortName: "USA", code: "USA", flag: "🇺🇸", group: "D", pot: 1, primaryColor: "#213065", secondaryColor: "#d42339" },
  { id: "mex", espnId: "203", name: "Mexico", shortName: "Mexico", code: "MEX", flag: "🇲🇽", group: "A", pot: 1, primaryColor: "#006847", secondaryColor: "#ce1126" },
  { id: "can", espnId: "206", name: "Canada", shortName: "Canada", code: "CAN", flag: "🇨🇦", group: "B", pot: 1, primaryColor: "#ed2224", secondaryColor: "#ffffff" },

  { id: "cro", espnId: "477", name: "Croatia", shortName: "Croatia", code: "CRO", flag: "🇭🇷", group: "L", pot: 2, primaryColor: "#ff0000", secondaryColor: "#0c2fff" },
  { id: "mar", espnId: "2869", name: "Morocco", shortName: "Morocco", code: "MAR", flag: "🇲🇦", group: "C", pot: 2, primaryColor: "#c1272d", secondaryColor: "#006233" },
  { id: "col", espnId: "208", name: "Colombia", shortName: "Colombia", code: "COL", flag: "🇨🇴", group: "K", pot: 2, primaryColor: "#fbd632", secondaryColor: "#21418c" },
  { id: "uru", espnId: "212", name: "Uruguay", shortName: "Uruguay", code: "URU", flag: "🇺🇾", group: "H", pot: 2, primaryColor: "#003da5", secondaryColor: "#ffffff" },
  { id: "sui", espnId: "475", name: "Switzerland", shortName: "Swiss", code: "SUI", flag: "🇨🇭", group: "B", pot: 2, primaryColor: "#d72b2c", secondaryColor: "#ffffff" },
  { id: "jpn", espnId: "627", name: "Japan", shortName: "Japan", code: "JPN", flag: "🇯🇵", group: "F", pot: 2, primaryColor: "#bc002d", secondaryColor: "#ffffff" },
  { id: "sen", espnId: "654", name: "Senegal", shortName: "Senegal", code: "SEN", flag: "🇸🇳", group: "I", pot: 2, primaryColor: "#00853f", secondaryColor: "#fdef42" },
  { id: "irn", espnId: "469", name: "Iran", shortName: "Iran", code: "IRN", flag: "🇮🇷", group: "G", pot: 2, primaryColor: "#239f40", secondaryColor: "#da0000" },
  { id: "kor", espnId: "451", name: "South Korea", shortName: "Korea", code: "KOR", flag: "🇰🇷", group: "A", pot: 2, primaryColor: "#ce2028", secondaryColor: "#1e4384" },
  { id: "ecu", espnId: "209", name: "Ecuador", shortName: "Ecuador", code: "ECU", flag: "🇪🇨", group: "E", pot: 2, primaryColor: "#ffdd00", secondaryColor: "#034ea2" },
  { id: "aut", espnId: "474", name: "Austria", shortName: "Austria", code: "AUT", flag: "🇦🇹", group: "J", pot: 2, primaryColor: "#d72b2c", secondaryColor: "#ffffff" },
  { id: "aus", espnId: "628", name: "Australia", shortName: "Australia", code: "AUS", flag: "🇦🇺", group: "D", pot: 2, primaryColor: "#2a2d7c", secondaryColor: "#ffcd00" },

  { id: "nor", espnId: "708", name: "Norway", shortName: "Norway", code: "NOR", flag: "🇳🇴", group: "I", pot: 3, primaryColor: "#ba0c2f", secondaryColor: "#00205b" },
  { id: "pan", espnId: "2659", name: "Panama", shortName: "Panama", code: "PAN", flag: "🇵🇦", group: "L", pot: 3, primaryColor: "#d21034", secondaryColor: "#005293" },
  { id: "egy", espnId: "2620", name: "Egypt", shortName: "Egypt", code: "EGY", flag: "🇪🇬", group: "G", pot: 3, primaryColor: "#d20300", secondaryColor: "#000000" },
  { id: "alg", espnId: "624", name: "Algeria", shortName: "Algeria", code: "ALG", flag: "🇩🇿", group: "J", pot: 3, primaryColor: "#5bbd19", secondaryColor: "#ffffff" },
  { id: "sco", espnId: "580", name: "Scotland", shortName: "Scotland", code: "SCO", flag: "🏴", group: "C", pot: 3, primaryColor: "#1a2d69", secondaryColor: "#ffffff" },
  { id: "par", espnId: "210", name: "Paraguay", shortName: "Paraguay", code: "PAR", flag: "🇵🇾", group: "D", pot: 3, primaryColor: "#ea2300", secondaryColor: "#0c2fff" },
  { id: "tun", espnId: "659", name: "Tunisia", shortName: "Tunisia", code: "TUN", flag: "🇹🇳", group: "F", pot: 3, primaryColor: "#d20300", secondaryColor: "#ffffff" },
  { id: "civ", espnId: "618", name: "Ivory Coast", shortName: "Ivory Coast", code: "CIV", flag: "🇨🇮", group: "E", pot: 3, primaryColor: "#f77f00", secondaryColor: "#009e60" },
  { id: "uzb", espnId: "2570", name: "Uzbekistan", shortName: "Uzbekistan", code: "UZB", flag: "🇺🇿", group: "K", pot: 3, primaryColor: "#0081d6", secondaryColor: "#1eb53a" },
  { id: "qat", espnId: "4398", name: "Qatar", shortName: "Qatar", code: "QAT", flag: "🇶🇦", group: "B", pot: 3, primaryColor: "#691a40", secondaryColor: "#ffffff" },
  { id: "ksa", espnId: "655", name: "Saudi Arabia", shortName: "Saudi", code: "KSA", flag: "🇸🇦", group: "H", pot: 3, primaryColor: "#006233", secondaryColor: "#ffffff" },
  { id: "rsa", espnId: "467", name: "South Africa", shortName: "South Africa", code: "RSA", flag: "🇿🇦", group: "A", pot: 3, primaryColor: "#087d5a", secondaryColor: "#fbb516" },

  { id: "jor", espnId: "3843", name: "Jordan", shortName: "Jordan", code: "JOR", flag: "🇯🇴", group: "J", pot: 4, primaryColor: "#ce1126", secondaryColor: "#007a3d" },
  { id: "cpv", espnId: "2597", name: "Cape Verde", shortName: "Cape Verde", code: "CPV", flag: "🇨🇻", group: "H", pot: 4, primaryColor: "#003893", secondaryColor: "#ef3340" },
  { id: "gha", espnId: "4469", name: "Ghana", shortName: "Ghana", code: "GHA", flag: "🇬🇭", group: "L", pot: 4, primaryColor: "#fcd116", secondaryColor: "#006b3f" },
  { id: "cuw", espnId: "11678", name: "Curaçao", shortName: "Curaçao", code: "CUW", flag: "🇨🇼", group: "E", pot: 4, primaryColor: "#0537e4", secondaryColor: "#f9d616" },
  { id: "hai", espnId: "639", name: "Haiti", shortName: "Haiti", code: "HAI", flag: "🇭🇹", group: "C", pot: 4, primaryColor: "#00209f", secondaryColor: "#d21034" },
  { id: "nzl", espnId: "582", name: "New Zealand", shortName: "New Zealand", code: "NZL", flag: "🇳🇿", group: "G", pot: 4, primaryColor: "#111111", secondaryColor: "#ffffff" },
  { id: "cze", espnId: "450", name: "Czechia", shortName: "Czechia", code: "CZE", flag: "🇨🇿", group: "A", pot: 4, primaryColor: "#d7141a", secondaryColor: "#11457e" },
  { id: "bih", espnId: "452", name: "Bosnia-Herzegovina", shortName: "Bosnia", code: "BIH", flag: "🇧🇦", group: "B", pot: 4, primaryColor: "#112855", secondaryColor: "#fcd116" },
  { id: "swe", espnId: "466", name: "Sweden", shortName: "Sweden", code: "SWE", flag: "🇸🇪", group: "F", pot: 4, primaryColor: "#006aa7", secondaryColor: "#fecb00" },
  { id: "tur", espnId: "465", name: "Türkiye", shortName: "Türkiye", code: "TUR", flag: "🇹🇷", group: "D", pot: 4, primaryColor: "#e30a17", secondaryColor: "#ffffff" },
  { id: "cod", espnId: "2850", name: "Congo DR", shortName: "Congo DR", code: "COD", flag: "🇨🇩", group: "K", pot: 4, primaryColor: "#418fde", secondaryColor: "#c60000" },
  { id: "irq", espnId: "641", name: "Iraq", shortName: "Iraq", code: "IRQ", flag: "🇮🇶", group: "I", pot: 4, primaryColor: "#ce1126", secondaryColor: "#007a3d" },
];

export function getTeamsByPot(pot: Team["pot"]) {
  return teams.filter((team) => team.pot === pot);
}

export function getTeam(teamId: string) {
  const team = teams.find((item) => item.id === teamId);
  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }
  return team;
}

export function getTeamByEspnId(espnId: string) {
  return teams.find((item) => item.espnId === espnId) ?? null;
}

export function maybeGetTeam(teamId: string | null | undefined) {
  if (!teamId) return null;
  return teams.find((item) => item.id === teamId) ?? null;
}
