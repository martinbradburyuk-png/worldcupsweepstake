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
  "Bosnia-Herzegovina": "Bosnia & Herzegovina",
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
  "Cape Verde Islands": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia", "Uruguay": "Uruguay",
  "France": "France", "Senegal": "Senegal", "Iraq": "Iraq",
  "Norway": "Norway", "Argentina": "Argentina", "Algeria": "Algeria",
  "Austria": "Austria", "Jordan": "Jordan", "Portugal": "Portugal",
  "DR Congo": "Congo", "Congo DR": "Congo", "Congo": "Congo",
  "Uzbekistan": "Uzbekistan", "Colombia": "Colombia",
  "England": "England", "Croatia": "Croatia", "Ghana": "Ghana", "Panama": "Panama",
};

// Reduce any team name to a comparison key: strip accents, lowercase, drop
// punctuation and common filler words. This makes spelling variants collapse
// to the same key, so "Bosnia-Herzegovina", "Bosnia and Herzegovina" and
// "Bosnia & Herzegovina" all match without each needing to be pre-listed.
const FILLER = /\b(and|the|of|ir|dr|fr|republic|islands?|national|team)\b/g;
function normKey(s) {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")                       // punctuation -> space
    .replace(FILLER, " ")                              // drop filler words
    .replace(/\s+/g, " ")                              // collapse spaces
    .trim();
}

// Pre-compute a normalised lookup once: every map key AND every canonical
// value is indexed, so the API can send either form and still match.
const NORM_LOOKUP = {};
for (const [k, v] of Object.entries(NAME_MAP)) {
  NORM_LOOKUP[normKey(k)] = v;
  NORM_LOOKUP[normKey(v)] = v;
}

// Anything genuinely unmatched is collected here so it surfaces in logs.
const unmatchedSeen = new Set();

function mapName(n) {
  if (!n) return null;
  if (NAME_MAP[n]) return NAME_MAP[n];          // exact hit (fast path)
  const key = normKey(n);
  if (NORM_LOOKUP[key]) return NORM_LOOKUP[key]; // normalised hit
  unmatchedSeen.add(n);                          // log-only; never silently lost
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
    const out = [];        // group-stage results (keyed by home|away in the app)
    const knockout = [];   // knockout matches (keyed by stage + order in the app)

    // Map football-data.org stage codes to our round ids
    const STAGE = {
      LAST_32: "R32", ROUND_OF_32: "R32",
      LAST_16: "R16", ROUND_OF_16: "R16",
      QUARTER_FINALS: "QF", QUARTER_FINAL: "QF",
      SEMI_FINALS: "SF", SEMI_FINAL: "SF",
      THIRD_PLACE: "3P", THIRD_PLACE_PLAYOFF: "3P",
      FINAL: "F",
    };

    // Convert a UTC kickoff to a UK day label + 12h time (matches app format)
    const toUK = iso => {
      if (!iso) return { date: null, time: null };
      const d = new Date(iso);
      const date = d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", timeZone:"Europe/London" });
      let time = d.toLocaleTimeString("en-GB", { hour:"numeric", minute:"2-digit", hour12:true, timeZone:"Europe/London" })
        .replace(":00","").replace(/\s/g,"").toLowerCase();
      return { date, time };
    };

    for (const m of data.matches || []) {
      const home = mapName(m.homeTeam?.name || m.homeTeam?.shortName);
      const away = mapName(m.awayTeam?.name || m.awayTeam?.shortName);
      const ft = m.score?.fullTime;
      const live = m.status === "IN_PLAY" || m.status === "PAUSED";
      const done = m.status === "FINISHED";
      const stage = STAGE[m.stage];

      if (stage) {
        // Knockout match: include it as soon as it exists, even unplayed,
        // so team names appear the moment the round is drawn.
        const { date, time } = toUK(m.utcDate);
        knockout.push({
          stage,
          home: home || null,
          away: away || null,
          hg: (done || live) && ft ? ft.home : null,
          awg: (done || live) && ft ? ft.away : null,
          status: done ? "FT" : live ? "LIVE" : null,
          date, time,
          utcDate: m.utcDate || null,
        });
        continue;
      }

      // Group stage: only emit finished/live with a score (keyed by teams)
      if (!home || !away) continue;
      if ((done || live) && ft && ft.home != null && ft.away != null) {
        out.push({ home, away, hg: ft.home, awg: ft.away, status: done ? "FT" : "LIVE" });
      }
    }

    // Order knockout matches by kickoff so the app can map them to slots in order
    knockout.sort((a, b) => (a.utcDate || "").localeCompare(b.utcDate || ""));
    if (unmatchedSeen.size) {
      console.warn("Unmatched team names (add to NAME_MAP if a result is missing):",
        [...unmatchedSeen].join(", "));
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // small cache so a flurry of family opens doesn't hammer the API
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify({ results: out, knockout, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
