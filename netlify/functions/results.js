// netlify/functions/results.js
// Server-side proxy to football-data.org. Keeps the API key hidden and avoids
// browser CORS problems. The React app fetches this (same-origin), not the API.
//
// Set the key in Netlify: Site configuration -> Environment variables ->
//   key:  FOOTBALL_DATA_API_KEY    value: <your free token>
//
// Returns a slim JSON array: [{home, away, hg, awg, status}, ...]
// status is "FT" (finished) or "LIVE" (in progress). Unplayed matches are omitted.

const API_URL = "https://api.football-data.org/v4/competitions/WC/matches";

// football-data.org name -> the exact string used in App.js
const NAME_MAP = {
  "Mexico": "Mexico", "South Africa": "South Africa",
  "Korea Republic": "Korea", "South Korea": "Korea", "Korea DPR": "Korea",
  "Czechia": "Czechia", "Czech Republic": "Czechia",
  "Canada": "Canada", "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Qatar": "Qatar", "Switzerland": "Switzerland", "Brazil": "Brazil",
  "Morocco": "Morocco", "Haiti": "Haiti", "Scotland": "Scotland",
  "United States": "USA", "USA": "USA", "Paraguay": "Paraguay",
  "Australia": "Australia", "Türkiye": "Turkey", "Turkey": "Turkey",
  "Germany": "Germany", "Curaçao": "Curacao", "Curacao": "Curacao",
  "Ivory Coast": "Ivory Coast", "Côte d'Ivoire": "Ivory Coast",
  "Ecuador": "Ecuador", "Netherlands": "Netherlands", "Japan": "Japan",
  "Sweden": "Sweden", "Tunisia": "Tunisia", "Belgium": "Belgium",
  "Egypt": "Egypt", "Iran": "Iran", "IR Iran": "Iran",
  "New Zealand": "New Zealand", "Spain": "Spain",
  "Cape Verde": "Cape Verde", "Cabo Verde": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia", "Uruguay": "Uruguay",
  "France": "France", "Senegal": "Senegal", "Iraq": "Iraq",
  "Norway": "Norway", "Argentina": "Argentina", "Algeria": "Algeria",
  "Austria": "Austria", "Jordan": "Jordan", "Portugal": "Portugal",
  "DR Congo": "Congo", "Congo DR": "Congo", "Congo": "Congo",
  "Uzbekistan": "Uzbekistan", "Colombia": "Colombia",
  "England": "England", "Croatia": "Croatia", "Ghana": "Ghana", "Panama": "Panama",
};

function mapName(n) {
  if (!n) return null;
  if (NAME_MAP[n]) return NAME_MAP[n];
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const t = norm(n);
  for (const [k, v] of Object.entries(NAME_MAP)) if (norm(k) === t) return v;
  return null;
}

export async function handler() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing API key" }) };
  }
  try {
    const res = await fetch(API_URL, { headers: { "X-Auth-Token": key } });
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: res.statusText }) };
    }
    const data = await res.json();
    const out = [];
    const unmatched = new Set();
    for (const m of data.matches || []) {
      const rawHome = m.homeTeam?.name || m.homeTeam?.shortName;
      const rawAway = m.awayTeam?.name || m.awayTeam?.shortName;
      const home = mapName(rawHome);
      const away = mapName(rawAway);
      if (!home) unmatched.add(rawHome);
      if (!away) unmatched.add(rawAway);
      if (!home || !away) continue;
      const ft = m.score?.fullTime;
      const live = m.status === "IN_PLAY" || m.status === "PAUSED";
      const done = m.status === "FINISHED";
      if ((done || live) && ft && ft.home != null && ft.away != null) {
        out.push({ home, away, hg: ft.home, awg: ft.away, status: done ? "FT" : "LIVE" });
      }
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // small cache so a flurry of family opens doesn't hammer the API
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify({
        results: out,
        fetchedAt: new Date().toISOString(),
        // TEMPORARY: any API team names we couldn't match, for debugging
        unmatched: [...unmatched].filter(Boolean),
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
