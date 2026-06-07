import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";

type EspnCompetitor = {
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  competitions?: Array<{
    status?: { type?: { name?: string; completed?: boolean; state?: string } };
    competitors?: EspnCompetitor[];
  }>;
};

Deno.serve(async (request) => {
  const expectedToken = Deno.env.get("SYNC_SCORES_TOKEN");
  const authHeader = request.headers.get("Authorization") ?? "";

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Missing Supabase environment" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const response = await fetch(ESPN_SCOREBOARD_URL);
  if (!response.ok) {
    return Response.json({ error: "ESPN fetch failed", status: response.status }, { status: 502 });
  }

  const payload = (await response.json()) as { events?: EspnEvent[] };
  const events = payload.events ?? [];
  const parsedMatches = events.flatMap(parseEspnEvent);

  for (const match of parsedMatches) {
    const { error } = await supabase.from("matches").upsert(match, {
      onConflict: "espn_match_id",
    });

    if (error) {
      console.error("match upsert failed", { espnMatchId: match.espn_match_id, error });
    }
  }

  return Response.json({
    ok: true,
    fetched: events.length,
    parsed: parsedMatches.length,
    synced_at: new Date().toISOString(),
  });
});

function parseEspnEvent(event: EspnEvent) {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.team?.id && competitor.winner !== undefined) ?? competitors[0];
  const away = competitors.find((competitor) => competitor !== home) ?? competitors[1];

  if (!event.id || !event.date || !home?.team?.id || !away?.team?.id) {
    return [];
  }

  const statusName = competition?.status?.type?.name ?? "STATUS_SCHEDULED";
  const completed = competition?.status?.type?.completed ?? false;

  return [
    {
      espn_match_id: event.id,
      stage: "group",
      home_team_id: null,
      away_team_id: null,
      home_score: Number.parseInt(home.score ?? "0", 10),
      away_score: Number.parseInt(away.score ?? "0", 10),
      starts_at: event.date,
      status: completed ? "completed" : statusName === "STATUS_IN_PROGRESS" ? "live" : "scheduled",
      raw_payload: event,
      updated_at: new Date().toISOString(),
    },
  ];
}
