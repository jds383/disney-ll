import { useState, useEffect, useCallback } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const PEOPLE = [
  { id: "J", kid: false, family: 1 },
  { id: "A", kid: false, family: 1 },
  { id: "w", kid: true,  family: 1 },
  { id: "r", kid: true,  family: 1 },
  { id: "T", kid: false, family: 2 },
  { id: "B", kid: false, family: 2 },
  { id: "t", kid: true,  family: 2 },
  { id: "q", kid: true,  family: 2 },
  { id: "b", kid: true,  family: 2 },
];
const FAMILY1 = PEOPLE.filter((p) => p.family === 1).map((p) => p.id);
const FAMILY2 = PEOPLE.filter((p) => p.family === 2).map((p) => p.id);

const PREF_SCORES = { must: 5, like: 2, neutral: 0, skip: -1 };
const PREF_KEYS   = ["must", "like", "neutral", "skip"];
const PREF_SHORT  = { must: "Must", like: "Like", neutral: "Neu", skip: "Skip" };

const PARKS = [
  { id: "mk", name: "Magic Kingdom",    color: "#2C5F8A" },
  { id: "ep", name: "EPCOT",            color: "#4A2C6B" },
  { id: "hs", name: "Hollywood Studios", color: "#8A3A2C" },
];
const PARK_LABEL = { mk: "Magic Kingdom", ep: "EPCOT", hs: "Hollywood Studios" };

function toDisplayName(raw) {
  return raw.replace(/^(The|A|An) /i, (_, p) => `(${p}) `);
}
function sortKey(name) {
  return name.replace(/^\((?:The|A|An)\)\s*/i, "").toLowerCase();
}

const RAW_RIDES = [
  { id:"hs7b", park:"hs", name:"Alien Swirling Saucers",                          type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/alien-swirling-saucers/" },
  { id:"mk12", park:"mk", name:"Astro Orbiter",                                    type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/astro-orbiter/" },
  { id:"ep9",  park:"ep", name:"Awesome Planet",                                   type:"Film", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/awesome-planet/" },
  { id:"hs8",  park:"hs", name:"Beauty and the Beast Live on Stage",               type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/beauty-and-the-beast-live-on-stage/" },
  { id:"mk18", park:"mk", name:"Big Thunder Mountain Railroad",                    type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/big-thunder-mountain-railroad/" },
  { id:"mk12b",park:"mk", name:"Buzz Lightyear's Space Ranger Spin",               type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/buzz-lightyear-space-ranger-spin/" },
  { id:"ep13", park:"ep", name:"Disney and Pixar Short Film Festival",             type:"Film", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/disney-pixar-short-film-festival/" },
  { id:"mk7b", park:"mk", name:"Dumbo the Flying Elephant",                        type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/dumbo-the-flying-elephant/" },
  { id:"hs12", park:"hs", name:"For the First Time in Forever: A Frozen Sing-Along", type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/frozen-sing-along-celebration/" },
  { id:"ep10", park:"ep", name:"Frozen Ever After",                                type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/frozen-ever-after/" },
  { id:"ep12", park:"ep", name:"Gran Fiesta Tour Starring The Three Caballeros",   type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/epcot/gran-fiesta-tour-starring-the-three-caballeros/" },
  { id:"ep1",  park:"ep", name:"Guardians of the Galaxy: Cosmic Rewind",           type:"Ride", ll:"ill", url:"https://disneyworld.disney.go.com/attractions/epcot/guardians-of-the-galaxy-cosmic-rewind/" },
  { id:"mk23", park:"mk", name:"Haunted Mansion",                                  type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/haunted-mansion/" },
  { id:"hs10", park:"hs", name:"Indiana Jones Epic Stunt Spectacular",             type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/indiana-jones-epic-stunt-spectacular/" },
  { id:"mk3",  park:"mk", name:"It's a Small World",                               type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/its-a-small-world/" },
  { id:"ep14", park:"ep", name:"Journey into Imagination with Figment",            type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/journey-into-imagination-with-figment/" },
  { id:"mk20", park:"mk", name:"Jungle Cruise",                                    type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/jungle-cruise/" },
  { id:"hs13", park:"hs", name:"The Little Mermaid – A Musical Adventure",         type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/entertainment/hollywood-studios/little-mermaid-musical-adventure/" },
  { id:"ep6",  park:"ep", name:"Living with the Land",                             type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/living-with-the-land/" },
  { id:"mk6",  park:"mk", name:"Mad Tea Party",                                    type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/mad-tea-party/" },
  { id:"mk21", park:"mk", name:"The Magic Carpets of Aladdin",                     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/magic-carpets-of-aladdin/" },
  { id:"mk8",  park:"mk", name:"The Many Adventures of Winnie the Pooh",           type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/many-adventures-of-winnie-the-pooh/" },
  { id:"hs11", park:"hs", name:"Mickey & Minnie's Runaway Railway",                type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/mickey-minnies-runaway-railway/" },
  { id:"mk9",  park:"mk", name:"Mickey's PhilharMagic",                            type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/mickeys-philharmagic/" },
  { id:"hs2",  park:"hs", name:"Millennium Falcon: Smugglers Run",                 type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/millennium-falcon-smugglers-run/" },
  { id:"ep3",  park:"ep", name:"Mission: SPACE",                                   type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/mission-space/" },
  { id:"mk17", park:"mk", name:"Monsters Inc. Laugh Floor",                        type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/monsters-inc-laugh-floor/" },
  { id:"mk2",  park:"mk", name:"Peter Pan's Flight",                               type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/peter-pan-flight/" },
  { id:"mk22", park:"mk", name:"Pirates of the Caribbean",                         type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/pirates-of-the-caribbean/" },
  { id:"mk5",  park:"mk", name:"Prince Charming Regal Carrousel",                  type:"Ride", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/cinderella-golden-carrousel/" },
  { id:"ep11", park:"ep", name:"Remy's Ratatouille Adventure",                     type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/remys-ratatouille-adventure/" },
  { id:"hs6",  park:"hs", name:"Rock 'n' Roller Coaster Starring The Muppets",     type:"Ride", ll:"mp1", closed:true, url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/rock-and-roller-coaster-starring-muppets/" },
  { id:"ep7",  park:"ep", name:"The Seas with Nemo & Friends",                     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/seas-with-nemo-and-friends/" },
  { id:"mk1",  park:"mk", name:"Seven Dwarfs Mine Train",                          type:"Ride", ll:"ill", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/seven-dwarfs-mine-train/" },
  { id:"hs3",  park:"hs", name:"Slinky Dog Dash",                                  type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/slinky-dog-dash/" },
  { id:"ep5",  park:"ep", name:"Soarin' Around the World",                         type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/soarin-around-world/" },
  { id:"mk11", park:"mk", name:"Space Mountain",                                   type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/space-mountain/" },
  { id:"ep4",  park:"ep", name:"Spaceship Earth",                                  type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/spaceship-earth/" },
  { id:"hs9",  park:"hs", name:"Star Tours – The Adventures Continue",             type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/star-tours/" },
  { id:"hs1",  park:"hs", name:"Star Wars: Rise of the Resistance",                type:"Ride", ll:"ill", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/star-wars-rise-of-the-resistance/" },
  { id:"ep2",  park:"ep", name:"Test Track",                                       type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/epcot/test-track/" },
  { id:"mk19", park:"mk", name:"Tiana's Bayou Adventure",                          type:"Ride", ll:"mp1", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tianas-bayou-adventure/" },
  { id:"mk16", park:"mk", name:"Tomorrowland Speedway",                            type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tomorrowland-speedway/" },
  { id:"mk15", park:"mk", name:"Tomorrowland Transit Authority PeopleMover",       type:"Tour", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tomorrowland-transit-authority-peoplemover/" },
  { id:"hs4",  park:"hs", name:"Toy Story Mania!",                                 type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/toy-story-mania/" },
  { id:"mk10", park:"mk", name:"TRON Lightcycle / Run",                            type:"Ride", ll:"ill", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/tron-lightcycle-run/" },
  { id:"hs7",  park:"hs", name:"The Twilight Zone Tower of Terror",                type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/hollywood-studios/twilight-zone-tower-of-terror/" },
  { id:"ep8",  park:"ep", name:"Turtle Talk with Crush",                           type:"Show", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/epcot/turtle-talk-with-crush/" },
  { id:"mk4",  park:"mk", name:"Under the Sea: Journey of the Little Mermaid",     type:"Ride", ll:"mp2", url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/under-the-sea-journey-of-the-little-mermaid/" },
  { id:"mk14", park:"mk", name:"Walt Disney's Carousel of Progress",               type:"Show", ll:"noll",url:"https://disneyworld.disney.go.com/attractions/magic-kingdom/walt-disneys-carousel-of-progress/" },
];

const RIDES = RAW_RIDES
  .map((r) => ({ ...r, displayName: toDisplayName(r.name) }))
  .sort((a, b) => sortKey(a.displayName).localeCompare(sortKey(b.displayName)));

// ── Storage helpers ───────────────────────────────────────────────────────────

const LS_KEY = "dw2026-ll-v5";

function loadStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}
function saveStorage(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

// ── Score helpers ─────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function LLBadge({ ll, closed }) {
  if (closed) return <span className="badge b-closed">Closed</span>;
  if (ll === "ill")  return <span className="badge b-ill">Individual LL</span>;
  if (ll === "mp1")  return <span className="badge b-mp1">Multipass Tier 1</span>;
  if (ll === "mp2")  return <span className="badge b-mp2">Multipass Tier 2</span>;
  return <span className="badge b-noll">No LL</span>;
}

function RideCard({ ride, prefs, onPref, onNotes, onClosed, onRdNom }) {
  const score   = calcScore(ride.id, prefs);
  const votes   = totalVotes(ride.id, prefs);
  const closed  = prefs[ride.id]?.closed ?? ride.closed ?? false;
  const rdNom   = prefs[ride.id]?.rdNom ?? false;
  const pct     = Math.round((votes / 9) * 100);
  const notes   = prefs[ride.id]?.notes ?? "";

  const renderFamily = (members) =>
    members.map((pid) => {
      const cur = prefs[ride.id]?.prefs?.[pid] ?? null;
      return (
        <div className="p-row" key={pid}>
          <span className="p-lbl">{pid}</span>
          <div className="pref-btns">
            {PREF_KEYS.map((k) => (
              <button
                key={k}
                className={`pb${cur === k ? ` sel-${k}` : ""}`}
                onClick={() => onPref(ride.id, pid, k)}
              >
                {PREF_SHORT[k]}
              </button>
            ))}
          </div>
        </div>
      );
    });

  return (
    <div className="ride-card">
      <div className="ride-header">
        <div className="name-row">
          <span className="ride-name">
            <a href={ride.url} target="_blank" rel="noreferrer">
              {ride.displayName} ↗
            </a>
          </span>
          <span className={`score-badge ${scoreColorClass(score)}`}>
            {score > 0 ? "+" : ""}{score}
          </span>
        </div>
        <div className="ride-meta">{PARK_LABEL[ride.park]}</div>
        <div className="controls-row">
          <div className="badge-grp">
            <LLBadge ll={ride.ll} closed={closed} />
            {ride.type !== "Ride" && <span className="badge b-type">{ride.type}</span>}
            <button className="btn-sm" onClick={() => onClosed(ride.id)}>
              {closed ? "Mark Open" : "Mark Closed"}
            </button>
          </div>
          <button
            className={`rd-btn${rdNom ? " on" : ""}`}
            onClick={() => onRdNom(ride.id)}
          >
            🌅 Rope Drop
          </button>
        </div>
        <div className="prog">
          <div
            className="prog-fill"
            style={{ width: `${pct}%`, background: pct === 100 ? "#1A6B4A" : "#2C5F8A" }}
          />
        </div>
      </div>
      <div className="prefs">
        <div className="fam-blk">
          <div className="fam-lbl">S Family</div>
          {renderFamily(FAMILY1)}
        </div>
        <div className="fam-blk">
          <div className="fam-lbl">M Family</div>
          {renderFamily(FAMILY2)}
        </div>
      </div>
      <div className="notes-sec">
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

function Rankings({ parkId, prefs, onRdConfirm }) {
  const [open, setOpen]   = useState(true);
  const [mode, setMode]   = useState("overall");

  const park  = PARKS.find((p) => p.id === parkId);
  const rides = RIDES.filter((r) => r.park === parkId);
  const allVoted = rides.every((r) => totalVotes(r.id, prefs) === 9);

  const scored = rides
    .map((r) => ({ ...r, score: calcScore(r.id, prefs) }))
    .filter((r) => r.score !== 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const rdConfirmed = prefs[`rdc_${parkId}`] ?? null;
  const rdNominees  = rides.filter((r) => prefs[r.id]?.rdNom);
  const multiPending = rdNominees.length > 1 && !rdConfirmed;

  const tier1Conflict = rides.filter(
    (r) =>
      r.ll === "mp1" &&
      !(prefs[r.id]?.closed ?? r.closed ?? false) &&
      r.id !== rdConfirmed &&
      PEOPLE.some((p) => prefs[r.id]?.prefs?.[p.id] === "must")
  );

  const renderOverall = () =>
    scored.slice(0, 6).map((r, i) => {
      const pill =
        r.ll === "ill" ? <span className="r-pill b-ill">ILL</span> :
        r.ll === "mp1" ? <span className="r-pill b-mp1">T1</span>  :
        r.ll === "mp2" ? <span className="r-pill b-mp2">T2</span>  : null;
      const rdTag = prefs[r.id]?.rdNom
        ? <span className="r-pill rd-tag">RD</span> : null;
      return (
        <div className="r-item" key={r.id}>
          <span className="r-num">{i + 1}</span>
          <span className="r-name">{r.displayName}</span>
          {rdTag}{pill}
          <span className={`score-badge ${scoreColorClass(r.score)}`}>
            {r.score > 0 ? "+" : ""}{r.score}
          </span>
        </div>
      );
    });

  const renderLL = () => {
    const confirmed = rdConfirmed;
    const llRides = rides.filter(
      (r) => r.ll !== "noll" && !(prefs[r.id]?.closed ?? r.closed ?? false) && r.id !== confirmed
    );
    const llScored = llRides
      .map((r) => ({ ...r, score: calcScore(r.id, prefs) }))
      .filter((r) => r.score !== 0)
      .sort((a, b) => b.score - a.score);

    return (
      <>
        {rdNominees.length > 0 && (
          <div>
            <div className="tier-lbl">Rope Drop</div>
            {multiPending && (
              <div className="rd-pend">Select one to confirm your Rope Drop ride ↓</div>
            )}
            {(confirmed ? rdNominees.filter((r) => r.id === confirmed) : rdNominees).map((r) => {
              const isConf = confirmed === r.id;
              const s = calcScore(r.id, prefs);
              return (
                <div className="r-item" key={r.id}>
                  <div
                    className={`rd-chk${isConf ? " on" : ""}`}
                    onClick={() => onRdConfirm(parkId, r.id)}
                  >
                    {isConf ? "✓" : ""}
                  </div>
                  <span className="r-name">{r.displayName}</span>
                  <span className={`score-badge ${scoreColorClass(s)}`}>
                    {s > 0 ? "+" : ""}{s}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {[
          { key: "ill", label: "Individual Lightning Lane" },
          { key: "mp1", label: "Multipass Tier 1" },
          { key: "mp2", label: "Multipass Tier 2" },
        ].map(({ key, label }) => {
          const group = llScored.filter((r) => r.ll === key).slice(0, 4);
          if (!group.length) return null;
          return (
            <div key={key}>
              <div className="tier-lbl">{label}</div>
              {group.map((r, i) => (
                <div className="r-item" key={r.id}>
                  <span className="r-num">{i + 1}</span>
                  <span className="r-name">{r.displayName}</span>
                  <span className={`score-badge ${scoreColorClass(r.score)}`}>
                    {r.score > 0 ? "+" : ""}{r.score}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="rank-sec">
      <div className="rank-hdr" onClick={() => setOpen((o) => !o)}>
        <span className="rank-title">
          Priority Ranking{allVoted ? " — All Voted" : ""}
        </span>
        <span className={`chev${open ? " open" : ""}`}>▼</span>
      </div>
      {open && (
        <div>
          <div className="tog-row">
            <button
              className={`tog-btn${mode === "overall" ? " on" : ""}`}
              style={mode === "overall" ? { background: park.color, color: "#FFF", borderColor: park.color } : {}}
              onClick={() => setMode("overall")}
            >
              Overall Top 6
            </button>
            <button
              className={`tog-btn${mode === "ll" ? " on" : ""}`}
              style={mode === "ll" ? { background: park.color, color: "#FFF", borderColor: park.color } : {}}
              onClick={() => setMode("ll")}
            >
              LL Ranking
            </button>
          </div>
          {tier1Conflict.length > 1 && (
            <div className="conflict">
              ⚠ Tier 1 conflict: {tier1Conflict.map((r) => r.displayName).join(" · ")} — only one Tier 1 can be booked initially.
            </div>
          )}
          <div className="rank-body">
            {mode === "overall" ? renderOverall() : renderLL()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activePark, setActivePark] = useState("mk");
  const [prefs, setPrefs] = useState(() => loadStorage());

  const persist = useCallback((next) => {
    setPrefs(next);
    saveStorage(next);
  }, []);

  const handlePref = useCallback((rideId, pid, pref) => {
    setPrefs((prev) => {
      const ride = { ...prev[rideId], prefs: { ...(prev[rideId]?.prefs ?? {}) } };
      ride.prefs[pid] = ride.prefs[pid] === pref ? null : pref;
      const next = { ...prev, [rideId]: ride };
      saveStorage(next);
      return next;
    });
  }, []);

  const handleNotes = useCallback((rideId, val) => {
    setPrefs((prev) => {
      const next = { ...prev, [rideId]: { ...prev[rideId], notes: val } };
      saveStorage(next);
      return next;
    });
  }, []);

  const handleClosed = useCallback((rideId) => {
    setPrefs((prev) => {
      const cur = prev[rideId]?.closed ?? RIDES.find((r) => r.id === rideId)?.closed ?? false;
      const next = { ...prev, [rideId]: { ...prev[rideId], closed: !cur } };
      saveStorage(next);
      return next;
    });
  }, []);

  const handleRdNom = useCallback((rideId) => {
    setPrefs((prev) => {
      const wasNom = prev[rideId]?.rdNom ?? false;
      const park   = RIDES.find((r) => r.id === rideId)?.park;
      const next   = { ...prev, [rideId]: { ...prev[rideId], rdNom: !wasNom } };
      // If removing nomination, also clear confirmed if it was this ride
      if (wasNom && next[`rdc_${park}`] === rideId) next[`rdc_${park}`] = null;
      saveStorage(next);
      return next;
    });
  }, []);

  const handleRdConfirm = useCallback((parkId, rideId) => {
    setPrefs((prev) => {
      const cur  = prev[`rdc_${parkId}`] ?? null;
      const next = { ...prev, [`rdc_${parkId}`]: cur === rideId ? null : rideId };
      saveStorage(next);
      return next;
    });
  }, []);

  const parkRides = RIDES.filter((r) => r.park === activePark);
  const park      = PARKS.find((p) => p.id === activePark);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FBF7F2; font-family: Georgia, serif; }
        .app { max-width: 480px; margin: 0 auto; padding: 20px 16px 60px; }
        .header { margin-bottom: 20px; }
        .header h1 { font-size: 22px; font-weight: normal; color: #1A1A1A; letter-spacing: -0.02em; margin-bottom: 4px; }
        .header p  { font-size: 11px; color: #AAA; font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase; }
        .park-tabs { display: flex; gap: 6px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
        .park-tab  { flex-shrink: 0; padding: 7px 14px; border-radius: 20px; border: none; font-family: monospace; font-size: 11px; cursor: pointer; transition: all 0.15s; }
        .park-tab.active   { color: #FFF; }
        .park-tab.inactive { background: #EDE8E1; color: #1A1A1A; }
        .ride-card   { background: #FFF; border-radius: 14px; border: 1px solid #EDE8E1; margin-bottom: 10px; overflow: hidden; }
        .ride-header { padding: 12px 16px 10px; border-bottom: 1px solid #F5F0EA; }
        .name-row    { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
        .ride-name   { font-size: 14px; color: #1A1A1A; flex: 1; line-height: 1.3; }
        .ride-name a { color: #1A1A1A; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
        .ride-meta   { font-size: 10px; color: #AAA; font-family: monospace; margin-bottom: 6px; }
        .controls-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
        .badge-grp   { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
        .badge       { font-size: 9px; font-family: monospace; padding: 2px 6px; border-radius: 10px; text-transform: uppercase; font-weight: bold; pointer-events: none; }
        .b-ill    { background: #FFF3E0; color: #BF360C; border: 1px solid #FFCC80; }
        .b-mp1    { background: #E8F5E9; color: #1B5E20; border: 1px solid #A5D6A7; }
        .b-mp2    { background: #E3F2FD; color: #0D47A1; border: 1px solid #90CAF9; }
        .b-noll   { background: #F5F5F5; color: #424242; border: 1px solid #BDBDBD; }
        .b-type   { background: #FAF0E6; color: #5D4037; border: 1px solid #D7CCC8; }
        .b-closed { background: #FFEBEE; color: #B71C1C; border: 1px solid #FFCDD2; }
        .btn-sm   { font-size: 9px; font-family: monospace; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; font-weight: bold; border: 1px solid #BDBDBD; background: #F5F5F5; color: #1A1A1A; cursor: pointer; }
        .rd-btn   { font-size: 9px; font-family: monospace; padding: 3px 10px; border-radius: 10px; text-transform: uppercase; font-weight: bold; border: 1.5px solid #C8C0B6; background: #F0EBE3; color: #1A1A1A; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .rd-btn.on { background: #1A6B4A; border-color: #1A6B4A; color: #FFF; }
        .score-badge { font-size: 11px; font-family: monospace; font-weight: bold; padding: 2px 7px; border-radius: 10px; flex-shrink: 0; }
        .score-hi { background: #E8F5E9; color: #1B5E20; }
        .score-md { background: #E3F2FD; color: #0D47A1; }
        .score-lo { background: #F5F5F5; color: #424242; }
        .score-ng { background: #FFEBEE; color: #B71C1C; }
        .prog      { height: 3px; background: #EDE8E1; border-radius: 2px; margin-top: 4px; }
        .prog-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .prefs     { padding: 10px 16px 6px; border-bottom: 1px solid #F5F0EA; }
        .fam-blk   { margin-bottom: 8px; }
        .fam-lbl   { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #AAA; font-family: monospace; margin-bottom: 6px; }
        .p-row     { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .p-lbl     { font-size: 11px; font-family: monospace; color: #1A1A1A; width: 14px; flex-shrink: 0; font-weight: bold; }
        .pref-btns { display: flex; gap: 3px; flex: 1; }
        .pb        { flex: 1; padding: 6px 2px; border-radius: 6px; border: 1.5px solid #C8C0B6; background: #F0EBE3; font-size: 9px; font-family: monospace; cursor: pointer; color: #1A1A1A; text-align: center; white-space: nowrap; font-weight: bold; transition: all 0.12s; }
        .pb:hover  { border-color: #999; background: #E5DED5; }
        .pb.sel-must    { background: #1A6B4A !important; border-color: #1A6B4A !important; color: #FFF !important; }
        .pb.sel-like    { background: #6AAB7E !important; border-color: #6AAB7E !important; color: #FFF !important; }
        .pb.sel-neutral { background: #888    !important; border-color: #888    !important; color: #FFF !important; }
        .pb.sel-skip    { background: #C0392B !important; border-color: #C0392B !important; color: #FFF !important; }
        .notes-sec { padding: 8px 16px 10px; }
        .notes-inp { width: 100%; border: 1.5px solid #D0CBC2; border-radius: 8px; padding: 7px 10px; font-size: 12px; font-family: Georgia, serif; color: #1A1A1A; resize: none; background: #FBF7F2; min-height: 44px; }
        .notes-inp:focus { outline: none; border-color: #AAA; }
        .rank-sec  { margin-top: 24px; background: #FFF; border-radius: 14px; border: 1px solid #EDE8E1; overflow: hidden; }
        .rank-hdr  { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #F5F0EA; }
        .rank-title { font-size: 14px; color: #1A1A1A; font-family: Georgia, serif; }
        .chev      { font-size: 11px; color: #AAA; transition: transform 0.2s; display: inline-block; }
        .chev.open { transform: rotate(180deg); }
        .tog-row   { display: flex; gap: 6px; padding: 10px 16px; border-bottom: 1px solid #F5F0EA; }
        .tog-btn   { flex: 1; padding: 6px; border-radius: 20px; border: 1.5px solid #C8C0B6; background: #F0EBE3; font-size: 10px; font-family: monospace; color: #1A1A1A; cursor: pointer; text-align: center; font-weight: bold; transition: all 0.12s; }
        .rank-body { padding: 10px 16px 12px; }
        .tier-lbl  { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #AAA; font-family: monospace; margin: 12px 0 6px; }
        .tier-lbl:first-child { margin-top: 0; }
        .r-item    { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #FAFAF8; border-radius: 10px; border: 1px solid #EDE8E1; margin-bottom: 5px; }
        .r-num     { font-size: 10px; font-family: monospace; color: #CCC; width: 16px; flex-shrink: 0; }
        .r-name    { flex: 1; font-size: 12px; color: #1A1A1A; line-height: 1.3; }
        .r-pill    { font-size: 9px; font-family: monospace; padding: 1px 5px; border-radius: 8px; font-weight: bold; flex-shrink: 0; pointer-events: none; }
        .rd-tag    { background: #F1F8F4; color: #1A6B4A; border: 1px solid #A5D6A7; }
        .rd-chk    { width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid #C8C0B6; background: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 11px; transition: all 0.12s; }
        .rd-chk.on { background: #1A6B4A; border-color: #1A6B4A; color: #FFF; }
        .conflict  { background: #FFF8E1; border-bottom: 1px solid #FFE082; padding: 8px 16px; font-size: 11px; color: #E65100; font-family: monospace; line-height: 1.5; }
        .rd-pend   { background: #F1F8F4; border: 1px solid #A5D6A7; border-radius: 8px; padding: 7px 10px; margin-bottom: 6px; font-size: 11px; color: #2E7D32; font-family: monospace; }
      `}</style>
      <div className="app">
        <div className="header">
          <h1>Lightning Lane Planner</h1>
          <p>Disney World · May 2026</p>
        </div>

        <div className="park-tabs">
          {PARKS.map((p) => (
            <button
              key={p.id}
              className={`park-tab ${p.id === activePark ? "active" : "inactive"}`}
              style={p.id === activePark ? { background: p.color } : {}}
              onClick={() => setActivePark(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {parkRides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            prefs={prefs}
            onPref={handlePref}
            onNotes={handleNotes}
            onClosed={handleClosed}
            onRdNom={handleRdNom}
          />
        ))}

        <Rankings
          parkId={activePark}
          prefs={prefs}
          onRdConfirm={handleRdConfirm}
        />
      </div>
    </>
  );
}
