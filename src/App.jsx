import { useState, useCallback, useEffect } from "react";

// ── Config ────────────────────────────────────────────────────────────────────

const WORKER_URL = "https://disney-ll-proxy.45-reactor-puritan.workers.dev";

// ── Data ─────────────────────────────────────────────────────────────────────

const PEOPLE = [
  { id: "J", family: 1 }, { id: "A", family: 1 },
  { id: "w", family: 1 }, { id: "r", family: 1 },
  { id: "T", family: 2 }, { id: "B", family: 2 },
  { id: "t", family: 2 }, { id: "q", family: 2 }, { id: "b", family: 2 },
];
const FAMILY1 = PEOPLE.filter((p) => p.family === 1).map((p) => p.id);
const FAMILY2 = PEOPLE.filter((p) => p.family === 2).map((p) => p.id);

const PREF_SCORES = { must: 5, like: 2, neutral: 0, skip: -1 };
const PREF_KEYS   = ["must", "like", "neutral", "skip"];
const PREF_LABELS = { must: "Must Do", like: "Like To", neutral: "Neutral", skip: "Skip It" };
const PREF_NOTION = { must: "Must Do", like: "Like To", neutral: "Neutral", skip: "Skip It" };
const NOTION_PREF = { "Must Do": "must", "Like To": "like", "Neutral": "neutral", "Skip It": "skip" };

const LL_STATUS = { FIRST: "Pre-Book (1st)", PREBOOK: "Pre-Book", LATER: "Later", DONTBOOK: "Don't Book" };

const PARKS = [
  { id: "mk", name: "Magic Kingdom",     color: "#2C5F8A" },
  { id: "ep", name: "EPCOT",             color: "#4A2C6B" },
  { id: "hs", name: "Hollywood Studios", color: "#8A3A2C" },
];

function toDisplayName(raw) {
  return raw.replace(/^(The|A|An) /i, (_, p) => `(${p}) `);
}
function sortKey(name) {
  return name.replace(/^\((?:The|A|An)\)\s*/i, "").toLowerCase();
}
function llText(ll, illPrice) {
  if (ll === "ill") return illPrice ? `Individual Lightning Lane · ${illPrice}` : "Individual Lightning Lane";
  if (ll === "mp1") return "Multipass Tier 1";
  if (ll === "mp2") return "Multipass Tier 2";
  return "No Lightning Lane";
}

const RAW_RIDES = [
  { id:"hs7b", park:"hs", name:"Alien Swirling Saucers",                             type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/alien-swirling-saucers/" },
  { id:"mk12", park:"mk", name:"Astro Orbiter",                                       type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/astro-orbiter/" },
  { id:"ep9",  park:"ep", name:"Awesome Planet",                                      type:"Film", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/the-land-awesome-planet/" },
  { id:"mk30", park:"mk", name:"The Barnstormer",                                     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/barnstormer-starring-great-goofini/" },
  { id:"hs8",  park:"hs", name:"Beauty and the Beast Live on Stage",                  type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/beauty-and-the-beast-live-on-stage/" },
  { id:"ep15", park:"ep", name:"Beauty and the Beast Sing-Along",                     type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/entertainment/epcot/beauty-and-the-beast-sing-along/" },
  { id:"mk18", park:"mk", name:"Big Thunder Mountain Railroad",                       type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/big-thunder-mountain-railroad/" },
  { id:"mk12b",park:"mk", name:"Buzz Lightyear's Space Ranger Spin",                  type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/buzz-lightyear-space-ranger-spin/" },
  { id:"mk31", park:"mk", name:"Country Bear Musical Jamboree",                       type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/country-bear-musical-jamboree/" },
  { id:"ep13", park:"ep", name:"Disney and Pixar Short Film Festival",                type:"Film", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/disney-pixar-short-film-festival/" },
  { id:"hs14", park:"hs", name:"Disney Villains: Unfairly Ever After",                type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/disney-villains-unfairly-ever-after/" },
  { id:"mk7b", park:"mk", name:"Dumbo the Flying Elephant",                           type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/dumbo-the-flying-elephant/" },
  { id:"mk22b",park:"mk", name:"Enchanted Tiki Room",                                 type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/enchanted-tiki-room/" },
  { id:"mk32", park:"mk", name:"Enchanted Tales with Belle",                          type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/enchanted-tales-with-belle/" },
  { id:"hs12", park:"hs", name:"For the First Time in Forever: A Frozen Sing-Along",  type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/frozen-sing-along-celebration/" },
  { id:"ep10", park:"ep", name:"Frozen Ever After",                                   type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/frozen-ever-after/" },
  { id:"ep12", park:"ep", name:"Gran Fiesta Tour Starring The Three Caballeros",      type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/gran-fiesta-tour-starring-three-caballeros/" },
  { id:"ep1",  park:"ep", name:"Guardians of the Galaxy: Cosmic Rewind",              type:"Ride", ll:"ill", illPrice:"$15–$22", url:"https://disneyworld.disney.go.com/attractions/epcot/guardians-of-the-galaxy-cosmic-rewind/" },
  { id:"mk33", park:"mk", name:"The Hall of Presidents",                              type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/hall-of-presidents/" },
  { id:"mk23", park:"mk", name:"Haunted Mansion",                                     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/haunted-mansion/" },
  { id:"hs10", park:"hs", name:"Indiana Jones Epic Stunt Spectacular",                type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/indiana-jones-epic-stunt-spectacular/" },
  { id:"mk3",  park:"mk", name:"It's a Small World",                                  type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/its-a-small-world/" },
  { id:"ep14", park:"ep", name:"Journey into Imagination with Figment",               type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/journey-into-imagination-with-figment/" },
  { id:"ep16", park:"ep", name:"Journey of Water, Inspired by Moana",                 type:"Tour", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/journey-of-water-inspired-by-moana/" },
  { id:"mk20", park:"mk", name:"Jungle Cruise",                                       type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/jungle-cruise/" },
  { id:"hs13", park:"hs", name:"The Little Mermaid - A Musical Adventure",            type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/little-mermaid-musical-adventure/" },
  { id:"ep6",  park:"ep", name:"Living with the Land",                                type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/living-with-the-land/" },
  { id:"mk6",  park:"mk", name:"Mad Tea Party",                                       type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/mad-tea-party/" },
  { id:"mk21", park:"mk", name:"The Magic Carpets of Aladdin",                        type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/magic-carpets-of-aladdin/" },
  { id:"mk8",  park:"mk", name:"The Many Adventures of Winnie the Pooh",              type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/many-adventures-of-winnie-the-pooh/" },
  { id:"mk34", park:"mk", name:"Meet Ariel at Her Grotto",                            type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/meet-ariel-at-her-grotto/" },
  { id:"hs15", park:"hs", name:"Meet Ariel at Walt Disney Presents",                  type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/meet-ariel-at-walt-disney-presents/" },
  { id:"ep17", park:"ep", name:"Meet Anna and Elsa at Royal Sommerhus",               type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/meet-anna-and-elsa-at-royal-sommerhus/" },
  { id:"ep18", park:"ep", name:"Meet Beloved Disney Pals at Mickey and Friends",      type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/meet-beloved-disney-pals-at-mickey-and-friends/" },
  { id:"mk35", park:"mk", name:"Meet Cinderella and a Visiting Princess at Princess Fairytale Hall", type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/princess-fairytale-hall/" },
  { id:"hs16", park:"hs", name:"Meet Disney Stars at Red Carpet Dreams",              type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/meet-disney-stars-at-red-carpet-dreams/" },
  { id:"hs17", park:"hs", name:"Meet Edna Mode at the Edna Mode Experience",          type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/meet-edna-mode/" },
  { id:"mk36", park:"mk", name:"Meet Mickey at Town Square Theater",                  type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/meet-mickey-at-town-square-theater/" },
  { id:"hs18", park:"hs", name:"Meet Olaf at Celebrity Spotlight",                    type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/meet-olaf-at-celebrity-spotlight/" },
  { id:"mk37", park:"mk", name:"Meet Princess Tiana and a Visiting Princess at Princess Fairytale Hall", type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/princess-fairytale-hall/" },
  { id:"hs11", park:"hs", name:"Mickey and Minnie's Runaway Railway",                 type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/mickey-minnies-runaway-railway/" },
  { id:"mk9",  park:"mk", name:"Mickey's PhilharMagic",                               type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/mickeys-philharmagic/" },
  { id:"hs2",  park:"hs", name:"Millennium Falcon: Smugglers Run",                    type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/millennium-falcon-smugglers-run/" },
  { id:"ep3",  park:"ep", name:"Mission: SPACE",                                      type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/mission-space/" },
  { id:"mk17", park:"mk", name:"Monsters Inc. Laugh Floor",                           type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/monsters-inc-laugh-floor/" },
  { id:"mk2",  park:"mk", name:"Peter Pan's Flight",                                  type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/peter-pan-flight/" },
  { id:"mk38", park:"mk", name:"Pete's Silly Sideshow - Dumbo and Goofy",             type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/petes-silly-sideshow/" },
  { id:"mk39", park:"mk", name:"Pete's Silly Sideshow - Donald and Daisy",            type:"Character Meet", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/petes-silly-sideshow/" },
  { id:"mk22", park:"mk", name:"Pirates of the Caribbean",                            type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/pirates-of-the-caribbean/" },
  { id:"mk5",  park:"mk", name:"Prince Charming Regal Carrousel",                     type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/prince-charming-regal-carrousel/" },
  { id:"ep11", park:"ep", name:"Remy's Ratatouille Adventure",                        type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/remys-ratatouille-adventure/" },
  { id:"hs6",  park:"hs", name:"Rock 'n' Roller Coaster Starring The Muppets",        type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/rock-and-roller-coaster-starring-muppets/" },
  { id:"ep7",  park:"ep", name:"The Seas with Nemo and Friends",                      type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/seas-with-nemo-and-friends/" },
  { id:"mk1",  park:"mk", name:"Seven Dwarfs Mine Train",                             type:"Ride", ll:"ill", illPrice:"$15–$22", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/seven-dwarfs-mine-train/" },
  { id:"hs3",  park:"hs", name:"Slinky Dog Dash",                                     type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/slinky-dog-dash/" },
  { id:"ep5",  park:"ep", name:"Soarin' Around the World",                            type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/soarin-around-world/" },
  { id:"ep19", park:"ep", name:"Soarin' Across America",                              type:"Ride", ll:"mp2", closed:true, url:"https://disneyworld.disney.go.com/attractions/epcot/soarin-across-america/" },
  { id:"mk11", park:"mk", name:"Space Mountain",                                      type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/space-mountain/" },
  { id:"ep4",  park:"ep", name:"Spaceship Earth",                                     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/spaceship-earth/" },
  { id:"hs9",  park:"hs", name:"Star Tours - The Adventures Continue",                type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/star-tours/" },
  { id:"hs1",  park:"hs", name:"Star Wars: Rise of the Resistance",                   type:"Ride", ll:"ill", illPrice:"$15–$22", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/star-wars-rise-of-the-resistance/" },
  { id:"mk40", park:"mk", name:"Swiss Family Treehouse",                              type:"Tour", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/swiss-family-treehouse/" },
  { id:"ep2",  park:"ep", name:"Test Track",                                          type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/test-track/" },
  { id:"mk19", park:"mk", name:"Tiana's Bayou Adventure",                             type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tianas-bayou-adventure/" },
  { id:"mk16", park:"mk", name:"Tomorrowland Speedway",                               type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tomorrowland-speedway/" },
  { id:"mk15", park:"mk", name:"Tomorrowland Transit Authority PeopleMover",          type:"Tour", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tomorrowland-transit-authority-peoplemover/" },
  { id:"hs4",  park:"hs", name:"Toy Story Mania!",                                    type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/toy-story-mania/" },
  { id:"mk10", park:"mk", name:"TRON Lightcycle / Run",                               type:"Ride", ll:"ill", illPrice:"$15–$22", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tron-lightcycle-run/" },
  { id:"ep8",  park:"ep", name:"Turtle Talk with Crush",                              type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/turtle-talk-with-crush/" },
  { id:"hs7",  park:"hs", name:"The Twilight Zone Tower of Terror",                   type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/twilight-zone-tower-of-terror/" },
  { id:"mk4",  park:"mk", name:"Under the Sea: Journey of the Little Mermaid",        type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/under-the-sea-journey-of-the-little-mermaid/" },
  { id:"mk14", park:"mk", name:"Walt Disney's Carousel of Progress",                  type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/walt-disney-carousel-of-progress/" },
  { id:"hs19", park:"hs", name:"Walt Disney Presents",                                type:"Tour", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/walt-disney-presents/" },
];

// Sellout times from Thrill Data (past month avg). Update closer to trip.
// urgency: "red" = before noon, "amber" = afternoon, "green" = evening
const SELLOUT = {
  mk18:  { time: "Rarely sells out", urgency: "green" }, // Big Thunder Mountain Railroad
  mk30:  { time: "Rarely sells out", urgency: "green" }, // The Barnstormer
  mk7b:  { time: "Rarely sells out", urgency: "green" }, // Dumbo
  mk23:  { time: "Rarely sells out", urgency: "green" }, // Haunted Mansion
  mk3:   { time: "Rarely sells out", urgency: "green" }, // It's a Small World
  mk6:   { time: "Rarely sells out", urgency: "green" }, // Mad Tea Party
  mk21:  { time: "Rarely sells out", urgency: "green" }, // Magic Carpets of Aladdin
  mk22:  { time: "Rarely sells out", urgency: "green" }, // Pirates of the Caribbean
  mk16:  { time: "Rarely sells out", urgency: "green" }, // Tomorrowland Speedway
  mk4:   { time: "Rarely sells out", urgency: "green" }, // Under the Sea
  mk17:  { time: "Rarely sells out", urgency: "green" }, // Monsters Inc. Laugh Floor
  // EPCOT
  ep4:   { time: "Rarely sells out", urgency: "green" }, // Spaceship Earth
  ep6:   { time: "Rarely sells out", urgency: "green" }, // Living with the Land
  ep7:   { time: "Rarely sells out", urgency: "green" }, // Seas with Nemo
  ep8:   { time: "Rarely sells out", urgency: "green" }, // Turtle Talk with Crush
  ep13:  { time: "Rarely sells out", urgency: "green" }, // Disney and Pixar Short Film Festival
  ep14:  { time: "Rarely sells out", urgency: "green" }, // Journey into Imagination with Figment
  // Hollywood Studios
  hs2:   { time: "Rarely sells out", urgency: "green" }, // Millennium Falcon
  hs9:   { time: "Rarely sells out", urgency: "green" }, // Star Tours
  hs7b:  { time: "Rarely sells out", urgency: "green" }, // Alien Swirling Saucers
  // Beauty and Beast shows (mp2 but low urgency already added above)
  mk10:  { time: "~8:56 AM",  urgency: "red"   }, // TRON
  mk19:  { time: "~10:20 AM", urgency: "red"   }, // Tiana's Bayou Adventure
  mk12b: { time: "~11:22 AM", urgency: "amber" }, // Buzz Lightyear
  mk2:   { time: "~12:09 PM", urgency: "amber" }, // Peter Pan's Flight
  mk20:  { time: "~12:21 PM", urgency: "amber" }, // Jungle Cruise
  mk8:   { time: "~1:00 PM",  urgency: "amber" }, // Many Adventures of Winnie the Pooh
  mk11:  { time: "~4:52 PM",  urgency: "green" }, // Space Mountain
  mk9:   { time: "~6:35 PM",  urgency: "green" }, // Mickey's PhilharMagic
  // EPCOT
  ep1:   { time: "~8:17 AM",  urgency: "red"   }, // Guardians of the Galaxy
  ep2:   { time: "~8:33 AM",  urgency: "red"   }, // Test Track
  ep10:  { time: "~9:47 AM",  urgency: "red"   }, // Frozen Ever After
  ep11:  { time: "~9:57 AM",  urgency: "red"   }, // Remy's Ratatouille Adventure
  ep5:   { time: "~3:23 PM",  urgency: "amber" }, // Soarin' Around the World
  ep3:   { time: "~6:23 PM",  urgency: "green" }, // Mission: SPACE
  // Hollywood Studios
  hs3:   { time: "~7:27 AM",  urgency: "red"   }, // Slinky Dog Dash
  hs1:   { time: "~9:28 AM",  urgency: "red"   }, // Star Wars: Rise of the Resistance
  hs4:   { time: "~9:46 AM",  urgency: "red"   }, // Toy Story Mania
  hs7:   { time: "~12:03 PM", urgency: "amber" }, // Tower of Terror
  hs13:  { time: "~2:16 PM",  urgency: "amber" }, // Little Mermaid
  hs11:  { time: "~2:34 PM",  urgency: "amber" }, // Mickey & Minnie's Runaway Railway
  hs10:  { time: "~3:18 PM",  urgency: "amber" }, // Indiana Jones
  hs8:   { time: "~4:17 PM",  urgency: "green" }, // Beauty and the Beast
  hs12:  { time: "~5:53 PM",  urgency: "green" }, // Frozen Sing-Along
};

const URGENCY_COLOR = {
  red:   { bg: "#FFEBEE", color: "#B71C1C", border: "#FFCDD2" },
  amber: { bg: "#FFF8E1", color: "#E65100", border: "#FFE082" },
  green: { bg: "#E8F5E9", color: "#1B5E20", border: "#A5D6A7" },
};

const RIDES = RAW_RIDES
  .map((r) => ({ ...r, displayName: toDisplayName(r.name) }))
  .sort((a, b) => sortKey(a.displayName).localeCompare(sortKey(b.displayName)));

// ── Storage ───────────────────────────────────────────────────────────────────

const LS_KEY = "dw2026-ll-v7";
function loadStorage() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : {}; } catch (_) { return {}; }
}
function saveStorage(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

// ── Notion API ────────────────────────────────────────────────────────────────

async function fetchAllVotes() {
  const parks = ["mk", "ep", "hs"];
  const [votesResults, metaData] = await Promise.all([
    Promise.all(parks.map((park) =>
      fetch(`${WORKER_URL}/votes?park=${park}`).then((r) => r.json())
    )),
    fetch(`${WORKER_URL}/meta`).then((r) => r.json()),
  ]);

  const prefs = {};

  votesResults.forEach((data) => {
    if (!data.results) return;
    data.results.forEach((page) => {
      const rideId    = page.properties["Ride ID"]?.rich_text?.[0]?.text?.content;
      const person    = page.properties["Person"]?.rich_text?.[0]?.text?.content;
      const prefLabel = page.properties["Preference"]?.select?.name;
      const prefKey   = NOTION_PREF[prefLabel];
      if (!rideId || !person || !prefKey) return;
      if (!prefs[rideId]) prefs[rideId] = { prefs: {}, pageIds: {} };
      prefs[rideId].prefs[person]   = prefKey;
      prefs[rideId].pageIds[person] = page.id;
    });
  });

  if (metaData.results) {
    metaData.results.forEach((page) => {
      const rideId      = page.properties["Ride ID"]?.rich_text?.[0]?.text?.content;
      const closed      = page.properties["Closed"]?.checkbox ?? false;
      const rdNom       = page.properties["Rope Drop Nominee"]?.checkbox ?? false;
      const rdConfirmed = page.properties["Rope Drop Confirmed"]?.checkbox ?? false;
      const llStatus    = page.properties["LL Status"]?.select?.name ?? null;
      const notes       = page.properties["Notes"]?.rich_text?.[0]?.text?.content ?? "";
      const park        = RIDES.find((r) => r.id === rideId)?.park;
      if (!rideId) return;
      if (!prefs[rideId]) prefs[rideId] = { prefs: {}, pageIds: {} };
      prefs[rideId].closed     = closed;
      prefs[rideId].rdNom      = rdNom;
      prefs[rideId].llStatus   = llStatus;
      prefs[rideId].notes      = notes;
      prefs[rideId].metaPageId = page.id;
      if (rdConfirmed && park) prefs[`rdc_${park}`] = rideId;
    });
  }

  return prefs;
}

async function saveVoteToNotion(rideId, rideName, park, person, preference) {
  const res = await fetch(`${WORKER_URL}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rideId, rideName, park, person, preference: PREF_NOTION[preference] }),
  });
  const data = await res.json();
  return data.id;
}

async function deleteVoteFromNotion(pageId) {
  await fetch(`${WORKER_URL}/votes`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId }),
  });
}

async function saveMetaToNotion(rideId, rideName, park, meta, rdConfirmedId) {
  try {
    const res = await fetch(`${WORKER_URL}/meta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rideId,
        rideName,
        park,
        closed:      meta.closed    ?? false,
        rdNom:       meta.rdNom     ?? false,
        rdConfirmed: rdConfirmedId === rideId,
        notes:       meta.notes     ?? "",
        llStatus:    meta.llStatus  ?? null,
      }),
    });
    const data = await res.json();
    if (data.object === "error") console.error("Notion meta error:", data);
  } catch (e) {
    console.error("Meta sync failed:", e);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcScore(rideId, prefs) {
  return PEOPLE.reduce((sum, p) => {
    const pf = prefs[rideId]?.prefs?.[p.id];
    return sum + (pf ? PREF_SCORES[pf] : 0);
  }, 0);
}
function totalVotes(rideId, prefs) {
  return PEOPLE.filter((p) => prefs[rideId]?.prefs?.[p.id]).length;
}
function scoreColorClass(s) {
  if (s >= 20) return "score-hi";
  if (s >= 8)  return "score-md";
  if (s >= 0)  return "score-lo";
  return "score-ng";
}
function isClosed(rideId, prefs) {
  return prefs[rideId]?.closed ?? RIDES.find((r) => r.id === rideId)?.closed ?? false;
}

// Count Pre-Book slots used for a park
function preBookCounts(parkId, prefs, excludeRideId) {
  const rides = RIDES.filter((r) => r.park === parkId);
  let t1 = 0, t2 = 0;
  rides.forEach((r) => {
    if (r.id === excludeRideId) return;
    const s = prefs[r.id]?.llStatus;
    if (s === LL_STATUS.PREBOOK || s === LL_STATUS.FIRST) {
      if (r.ll === "mp1") t1++;
      if (r.ll === "mp2") t2++;
    }
  });
  return { t1, t2 };
}

// ── RideCard ──────────────────────────────────────────────────────────────────

function RideCard({ ride, prefs, onPref, onNotes, onClosed, onRdNom, syncing }) {
  const score  = calcScore(ride.id, prefs);
  const votes  = totalVotes(ride.id, prefs);
  const closed = isClosed(ride.id, prefs);
  const rdNom  = prefs[ride.id]?.rdNom ?? false;
  const pct    = Math.round((votes / 9) * 100);
  const notes  = prefs[ride.id]?.notes ?? "";

  const metaParts = [
    closed ? "Closed" : llText(ride.ll, ride.illPrice),
    ride.type !== "Ride" ? ride.type : null,
  ].filter(Boolean).join(" · ");

  const renderFamily = (members) =>
    members.map((pid) => {
      const cur       = prefs[ride.id]?.prefs?.[pid] ?? null;
      const isSyncing = syncing[`${ride.id}_${pid}`];
      return (
        <div className="p-row" key={pid}>
          <span className="p-lbl">{pid}{isSyncing ? <span className="sync-dot">…</span> : null}</span>
          <div className="pref-btns">
            {PREF_KEYS.map((k) => (
              <button
                key={k}
                className={`pb${cur === k ? ` sel-${k}` : ""}`}
                onClick={() => onPref(ride.id, pid, k)}
                disabled={isSyncing}
              >
                {PREF_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      );
    });

  return (
    <div className={`ride-card${closed ? " card-closed" : ""}`}>
      <div className="ride-header">
        <div className="name-row">
          <span className="ride-name">
            <a href={ride.url} target="_blank" rel="noreferrer">{ride.displayName} ↗</a>
          </span>
          {!closed && (
            <span className={`score-badge ${scoreColorClass(score)}`}>
              {score > 0 ? "+" : ""}{score}
            </span>
          )}
        </div>
        <div className={`ride-meta${closed ? " meta-closed" : ""}`}>{metaParts}</div>
        <div className="controls-row">
          <button className="btn-sm" onClick={() => onClosed(ride.id)}>
            {closed ? "Mark Ride Open" : "Mark Ride Closed"}
          </button>
          {!closed && (
            <button className={`rd-btn${rdNom ? " on" : ""}`} onClick={() => onRdNom(ride.id)}>
              🌅 Rope Drop Candidate
            </button>
          )}
        </div>
        {!closed && (
          <div className="prog">
            <div className="prog-fill" style={{ width: `${pct}%`, background: pct === 100 ? "#1A6B4A" : "#2C5F8A" }} />
          </div>
        )}
      </div>
      <div className={`prefs${closed ? " section-closed" : ""}`}>
        <div className="fam-blk"><div className="fam-lbl">S Family</div>{renderFamily(FAMILY1)}</div>
        <div className="fam-blk"><div className="fam-lbl">M Family</div>{renderFamily(FAMILY2)}</div>
      </div>
      <div className={`notes-sec${closed ? " section-closed" : ""}`}>
        <textarea
          className="notes-inp"
          placeholder="Notes..."
          rows={2}
          defaultValue={notes}
          onBlur={(e) => onNotes(ride.id, e.target.value)}
        />
      </div>
    </div>
  );
}

// ── LL Status Menu ────────────────────────────────────────────────────────────

function LLStatusMenu({ ride, prefs, parkId, onLLStatus }) {
  const [open, setOpen] = useState(false);
  const current = prefs[ride.id]?.llStatus ?? null;
  const { t1, t2 } = preBookCounts(parkId, prefs, ride.id);
  const noT1Booked = t1 === 0;
  const maxT2 = noT1Booked ? 3 : 2;
  const canPreBook = !((ride.ll === "mp1" && t1 >= 1) || (ride.ll === "mp2" && t2 >= maxT2));
  const isPreBookSelected = current === LL_STATUS.FIRST || current === LL_STATUS.PREBOOK;

  const options = [
    { key: LL_STATUS.FIRST,    label: "Pre-Book (1st)", color: "#0A4A2E", disabled: !canPreBook && !isPreBookSelected },
    { key: LL_STATUS.PREBOOK,  label: "Pre-Book",       color: "#1A6B4A", disabled: !canPreBook && !isPreBookSelected },
    { key: LL_STATUS.LATER,    label: "Book Later",     color: "#6AAB7E", disabled: false },
    { key: LL_STATUS.DONTBOOK, label: "Don't Book",     color: "#C0392B", disabled: false },
  ];

  const currentOpt = options.find((o) => o.key === current);
  const btnStyle = current ? { background: currentOpt.color, borderColor: currentOpt.color, color: "#FFF" } : {};

  return (
    <div style={{ position: "relative", flexShrink: 0 }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} tabIndex={-1}>
      <button className="ll-menu-btn" style={btnStyle} onClick={() => setOpen((o) => !o)}>
        {current ? currentOpt.label : "— Set LL"} ▾
      </button>
      {open && (
        <div className="ll-menu-popup">
          {options.map(({ key, label, color, disabled }) => (
            <div
              key={key}
              className={`ll-menu-item${disabled ? " ll-menu-disabled" : ""}${current === key ? " ll-menu-active" : ""}`}
              onClick={() => {
                if (disabled) return;
                if (key === LL_STATUS.FIRST) {
                  RIDES.filter((r) => r.park === ride.park && r.id !== ride.id && prefs[r.id]?.llStatus === LL_STATUS.FIRST)
                    .forEach((r) => onLLStatus(r.id, LL_STATUS.PREBOOK));
                }
                onLLStatus(ride.id, current === key ? null : key);
                setOpen(false);
              }}
            >
              <span className="ll-menu-dot" style={{ background: color }} />
              {label}
              {current === key && <span className="ll-menu-check">✓</span>}
            </div>
          ))}
          {current && (
            <div className="ll-menu-item ll-menu-clear" onClick={() => { onLLStatus(ride.id, null); setOpen(false); }}>
              <span className="ll-menu-dot" style={{ background: "#CCC" }} />
              Clear
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rankings ──────────────────────────────────────────────────────────────────

function Rankings({ parkId, prefs, onRdConfirm, onLLStatus }) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState("overall");

  const park        = PARKS.find((p) => p.id === parkId);
  const rides       = RIDES.filter((r) => r.park === parkId);
  const activeRides = rides.filter((r) => !isClosed(r.id, prefs));
  const allVoted    = activeRides.length > 0 && activeRides.every((r) => totalVotes(r.id, prefs) === 9);

  const scored = activeRides
    .map((r) => ({ ...r, score: calcScore(r.id, prefs) }))
    .filter((r) => r.score !== 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const rdConfirmed  = prefs[`rdc_${parkId}`] ?? null;
  const rdNominees   = activeRides.filter((r) => prefs[r.id]?.rdNom);
  const multiPending = rdNominees.length > 1 && !rdConfirmed;

  const tier1Conflict = activeRides.filter(
    (r) => r.ll === "mp1" && r.id !== rdConfirmed && PEOPLE.some((p) => prefs[r.id]?.prefs?.[p.id] === "must")
  );

  const renderOverall = () => {
    const nonSkipped = activeRides.filter((r) => prefs[r.id]?.llStatus !== LL_STATUS.DONTBOOK && prefs[r.id]?.llStatus !== LL_STATUS.LATER && r.id !== rdConfirmed);
    const topT1 = nonSkipped.filter((r) => r.ll === "mp1").map((r) => ({ ...r, score: calcScore(r.id, prefs) })).sort((a, b) => b.score - a.score)[0];
    const topT2 = nonSkipped.filter((r) => r.ll === "mp2").map((r) => ({ ...r, score: calcScore(r.id, prefs) })).sort((a, b) => b.score - a.score).slice(0, 2);
    const illRides = nonSkipped.filter((r) => r.ll === "ill");
    const llIndicatorIds = new Set([...(topT1 ? [topT1.id] : []), ...topT2.map((r) => r.id), ...illRides.map((r) => r.id)]);

    return scored.slice(0, 10).map((r, i) => {
      const isConfRD = rdConfirmed === r.id;
      const isRDNom  = prefs[r.id]?.rdNom && !isConfRD;
      const showLL   = llIndicatorIds.has(r.id) && !isConfRD;
      const pill =
        r.ll === "ill" ? <span className="r-pill b-ill">ILL</span> :
        r.ll === "mp1" ? <span className="r-pill b-mp1">T1</span>  :
        r.ll === "mp2" ? <span className="r-pill b-mp2">T2</span>  : null;
      return (
        <div className="r-item" key={r.id}>
          <span className="r-num">{i + 1}</span>
          <span className={`score-badge ${scoreColorClass(r.score)}`} style={{marginRight:'2px'}}>{r.score > 0 ? "+" : ""}{r.score}</span>
          <span className="r-name">{r.displayName}</span>
          {isConfRD && <span className="r-pill rd-tag">RD ✓</span>}
          {isRDNom  && <span className="r-pill rd-tag">RD?</span>}
          {showLL && pill}
          {showLL && <span className="r-pill ll-tag">Book LL</span>}
        </div>
      );
    });
  };

  const renderRankItem = (r, num) => {
    const llStatus  = prefs[r.id]?.llStatus ?? null;
    const isDemoted = llStatus === LL_STATUS.DONTBOOK || llStatus === LL_STATUS.LATER;
    const sellout   = SELLOUT[r.id];
    const urgStyle  = sellout ? URGENCY_COLOR[sellout.urgency] : null;
    return (
      <div className={`r-item${isDemoted ? " r-skipped" : ""}`} key={r.id}>
        <span className="r-num">{isDemoted ? "—" : num}</span>
        <span className={`score-badge ${scoreColorClass(r.score)}`} style={isDemoted?{opacity:0.4}:{}}>{r.score > 0 ? "+" : ""}{r.score}</span>
        <span className={`r-name${isDemoted ? " r-name-skip" : ""}`}>
          {r.displayName}
          {r.illPrice ? <span className="ill-price">({r.illPrice})</span> : null}
          {sellout && !isDemoted && (
            <span className="sellout-badge" style={{background:urgStyle.bg, color:urgStyle.color, border:`1px solid ${urgStyle.border}`}}>
              {sellout.urgency !== "green" ? "⏱ " : ""}{sellout.time}
            </span>
          )}
        </span>
        <LLStatusMenu ride={r} prefs={prefs} parkId={parkId} onLLStatus={onLLStatus} />
      </div>
    );
  };

  const renderLL = () => {
    const llRides  = activeRides.filter((r) => r.ll !== "noll" && r.id !== rdConfirmed);
    const llScored = llRides.map((r) => ({ ...r, score: calcScore(r.id, prefs) })).filter((r) => r.score !== 0).sort((a, b) => b.score - a.score);

    return (
      <>
        {rdNominees.length > 0 && (
          <div>
            <div className="tier-lbl">Rope Drop Candidate</div>
            {multiPending && <div className="rd-pend">Select one to confirm your Rope Drop ride ↓</div>}
            {(rdConfirmed ? rdNominees.filter((r) => r.id === rdConfirmed) : rdNominees).map((r) => {
              const isConf = rdConfirmed === r.id;
              const s = calcScore(r.id, prefs);
              return (
                <div className="r-item" key={r.id}>
                  <div className={`rd-chk${isConf ? " on" : ""}`} onClick={() => onRdConfirm(parkId, r.id)}>{isConf ? "✓" : ""}</div>
                  <span className="r-name">{r.displayName}</span>
                  <span className={`score-badge ${scoreColorClass(s)}`}>{s > 0 ? "+" : ""}{s}</span>
                </div>
              );
            })}
          </div>
        )}

        {tier1Conflict.length > 1 && (
          <div className="conflict">⚠ Only one Tier 1 can be Pre-Booked.</div>
        )}

        {[
          { key: "mp1", label: "Multipass Tier 1" },
          { key: "mp2", label: "Multipass Tier 2" },
          { key: "ill", label: "Individual Lightning Lane" },
        ].map(({ key, label }) => {
          const group = key === "ill"
            ? activeRides.filter((r) => r.ll === "ill" && r.id !== rdConfirmed).map((r) => ({ ...r, score: calcScore(r.id, prefs) })).filter((r) => r.score !== 0).sort((a, b) => b.score - a.score)
            : llScored.filter((r) => r.ll === key);

          const undecided = group.filter((r) => !prefs[r.id]?.llStatus);
          const prebooked = group.filter((r) => prefs[r.id]?.llStatus === LL_STATUS.PREBOOK || prefs[r.id]?.llStatus === LL_STATUS.FIRST);
          const demoted   = group.filter((r) => prefs[r.id]?.llStatus === LL_STATUS.LATER || prefs[r.id]?.llStatus === LL_STATUS.DONTBOOK);
          const topSlots  = [...undecided, ...prebooked].slice(0, key === "ill" ? 10 : 4);
          const display   = [...topSlots, ...demoted];
          if (!display.length) return null;

          let activeNum = 0;
          return (
            <div key={key}>
              <div className="tier-lbl">{label}</div>
              {display.map((r) => {
                const status  = prefs[r.id]?.llStatus ?? null;
                const isDemoted = status === LL_STATUS.LATER || status === LL_STATUS.DONTBOOK;
                if (!isDemoted) activeNum++;
                return renderRankItem(r, isDemoted ? null : activeNum);
              })}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="rank-sec">
      <div className="rank-hdr" onClick={() => setOpen((o) => !o)}>
        <span className="rank-title">Priority Ranking{allVoted ? " — All Voted" : ""}</span>
        <span className={`chev${open ? " open" : ""}`}>▼</span>
      </div>
      {open && (
        <div>
          <div className="tog-row">
            <button className={`tog-btn${mode === "overall" ? " on" : ""}`} style={mode === "overall" ? { background: park.color, color: "#FFF", borderColor: park.color } : {}} onClick={() => setMode("overall")}>Overall Top 10</button>
            <button className={`tog-btn${mode === "ll" ? " on" : ""}`} style={mode === "ll" ? { background: park.color, color: "#FFF", borderColor: park.color } : {}} onClick={() => setMode("ll")}>LL Ranking</button>
          </div>
          <div className="rank-body">{mode === "overall" ? renderOverall() : renderLL()}</div>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activePark, setActivePark] = useState("mk");
  const [prefs, setPrefs]           = useState(() => loadStorage());
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState({});
  const [syncError, setSyncError]   = useState(null);

  useEffect(() => {
    fetchAllVotes()
      .then((notionData) => {
        setPrefs((local) => {
          const merged = { ...local };
          Object.entries(notionData).forEach(([key, data]) => {
            if (key.startsWith("rdc_")) { merged[key] = data; }
            else {
              merged[key] = { ...local[key], ...data, prefs: { ...(local[key]?.prefs ?? {}), ...(data.prefs ?? {}) }, pageIds: { ...(local[key]?.pageIds ?? {}), ...(data.pageIds ?? {}) } };
            }
          });
          saveStorage(merged);
          return merged;
        });
      })
      .catch(() => setSyncError("Could not load from server — showing local data."))
      .finally(() => setLoading(false));
  }, []);

  const handlePref = useCallback(async (rideId, pid, pref) => {
    const ride    = RIDES.find((r) => r.id === rideId);
    const syncKey = `${rideId}_${pid}`;
    setPrefs((prev) => {
      const curPref = prev[rideId]?.prefs?.[pid] ?? null;
      const newPref = curPref === pref ? null : pref;
      const next = { ...prev, [rideId]: { ...prev[rideId], prefs: { ...(prev[rideId]?.prefs ?? {}), [pid]: newPref } } };
      if (!newPref) delete next[rideId].prefs[pid];
      saveStorage(next);
      return next;
    });
    setSyncing((s) => ({ ...s, [syncKey]: true }));
    setSyncError(null);
    try {
      const existingPageId = prefs[rideId]?.pageIds?.[pid];
      if (existingPageId) await deleteVoteFromNotion(existingPageId);
      const curPref = prefs[rideId]?.prefs?.[pid] ?? null;
      if (curPref !== pref) {
        const pageId = await saveVoteToNotion(rideId, ride.displayName, ride.park, pid, pref);
        setPrefs((prev) => { const next = { ...prev, [rideId]: { ...prev[rideId], pageIds: { ...(prev[rideId]?.pageIds ?? {}), [pid]: pageId } } }; saveStorage(next); return next; });
      } else {
        setPrefs((prev) => { const next = { ...prev }; if (next[rideId]?.pageIds) delete next[rideId].pageIds[pid]; saveStorage(next); return next; });
      }
    } catch (_) { setSyncError("Vote saved locally but could not sync to server."); }
    finally { setSyncing((s) => { const n = { ...s }; delete n[syncKey]; return n; }); }
  }, [prefs]);

  const handleNotes = useCallback((rideId, val) => {
    setPrefs((prev) => {
      const next = { ...prev, [rideId]: { ...prev[rideId], notes: val } };
      saveStorage(next);
      const ride = RIDES.find((r) => r.id === rideId);
      saveMetaToNotion(rideId, ride?.displayName, ride?.park, next[rideId], next[`rdc_${ride?.park}`]);
      return next;
    });
  }, []);

  const handleClosed = useCallback((rideId) => {
    setPrefs((prev) => {
      const cur  = isClosed(rideId, prev);
      const park = RIDES.find((r) => r.id === rideId)?.park;
      const next = { ...prev, [rideId]: { ...prev[rideId], closed: !cur } };
      if (!cur) { next[rideId].rdNom = false; if (next[`rdc_${park}`] === rideId) next[`rdc_${park}`] = null; }
      saveStorage(next);
      const ride = RIDES.find((r) => r.id === rideId);
      saveMetaToNotion(rideId, ride?.displayName, park, next[rideId], next[`rdc_${park}`]);
      return next;
    });
  }, []);

  const handleRdNom = useCallback((rideId) => {
    setPrefs((prev) => {
      const wasNom = prev[rideId]?.rdNom ?? false;
      const park   = RIDES.find((r) => r.id === rideId)?.park;
      const next   = { ...prev, [rideId]: { ...prev[rideId], rdNom: !wasNom } };
      if (wasNom && next[`rdc_${park}`] === rideId) next[`rdc_${park}`] = null;
      saveStorage(next);
      const ride = RIDES.find((r) => r.id === rideId);
      saveMetaToNotion(rideId, ride?.displayName, park, next[rideId], next[`rdc_${park}`]);
      return next;
    });
  }, []);

  const handleRdConfirm = useCallback((parkId, rideId) => {
    setPrefs((prev) => {
      const cur  = prev[`rdc_${parkId}`] ?? null;
      const next = { ...prev, [`rdc_${parkId}`]: cur === rideId ? null : rideId };
      saveStorage(next);
      const nominees = RIDES.filter((r) => r.park === parkId && prev[r.id]?.rdNom);
      nominees.forEach((r) => saveMetaToNotion(r.id, r.displayName, parkId, next[r.id] ?? {}, next[`rdc_${parkId}`]));
      return next;
    });
  }, []);

  const handleLLStatus = useCallback((rideId, status) => {
    setPrefs((prev) => {
      const cur  = prev[rideId]?.llStatus ?? null;
      const next = { ...prev, [rideId]: { ...prev[rideId], llStatus: cur === status ? null : status } };
      saveStorage(next);
      const ride = RIDES.find((r) => r.id === rideId);
      saveMetaToNotion(rideId, ride?.displayName, ride?.park, next[rideId], next[`rdc_${ride?.park}`]);
      return next;
    });
  }, []);

  const parkRides = RIDES.filter((r) => r.park === activePark);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FBF7F2; font-family: Georgia, serif; }
        .app { max-width: 480px; margin: 0 auto; padding: 20px 16px 60px; }
        .header { margin-bottom: 20px; }
        .header h1 { font-size: 22px; font-weight: normal; color: #1A1A1A; letter-spacing: -0.02em; margin-bottom: 4px; }
        .header p  { font-size: 11px; color: #AAA; font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase; }
        .sync-status  { font-size: 10px; font-family: monospace; padding: 6px 10px; border-radius: 8px; margin-bottom: 14px; }
        .sync-loading { background: #E3F2FD; color: #0D47A1; }
        .sync-error   { background: #FFF8E1; color: #E65100; }
        .park-tabs { display: flex; gap: 6px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
        .park-tab  { flex-shrink: 0; padding: 7px 14px; border-radius: 20px; border: none; font-family: monospace; font-size: 11px; cursor: pointer; transition: all 0.15s; }
        .park-tab.active   { color: #FFF; }
        .park-tab.inactive { background: #EDE8E1; color: #1A1A1A; }
        .ride-card { background: #FFF; border-radius: 14px; border: 1px solid #EDE8E1; margin-bottom: 10px; overflow: hidden; transition: all 0.2s; }
        .ride-card.card-closed { background: #EEECEA; border-color: #D8D4CD; }
        .ride-header { padding: 12px 16px 10px; border-bottom: 1px solid #F5F0EA; }
        .card-closed .ride-header { border-color: #D8D4CD; }
        .name-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
        .ride-name { font-size: 14px; color: #1A1A1A; flex: 1; line-height: 1.3; }
        .ride-name a { color: #1A1A1A; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
        .card-closed .ride-name a { color: #999; }
        .ride-meta { font-size: 10px; color: #AAA; font-family: monospace; margin-bottom: 6px; }
        .ride-meta.meta-closed { color: #B71C1C; font-weight: bold; }
        .controls-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
        .btn-sm { font-size: 9px; font-family: monospace; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; font-weight: bold; border: 1px solid #BDBDBD; background: #F5F5F5; color: #1A1A1A; cursor: pointer; }
        .rd-btn { font-size: 9px; font-family: monospace; padding: 3px 10px; border-radius: 10px; text-transform: uppercase; font-weight: bold; border: 1.5px solid #C8C0B6; background: #F0EBE3; color: #1A1A1A; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .rd-btn.on { background: #1A6B4A; border-color: #1A6B4A; color: #FFF; }
        .score-badge { font-size: 11px; font-family: monospace; font-weight: bold; padding: 2px 7px; border-radius: 10px; flex-shrink: 0; }
        .score-hi { background: #E8F5E9; color: #1B5E20; }
        .score-md { background: #E3F2FD; color: #0D47A1; }
        .score-lo { background: #F5F5F5; color: #424242; }
        .score-ng { background: #FFEBEE; color: #B71C1C; }
        .prog { height: 3px; background: #EDE8E1; border-radius: 2px; margin-top: 4px; }
        .prog-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .prefs { padding: 10px 16px 6px; border-bottom: 1px solid #F5F0EA; }
        .prefs.section-closed { opacity: 0.4; pointer-events: none; background: #EEECEA; }
        .fam-blk { margin-bottom: 8px; }
        .fam-lbl { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #AAA; font-family: monospace; margin-bottom: 6px; }
        .p-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .p-lbl { font-size: 11px; font-family: monospace; color: #1A1A1A; width: 18px; flex-shrink: 0; font-weight: bold; position: relative; }
        .sync-dot { font-size: 10px; color: #2C5F8A; margin-left: 1px; }
        .pref-btns { display: flex; gap: 3px; flex: 1; }
        .pb { flex: 1; padding: 6px 2px; border-radius: 6px; border: 1.5px solid #C8C0B6; background: #F0EBE3; font-size: 8px; font-family: monospace; cursor: pointer; color: #1A1A1A; text-align: center; white-space: nowrap; font-weight: bold; transition: all 0.12s; }
        .pb:hover:not(:disabled) { border-color: #999; background: #E5DED5; }
        .pb:disabled { opacity: 0.6; cursor: wait; }
        .pb.sel-must    { background: #1A6B4A !important; border-color: #1A6B4A !important; color: #FFF !important; }
        .pb.sel-like    { background: #6AAB7E !important; border-color: #6AAB7E !important; color: #FFF !important; }
        .pb.sel-neutral { background: #888    !important; border-color: #888    !important; color: #FFF !important; }
        .pb.sel-skip    { background: #C0392B !important; border-color: #C0392B !important; color: #FFF !important; }
        .notes-sec { padding: 8px 16px 10px; }
        .notes-sec.section-closed { opacity: 0.4; pointer-events: none; background: #EEECEA; }
        .notes-inp { width: 100%; border: 1.5px solid #D0CBC2; border-radius: 8px; padding: 7px 10px; font-size: 12px; font-family: Georgia, serif; color: #1A1A1A; resize: none; background: #FBF7F2; min-height: 44px; }
        .notes-inp:focus { outline: none; border-color: #AAA; }
        .rank-sec { margin-top: 24px; background: #FFF; border-radius: 14px; border: 1px solid #EDE8E1; overflow: hidden; }
        .rank-hdr { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #F5F0EA; }
        .rank-title { font-size: 14px; color: #1A1A1A; font-family: Georgia, serif; }
        .chev { font-size: 11px; color: #AAA; transition: transform 0.2s; display: inline-block; }
        .chev.open { transform: rotate(180deg); }
        .tog-row { display: flex; gap: 6px; padding: 10px 16px; border-bottom: 1px solid #F5F0EA; }
        .tog-btn { flex: 1; padding: 6px; border-radius: 20px; border: 1.5px solid #C8C0B6; background: #F0EBE3; font-size: 10px; font-family: monospace; color: #1A1A1A; cursor: pointer; text-align: center; font-weight: bold; transition: all 0.12s; }
        .rank-body { padding: 10px 16px 12px; }
        .tier-lbl { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #AAA; font-family: monospace; margin: 12px 0 6px; }
        .tier-lbl:first-child { margin-top: 0; }
        .r-item { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #FAFAF8; border-radius: 10px; border: 1px solid #EDE8E1; margin-bottom: 5px; }
        .r-item.r-skipped { background: #F5F3F0; border-color: #E8E3DC; opacity: 0.65; }
        .r-num  { font-size: 10px; font-family: monospace; color: #CCC; width: 14px; flex-shrink: 0; }
        .r-name { flex: 1; font-size: 12px; color: #1A1A1A; line-height: 1.3; }
        .r-name-skip { text-decoration: line-through; color: #AAA; }
        .ill-price { font-size: 9px; color: #BF360C; margin-left: 4px; font-family: monospace; }
        .sellout-badge { display: inline-block; font-size: 8px; font-family: monospace; font-weight: bold; padding: 1px 5px; border-radius: 8px; margin-left: 4px; white-space: nowrap; }
        .r-pill { font-size: 9px; font-family: monospace; padding: 1px 5px; border-radius: 8px; font-weight: bold; flex-shrink: 0; pointer-events: none; }
        .b-ill  { background: #FFF3E0; color: #BF360C; border: 1px solid #FFCC80; }
        .b-mp1  { background: #E8F5E9; color: #1B5E20; border: 1px solid #A5D6A7; }
        .b-mp2  { background: #E3F2FD; color: #0D47A1; border: 1px solid #90CAF9; }
        .rd-tag { background: #F1F8F4; color: #1A6B4A; border: 1px solid #A5D6A7; }
        .ll-tag { background: #FFF3E0; color: #BF360C; border: 1px solid #FFCC80; }
        .rd-chk { width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid #C8C0B6; background: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 11px; transition: all 0.12s; }
        .rd-chk.on { background: #1A6B4A; border-color: #1A6B4A; color: #FFF; }
        .conflict { background: #FFF8E1; border: 1px solid #FFE082; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 11px; color: #E65100; font-family: monospace; line-height: 1.5; }
        .rd-pend  { background: #F1F8F4; border: 1px solid #A5D6A7; border-radius: 8px; padding: 7px 10px; margin-bottom: 6px; font-size: 11px; color: #2E7D32; font-family: monospace; }
        .ll-menu-btn { font-size: 9px; font-family: monospace; font-weight: bold; padding: 3px 8px; border-radius: 10px; border: 1.5px solid #C8C0B6; background: #F0EBE3; color: #1A1A1A; cursor: pointer; white-space: nowrap; transition: all 0.12s; }
        .ll-menu-btn:hover { border-color: #999; }
        .ll-menu-popup { position: absolute; right: 0; top: 28px; background: #FFF; border: 1px solid #EDE8E1; border-radius: 10px; overflow: hidden; width: 140px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
        .ll-menu-item { padding: 8px 12px; font-size: 11px; font-family: monospace; color: #1A1A1A; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .ll-menu-item:hover { background: #F5F2EE; }
        .ll-menu-item.ll-menu-disabled { opacity: 0.35; cursor: not-allowed; }
        .ll-menu-item.ll-menu-active { background: #F1F8F4; }
        .ll-menu-item.ll-menu-clear { border-top: 1px solid #EDE8E1; color: #AAA; }
        .ll-menu-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ll-menu-check { margin-left: auto; color: #1A6B4A; font-size: 11px; }
      `}</style>
      <div className="app">
        <div className="header">
          <h1>Ride Selection for May 2026</h1>
          <p>Disney World · May 2026</p>
        </div>
        {loading && <div className="sync-status sync-loading">Loading votes from server…</div>}
        {syncError && <div className="sync-status sync-error">{syncError}</div>}
        <div className="park-tabs">
          {PARKS.map((p) => (
            <button key={p.id} className={`park-tab ${p.id === activePark ? "active" : "inactive"}`} style={p.id === activePark ? { background: p.color } : {}} onClick={() => setActivePark(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        {parkRides.map((ride) => (
          <RideCard key={ride.id} ride={ride} prefs={prefs} onPref={handlePref} onNotes={handleNotes} onClosed={handleClosed} onRdNom={handleRdNom} syncing={syncing} />
        ))}
        <Rankings parkId={activePark} prefs={prefs} onRdConfirm={handleRdConfirm} onLLStatus={handleLLStatus} />
      </div>
    </>
  );
}