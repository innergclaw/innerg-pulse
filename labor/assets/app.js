function arrowIcon() {
  const span = document.createElement("span");
  span.className = "arrow";
  span.setAttribute("aria-hidden", "true");
  span.textContent = "➜\uFE0E";
  return span;
}

const REGIONS = [
  ["global", "Global"],
  ["us", "US"],
  ["india", "India"],
  ["europe", "Europe"],
  ["uk", "UK"],
  ["apac", "Asia-Pacific"],
  ["row", "Rest of world"],
];
const EUROPE = new Set(["NL","DE","FR","IE","ES","IT","SE","NO","DK","FI","PL","PT","AT","BE","CH","CZ","GR","HU","RO","LU"]);
const APAC = new Set(["AU","NZ","JP","KR","SG","CN","HK","TW","MY","TH","ID","PH","VN"]);
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const state = { query: "", region: "global", sector: null, pane: "cuts", tick: 0, letter: null, shown: 40 };

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v != null && v !== false) node.setAttribute(k, String(v));
  }
  for (const child of children) node.append(child);
  return node;
};
const text = (tag, value, attrs) => {
  const node = el(tag, attrs);
  node.textContent = value;
  return node;
};
const num = (n) => n.toLocaleString("en-US");
const shortDate = (iso) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${months[Number(m) - 1]}`;
};
const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "source"; }
};
const mono = (name) => {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
const regionOf = (country) => {
  if (!country) return null;
  if (country === "US") return "us";
  if (country === "IN") return "india";
  if (country === "UK" || country === "GB") return "uk";
  if (EUROPE.has(country)) return "europe";
  if (APAC.has(country)) return "apac";
  return "row";
};
const inRegion = (country, region) => region === "global" || regionOf(country) === region;
const matches = (query, name, sector) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return name.toLowerCase().includes(q) || (sector?.toLowerCase().includes(q) ?? false);
};
const shortBar = (name) => ({ "Airlines & Travel": "Airlines", "Media & Entertainment": "Media", "Health & Pharma": "Health" }[name] || name);

function chip(label, pressed, onClick, count) {
  const btn = el("button", { type: "button", class: "chip", "aria-pressed": pressed ? "true" : "false", onclick: onClick });
  btn.textContent = count == null ? label : `${label} ${count}`;
  return btn;
}

function rowLink(href, mark, title, meta, people, extra) {
  const a = el("a", { href, target: "_blank", rel: "noopener noreferrer" }, [
    text("span", mark.text, { class: mark.class }),
    el("span", { class: "who" }, [text("strong", title), text("em", meta)]),
    people,
  ]);
  if (extra) a.append(extra);
  a.append(arrowIcon());
  return el("li", {}, [a]);
}

function render(data) {
  const { cuts, hires, snapshot, boards, boardsUpdated } = data;
  const q = state.query.trim();
  const filteredCuts = cuts.filter((c) => inRegion(c.country, state.region) && (state.sector == null || c.sector === state.sector) && matches(q, c.company, c.sector));
  const filteredHires = hires.filter((h) => (state.sector == null || h.sector === state.sector) && matches(q, h.company, h.sector));
  const counts = new Map(REGIONS.map(([id]) => [id, 0]));
  for (const c of cuts) {
    counts.set("global", counts.get("global") + 1);
    const r = regionOf(c.country);
    if (r) counts.set(r, counts.get(r) + 1);
  }
  const sectors = new Map();
  for (const c of cuts) {
    if (!c.sector || !inRegion(c.country, state.region)) continue;
    sectors.set(c.sector, (sectors.get(c.sector) ?? 0) + 1);
  }
  for (const h of hires) if (h.sector && !sectors.has(h.sector)) sectors.set(h.sector, 0);
  const sectorOptions = [...sectors.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const barsMap = new Map();
  for (const c of filteredCuts) {
    if (c.people == null) continue;
    const key = c.sector ?? "Unspecified";
    barsMap.set(key, (barsMap.get(key) ?? 0) + c.people);
  }
  const bars = [...barsMap.entries()].map(([name, people]) => ({ name, people })).sort((a, b) => b.people - a.people);
  const max = bars[0]?.people ?? 1;
  const ticker = [
    ...cuts.filter((c) => c.people != null).slice(0, 4).map((c) => `${c.company} cut ${num(c.people)} · ${c.country ?? "—"} · ${shortDate(c.date)}`),
    ...hires.slice(0, 3).map((h) => `${h.company} added ${num(h.week)} open roles`),
  ];
  const needle = q.toLowerCase();
  const boardHits = boards.filter((b) => (!state.letter || b.name.toUpperCase().startsWith(state.letter)) && (!needle || b.name.toLowerCase().includes(needle)));

  const stage = $("#stage");
  const focus = document.activeElement === $("#pulse-search");
  const sel = focus ? $("#pulse-search").selectionStart : null;
  stage.replaceChildren();
  document.body.className = `pane-${state.pane}`;

  const hero = el("section", { class: "hero", "aria-label": "This week" }, [
    text("p", `Snapshot ${snapshot.asOf}`, { class: "kicker" }),
    text("h1", "Who is cutting."),
    text("p", ticker[state.tick % ticker.length], { class: "lede" }),
    text("p", "Who is hiring, too. The week’s totals cover the full tracker. The lists are the latest named cuts and the biggest open-role adds.", { class: "note" }),
  ]);
  const stats = el("div", { class: "stats" }, [
    stamp("Laid off · 7 days", num(snapshot.laidOff7d), "loss"),
    stamp("New jobs · 7 days", num(snapshot.newJobs7d), "gain"),
    stamp("Most impacted", snapshot.impactedSector, "", `${num(snapshot.impactedCount)} laid off`, "loss"),
    stamp("Top hiring", snapshot.topHirer, "", `+${num(snapshot.topHirerNew)} new jobs`, "gain"),
  ]);
  stage.append(hero, stats);

  const head = el("div", { class: "section-head" }, [
    text("h2", "Disclosed headcount in view", { class: "kicker red" }),
    text("p", "A dash means sources did not agree on a number", { class: "quiet" }),
  ]);
  stage.append(head);
  if (!bars.length) stage.append(text("p", "No published headcount for this filter.", { class: "hint" }));
  else {
    stage.append(el("ul", { class: "bars" }, bars.map((bar) => {
      const pct = Math.max(4, Math.round((bar.people / max) * 100));
      const fill = el("i");
      fill.style.width = `${pct}%`;
      return el("li", {}, [
        text("span", shortBar(bar.name), { class: "name", title: bar.name }),
        el("span", { class: "track" }, [fill]),
        text("span", num(bar.people), { class: "n" }),
      ]);
    })));
  }

  const input = el("input", { id: "pulse-search", type: "search", placeholder: "Search a company, like Walmart or Boeing", value: state.query });
  input.addEventListener("input", () => { state.query = input.value; state.shown = 40; render(data); });
  const search = el("label", { class: "search" }, [
    text("span", "Search a company", { class: "sr" }),
    el("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "2" }, [
      el("circle", { cx: "11", cy: "11", r: "7" }),
      el("path", { d: "M20 20l-3.5-3.5" }),
    ]),
    input,
  ]);
  if (state.query) search.append(el("button", { type: "button", class: "clear", "aria-label": "Clear search", onclick: () => { state.query = ""; state.shown = 40; render(data); } }, [text("span", "×")]));
  else search.append(text("span", "/", { class: "slash" }));
  stage.append(search);

  stage.append(el("div", { class: "chips", role: "group", "aria-label": "Region" }, REGIONS.map(([id, label]) => chip(label, state.region === id, () => { state.region = id; render(data); }, counts.get(id)))));
  stage.append(el("div", { class: "chips", role: "group", "aria-label": "Sector" }, [
    chip("All sectors", state.sector == null, () => { state.sector = null; render(data); }),
    ...sectorOptions.map(([name, count]) => chip(name, state.sector === name, () => { state.sector = state.sector === name ? null : name; render(data); }, count || null)),
  ]));

  stage.append(el("div", { class: "tabs", role: "tablist", "aria-label": "Feed" }, [
    tab("Layoffs", "cuts", filteredCuts.length),
    tab("Hiring", "hiring", filteredHires.length),
    tab("Boards", "boards", snapshot.boards),
  ]));

  if (state.pane !== "boards" && q && boardHits.length) {
    const hint = text("p", "", { class: "hint" });
    hint.append(`${num(boardHits.length)} career boards match “${q}”. `);
    hint.append(el("button", { type: "button", onclick: () => { state.pane = "boards"; render(data); } }, [document.createTextNode("Open boards")]));
    stage.append(hint);
  }

  const cutsCol = el("section", { class: "cuts-col", "aria-label": "Layoffs" }, [
    el("div", { class: "col-head" }, [
      text("h2", "Layoffs"),
      text("p", `${filteredCuts.length} of the latest ${snapshot.trackedCuts} tracked`),
    ]),
  ]);
  if (state.region !== "global") cutsCol.append(text("p", "Region filters the cuts. Hiring adds are not geotagged.", { class: "hint" }));
  cutsCol.append(filteredCuts.length ? el("ul", { class: "rows" }, filteredCuts.map((c) => rowLink(
    c.url,
    { text: mono(c.company), class: "mark" },
    c.company,
    [c.sector, c.source === "warn" ? "WARN" : hostOf(c.url), c.country].filter(Boolean).join(" · "),
    text("span", c.people == null ? "—" : `−${num(c.people)}`, { class: "people loss" }),
    text("span", shortDate(c.date), { class: "when" }),
  ))) : text("p", "No cuts match this filter.", { class: "empty" }));

  const hiringCol = el("section", { class: "hiring-col hiring stamp", "aria-label": "Hiring" }, [
    el("div", { class: "col-head" }, [text("h2", "Hiring"), text("p", "Biggest adds still open this week")]),
    filteredHires.length ? el("ul", { class: "rows" }, filteredHires.map((h) => rowLink(
      h.url,
      { text: mono(h.company), class: "mark sky" },
      h.company,
      [h.sector, `${num(h.open)} open`, hostOf(h.url)].filter(Boolean).join(" · "),
      text("span", `+${num(h.week)}`, { class: "people gain" }),
    ))) : text("p", "No hiring adds match this filter.", { class: "empty" }),
  ]);

  const boardsCol = el("section", { class: "boards-col", "aria-label": "Career boards" }, [
    el("div", { class: "col-head" }, [
      text("h2", "Career boards"),
      text("p", `${num(boardHits.length)} tracked · updated ${boardsUpdated}`),
    ]),
    text("p", "Open a company’s own careers page. Role counts are on the hiring list, not on every board.", { class: "hint" }),
    el("div", { class: "chips", role: "group", "aria-label": "Jump by letter" }, [
      chip("All", state.letter == null, () => { state.letter = null; state.shown = 40; render(data); }),
      ...LETTERS.map((l) => chip(l, state.letter === l, () => { state.letter = state.letter === l ? null : l; state.shown = 40; render(data); })),
    ]),
  ]);
  if (!boardHits.length) boardsCol.append(text("p", "No boards match.", { class: "empty" }));
  else {
    boardsCol.append(el("ul", { class: "rows" }, boardHits.slice(0, state.shown).map((b) => {
      const a = el("a", { href: b.url, target: "_blank", rel: "noopener noreferrer" }, [
        text("span", mono(b.name), { class: "mark sm" }),
        text("span", b.name, { class: "who" }),
        text("span", hostOf(b.url), { class: "host" }),
        arrowIcon(),
      ]);
      a.style.minHeight = "48px";
      return el("li", {}, [a]);
    })));
    if (state.shown < boardHits.length) {
      boardsCol.append(el("button", { type: "button", class: "more", onclick: () => { state.shown += 40; render(data); } }, [
        document.createTextNode(`Show more · ${num(boardHits.length - state.shown)} left`),
      ]));
    }
  }

  stage.append(el("div", { class: "split" }, [cutsCol, hiringCol, boardsCol]));
  if (focus) {
    const next = $("#pulse-search");
    next.focus();
    if (sel != null) next.setSelectionRange(sel, sel);
  }

  function tab(label, id, count) {
    return el("button", {
      type: "button", role: "tab", class: "tab", "aria-selected": state.pane === id ? "true" : "false",
      onclick: () => { state.pane = id; render(data); },
    }, [document.createTextNode(`${label} ${num(count)}`)]);
  }
}

function stamp(label, value, tone, note, noteTone) {
  return el("div", { class: "stamp" }, [
    text("p", label, { class: "kicker red" }),
    text("p", value, { class: `stat ${tone || ""}`.trim() }),
    text("p", note || "\u00a0", { class: `fine ${noteTone || ""}`.trim() }),
  ]);
}

const sr = document.createElement("style");
sr.textContent = ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}";
document.head.append(sr);

const data = await Promise.all([
  fetch("./assets/feed.json").then((r) => r.json()),
  fetch("./assets/boards.json").then((r) => r.json()),
]).then(([feed, boards]) => ({ ...feed, boards: boards.companies, boardsUpdated: boards.updated }));

render(data);
window.addEventListener("keydown", (e) => {
  const tag = e.target?.tagName;
  if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
    e.preventDefault();
    $("#pulse-search")?.focus();
  }
});
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.setInterval(() => { state.tick += 1; render(data); }, 4200);
}
