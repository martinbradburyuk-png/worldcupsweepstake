/*
 * update-results.mjs
 * ------------------
 * Fetches FIFA World Cup 2026 results from football-data.org (free tier)
 * and patches the scores into src/App.js. Designed to run daily via GitHub Actions.
 *
 * It ONLY touches the hg/awg/status fields of matches it can confidently match.
 * It never rewrites dates, times, or team allocations — so the validated schedule
 * stays exactly as-is. If a match can't be matched, it's skipped (logged, not guessed).
 *
 * Requires env var: FOOTBALL_DATA_API_KEY  (free key from football-data.org)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_PATH = path.join(__dirname, "..", "src", "App.js");

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
if (!API_KEY) {
  console.error("Missing FOOTBALL_DATA_API_KEY environment variable.");
  process.exit(1);
}

// football-data.org competition code for the World Cup is "WC".
const API_URL = "https://api.football-data.org/v4/competitions/WC/matches";

// ---- Team name bridge -------------------------------------------------------
// LEFT  = how football-data.org may name the team
// RIGHT = the exact string used in App.js (your sweepstake sheet)
// Add any mismatches here if a result is ever skipped for "unknown team".
const NAME_MAP = {
  "Mexico": "Mexico",
  "South Africa": "South Africa",
  "Korea Republic": "Korea",
  "South Korea": "Korea",
  "Czechia": "Czechia",
  "Czech Republic": "Czechia",
  "Canada": "Canada",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Bosnia & Herzegovina": "Bosnia & Herzegovina",
  "Qatar": "Qatar",
  "Switzerland": "Switzerland",
  "Brazil": "Brazil",
  "Morocco": "Morocco",
  "Haiti": "Haiti",
  "Scotland": "Scotland",
  "United States": "USA",
  "USA": "USA",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Türkiye": "Turkey",
  "Turkey": "Turkey",
  "Germany": "Germany",
  "Curaçao": "Curacao",
  "Curacao": "Curacao",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Ecuador": "Ecuador",
  "Netherlands": "Netherlands",
  "Japan": "Japan",
  "Sweden": "Sweden",
  "Tunisia": "Tunisia",
  "Belgium": "Belgium",
  "Egypt": "Egypt",
  "Iran": "Iran",
  "IR Iran": "Iran",
  "New Zealand": "New Zealand",
  "Spain": "Spain",
  "Cape Verde": "Cape Verde",
  "Cabo Verde": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia",
  "Uruguay": "Uruguay",
  "France": "France",
  "Senegal": "Senegal",
  "Iraq": "Iraq",
  "Norway": "Norway",
  "Argentina": "Argentina",
  "Algeria": "Algeria",
  "Austria": "Austria",
  "Jordan": "Jordan",
  "Portugal": "Portugal",
  "DR Congo": "Congo",
  "Congo DR": "Congo",
  "Congo": "Congo",
  "Uzbekistan": "Uzbekistan",
  "Colombia": "Colombia",
  "England": "England",
  "Croatia": "Croatia",
  "Ghana": "Ghana",
  "Panama": "Panama",
};

function mapName(apiName) {
  if (!apiName) return null;
  if (NAME_MAP[apiName]) return NAME_MAP[apiName];
  // try a loose match (strip accents, case-insensitive)
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const target = norm(apiName);
  for (const [k, v] of Object.entries(NAME_MAP)) {
    if (norm(k) === target) return v;
  }
  return null;
}

async function fetchResults() {
  const res = await fetch(API_URL, { headers: { "X-Auth-Token": API_KEY } });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.matches || [];
}

// Build a lookup of finished results keyed by "home|away"
function buildResultIndex(matches) {
  const idx = {};
  let finished = 0;
  for (const m of matches) {
    const status = m.status; // FINISHED, IN_PLAY, PAUSED, TIMED, SCHEDULED...
    const home = mapName(m.homeTeam?.name || m.homeTeam?.shortName);
    const away = mapName(m.awayTeam?.name || m.awayTeam?.shortName);
    if (!home || !away) continue;

    const ft = m.score?.fullTime;
    const live = m.status === "IN_PLAY" || m.status === "PAUSED";
    const isFinished = m.status === "FINISHED";

    if ((isFinished || live) && ft && ft.home != null && ft.away != null) {
      idx[`${home}|${away}`] = {
        hg: ft.home,
        awg: ft.away,
        status: isFinished ? "FT" : "LIVE",
      };
      if (isFinished) finished++;
    }
  }
  console.log(`API returned ${matches.length} matches; ${finished} finished with scores.`);
  return idx;
}

// Patch App.js: for each fixture line, if we have a result, set hg/awg/status.
function patchAppFile(resultIndex) {
  let src = fs.readFileSync(APP_PATH, "utf8");
  const lines = src.split("\n");
  let updated = 0;

  const fixtureRe = /^\s*\{date:.*?home:"([^"]+)",away:"([^"]+)",time:"[^"]*",(hg:[^,]+,\s*awg:[^,]+,\s*status:[^}]+)\},?\s*$/;

  const newLines = lines.map(line => {
    const m = line.match(fixtureRe);
    if (!m) return line;
    const home = m[1], away = m[2];
    const result = resultIndex[`${home}|${away}`];
    if (!result) return line;

    const newScore = `hg:${result.hg}, awg:${result.awg}, status:"${result.status}"`;
    const patched = line.replace(/hg:[^,]+,\s*awg:[^,]+,\s*status:[^}]+/, newScore);
    if (patched !== line) updated++;
    return patched;
  });

  fs.writeFileSync(APP_PATH, newLines.join("\n"));
  console.log(`Patched ${updated} fixture line(s) in App.js.`);
  return updated;
}

(async () => {
  try {
    const matches = await fetchResults();
    const idx = buildResultIndex(matches);
    const n = patchAppFile(idx);
    // Exit 0 always; the workflow decides whether anything changed via git.
    console.log(n > 0 ? "Done — results updated." : "Done — no new results to apply.");
  } catch (err) {
    console.error("Update failed:", err.message);
    process.exit(1);
  }
})();
