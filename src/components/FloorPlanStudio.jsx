import { useCallback, useEffect, useRef, useState } from "react";
import Marzipano from "marzipano";
import { useSize } from "../hooks/useSize";
import { APP_DATA } from "../data/data";
import { panoLimiter } from "../data/panoLimits";
import { SAMPLE_DATA, PLAN_FLOOR, PLAN_W, PLAN_H, WINGS, WING_BY_ID, TYPES, UNITS, UNIT_BY_ID, unitsIn, viewFor } from "../data/units";

// The Floor Plan screen (Explore Units), over the Floor Plans page: five tabs, all reading
// the homes in data/units.js (the 8th floor of wings A1 and A2) —
//   Floor Plan      the wing's real plan: pick a home on it for its details and its own plan
//   Filter Units    narrow the homes down by wing, type, size and availability
//   Compare Units   up to three homes side by side
//   Compare Wings   A1 and A2 side by side
//   Compare Views   the view at two times of day side by side, turning together
// Nothing on it scrolls: every tab is laid out to fit the screen (results come in pages).
const TABS = [
  { id: "plan", label: "Floor Plan", short: "Plan", title: ["Floor", "Plan"] },
  { id: "filter", label: "Filter Units", short: "Filter", title: ["Find Your", "Home"] },
  { id: "units", label: "Compare Units", short: "Units", title: ["Compare", "Units"] },
  { id: "wings", label: "Compare Wings", short: "Wings", title: ["Compare", "Wings"] },
  { id: "views", label: "Compare Views", short: "Views", title: ["Compare", "Views"] },
];
const MAX_COMPARE = 3;
const WING_IDS = WINGS.map((w) => w.id);

const pad = (n) => String(n).padStart(2, "0");
const sqft = (n) => `${n.toLocaleString("en-IN")} sq ft`;
const typeName = (u) => (u.code ? `${u.type} · ${u.code}` : u.type);

// ---- Filters ----------------------------------------------------------------------------

// carpet area: the slider runs over the homes' own range, in 10 sq ft steps
const AREA_STEP = 10;
const AREA_MIN = Math.floor(Math.min(...UNITS.map((u) => u.carpet)) / AREA_STEP) * AREA_STEP;
const AREA_MAX = Math.ceil(Math.max(...UNITS.map((u) => u.carpet)) / AREA_STEP) * AREA_STEP;
const DEFAULT_FILTERS = { wing: "All", types: [], min: AREA_MIN, max: AREA_MAX, availableOnly: false };
const isDefault = (f) => JSON.stringify(f) === JSON.stringify(DEFAULT_FILTERS);
const activeCount = (f) =>
  (f.wing !== "All") + (f.types.length > 0) + (f.min !== AREA_MIN || f.max !== AREA_MAX) + f.availableOnly;
const matcher = (f) => (u) =>
  (f.wing === "All" || u.wing === f.wing) &&
  (!f.types.length || f.types.includes(u.type)) &&
  u.carpet >= f.min &&
  u.carpet <= f.max &&
  (!f.availableOnly || u.status === "Available");
const SORTS = {
  wing: { label: "Wing order", by: (a, b) => a.id.localeCompare(b.id) },
  small: { label: "Size: small first", by: (a, b) => a.carpet - b.carpet || a.id.localeCompare(b.id) },
  large: { label: "Size: large first", by: (a, b) => b.carpet - a.carpet || a.id.localeCompare(b.id) },
};
const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// ---- Small pieces -------------------------------------------------------------------------

function Icon({ d, className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONS = {
  close: "M6 6l12 12M18 6L6 18",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  filter: "M4 6h16M7 12h10M10 18h4",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
};

const LABEL = "text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:text-[10px] sm:tracking-[0.25em]";

function Chip({ on, onClick, children, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-35 sm:text-[11px] ${
        on ? "border-red-600 bg-red-600 text-white" : "border-white/20 text-white/75 hover:border-white/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Segmented({ value, options, onChange, label, disabled = [] }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-white/20 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          disabled={disabled.includes(o)}
          onClick={() => onChange(o)}
          className={`min-w-8 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors disabled:opacity-30 sm:text-[11px] ${
            value === o ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Available"
      ? "border-emerald-400/50 text-emerald-300"
      : status === "On Hold"
        ? "border-white/35 text-white/70"
        : "border-white/15 text-white/40";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] sm:text-[9px] ${tone}`}>
      {status}
    </span>
  );
}

// ---- Zoom -------------------------------------------------------------------------------------

// A drawing, zoomable inside its box (no scrolling): scroll or pinch to zoom in where the
// pointer is, drag to move around, double-click to zoom in or back out. Its children fill
// the box and move together (the plan and the homes drawn over it). `dragged()` tells a
// click inside whether the pointer was really dragging.
const MAX_ZOOM = 6;
function ZoomBox({ children, label }) {
  const boxRef = useRef(null);
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const travel = useRef(0);

  // keep the drawing covering the box: no gaps at the edges once zoomed in
  const fit = (s, x, y) => {
    const el = boxRef.current;
    const w = el?.clientWidth ?? 0;
    const h = el?.clientHeight ?? 0;
    return { s, x: Math.min(0, Math.max(w - w * s, x)), y: Math.min(0, Math.max(h - h * s, y)) };
  };
  const zoomAt = (factor, cx, cy) =>
    setZ((p) => {
      const s = Math.min(MAX_ZOOM, Math.max(1, p.s * factor));
      const k = s / p.s;
      return fit(s, cx - (cx - p.x) * k, cy - (cy - p.y) * k);
    });
  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const centre = () => [(boxRef.current?.clientWidth ?? 0) / 2, (boxRef.current?.clientHeight ?? 0) / 2];

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, local(e));
    travel.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  };
  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = local(e);
    pointers.current.set(e.pointerId, now);
    travel.current += Math.hypot(now[0] - prev[0], now[1] - prev[1]);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt(d / pinch.current, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      pinch.current = d;
    } else if (pointers.current.size === 1 && travel.current > 4) {
      if (!boxRef.current.hasPointerCapture(e.pointerId)) boxRef.current.setPointerCapture(e.pointerId);
      setZ((p) => fit(p.s, p.x + now[0] - prev[0], p.y + now[1] - prev[1]));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const btn = "grid h-8 w-8 place-items-center rounded-lg text-navy-950 transition-colors hover:bg-navy-950/10 disabled:opacity-30";

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-white">
      <div
        ref={boxRef}
        aria-label={label}
        onWheel={(e) => zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, ...local(e))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => travel.current > 4 && e.stopPropagation()}
        onDoubleClick={(e) => (z.s > 1 ? setZ({ s: 1, x: 0, y: 0 }) : zoomAt(2.5, ...local(e)))}
        className={`absolute inset-0 touch-none select-none ${z.s > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="absolute inset-0" style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      </div>
      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-xl border border-navy-950/15 bg-white/95 p-0.5 shadow-premium">
        <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5, ...centre())} disabled={z.s <= 1} className={btn}>
          <Icon d="M5 12h14" className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-10 text-center text-[10px] font-bold tracking-wider text-navy-950">{Math.round(z.s * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoomAt(1.5, ...centre())} disabled={z.s >= MAX_ZOOM} className={btn}>
          <Icon d={ICONS.plus} className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Fit the whole drawing"
          onClick={() => setZ({ s: 1, x: 0, y: 0 })}
          disabled={z.s === 1}
          className={`${btn} w-auto px-2 text-[9px] font-bold uppercase tracking-[0.14em]`}
        >
          Fit
        </button>
      </div>
    </div>
  );
}

// ---- The plan, with its homes ------------------------------------------------------------------

// The wing's plan with every home's outline over it, in the plan's own drawing space. A home
// lights on hover; the chosen one is red; sold ones are shaded and on-hold ones dashed;
// homes outside the filter fade back. Homes in compare carry a red tick.
function WingPlan({ wing, selectedId, compareIds = [], match, onPick }) {
  const w = WING_BY_ID[wing];
  const units = unitsIn(wing);

  return (
    <>
      <img src={w.plan} alt={`Wing ${wing}, floor ${PLAN_FLOOR} plan`} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
      <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} className="absolute inset-0 h-full w-full" role="group" aria-label={`Wing ${wing}: homes`}>
        {units.map((u) => {
          const on = u.id === selectedId;
          const dim = match && !match(u);
          const sold = u.status === "Sold";
          const hold = u.status === "On Hold";
          const pick = () => onPick(u.id);
          return (
            <path
              key={u.id}
              data-id={u.id}
              d={u.shape}
              role="button"
              tabIndex={0}
              aria-label={`Home ${u.id}, ${u.type}, ${u.status}`}
              aria-pressed={on}
              onClick={pick}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick())}
              strokeDasharray={hold && !on ? "8 6" : undefined}
              className={`cursor-pointer outline-none transition-[fill,stroke] duration-200 ${
                on
                  ? "fill-red-600/30 stroke-red-600 [stroke-width:3]"
                  : dim
                    ? "fill-white/75 stroke-transparent"
                    : sold
                      ? "fill-navy-950/35 stroke-navy-950/40 [stroke-width:1.2] hover:fill-navy-950/45"
                      : `fill-transparent ${hold ? "stroke-navy-950/60" : "stroke-transparent"} [stroke-width:1.5] hover:fill-red-600/15 hover:stroke-red-600 focus-visible:fill-red-600/15 focus-visible:stroke-red-600`
              }`}
            />
          );
        })}
        {compareIds
          .map((id) => UNIT_BY_ID.get(id))
          .filter((u) => u?.wing === wing)
          .map(({ id, centre }) => (
            <g key={id} transform={`translate(${centre[0]} ${centre[1]})`} pointerEvents="none">
              <circle r="13" className="fill-red-600" />
              <path d="M-6 0.5l4 4 8-8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
      </svg>
    </>
  );
}

function Legend() {
  const item = (cls, text, dashed) => (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-4 rounded-sm border ${cls} ${dashed ? "border-dashed" : ""}`} />
      {text}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-[10px]">
      {item("border-white/60 bg-white", "Available")}
      {item("border-white/60 bg-white", "On hold", true)}
      {item("border-white/30 bg-white/40", "Sold")}
      {item("border-red-600 bg-red-600/40", "Selected")}
      <span className="flex items-center gap-1.5">
        <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-red-600">
          <Icon d={ICONS.check} className="h-2 w-2" />
        </span>
        In compare
      </span>
      <span className="text-white/40 max-sm:hidden">Scroll or pinch to zoom · drag to move</span>
    </div>
  );
}

// ---- Floor Plan ------------------------------------------------------------------------------

function UnitDetails({ unit, inCompare, compareFull, onCompare, onViews, onHomePlan }) {
  if (!unit) {
    return <p className="text-xs leading-relaxed text-white/60 sm:text-sm">Select a home on the plan to see its details and its own plan.</p>;
  }
  const specs = [
    ["Type", typeName(unit)],
    ["Bedrooms", unit.bed],
    ["Carpet", sqft(unit.carpet)],
  ];
  const btn =
    "btn-fill flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-transform active:scale-95 disabled:opacity-40 sm:tracking-[0.16em] lg:py-2.5 lg:text-[11px]";
  return (
    <div key={unit.id} className="jp-caption-in flex h-full min-h-0 flex-col">
      <span className={LABEL}>
        Wing {unit.wing} · Floor {pad(unit.floor)}
      </span>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="font-display text-3xl leading-none lg:text-5xl short:text-2xl">{unit.id}</span>
        <StatusBadge status={unit.status} />
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-x-3 lg:mt-4 short:mt-1.5 short:gap-x-2">
        {specs.map(([k, v]) => (
          <div key={k} className="border-t border-white/10 pt-1 lg:pt-2 short:pt-0.5">
            <dt className={`${LABEL} short:tracking-[0.1em]`}>{k}</dt>
            <dd className="text-xs font-semibold lg:mt-0.5 lg:text-sm short:text-[10px]">{v}</dd>
          </div>
        ))}
      </dl>
      {/* the home's own plan: opens large in the plan area */}
      <button
        type="button"
        onClick={onHomePlan}
        aria-label={`${unit.id}: open its plan`}
        className="group relative mt-3 min-h-0 flex-1 overflow-hidden rounded-xl bg-white max-lg:hidden lg:mt-4"
      >
        <img src={unit.image} alt="" className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-navy-950/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
          <Icon d={ICONS.expand} className="h-3 w-3" /> Home plan
        </span>
      </button>
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 lg:mt-4 lg:grid-cols-1 short:mt-2 short:grid-cols-1 short:gap-1.5 short:[&>button]:py-1.5">
        <button
          type="button"
          onClick={onCompare}
          disabled={!inCompare && compareFull}
          title={!inCompare && compareFull ? `Compare holds up to ${MAX_COMPARE} units` : undefined}
          style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
          className={`${btn} ${inCompare ? "border-red-600 bg-red-600/20" : "border-red-500/60"}`}
        >
          <Icon d={inCompare ? ICONS.check : ICONS.plus} className="h-3 w-3" />
          {inCompare ? "In Compare" : compareFull ? "Compare Full" : "Add to Compare"}
        </button>
        <button type="button" onClick={onViews} style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }} className={`${btn} border-white/25`}>
          <span className="lg:hidden">The View</span>
          <span className="max-lg:hidden">See the View</span>
          <Icon d={ICONS.arrow} className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// The Floor Plan tab: the wing's plan to pick homes on, or the chosen home's own plan
function PlanTab({ wing, setWing, view, setView, selectedId, setSelectedId, compareIds, toggleCompare, filters, clearFilters, openViews }) {
  const unit = selectedId ? UNIT_BY_ID.get(selectedId) : null;
  const filtered = !isDefault(filters);
  const showHome = view === "Home" && !!unit;
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-10 short:grid-cols-[minmax(0,1fr)_250px] short:grid-rows-1 short:gap-4">
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Segmented
              value={wing}
              options={WING_IDS}
              onChange={(w) => {
                setWing(w);
                if (unit?.wing !== w) setSelectedId(null);
                setView("Floor");
              }}
              label="Wing"
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">Floor {pad(PLAN_FLOOR)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filtered && !showHome && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Filter on · Clear <Icon d={ICONS.close} className="h-3 w-3" />
              </button>
            )}
            {/* the whole floor, or the chosen home's own plan */}
            <Segmented value={showHome ? "Home" : "Floor"} options={["Floor", "Home"]} onChange={setView} disabled={unit ? [] : ["Home"]} label="Floor or home plan" />
          </div>
        </div>
        {/* the plan fills whatever height is left */}
        <div className="relative mt-3 min-h-0 flex-1 short:mt-2">
          {showHome ? (
            <ZoomBox key={unit.id} label={`${unit.id} plan`}>
              <img src={unit.image} alt={`Home ${unit.id} plan`} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
            </ZoomBox>
          ) : (
            <ZoomBox key={wing} label={`Wing ${wing} floor plan`}>
              <WingPlan
                wing={wing}
                selectedId={selectedId}
                compareIds={compareIds}
                match={filtered ? matcher(filters) : null}
                onPick={(id) => setSelectedId(id === selectedId ? null : id)}
              />
            </ZoomBox>
          )}
        </div>
        <div className="mt-2.5 shrink-0 short:hidden">
          {showHome ? (
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-[10px]">
              {unit.id} · {typeName(unit)} — scroll or pinch to zoom, drag to move
            </p>
          ) : (
            <Legend />
          )}
        </div>
      </div>
      <aside className="min-h-0 overflow-hidden rounded-2xl border border-white/15 bg-navy-950/60 p-3.5 shadow-premium sm:p-5 short:self-stretch short:p-3">
        <UnitDetails
          unit={unit}
          inCompare={!!unit && compareIds.includes(unit.id)}
          compareFull={compareIds.length >= MAX_COMPARE}
          onCompare={() => toggleCompare(unit.id)}
          onViews={openViews}
          onHomePlan={() => setView("Home")}
        />
      </aside>
    </div>
  );
}

// ---- Filter Units --------------------------------------------------------------------------

// Every home as a card with its own plan, as many as fit (in pages, never a scroll): tick a
// card's box to add it to the comparison; the card itself opens the home on the floor plan.
const CARD_MIN_W = 150; // a card's narrowest
const PLAN_MIN_H = 100; // the plan in it never gets shorter than this
const CARD_TEXT_H = 58; // its name and size, under the plan
const GRID_GAP = 12;

// How n results fill w × h: the columns and rows that show the most homes per page with
// every plan still readable, and among those, the one with the largest plans.
function cardGrid(w, h, n) {
  let best = { cols: 1, rows: 1, planH: Math.max(PLAN_MIN_H, h - CARD_TEXT_H) };
  let bestShown = 0;
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const cardW = (w - GRID_GAP * (cols - 1)) / cols;
    if (cols > 1 && cardW < CARD_MIN_W) break;
    for (let rows = 1; (rows - 1) * cols < n; rows++) {
      const planH = Math.min(cardW * 0.7, (h - GRID_GAP * (rows - 1)) / rows - CARD_TEXT_H);
      if (planH < PLAN_MIN_H) break;
      const shown = Math.min(cols * rows, n);
      if (shown > bestShown || (shown === bestShown && planH > best.planH)) {
        best = { cols, rows, planH };
        bestShown = shown;
      }
    }
  }
  return best;
}

// Two handles on one track: the smallest and the largest carpet area
function AreaRange({ min, max, onChange }) {
  const pct = (v) => ((v - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs font-semibold text-white sm:text-sm">
        <span>{min.toLocaleString("en-IN")}</span>
        <span className={LABEL}>sq ft</span>
        <span>{max.toLocaleString("en-IN")}</span>
      </div>
      <div className="jp-range relative mt-1.5 h-6">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-red-600" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <input
          type="range"
          aria-label="Smallest carpet area"
          min={AREA_MIN}
          max={AREA_MAX}
          step={AREA_STEP}
          value={min}
          onChange={(e) => onChange({ min: Math.min(Number(e.target.value), max) })}
        />
        <input
          type="range"
          aria-label="Largest carpet area"
          min={AREA_MIN}
          max={AREA_MAX}
          step={AREA_STEP}
          value={max}
          onChange={(e) => onChange({ max: Math.max(Number(e.target.value), min) })}
        />
      </div>
    </div>
  );
}

function FilterPanel({ filters, set, count, sort, setSort, onDone }) {
  const group = (title, children) => (
    <div className="border-t border-white/10 pt-[min(12px,1.6vh)] short:pt-1.5">
      <p className={LABEL}>{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
  return (
    <div className="grid content-start gap-y-[min(12px,1.6vh)] short:grid-cols-2 short:gap-x-5 short:gap-y-1.5">
      <div className="flex items-center justify-between gap-3 short:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white sm:text-[11px]">
          <span className="font-display text-2xl tracking-normal text-white">{count}</span> {count === 1 ? "home" : "homes"}
        </span>
        <label className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-transparent pr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white outline-none sm:text-[11px]"
          >
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id} className="bg-navy-950">
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {group(
        "Configuration",
        TYPES.map((t) => (
          <Chip key={t} on={filters.types.includes(t)} onClick={() => set({ types: toggleIn(filters.types, t) })}>
            {t}
          </Chip>
        )),
      )}
      {group(
        "Wing",
        ["All", ...WING_IDS].map((w) => (
          <Chip key={w} on={filters.wing === w} onClick={() => set({ wing: w })}>
            {w === "All" ? "Both" : `Wing ${w}`}
          </Chip>
        )),
      )}
      {group("Carpet area", <div className="w-full"><AreaRange min={filters.min} max={filters.max} onChange={set} /></div>)}
      <div className="flex flex-col gap-2.5 border-t border-white/10 pt-[min(12px,1.6vh)] short:pt-1.5">
        <label className="flex cursor-pointer items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:text-[11px]">
          <input type="checkbox" checked={filters.availableOnly} onChange={(e) => set({ availableOnly: e.target.checked })} className="h-4 w-4 accent-red-600" />
          Available only
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => set(DEFAULT_FILTERS)}
            disabled={isDefault(filters)}
            className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500 transition-colors hover:text-white disabled:opacity-30"
          >
            Reset filters
          </button>
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="ml-auto whitespace-nowrap rounded-lg bg-red-600 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white lg:hidden"
            >
              Show results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// A home in the results: its plan, a tick box to compare it, its status, its name and size
function UnitCard({ u, planH, inCompare, compareFull, toggleCompare, showOnPlan }) {
  const locked = !inCompare && compareFull;
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] transition-colors hover:border-white/35">
      <button
        type="button"
        onClick={() => showOnPlan(u)}
        aria-label={`${u.id}, ${u.type}: show it on the floor plan`}
        className="relative block w-full bg-white"
        style={{ height: planH }}
      >
        <img
          src={u.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </button>
      <label
        title={locked ? `Compare holds up to ${MAX_COMPARE} homes` : inCompare ? "Remove from compare" : "Add to compare"}
        className={`absolute left-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg border-2 shadow-premium transition-colors ${
          inCompare
            ? "cursor-pointer border-red-600 bg-red-600 text-white"
            : locked
              ? "cursor-not-allowed border-navy-950/15 bg-white/80 text-transparent"
              : "cursor-pointer border-navy-950/25 bg-white text-transparent hover:border-red-600"
        }`}
      >
        <input type="checkbox" className="sr-only" checked={inCompare} disabled={locked} onChange={() => toggleCompare(u.id)} aria-label={`Compare ${u.id}`} />
        <Icon d={ICONS.check} className="h-3.5 w-3.5" />
      </label>
      <span className="absolute right-2.5 top-2.5 rounded-full bg-navy-950/90 p-0.5">
        <StatusBadge status={u.status} />
      </span>
      <div className="flex min-w-0 flex-col justify-center px-3.5" style={{ height: CARD_TEXT_H }}>
        <p className="truncate font-display text-xl leading-none sm:text-2xl">
          {u.id} <span className="text-white/35">—</span> {u.type}
        </p>
        <p className="mt-1 truncate text-[11px] text-white/60">
          <span className="font-semibold text-white/85">{sqft(u.carpet)}</span> carpet · Wing {u.wing} · Floor {pad(u.floor)}
          {u.code ? ` · ${u.code}` : ""}
        </p>
      </div>
    </li>
  );
}

function FilterTab({ filters, setFilters, compareIds, toggleCompare, showOnPlan, goTo }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("wing");
  const [panelOpen, setPanelOpen] = useState(false); // below lg the filters open over the results
  const gridRef = useRef(null);
  const { w, h } = useSize(gridRef);
  const set = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const results = UNITS.filter(matcher(filters)).sort(SORTS[sort].by);
  const available = results.filter((u) => u.status === "Available").length;
  const full = compareIds.length >= MAX_COMPARE;
  const { cols, rows, planH } = cardGrid(w, h, results.length);
  const perPage = cols * rows;
  const pages = Math.max(1, Math.ceil(results.length / perPage));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * perPage, (current + 1) * perPage);
  const active = activeCount(filters);

  return (
    <div className="relative grid h-full gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      {/* filters: a column from lg up; below it, a panel over the results */}
      <div
        className={`rounded-2xl border border-white/15 bg-navy-950 p-4 shadow-premium lg:block lg:self-start lg:bg-navy-950/60 lg:p-5 ${
          panelOpen ? "absolute inset-0 z-10 overflow-hidden lg:static" : "hidden"
        }`}
      >
        <FilterPanel
          filters={filters}
          set={set}
          count={results.length}
          sort={sort}
          setSort={(s) => {
            setSort(s);
            setPage(0);
          }}
          onDone={() => setPanelOpen(false)}
        />
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-white/70 sm:text-sm" aria-live="polite">
            <span className="font-display text-2xl text-white sm:text-3xl">{results.length}</span> homes match
            <span className="text-white/45"> · {available} available</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo("units")}
              disabled={!compareIds.length}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors disabled:opacity-40 ${
                compareIds.length ? "border-red-600 bg-red-600/15 text-white hover:bg-red-600" : "border-white/20 text-white/60"
              }`}
            >
              Compare {compareIds.length}/{MAX_COMPARE}
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] lg:hidden"
            >
              <Icon d={ICONS.filter} className="h-3.5 w-3.5" />
              Filters{active ? ` (${active})` : ""}
            </button>
          </div>
        </div>

        <div ref={gridRef} className="mt-3 min-h-0 flex-1">
          {results.length === 0 ? (
            <p className="text-sm text-white/60">No homes match these filters. Try another size or configuration.</p>
          ) : (
            w > 0 && (
              <ul key={`${sort}-${current}`} className="jp-caption-in grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: GRID_GAP }}>
                {shown.map((u) => (
                  <UnitCard
                    key={u.id}
                    u={u}
                    planH={planH}
                    inCompare={compareIds.includes(u.id)}
                    compareFull={full}
                    toggleCompare={toggleCompare}
                    showOnPlan={showOnPlan}
                  />
                ))}
              </ul>
            )
          )}
        </div>

        {pages > 1 && (
          <div className="mt-3 flex shrink-0 items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Previous results"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <Icon d={ICONS.left} className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[7rem] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Page <span className="text-white">{current + 1}</span> of {pages}
            </span>
            <button
              type="button"
              aria-label="Next results"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <Icon d={ICONS.right} className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Comparisons -----------------------------------------------------------------------------

// A comparison table: a header per column, then one row per fact; rows whose values differ
// are marked so the differences stand out, and the largest number in such a row is red.
function CompareTable({ columns, rows, head }) {
  const cols = `minmax(76px,0.7fr) repeat(${columns.length}, minmax(0,1fr))`;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-2 sm:gap-3" style={{ gridTemplateColumns: cols }}>
        <div />
        {columns.map((c, i) => (
          <div key={i} className="flex min-h-0 min-w-0 flex-col">
            {head(c, i)}
          </div>
        ))}
      </div>
      <div className="mt-1 shrink-0">
        {rows.map(([label, get, best]) => {
          const values = columns.map(get);
          const differs = new Set(values.map(String)).size > 1;
          const bestValue = best && differs ? Math.max(...columns.map(best)) : null;
          return (
            <div
              key={label}
              className="grid items-center gap-2 border-t border-white/10 py-[min(9px,1.1vh)] sm:gap-3 short:py-[3px]"
              style={{ gridTemplateColumns: cols }}
            >
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55 sm:text-[10px] sm:tracking-[0.22em]">
                {differs && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" title="Differs" />}
                {label}
              </span>
              {columns.map((c, i) => (
                <span
                  key={i}
                  className={`min-w-0 text-[11px] font-semibold sm:text-sm short:text-[11px] ${
                    bestValue !== null && best(c) === bestValue ? "text-red-500" : "text-white/90"
                  }`}
                >
                  {values[i]}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-2 flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Differs
        <span className="ml-3 text-red-500">Red</span> Largest
      </p>
    </div>
  );
}

// a column's head: its name and a plan, filling the room above the table
function CompareHead({ title, action, image, imageAlt, onImage }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/12 bg-white/[0.03] p-2 sm:p-3 short:p-1.5">
      <div className="flex shrink-0 items-start justify-between gap-1">
        <span className="whitespace-nowrap font-display text-lg leading-none sm:text-3xl short:text-lg">{title}</span>
        {action}
      </div>
      <button
        type="button"
        onClick={onImage}
        aria-label={imageAlt}
        className="relative mt-2 min-h-[60px] flex-1 overflow-hidden rounded-lg bg-white short:hidden"
      >
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain p-1.5" />
      </button>
    </div>
  );
}

function UnitsTab({ compareIds, toggleCompare, goTo, showOnPlan }) {
  const units = compareIds.map((id) => UNIT_BY_ID.get(id)).filter(Boolean);
  if (!units.length) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <p className="text-sm leading-relaxed text-white/65">
          Add up to {MAX_COMPARE} homes to compare them side by side: pick them on the floor plan or from the filter results.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Chip onClick={() => goTo("plan")}>Floor Plan</Chip>
          <Chip onClick={() => goTo("filter")}>Filter Units</Chip>
        </div>
      </div>
    );
  }
  const rows = [
    ["Wing", (u) => u.wing],
    ["Type", (u) => typeName(u)],
    ["Bedrooms", (u) => u.bed, (u) => u.bed],
    ["Carpet area", (u) => sqft(u.carpet), (u) => u.carpet],
    ["Status", (u) => u.status],
  ];
  return (
    <CompareTable
      columns={units}
      rows={rows}
      head={(u) => (
        <CompareHead
          title={u.id}
          image={u.image}
          imageAlt={`${u.id}: open it on the floor plan`}
          onImage={() => showOnPlan(u, "Home")}
          action={
            <button
              type="button"
              aria-label={`Remove ${u.id} from compare`}
              onClick={() => toggleCompare(u.id)}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white/10 sm:h-6 sm:w-6"
            >
              <Icon d={ICONS.close} className="h-3 w-3" />
            </button>
          }
        />
      )}
    />
  );
}

function wingFacts(id) {
  const us = unitsIn(id);
  return {
    homes: us.length,
    byType: Object.fromEntries(TYPES.map((t) => [t, us.filter((u) => u.type === t).length])),
    available: us.filter((u) => u.status === "Available").length,
    carpet: us.reduce((s, u) => s + u.carpet, 0),
    largest: Math.max(...us.map((u) => u.carpet)),
  };
}

function WingsTab({ openWing }) {
  const cols = WINGS.map((w) => ({ ...w, facts: wingFacts(w.id) }));
  const rows = [
    ["Homes", (c) => c.facts.homes, (c) => c.facts.homes],
    ...TYPES.map((t) => [t, (c) => c.facts.byType[t] || "—"]),
    ["Available", (c) => c.facts.available, (c) => c.facts.available],
    ["Largest home", (c) => sqft(c.facts.largest), (c) => c.facts.largest],
    ["Total carpet", (c) => sqft(c.facts.carpet), (c) => c.facts.carpet],
  ];
  return (
    <CompareTable
      columns={cols}
      rows={rows}
      head={(c) => (
        <CompareHead
          title={`Wing ${c.id}`}
          image={c.plan}
          imageAlt={`Wing ${c.id}: open its floor plan`}
          onImage={() => openWing(c.id)}
          action={<span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:text-[10px]">Floor {pad(PLAN_FLOOR)}</span>}
        />
      )}
    />
  );
}

// ---- Compare Views: two 360° views that turn together ---------------------------------------

// the same tiles as the 360° page (public/assets/360pano/tiles/), turning within the same
// limits (data/panoLimits.js)
const TILE_URL = (id) => `/assets/360pano/tiles/${id}/{z}/{f}/{y}/{x}.jpg`;
const PREVIEW_URL = (id) => `/assets/360pano/tiles/${id}/preview.jpg`;
const SCENE_BY_ID = new Map(APP_DATA.scenes.map((s) => [s.id, s]));

// One 360° view. It tells its pair which view it's showing (`register`) and when it turns
// (`onTurn`), so the pair can turn the other one with it.
function PanoPane({ sceneId, side, register, onTurn }) {
  const elRef = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    const viewer = new Marzipano.Viewer(elRef.current, { controls: { mouseViewMode: "drag" } });
    ctx.current = { viewer, scenes: new Map(), current: null };
    return () => {
      viewer.destroy();
      ctx.current = null;
      register(side, null);
    };
  }, [register, side]);

  useEffect(() => {
    const c = ctx.current;
    const data = SCENE_BY_ID.get(sceneId);
    if (!c || !data) return;
    let entry = c.scenes.get(sceneId);
    if (!entry) {
      const view = new Marzipano.RectilinearView(data.initialViewParameters, panoLimiter(data));
      const source = Marzipano.ImageUrlSource.fromString(TILE_URL(sceneId), { cubeMapPreviewUrl: PREVIEW_URL(sceneId) });
      const scene = c.viewer.createScene({ source, geometry: new Marzipano.CubeGeometry(data.levels), view, pinFirstLevel: true });
      view.addEventListener("change", () => onTurn(side, view));
      entry = { scene, view };
      c.scenes.set(sceneId, entry);
    }
    const prev = c.current;
    if (prev && prev !== entry) entry.view.setParameters({ yaw: prev.view.yaw(), pitch: prev.view.pitch(), fov: prev.view.fov() });
    entry.scene.switchTo({ transitionDuration: prev ? 600 : 0 });
    c.current = entry;
    register(side, entry.view);
  }, [sceneId, side, register, onTurn]);

  return <div ref={elRef} className="absolute inset-0" />;
}

function ViewsTab({ pair, setPair }) {
  const link = useRef({ views: {}, on: true, lock: false });
  const [together, setTogether] = useState(true);
  useEffect(() => {
    link.current.on = together;
  }, [together]);
  const register = useCallback((side, view) => {
    link.current.views[side] = view;
  }, []);
  // turning one view turns the other one too (while "Turn together" is on)
  const onTurn = useCallback((side, view) => {
    const l = link.current;
    const other = l.views[side === "a" ? "b" : "a"];
    if (!l.on || l.lock || !other || l.views[side] !== view) return;
    l.lock = true;
    other.setParameters({ yaw: view.yaw(), pitch: view.pitch(), fov: view.fov() });
    l.lock = false;
  }, []);
  const view = viewFor(PLAN_FLOOR);
  const times = Object.keys(view.scenes);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/65 sm:text-sm">Drag either view to look around.</p>
        <label className="flex cursor-pointer items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-[11px]">
          <input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} className="h-4 w-4 accent-red-600" />
          Turn together
        </label>
      </div>
      {/* two views: stacked on phones, side by side from md (and on phones turned sideways) */}
      <div className="mt-3 grid min-h-0 flex-1 grid-rows-2 gap-3 md:grid-cols-2 md:grid-rows-1 short:mt-2 short:grid-cols-2 short:grid-rows-1">
        {pair.map((p, i) => {
          const time = times.includes(p.time) ? p.time : times[0];
          return (
            <div key={i} className="flex min-h-0 flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-2.5 sm:p-3 short:p-2">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-[11px]">View {i + 1}</span>
                <Segmented value={time} options={times} onChange={(t) => setPair((all) => all.map((x, j) => (j === i ? { time: t } : x)))} label="Time of day" />
              </div>
              <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-xl bg-navy-950">
                <PanoPane sceneId={view.scenes[time]} side={i === 0 ? "a" : "b"} register={register} onTurn={onTurn} />
                <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-navy-950/75 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur sm:text-[9px]">
                  Captured at: {view.label} · {time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- The screen ------------------------------------------------------------------------------

export default function FloorPlanStudio({ startWing = WING_IDS[0], startTab = "plan", onClose }) {
  const [tab, setTab] = useState(startTab);
  const [wing, setWing] = useState(startWing);
  const [selectedId, setSelectedId] = useState(null);
  // the Floor Plan tab shows the whole floor; "Home" is the chosen home's own plan
  const [planView, setPlanView] = useState("Floor");
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewPair, setViewPair] = useState([{ time: "Day" }, { time: "Evening" }]);
  const active = TABS.find((t) => t.id === tab);

  const toggleCompare = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]));
  const showOnPlan = (u, view = "Floor") => {
    setWing(u.wing);
    setSelectedId(u.id);
    setPlanView(view);
    setTab("plan");
  };
  const openWing = (w) => {
    setWing(w);
    if (UNIT_BY_ID.get(selectedId)?.wing !== w) setSelectedId(null);
    setPlanView("Floor");
    setTab("plan");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="floor-studio-title"
      className="jp-caption-in absolute inset-0 z-40 flex flex-col overflow-hidden bg-navy-950/95 text-white backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-8 lg:px-14 short:pt-3">
        <div>
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 short:hidden">
            <span className="h-px w-6 bg-red-600" />
            Floor Plans
          </span>
          <h2 id="floor-studio-title" className="mt-2 font-display text-3xl uppercase leading-none sm:text-4xl lg:text-5xl short:mt-0 short:text-2xl">
            {active.title[0]} <span className="text-red-600">{active.title[1]}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {SAMPLE_DATA && (
            <span
              title="Homes, types and plans are real; carpet areas and availability are sample figures until the final unit list is added"
              className="hidden rounded-full border border-white/25 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 sm:inline"
            >
              Sizes &amp; availability · sample
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close floor plan"
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 short:h-8 short:w-8"
          >
            <Icon d={ICONS.close} />
          </button>
        </div>
      </div>

      {/* Tabs: short labels on phones, so they fit on one line */}
      <div role="tablist" aria-label="Floor plan tools" className="mt-3 flex shrink-0 gap-1.5 px-5 sm:mt-4 sm:px-10 lg:px-14 short:mt-2">
        {TABS.map((t) => {
          const on = t.id === tab;
          const count = t.id === "units" ? compareIds.length : 0;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={count ? `${t.label} (${count})` : t.label}
              onClick={() => setTab(t.id)}
              className={`flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors max-sm:flex-1 sm:px-3.5 sm:py-2 sm:text-[11px] sm:tracking-[0.16em] short:flex-1 short:px-2 short:py-1 ${
                on ? "border-red-600 bg-red-600 text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
            >
              {/* short labels on phones and on short (landscape) screens */}
              <span className="sm:hidden short:!inline">{t.short}</span>
              <span className="max-sm:hidden short:!hidden">{t.label}</span>
              {count > 0 && (
                <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${on ? "bg-white text-red-600" : "bg-red-600 text-white"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {SAMPLE_DATA && (
        <p className="mt-1.5 px-5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45 sm:hidden">Sizes &amp; availability · sample</p>
      )}

      {/* Body: fills the rest of the screen and never scrolls; bottom room for the Brainwing credit on large screens */}
      <div role="tabpanel" aria-label={active.label} className="mt-4 min-h-0 flex-1 overflow-hidden px-5 pb-5 sm:px-10 lg:px-14 lg:pb-[clamp(56px,7vh,84px)] short:mt-2 short:pb-2">
        {tab === "plan" && (
          <PlanTab
            wing={wing}
            setWing={setWing}
            view={planView}
            setView={setPlanView}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            compareIds={compareIds}
            toggleCompare={toggleCompare}
            filters={filters}
            clearFilters={() => setFilters(DEFAULT_FILTERS)}
            openViews={() => setTab("views")}
          />
        )}
        {tab === "filter" && (
          <FilterTab filters={filters} setFilters={setFilters} compareIds={compareIds} toggleCompare={toggleCompare} showOnPlan={showOnPlan} goTo={setTab} />
        )}
        {tab === "units" && <UnitsTab compareIds={compareIds} toggleCompare={toggleCompare} goTo={setTab} showOnPlan={showOnPlan} />}
        {tab === "wings" && <WingsTab openWing={openWing} />}
        {tab === "views" && <ViewsTab pair={viewPair} setPair={setViewPair} />}
      </div>
    </div>
  );
}
