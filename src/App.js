/*
 * FAMILY WORLD CUP 2026 — Sweepstake Tracker
 * ------------------------------------------
 * HOW TO USE IN CODESANDBOX:
 * 1. Go to codesandbox.io → Create → "React" template (plain JS, not TS)
 * 2. Open the file src/App.js, select all, delete
 * 3. Paste this entire file in its place, then Save (Cmd/Ctrl+S)
 * 4. The preview on the right renders instantly. Click Share for a permanent URL.
 *
 * TO UPDATE RESULTS each day:
 *   Find the match in the FIXTURES array below and change:
 *     hg:null, awg:null, status:null      (not played)
 *   to e.g.:
 *     hg:2, awg:1, status:"FT"            (home 2, away 1, full time)
 *   The league table recalculates itself automatically.
 */
import { useState, useEffect } from "react";

const FAMILY = {
  STAN:   ["Czechia","Morocco","Ivory Coast","USA"],
  KAREN:  ["Uzbekistan","Qatar","Saudi Arabia","Jordan"],
  DARREN: ["Korea","Bosnia & Herzegovina","Haiti","Sweden"],
  LINDA:  ["Australia","Netherlands","Tunisia","France"],
  ABI:    ["Ghana","Panama","Norway","Algeria"],
  MARTIN: ["Turkey","Spain","New Zealand","Egypt"],
  ANITA:  ["Mexico","Switzerland","Iran"],
  CLARA:  ["South Africa","Belgium","Argentina"],
  HARRY:  ["Brazil","Senegal","Paraguay"],
  ROSE:   ["Scotland","Iraq","Austria"],
  FRANKIE:["Germany","Curacao","Congo"],
  KITTY:  ["Canada","Japan","Uruguay"],
  TRACY:  ["Colombia","Cape Verde","England"],
  VICKY:  ["Ecuador","Portugal","Croatia"],
};

const TEAM_OWNER = {};
Object.entries(FAMILY).forEach(([name, teams]) =>
  teams.forEach(t => { TEAM_OWNER[t.toLowerCase()] = name; })
);
const getOwner = team => TEAM_OWNER[team.toLowerCase()] || null;

const COLORS = {
  STAN:"#e74c3c", KAREN:"#9b59b6", DARREN:"#2980b9", LINDA:"#27ae60",
  ABI:"#f39c12", MARTIN:"#16a085", ANITA:"#d35400", CLARA:"#8e44ad",
  HARRY:"#c0392b", ROSE:"#1abc9c", FRANKIE:"#2c3e50", KITTY:"#e91e8c",
  TRACY:"#3498db", VICKY:"#795548",
};

const FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","Korea":"🇰🇷","Czechia":"🇨🇿",
  "Canada":"🇨🇦","Bosnia & Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turkey":"🇹🇷",
  "Germany":"🇩🇪","Curacao":"🇨🇼","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Sweden":"🇸🇪","Tunisia":"🇹🇳",
  "Belgium":"🇧🇪","Egypt":"🇪🇬","Iran":"🇮🇷","New Zealand":"🇳🇿",
  "Spain":"🇪🇸","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾",
  "France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴",
  "Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴",
  "Portugal":"🇵🇹","Congo":"🇨🇩","Uzbekistan":"🇺🇿","Colombia":"🇨🇴",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
};

// Convert a UK (BST) time string like "8pm", "11pm", "1:30am", "12am" to
// California time (PT). California is 8 hours behind the UK (BST−8).
function toCalifornia(bst) {
  if (!bst) return null;
  const m = bst.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3];
  if (h === 12) h = 0;               // 12am -> 0, 12pm -> 0 then +12 below
  if (mer === "pm") h += 12;         // to 24h
  let pt = (h - 8 + 24) % 24;        // shift back 8 hours
  const ptMer = pt >= 12 ? "pm" : "am";
  let ph = pt % 12; if (ph === 0) ph = 12;
  return min ? `${ph}:${String(min).padStart(2,"0")}${ptMer}` : `${ph}${ptMer}`;
}

// status: "FT" = played, "LIVE" = in progress, null = upcoming
// Date = the UK calendar day the match is watched on (late US kickoffs roll into the early hours). All times BST.
const FIXTURES = [
  // Times validated programmatically from official ET kickoffs -> BST. UK date = day match is watched in UK.
  {date:"Thu 11 Jun",group:"A",home:"Mexico",away:"South Africa",time:"8pm",venue:"Estadio Azteca, Mexico City",hg:2, awg:0, status:"FT"},
  {date:"Fri 12 Jun",group:"A",home:"Korea",away:"Czechia",time:"3am",venue:"Estadio Akron, Guadalajara",hg:2, awg:1, status:"FT"},
  {date:"Fri 12 Jun",group:"B",home:"Canada",away:"Bosnia & Herzegovina",time:"8pm",venue:"BMO Field, Toronto",hg:1, awg:1, status:"FT"},
  {date:"Sat 13 Jun",group:"D",home:"USA",away:"Paraguay",time:"2am",venue:"SoFi Stadium, Los Angeles",hg:4, awg:1, status:"FT"},
  {date:"Sat 13 Jun",group:"B",home:"Qatar",away:"Switzerland",time:"8pm",venue:"Levi's Stadium, San Francisco Bay",hg:1, awg:1, status:"FT"},
  {date:"Sat 13 Jun",group:"C",home:"Brazil",away:"Morocco",time:"11pm",venue:"MetLife Stadium, New York/NJ",hg:1, awg:1, status:"FT"},
  {date:"Sun 14 Jun",group:"C",home:"Haiti",away:"Scotland",time:"2am",venue:"Gillette Stadium, Boston",hg:0, awg:1, status:"FT"},
  {date:"Sun 14 Jun",group:"D",home:"Australia",away:"Turkey",time:"5pm",venue:"BC Place, Vancouver",hg:2, awg:0, status:"FT"},
  {date:"Sun 14 Jun",group:"E",home:"Germany",away:"Curacao",time:"6pm",venue:"NRG Stadium, Houston",hg:null,awg:null,status:null},
  {date:"Sun 14 Jun",group:"F",home:"Netherlands",away:"Japan",time:"9pm",venue:"AT&T Stadium, Dallas",hg:null,awg:null,status:null},
  {date:"Mon 15 Jun",group:"E",home:"Ivory Coast",away:"Ecuador",time:"12am",venue:"Lincoln Financial Field, Philadelphia",hg:null,awg:null,status:null},
  {date:"Mon 15 Jun",group:"F",home:"Sweden",away:"Tunisia",time:"3am",venue:"Estadio BBVA, Monterrey",hg:null,awg:null,status:null},
  {date:"Mon 15 Jun",group:"H",home:"Spain",away:"Cape Verde",time:"5pm",venue:"Mercedes-Benz Stadium, Atlanta",hg:null,awg:null,status:null},
  {date:"Mon 15 Jun",group:"G",home:"Belgium",away:"Egypt",time:"8pm",venue:"Lumen Field, Seattle",hg:null,awg:null,status:null},
  {date:"Mon 15 Jun",group:"H",home:"Saudi Arabia",away:"Uruguay",time:"11pm",venue:"Hard Rock Stadium, Miami",hg:null,awg:null,status:null},
  {date:"Tue 16 Jun",group:"G",home:"Iran",away:"New Zealand",time:"2am",venue:"SoFi Stadium, Los Angeles",hg:null,awg:null,status:null},
  {date:"Tue 16 Jun",group:"I",home:"France",away:"Senegal",time:"8pm",venue:"MetLife Stadium, New York/NJ",hg:null,awg:null,status:null},
  {date:"Tue 16 Jun",group:"I",home:"Iraq",away:"Norway",time:"11pm",venue:"Gillette Stadium, Boston",hg:null,awg:null,status:null},
  {date:"Wed 17 Jun",group:"J",home:"Argentina",away:"Algeria",time:"2am",venue:"Arrowhead Stadium, Kansas City",hg:null,awg:null,status:null},
  {date:"Wed 17 Jun",group:"J",home:"Austria",away:"Jordan",time:"5am",venue:"Levi's Stadium, San Francisco Bay",hg:null,awg:null,status:null},
  {date:"Wed 17 Jun",group:"K",home:"Portugal",away:"Congo",time:"6pm",venue:"NRG Stadium, Houston",hg:null,awg:null,status:null},
  {date:"Wed 17 Jun",group:"L",home:"England",away:"Croatia",time:"9pm",venue:"AT&T Stadium, Dallas",hg:null,awg:null,status:null},
  {date:"Thu 18 Jun",group:"L",home:"Ghana",away:"Panama",time:"12am",venue:"BMO Field, Toronto",hg:null,awg:null,status:null},
  {date:"Thu 18 Jun",group:"K",home:"Uzbekistan",away:"Colombia",time:"3am",venue:"Estadio Azteca, Mexico City",hg:null,awg:null,status:null},
  {date:"Thu 18 Jun",group:"A",home:"Czechia",away:"South Africa",time:"5pm",venue:"Mercedes-Benz Stadium, Atlanta",hg:null,awg:null,status:null},
  {date:"Thu 18 Jun",group:"B",home:"Switzerland",away:"Bosnia & Herzegovina",time:"8pm",venue:"SoFi Stadium, Los Angeles",hg:null,awg:null,status:null},
  {date:"Thu 18 Jun",group:"B",home:"Canada",away:"Qatar",time:"11pm",venue:"BC Place, Vancouver",hg:null,awg:null,status:null},
  {date:"Fri 19 Jun",group:"A",home:"Mexico",away:"Korea",time:"2am",venue:"Estadio Akron, Guadalajara",hg:null,awg:null,status:null},
  {date:"Fri 19 Jun",group:"D",home:"USA",away:"Australia",time:"8pm",venue:"Lumen Field, Seattle",hg:null,awg:null,status:null},
  {date:"Fri 19 Jun",group:"C",home:"Scotland",away:"Morocco",time:"11pm",venue:"Gillette Stadium, Boston",hg:null,awg:null,status:null},
  {date:"Sat 20 Jun",group:"C",home:"Brazil",away:"Haiti",time:"1:30am",venue:"Lincoln Financial Field, Philadelphia",hg:null,awg:null,status:null},
  {date:"Sat 20 Jun",group:"D",home:"Turkey",away:"Paraguay",time:"4am",venue:"Levi's Stadium, San Francisco Bay",hg:null,awg:null,status:null},
  {date:"Sat 20 Jun",group:"F",home:"Netherlands",away:"Sweden",time:"6pm",venue:"NRG Stadium, Houston",hg:null,awg:null,status:null},
  {date:"Sat 20 Jun",group:"E",home:"Germany",away:"Ivory Coast",time:"9pm",venue:"BMO Field, Toronto",hg:null,awg:null,status:null},
  {date:"Sun 21 Jun",group:"E",home:"Ecuador",away:"Curacao",time:"1am",venue:"Arrowhead Stadium, Kansas City",hg:null,awg:null,status:null},
  {date:"Sun 21 Jun",group:"F",home:"Tunisia",away:"Japan",time:"5am",venue:"Estadio BBVA, Monterrey",hg:null,awg:null,status:null},
  {date:"Sun 21 Jun",group:"H",home:"Spain",away:"Saudi Arabia",time:"5pm",venue:"Mercedes-Benz Stadium, Atlanta",hg:null,awg:null,status:null},
  {date:"Sun 21 Jun",group:"G",home:"Belgium",away:"Iran",time:"8pm",venue:"SoFi Stadium, Los Angeles",hg:null,awg:null,status:null},
  {date:"Sun 21 Jun",group:"H",home:"Uruguay",away:"Cape Verde",time:"11pm",venue:"Hard Rock Stadium, Miami",hg:null,awg:null,status:null},
  {date:"Mon 22 Jun",group:"G",home:"New Zealand",away:"Egypt",time:"2am",venue:"BC Place, Vancouver",hg:null,awg:null,status:null},
  {date:"Mon 22 Jun",group:"J",home:"Argentina",away:"Austria",time:"6pm",venue:"AT&T Stadium, Dallas",hg:null,awg:null,status:null},
  {date:"Mon 22 Jun",group:"I",home:"France",away:"Iraq",time:"10pm",venue:"Lincoln Financial Field, Philadelphia",hg:null,awg:null,status:null},
  {date:"Tue 23 Jun",group:"I",home:"Norway",away:"Senegal",time:"1am",venue:"MetLife Stadium, New York/NJ",hg:null,awg:null,status:null},
  {date:"Tue 23 Jun",group:"J",home:"Jordan",away:"Algeria",time:"4am",venue:"Levi's Stadium, San Francisco Bay",hg:null,awg:null,status:null},
  {date:"Tue 23 Jun",group:"K",home:"Portugal",away:"Uzbekistan",time:"6pm",venue:"NRG Stadium, Houston",hg:null,awg:null,status:null},
  {date:"Tue 23 Jun",group:"L",home:"England",away:"Ghana",time:"9pm",venue:"Gillette Stadium, Boston",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"L",home:"Panama",away:"Croatia",time:"12am",venue:"BMO Field, Toronto",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"K",home:"Colombia",away:"Congo",time:"3am",venue:"Estadio Akron, Guadalajara",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"B",home:"Switzerland",away:"Canada",time:"8pm",venue:"BC Place, Vancouver",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"B",home:"Bosnia & Herzegovina",away:"Qatar",time:"8pm",venue:"Lumen Field, Seattle",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"C",home:"Scotland",away:"Brazil",time:"11pm",venue:"Hard Rock Stadium, Miami",hg:null,awg:null,status:null},
  {date:"Wed 24 Jun",group:"C",home:"Morocco",away:"Haiti",time:"11pm",venue:"Mercedes-Benz Stadium, Atlanta",hg:null,awg:null,status:null},
  {date:"Thu 25 Jun",group:"A",home:"Czechia",away:"Mexico",time:"2am",venue:"Estadio Azteca, Mexico City",hg:null,awg:null,status:null},
  {date:"Thu 25 Jun",group:"A",home:"South Africa",away:"Korea",time:"2am",venue:"Estadio BBVA, Monterrey",hg:null,awg:null,status:null},
  {date:"Thu 25 Jun",group:"E",home:"Curacao",away:"Ivory Coast",time:"9pm",venue:"Lincoln Financial Field, Philadelphia",hg:null,awg:null,status:null},
  {date:"Thu 25 Jun",group:"E",home:"Ecuador",away:"Germany",time:"9pm",venue:"MetLife Stadium, New York/NJ",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"F",home:"Japan",away:"Sweden",time:"12am",venue:"AT&T Stadium, Dallas",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"F",home:"Tunisia",away:"Netherlands",time:"12am",venue:"Arrowhead Stadium, Kansas City",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"D",home:"Turkey",away:"USA",time:"3am",venue:"SoFi Stadium, Los Angeles",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"D",home:"Paraguay",away:"Australia",time:"3am",venue:"Levi's Stadium, San Francisco Bay",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"I",home:"Norway",away:"France",time:"8pm",venue:"Gillette Stadium, Boston",hg:null,awg:null,status:null},
  {date:"Fri 26 Jun",group:"I",home:"Senegal",away:"Iraq",time:"8pm",venue:"BMO Field, Toronto",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"H",home:"Cape Verde",away:"Saudi Arabia",time:"1am",venue:"NRG Stadium, Houston",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"H",home:"Uruguay",away:"Spain",time:"1am",venue:"Estadio Akron, Guadalajara",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"G",home:"Egypt",away:"Iran",time:"4am",venue:"Lumen Field, Seattle",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"G",home:"New Zealand",away:"Belgium",time:"4am",venue:"BC Place, Vancouver",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"L",home:"Panama",away:"England",time:"10pm",venue:"MetLife Stadium, New York/NJ",hg:null,awg:null,status:null},
  {date:"Sat 27 Jun",group:"L",home:"Croatia",away:"Ghana",time:"10pm",venue:"Lincoln Financial Field, Philadelphia",hg:null,awg:null,status:null},
  {date:"Sun 28 Jun",group:"K",home:"Colombia",away:"Portugal",time:"12:30am",venue:"Hard Rock Stadium, Miami",hg:null,awg:null,status:null},
  {date:"Sun 28 Jun",group:"K",home:"Congo",away:"Uzbekistan",time:"12:30am",venue:"Mercedes-Benz Stadium, Atlanta",hg:null,awg:null,status:null},
  {date:"Sun 28 Jun",group:"J",home:"Algeria",away:"Austria",time:"3am",venue:"Arrowhead Stadium, Kansas City",hg:null,awg:null,status:null},
  {date:"Sun 28 Jun",group:"J",home:"Jordan",away:"Argentina",time:"3am",venue:"AT&T Stadium, Dallas",hg:null,awg:null,status:null},
];

// ── Knockout stage ────────────────────────────────────────────────────────────
// 2026 is the first 48-team World Cup, so there's a Round of 32 before the Last 16.
// Teams are filled in by the API once each round is drawn; until then home/away are
// null and the card shows a placeholder. Dates are correct (UK); knockout kick-off
// times are best-estimate slots until FIFA confirms them and the API supplies exact times.
const ROUNDS = [
  { id:"R32", label:"Last 32",  range:"28 Jun – 3 Jul" },
  { id:"R16", label:"Last 16",  range:"4 – 7 Jul" },
  { id:"QF",  label:"Quarters", range:"9 – 11 Jul" },
  { id:"SF",  label:"Semis",    range:"14 – 15 Jul" },
  { id:"3P",  label:"3rd Place",range:"18 Jul" },
  { id:"F",   label:"Final",    range:"19 Jul" },
];

const KNOCKOUTS = [
  {round:"R32",match:"M73",date:"Sun 28 Jun",time:"5pm",venue:"SoFi Stadium, Los Angeles",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M88",date:"Mon 29 Jun",time:"1am",venue:"NRG Stadium, Houston",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M74",date:"Sun 28 Jun",time:"9pm",venue:"NRG Stadium, Houston",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M75",date:"Mon 29 Jun",time:"5pm",venue:"Gillette Stadium, Boston",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M76",date:"Mon 29 Jun",time:"9pm",venue:"Estadio BBVA, Monterrey",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M77",date:"Tue 30 Jun",time:"1am",venue:"AT&T Stadium, Dallas",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M78",date:"Tue 30 Jun",time:"8pm",venue:"MetLife Stadium, New York/NJ",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M79",date:"Wed 1 Jul",time:"12am",venue:"Estadio Azteca, Mexico City",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M80",date:"Wed 1 Jul",time:"8pm",venue:"Mercedes-Benz Stadium, Atlanta",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M81",date:"Thu 2 Jul",time:"12am",venue:"Lumen Field, Seattle",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M82",date:"Thu 2 Jul",time:"5pm",venue:"Levi's Stadium, San Francisco Bay",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M83",date:"Thu 2 Jul",time:"9pm",venue:"SoFi Stadium, Los Angeles",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M84",date:"Fri 3 Jul",time:"1am",venue:"BMO Field, Toronto",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M85",date:"Fri 3 Jul",time:"5pm",venue:"BC Place, Vancouver",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M86",date:"Fri 3 Jul",time:"9pm",venue:"AT&T Stadium, Dallas",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R32",match:"M87",date:"Sat 4 Jul",time:"1am",venue:"Hard Rock Stadium, Miami",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M89",date:"Sat 4 Jul",time:"5pm",venue:"NRG Stadium, Houston",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M90",date:"Sat 4 Jul",time:"9pm",venue:"Lincoln Financial Field, Philadelphia",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M91",date:"Sun 5 Jul",time:"5pm",venue:"MetLife Stadium, New York/NJ",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M92",date:"Sun 5 Jul",time:"9pm",venue:"Estadio Azteca, Mexico City",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M93",date:"Mon 6 Jul",time:"8pm",venue:"AT&T Stadium, Dallas",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M94",date:"Tue 7 Jul",time:"12am",venue:"Lumen Field, Seattle",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M95",date:"Tue 7 Jul",time:"5pm",venue:"Mercedes-Benz Stadium, Atlanta",home:null,away:null,hg:null,awg:null,status:null},
  {round:"R16",match:"M96",date:"Tue 7 Jul",time:"9pm",venue:"BC Place, Vancouver",home:null,away:null,hg:null,awg:null,status:null},
  {round:"QF",match:"M97",date:"Thu 9 Jul",time:"9pm",venue:"Gillette Stadium, Boston",home:null,away:null,hg:null,awg:null,status:null},
  {round:"QF",match:"M98",date:"Fri 10 Jul",time:"5pm",venue:"SoFi Stadium, Los Angeles",home:null,away:null,hg:null,awg:null,status:null},
  {round:"QF",match:"M99",date:"Sat 11 Jul",time:"10pm",venue:"Hard Rock Stadium, Miami",home:null,away:null,hg:null,awg:null,status:null},
  {round:"QF",match:"M100",date:"Sun 12 Jul",time:"2am",venue:"Arrowhead Stadium, Kansas City",home:null,away:null,hg:null,awg:null,status:null},
  {round:"SF",match:"M101",date:"Tue 14 Jul",time:"8pm",venue:"AT&T Stadium, Dallas",home:null,away:null,hg:null,awg:null,status:null},
  {round:"SF",match:"M102",date:"Wed 15 Jul",time:"8pm",venue:"Mercedes-Benz Stadium, Atlanta",home:null,away:null,hg:null,awg:null,status:null},
  {round:"3P",match:"M103",date:"Sat 18 Jul",time:"10pm",venue:"Hard Rock Stadium, Miami",home:null,away:null,hg:null,awg:null,status:null},
  {round:"F",match:"M104",date:"Sun 19 Jul",time:"8pm",venue:"MetLife Stadium, New York/NJ",home:null,away:null,hg:null,awg:null,status:null},
];

// ── Team survival (who's still in the competition) ────────────────────────────
// A team is OUT if it lost a knockout match, or if the knockouts have begun and
// the team never appears in any knockout fixture (didn't qualify from groups).
// Otherwise it's IN (during the group stage, everyone counts as in until then).
function computeSurvival(knockouts) {
  const eliminated = new Set();
  const inKnockouts = new Set();      // every team that reached the knockouts
  let knockoutsBegun = false;

  knockouts.forEach(k => {
    if (k.home) inKnockouts.add(k.home);
    if (k.away) inKnockouts.add(k.away);
    if (k.home || k.away) knockoutsBegun = true;
    // a finished knockout match eliminates the loser
    if (k.status === "FT" && k.home && k.away && k.hg != null && k.awg != null) {
      if (k.hg > k.awg) eliminated.add(k.away);
      else if (k.awg > k.hg) eliminated.add(k.home);
      // (draws in knockouts go to extra time / pens; the API reports the
      //  advancing side via the next round, so a level FT score leaves both
      //  "in" here until the winner appears in the following round)
    }
  });

  // Once the bracket is populated, any team not in it didn't qualify.
  function isOut(team) {
    if (eliminated.has(team)) return true;
    if (knockoutsBegun && !inKnockouts.has(team)) return true;
    return false;
  }
  return { isOut, knockoutsBegun };
}

// ── League table calculation ──────────────────────────────────────────────────
function buildLeagueTable(fixtures) {
  const stats = {};
  Object.keys(FAMILY).forEach(name => {
    stats[name] = { p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
  });
  fixtures.filter(f => f.status === "FT" || f.status === "LIVE").forEach(f => {
    const ho = getOwner(f.home);
    const ao = getOwner(f.away);
    const hg = f.hg, ag = f.awg;
    // home team owner
    if (ho) {
      stats[ho].p++;
      stats[ho].gf += hg; stats[ho].ga += ag;
      if (hg > ag) { stats[ho].w++; stats[ho].pts += 3; }
      else if (hg === ag) { stats[ho].d++; stats[ho].pts += 1; }
      else stats[ho].l++;
    }
    // away team owner (different person)
    if (ao && ao !== ho) {
      stats[ao].p++;
      stats[ao].gf += ag; stats[ao].ga += hg;
      if (ag > hg) { stats[ao].w++; stats[ao].pts += 3; }
      else if (ag === hg) { stats[ao].d++; stats[ao].pts += 1; }
      else stats[ao].l++;
    }
    // if same owner has both teams, still count both separately (they can't lose to themselves)
    if (ho && ao && ho === ao) {
      // second "team" appearance for same member — count the away team too
      stats[ao].p++;
      stats[ao].gf += ag; stats[ao].ga += hg;
      if (ag > hg) { stats[ao].w++; stats[ao].pts += 3; }
      else if (ag === hg) { stats[ao].d++; stats[ao].pts += 1; }
      else stats[ao].l++;
    }
  });
  return Object.entries(stats)
    .map(([name, s]) => ({ name, ...s, gd: s.gf - s.ga }))
    .sort((a,b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
}

// ── Sub-components ────────────────────────────────────────────────────────────
function OwnerPill({ team, size = "sm" }) {
  const owner = getOwner(team);
  if (!owner) return null;
  return (
    <span style={{
      background: COLORS[owner], color:"#fff", borderRadius:999,
      fontSize: size === "sm" ? 10 : 11,
      fontWeight:700, padding:"1px 7px", letterSpacing:"0.04em", whiteSpace:"nowrap",
    }}>{owner}</span>
  );
}

function ScoreBox({ f }) {
  if (f.status === "FT") {
    const hw = f.hg > f.awg, aw = f.awg > f.hg;
    return (
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        minWidth:62, background:"#1a3a6e", borderRadius:8, padding:"4px 10px",
      }}>
        <span style={{ fontSize:8, color:"#8ba8d4", fontWeight:700, letterSpacing:"0.05em", marginBottom:1 }}>FULL TIME</span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:20, fontWeight:900, color: hw?"#4ade80": aw?"#94a3b8":"#fbbf24" }}>{f.hg}</span>
          <span style={{ color:"#8ba8d4", fontWeight:700, fontSize:14 }}>–</span>
          <span style={{ fontSize:20, fontWeight:900, color: aw?"#4ade80": hw?"#94a3b8":"#fbbf24" }}>{f.awg}</span>
        </div>
        <span style={{ fontSize:8, color:"#4ade80", fontWeight:800, letterSpacing:"0.05em" }}>● FT</span>
      </div>
    );
  }
  if (f.status === "LIVE") {
    return (
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        minWidth:62, background:"#7f1d1d", borderRadius:8, padding:"4px 10px",
      }}>
        <span style={{ fontSize:8, color:"#fca5a5", fontWeight:700, marginBottom:1 }}>LIVE</span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{f.hg}</span>
          <span style={{ color:"#fca5a5", fontWeight:700 }}>–</span>
          <span style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{f.awg}</span>
        </div>
        <span style={{ fontSize:8, color:"#f87171", fontWeight:800 }}>● LIVE</span>
      </div>
    );
  }
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      minWidth:68, background:"#eef2f7", borderRadius:8, padding:"4px 8px",
    }}>
      <span style={{ fontSize:9, color:"#7a8599", fontWeight:700 }}>{f.date.slice(4,10)}</span>
      <span style={{ fontSize:14, fontWeight:900, color:"#1a2035", lineHeight:1.1 }}>VS</span>
      <span style={{ fontSize:9, color:"#7a8599", fontWeight:700 }}>{f.time} <span style={{color:"#a0aec0"}}>UK</span></span>
      {toCalifornia(f.time) && (
        <span style={{ fontSize:9, color:"#c0392b", fontWeight:700 }}>{toCalifornia(f.time)} <span style={{color:"#d99",fontWeight:600}}>CA</span></span>
      )}
    </div>
  );
}

function TeamSide({ team, side }) {
  // side: "home" (right-aligned) or "away" (left-aligned)
  const owner = team ? getOwner(team) : null;
  const isHome = side === "home";
  const placeholder = !team;
  const nameEl = (
    <span style={{
      fontWeight:700, fontSize:12,
      color: placeholder ? "#94a3b8" : "#1a2035",
      fontStyle: placeholder ? "italic" : "normal",
      textAlign: isHome ? "right" : "left", wordBreak:"break-word",
    }}>{team || "To be decided"}</span>
  );
  const flagEl = <span style={{ fontSize:16, flexShrink:0 }}>{team ? (FLAGS[team]||"⚽") : "🏳️"}</span>;
  return (
    <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center",
      justifyContent: isHome ? "flex-end" : "flex-start", gap:4 }}>
      {!isHome && <div style={{ width:3, height:32, borderRadius:2, background:owner?COLORS[owner]:"#ddd", flexShrink:0 }} />}
      {!isHome && flagEl}
      <div style={{ minWidth:0, display:"flex", flexDirection:"column",
        alignItems: isHome ? "flex-end" : "flex-start", gap:2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {isHome && nameEl}{isHome && flagEl}
          {!isHome && nameEl}
        </div>
        {owner && <OwnerPill team={team} />}
      </div>
      {isHome && <div style={{ width:3, height:32, borderRadius:2, background:owner?COLORS[owner]:"#ddd", flexShrink:0 }} />}
    </div>
  );
}

function FixtureCard({ f }) {
  const played = f.status === "FT" || f.status === "LIVE";
  return (
    <div style={{
      background: played ? "#f7faff" : "#fff",
      border: played ? "1px solid #c7d8f0" : "1px solid #e8ecf0",
      borderRadius:10, padding:"10px 12px", marginBottom:8, position:"relative",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <TeamSide team={f.home} side="home" />
        <div style={{ flexShrink:0 }}><ScoreBox f={f} /></div>
        <TeamSide team={f.away} side="away" />
      </div>
      {f.venue && (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:4,
          marginTop:8, paddingTop:7, borderTop:"1px solid #eef2f7",
          fontSize:10.5, color:"#94a3b8", fontWeight:600,
        }}>
          <span style={{ fontSize:11 }}>📍</span>
          <span>{f.venue}</span>
        </div>
      )}
    </div>
  );
}

function LeagueTable({ fixtures }) {
  const table = buildLeagueTable(fixtures);
  const hasData = table.some(r => r.p > 0);
  const medals = ["🥇","🥈","🥉"];
  const groupGames = fixtures.length;             // 72 group matches
  const groupDone = fixtures.filter(f => f.status === "FT").length;
  const isFinal = groupGames > 0 && groupDone === groupGames;
  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"16px 12px" }}>
      <div style={{
        background: isFinal ? "linear-gradient(135deg,#1a3a6e,#16a34a)" : "#1a3a6e",
        borderRadius:12, padding:"14px 16px", marginBottom:16,
        border:"1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ color:"#fff", fontWeight:900, fontSize:15, marginBottom:2 }}>
          🏅 Family League Table{isFinal && " · FINAL"}
        </div>
        <div style={{ color: isFinal ? "#d1fae5" : "#8ba8d4", fontSize:12 }}>
          {isFinal
            ? `✓ All ${groupGames} group games played — final sweepstake standings`
            : `Group stage points · 3 for a win, 1 for a draw · ${groupDone}/${groupGames} games played`}
        </div>
      </div>

      {!hasData && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#7a8599", background:"#fff", borderRadius:12, border:"1px solid #e8ecf0" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <div style={{ fontWeight:700, fontSize:14 }}>No results yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>The table will fill up as matches are played</div>
        </div>
      )}

      {hasData && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8ecf0", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
          {/* Header */}
          <div style={{
            display:"grid", gridTemplateColumns:"36px 1fr 30px 30px 30px 38px 48px",
            background:"#f0f4f8", padding:"8px 12px",
            fontSize:10, fontWeight:800, color:"#7a8599", letterSpacing:"0.06em",
            borderBottom:"2px solid #e8ecf0",
          }}>
            <span>#</span>
            <span>MEMBER</span>
            <span style={{textAlign:"center"}}>P</span>
            <span style={{textAlign:"center"}}>W</span>
            <span style={{textAlign:"center"}}>D</span>
            <span style={{textAlign:"center"}}>GD</span>
            <span style={{textAlign:"center",color:"#1a2035",fontWeight:900}}>PTS</span>
          </div>

          {table.map((row, i) => (
            <div key={row.name} style={{
              display:"grid",
              gridTemplateColumns:"36px 1fr 30px 30px 30px 38px 48px",
              padding:"9px 12px",
              borderBottom: i < table.length-1 ? "1px solid #f0f4f8" : "none",
              background: i===0 && row.p>0 ? "linear-gradient(90deg,rgba(250,204,21,0.07),transparent)" :
                          i===1 && row.p>0 ? "linear-gradient(90deg,rgba(148,163,184,0.07),transparent)" :
                          i===2 && row.p>0 ? "linear-gradient(90deg,rgba(180,120,60,0.07),transparent)" : "#fff",
              alignItems:"center",
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                {row.p > 0
                  ? (i < 3
                      ? <span style={{fontSize:18}}>{medals[i]}</span>
                      : <span style={{fontSize:12,fontWeight:800,color:"#a0aec0"}}>{i+1}</span>)
                  : <span style={{fontSize:12,color:"#cbd5e0"}}>–</span>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:9, height:9, borderRadius:"50%", background:COLORS[row.name], flexShrink:0 }} />
                  <span style={{ fontWeight:800, fontSize:13, color:"#1a2035" }}>{row.name}</span>
                </div>
                <span style={{ fontSize:11, color:"#a0aec0", paddingLeft:15 }}>
                  {FAMILY[row.name].map(t => FLAGS[t]||"⚽").join(" ")}
                </span>
              </div>
              <span style={{ textAlign:"center", fontSize:13, color:"#64748b", fontWeight:600 }}>{row.p}</span>
              <span style={{ textAlign:"center", fontSize:13, color:row.w>0?"#16a34a":"#cbd5e0", fontWeight:700 }}>{row.w}</span>
              <span style={{ textAlign:"center", fontSize:13, color:row.d>0?"#b45309":"#cbd5e0", fontWeight:700 }}>{row.d}</span>
              <span style={{ textAlign:"center", fontSize:13, fontWeight:700,
                color:row.gd>0?"#16a34a":row.gd<0?"#dc2626":"#64748b" }}>
                {row.gd>0?`+${row.gd}`:row.gd}
              </span>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <span style={{
                  background: row.pts>0 ? COLORS[row.name] : "#e8ecf0",
                  color: row.pts>0 ? "#fff" : "#a0aec0",
                  borderRadius:20, padding:"4px 0",
                  fontSize:15, fontWeight:900, width:38, textAlign:"center", display:"block",
                }}>{row.pts}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div style={{ marginTop:12, padding:"10px 14px", background:"#fff", borderRadius:10, border:"1px solid #e8ecf0", fontSize:11, color:"#7a8599" }}>
          <strong style={{ color:"#1a2035" }}>Note:</strong> Each member earns points for every team they own. If a member owns both teams in a match, both results count towards their total.
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("groups");
  const [selGroup, setSelGroup] = useState("All");
  const [selMember, setSelMember] = useState("All");
  const [selShow, setSelShow] = useState("all");
  const [selRound, setSelRound] = useState("R32");

  // ── Date-aware behaviour ────────────────────────────────────────────────────
  // Group stage ends Sat 27 Jun 2026. The family league table is a group-stage
  // competition, so we stop showing it once the groups are done (from 28 Jun).
  // The knockouts run from 28 Jun; from 29 Jun we default the app to the
  // current knockout round so it opens on what's live.
  const NOW = new Date();
  const showLeague = NOW < new Date("2026-06-28T00:00:00Z");

  // Which knockout round is "current" based on today's date (UK).
  const currentRound = (() => {
    const d = NOW;
    if (d >= new Date("2026-07-19T00:00:00Z")) return "F";
    if (d >= new Date("2026-07-18T00:00:00Z")) return "3P";
    if (d >= new Date("2026-07-14T00:00:00Z")) return "SF";
    if (d >= new Date("2026-07-09T00:00:00Z")) return "QF";
    if (d >= new Date("2026-07-04T00:00:00Z")) return "R16";
    if (d >= new Date("2026-06-28T00:00:00Z")) return "R32";
    return null; // group stage still running
  })();

  // From Mon 29 Jun, open the app on the Knockouts tab at the current round.
  useEffect(() => {
    const knockoutsDefaultFrom = new Date("2026-06-29T00:00:00Z");
    if (NOW >= knockoutsDefaultFrom && currentRound) {
      setView("knockouts");
      setSelRound(currentRound);
    }
    // run once on mount
  }, []);

  // Live results are fetched on page load from our Netlify function and merged
  // over the built-in FIXTURES. If the fetch fails, we just show the built-in data.
  const [fixtures, setFixtures] = useState(FIXTURES);
  const [knockouts, setKnockouts] = useState(KNOCKOUTS);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/.netlify/functions/results")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (cancelled || !data || !Array.isArray(data.results)) return;
        const idx = {};
        data.results.forEach(r => { idx[`${r.home}|${r.away}`] = r; });
        setFixtures(prev => prev.map(f => {
          const r = idx[`${f.home}|${f.away}`];
          return r ? { ...f, hg: r.hg, awg: r.awg, status: r.status } : f;
        }));
        // Knockout matches: the API returns them ordered by kickoff, grouped by
        // stage. We replace our placeholders for each round in that same order,
        // so team names, dates and times populate the moment a round is drawn.
        if (Array.isArray(data.knockout)) {
          const byStage = {};
          data.knockout.forEach(k => { (byStage[k.stage] = byStage[k.stage]||[]).push(k); });
          setKnockouts(prev => {
            const counters = {};
            return prev.map(slot => {
              const list = byStage[slot.round];
              if (!list) return slot;
              const i = counters[slot.round] || 0;
              counters[slot.round] = i + 1;
              const api = list[i];
              if (!api) return slot;
              return { ...slot,
                home: api.home ?? slot.home,
                away: api.away ?? slot.away,
                hg: api.hg, awg: api.awg, status: api.status,
                date: api.date || slot.date,
                time: api.time || slot.time };
            });
          });
        }
        if (data.fetchedAt) setUpdatedAt(new Date(data.fetchedAt));
      })
      .catch(() => { /* keep built-in data on any error */ });
    return () => { cancelled = true; };
  }, []);

  const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const playedCount = fixtures.filter(f => f.status === "FT" || f.status === "LIVE").length;

  const filtered = fixtures.filter(f => {
    const gOk = selGroup === "All" || f.group === selGroup;
    const mOk = selMember === "All" || getOwner(f.home)===selMember || getOwner(f.away)===selMember;
    const sOk = selShow==="all" || (selShow==="played"&&f.status) || (selShow==="upcoming"&&!f.status);
    return gOk && mOk && sOk;
  });

  const byDate = {};
  filtered.forEach(f => { (byDate[f.date] = byDate[f.date]||[]).push(f); });

  // Sort date groups chronologically (parse "Sat 13 Jun" -> day number)
  const MONTHS = { Jun:6, Jul:7 };
  const dateKey = label => {
    const parts = label.split(" "); // ["Sat","13","Jun"]
    return MONTHS[parts[2]] * 100 + parseInt(parts[1], 10);
  };
  const sortedDates = Object.keys(byDate).sort((a,b) => dateKey(a) - dateKey(b));

  // If the league tab is gone (groups closed) but it's still the active view,
  // fall back to a sensible default.
  useEffect(() => {
    if (!showLeague && view === "league") setView(currentRound ? "knockouts" : "groups");
  }, [showLeague, view]);

  const tabs = [
    ["groups","📋 Groups"],
    ["knockouts","🏆 Knockouts"],
    ...(showLeague ? [["league","🏅 League"]] : []),
    ["teams","👥 Teams"],
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0a1628", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#0a1628 0%,#1a3a6e 50%,#0a1628 100%)",
        padding:"20px 20px 0", textAlign:"center", borderBottom:"1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ fontSize:26, marginBottom:2 }}>🏆</div>
        <h1 style={{ color:"#fff", margin:"0 0 3px", fontSize:21, fontWeight:900, letterSpacing:"0.02em" }}>
          FAMILY WORLD CUP 2026
        </h1>
        <p style={{ color:"#8ba8d4", margin:"0 0 8px", fontSize:12 }}>
          ⚽ Sweepstake · 48 Teams · 14 Members · v2.0
        </p>
        <div style={{ marginBottom:8, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
          {playedCount > 0 && (
            <span style={{
              background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.4)",
              color:"#4ade80", borderRadius:20, fontSize:11, fontWeight:700, padding:"3px 12px",
            }}>✓ {playedCount} result{playedCount!==1?"s":""} in</span>
          )}
          <span style={{
            background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)",
            color:"#8ba8d4", borderRadius:20, fontSize:11, fontWeight:600, padding:"3px 12px",
          }}>🕐 Updated {(updatedAt || new Date()).toLocaleString("en-GB",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:"Europe/London"})}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:2 }}>
          {tabs.map(([id,label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              background: view===id ? "#fff" : "transparent",
              color: view===id ? "#0a1628" : "rgba(255,255,255,0.6)",
              border:"none", borderRadius:"8px 8px 0 0",
              padding:"9px 12px", fontWeight:700, fontSize:12, cursor:"pointer",
              transition:"all 0.15s", whiteSpace:"nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"#f5f7fa", minHeight:"calc(100vh - 160px)" }}>

        {/* ── GROUP STAGE TAB ── */}
        {view === "groups" && (
          <div style={{ maxWidth:720, margin:"0 auto", padding:"16px 12px" }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"flex-end" }}>
              {[
                ["Group","selGroup",["All",...GROUPS.map(g=>`Group ${g}`)],["All",...GROUPS]],
                ["Member","selMember",["All Members",...Object.keys(FAMILY)],["All",...Object.keys(FAMILY)]],
                ["Show","selShow",["All matches","Results only","Upcoming only"],["all","played","upcoming"]],
              ].map(([label, key, labels, vals]) => (
                <div key={key}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#7a8599", marginBottom:3 }}>{label.toUpperCase()}</div>
                  <select
                    value={key==="selGroup"?selGroup:key==="selMember"?selMember:selShow}
                    onChange={e => key==="selGroup"?setSelGroup(e.target.value):key==="selMember"?setSelMember(e.target.value):setSelShow(e.target.value)}
                    style={{ border:"1px solid #dce3ea", borderRadius:7, padding:"6px 10px", fontSize:12, background:"#fff", fontWeight:600, color:"#1a2035", cursor:"pointer" }}
                  >
                    {labels.map((l,i) => <option key={i} value={vals[i]}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {Object.keys(byDate).length === 0 && (
              <div style={{ textAlign:"center", padding:40, color:"#7a8599" }}>No fixtures match your filters.</div>
            )}

            {sortedDates.map(date => {
              const fixtures = byDate[date];
              return (
              <div key={date} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ background:"#1a3a6e", color:"#fff", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:800, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{date}</div>
                  <div style={{ flex:1, height:1, background:"#dce3ea" }} />
                  <span style={{ fontSize:11, color:"#a0aec0", whiteSpace:"nowrap" }}>{fixtures.length} match{fixtures.length!==1?"es":""}</span>
                </div>
                {fixtures.map((f,i) => (
                  <div key={i}>
                    <div style={{ fontSize:10, color:"#9baec8", fontWeight:700, letterSpacing:"0.06em", marginBottom:2, paddingLeft:4 }}>GROUP {f.group}</div>
                    <FixtureCard f={f} />
                  </div>
                ))}
              </div>
              );
            })}
            <div style={{ textAlign:"center", padding:"16px 0 20px", color:"#a0aec0", fontSize:11 }}>
              All times BST · Group stage · Updated {new Date().toLocaleDateString("en-GB")}
            </div>
          </div>
        )}

        {/* ── KNOCKOUTS TAB ── */}
        {view === "knockouts" && (() => {
          const roundMatches = knockouts.filter(k => k.round === selRound);
          const roundMeta = ROUNDS.find(r => r.id === selRound);
          const koByDate = {};
          roundMatches.forEach(k => { (koByDate[k.date] = koByDate[k.date]||[]).push(k); });
          const koDates = Object.keys(koByDate).sort((a,b) => dateKey(a) - dateKey(b));
          const anyTeams = roundMatches.some(k => k.home || k.away);
          const roundCount = id => knockouts.filter(k => k.round === id).length;
          return (
            <div style={{ maxWidth:720, margin:"0 auto", padding:"16px 12px" }}>
              {/* round sub-nav */}
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:6, WebkitOverflowScrolling:"touch" }}>
                {ROUNDS.map(r => (
                  <button key={r.id} onClick={() => setSelRound(r.id)} style={{
                    flex:"0 0 auto",
                    background: selRound===r.id ? "#1a3a6e" : "#fff",
                    color: selRound===r.id ? "#fff" : "#64748b",
                    border: selRound===r.id ? "1px solid #1a3a6e" : "1px solid #dce3ea",
                    borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:700,
                    cursor:"pointer", whiteSpace:"nowrap",
                  }}>
                    {r.label}{roundCount(r.id) > 1 && <span style={{ opacity:0.6, fontWeight:600, marginLeft:4 }}>{roundCount(r.id)}</span>}
                  </button>
                ))}
              </div>

              {koDates.map(date => {
                const ms = koByDate[date];
                return (
                  <div key={date} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ background:"#1a3a6e", color:"#fff", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:800, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{date}</div>
                      <div style={{ flex:1, height:1, background:"#dce3ea" }} />
                      <span style={{ fontSize:11, color:"#a0aec0", whiteSpace:"nowrap" }}>{ms.length} match{ms.length!==1?"es":""}</span>
                    </div>
                    {ms.map((k,i) => <FixtureCard key={i} f={k} />)}
                  </div>
                );
              })}

              {!anyTeams && (
                <div style={{
                  textAlign:"center", color:"#94a3b8", fontSize:12, padding:"20px 16px",
                  background:"#fff", borderRadius:12, border:"1px dashed #cbd5e0", marginTop:4,
                }}>
                  🔒 Teams appear here automatically once the earlier rounds are played.
                  Dates &amp; kick-off times are already set.
                </div>
              )}

              <div style={{ textAlign:"center", padding:"16px 0 20px", color:"#a0aec0", fontSize:11 }}>
                {roundMeta?.label} · {roundMeta?.range} · times BST (estimated until confirmed)
              </div>
            </div>
          );
        })()}

        {/* ── LEAGUE TAB ── */}
        {view === "league" && showLeague && <LeagueTable fixtures={fixtures} />}

        {/* ── TEAMS TAB ── */}
        {view === "teams" && (() => {
          const { isOut, knockoutsBegun } = computeSurvival(knockouts);
          // Build per-member survival data and sort by teams remaining (desc),
          // then by name for a stable order.
          const members = Object.entries(FAMILY).map(([name, teams]) => {
            const status = teams.map(t => ({ team: t, out: isOut(t) }));
            const remaining = status.filter(s => !s.out).length;
            return { name, teams, status, remaining };
          }).sort((a, b) => b.remaining - a.remaining || a.name.localeCompare(b.name));

          return (
            <div style={{ maxWidth:720, margin:"0 auto", padding:"16px 12px" }}>
              {knockoutsBegun && (
                <div style={{
                  background:"#1a3a6e", borderRadius:12, padding:"12px 16px", marginBottom:16,
                  border:"1px solid rgba(255,255,255,0.1)",
                }}>
                  <div style={{ color:"#fff", fontWeight:900, fontSize:15, marginBottom:2 }}>🏆 Who's Still Standing</div>
                  <div style={{ color:"#8ba8d4", fontSize:12 }}>Ranked by teams still in the competition · updates as games finish</div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:12 }}>
                {members.map(({ name, status, teams, remaining }, i) => (
                  <div key={name} style={{ background:"#fff", borderRadius:10, border:"1px solid #e8ecf0", overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                    <div style={{ background:COLORS[name], padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff" }}>{name[0]}</div>
                      <span style={{ color:"#fff", fontWeight:800, fontSize:14 }}>{name}</span>
                      <span style={{
                        marginLeft:"auto", color:"#fff",
                        background: remaining>0 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)",
                        borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:800,
                      }}>
                        {knockoutsBegun
                          ? (remaining>0 ? `${remaining} still in` : "knocked out")
                          : `${teams.length} teams`}
                      </span>
                    </div>
                    <div style={{ padding:"10px 14px" }}>
                      {status.map(({ team, out }) => (
                        <div key={team} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid #f0f4f8", opacity: out ? 0.45 : 1 }}>
                          <span style={{ fontSize:18, filter: out ? "grayscale(100%)" : "none" }}>{FLAGS[team]||"⚽"}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:"#1a2035", textDecoration: out ? "line-through" : "none" }}>{team}</span>
                          {out
                            ? <span style={{ marginLeft:"auto", fontSize:10, fontWeight:800, color:"#dc2626", letterSpacing:"0.04em" }}>OUT</span>
                            : knockoutsBegun && <span style={{ marginLeft:"auto", fontSize:10, fontWeight:800, color:"#16a34a", letterSpacing:"0.04em" }}>IN</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
