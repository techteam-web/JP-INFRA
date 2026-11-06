import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSize } from "../hooks/useSize";
import { ALL, OFFSET, PLANS_TOWER, VIEW_H, VIEW_W, towerImg } from "../data/tower";
import { facingScene, viewFor } from "../data/towerViews";
import PanoPane from "./PanoPane";
import TowerView from "./TowerView";
import { SAMPLE_DATA, PLAN_FLOOR, PLAN_W, PLAN_H, WINGS, WING_BY_ID, TYPES, UNITS, UNIT_BY_ID, unitsIn } from "../data/units";

// The Floor Plan screen (Explore Units), over the Floor Plans page: three tabs, all reading
// the homes in data/units.js (the 8th floor of wings A1 and A2) —
//   Visual Selection  the wing's real plan: pick a home on it for its details and its own plan
//   Search by Unit    narrow the homes down by wing, type, size and availability
//   Compare Units     up to three homes side by side, with their views on a second panel
// Comparing the views (Tower A's wings and heights, data/towerViews.js) belongs to Compare
// Units — it is a way of telling two homes apart, so it sits with them rather than on its own.
// Nothing on it scrolls: every tab is laid out to fit the screen (results come in pages).
const TABS = [
  { id: "plan", label: "Visual Selection", short: "Visual", title: ["Visual", "Selection"] },
  { id: "filter", label: "Search by Unit", short: "Search", title: ["Search", "by Unit"] },
  { id: "units", label: "Compare Units", short: "Compare", title: ["Compare", "Units"] },
];
// Compare Units has no tab of its own: it is reached from "Compare now" and "See the view".
const NAV_TABS = TABS.filter((t) => t.id !== "units");
const MAX_COMPARE = 3;
const WING_IDS = WINGS.map((w) => w.id);
// the two panels of Compare Units: the homes' plans, then the view out of them
const PANELS = ["Plans", "Views"];

const pad = (n) => String(n).padStart(2, "0");
// The Tower A floor on screen: the one picked on the Floor Plans page, or on the tower panel.
// Every floor's homes are laid out as on the 8th floor's plan, so only the floor changes.
// `showView` opens the view from a home (its eye on the plan).
const FloorCtx = createContext({ floor: PLAN_FLOOR, setFloor: () => {}, showView: () => {} });
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
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  filter: "M4 6h16M7 12h10M10 18h4",
  lock: "M7.5 11V8a4.5 4.5 0 019 0v3M5.5 11h13v9.5h-13z",
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

// `badges`: an optional count shown on an option (by option), e.g. the homes in compare per wing
function Segmented({ value, options, onChange, label, disabled = [], badges = {} }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex rounded-lg border border-white/20 p-0.5 ${Object.values(badges).some((n) => n > 0) ? "gap-2" : ""}`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          disabled={disabled.includes(o)}
          onClick={() => onChange(o)}
          className={`relative min-w-8 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors disabled:opacity-30 sm:text-[11px] ${
            value === o ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {o}
          {badges[o] > 0 && (
            <span
              aria-label={`${badges[o]} in compare`}
              className={`absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold leading-none tracking-normal ${
                value === o ? "bg-white text-red-600" : "bg-red-600 text-white"
              }`}
            >
              {badges[o]}
            </span>
          )}
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
// Every home also carries an eye, out in the sheet's margin: it opens the view from that home.
function WingPlan({ wing, selectedId, compareIds = [], match, onPick }) {
  const w = WING_BY_ID[wing];
  const units = unitsIn(wing);
  const { floor, showView } = useContext(FloorCtx);

  return (
    <>
      <img src={w.plan} alt={`Wing ${wing}, floor ${floor} plan`} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
      <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} className="absolute inset-0 h-full w-full" role="group" aria-label={`Wing ${wing}: homes`}>
        {units.map((u) => {
          const on = u.id === selectedId;
          const compared = compareIds.includes(u.id);
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
              strokeDasharray={hold && !on && !compared ? "8 6" : undefined}
              className={`cursor-pointer outline-none transition-[fill,stroke] duration-200 ${
                on
                  ? "fill-red-600/30 stroke-red-600 [stroke-width:3]"
                  : compared
                    ? "fill-red-600/25 stroke-red-600 [stroke-width:2.5] hover:fill-red-600/35"
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

        {/* an eye on every home, out in the margin by its type label (not over the rooms): it
            opens the view from that home, full screen */}
        {units.map((u) => (
          <g
            key={`eye-${u.id}`}
            transform={`translate(${u.marker[0]} ${u.marker[1]})`}
            role="button"
            tabIndex={0}
            aria-label={`The view from ${u.id}`}
            className="group cursor-pointer outline-none"
            onClick={(e) => {
              e.stopPropagation();
              showView(u);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              showView(u);
            }}
          >
            <title>{`The view from ${u.id}`}</title>
            <circle
              r="17"
              className="fill-navy-950/85 stroke-white/70 transition-colors group-hover:fill-red-600 group-focus-visible:fill-red-600"
              strokeWidth="1.6"
            />
            <g className="pointer-events-none" stroke="#fff" fill="none" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M-10 0C-6.5-6 6.5-6 10 0 6.5 6-6.5 6-10 0Z" />
              <circle r="3.1" fill="#fff" stroke="none" />
            </g>
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

// The tower, as the Floor Plans page draws it, filling the panel beside the plan: every floor
// is an outline you can hover, and the one whose homes are on the plan (Tower A, floor 8) is
// lit in red and clicks back to the whole floor. The other floors have no plans in yet, so
// they only light on hover. This panel replaced the home's specs and its buttons: the home is
// named under the plan itself, so the panel's whole job is to place it in the building.
function TowerPanel({ wing, floorActive, onFloor }) {
  const boxRef = useRef(null);
  const { w, h } = useSize(boxRef);
  const [hover, setHover] = useState(null);
  const { floor, setFloor } = useContext(FloorCtx);
  // the render is cropped to fill the panel, so the outlines are placed the same way
  const scale = Math.max(w / VIEW_W, h / VIEW_H) || 1;
  const dx = (w - VIEW_W * scale) / 2;
  const dy = (h - VIEW_H * scale) / 2;
  const live = (f) => f.b === PLANS_TOWER && f.n === floor;
  const pickable = (f) => f.b === PLANS_TOWER;
  // a floor of the other tower, clicked: its plans aren't in yet, so a note says so for a
  // moment (`at` lets a second click on the same floor show it again)
  const [soon, setSoon] = useState(null);
  useEffect(() => {
    if (!soon) return;
    const t = setTimeout(() => setSoon(null), 2600);
    return () => clearTimeout(t);
  }, [soon]);

  return (
    <div ref={boxRef} className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-950">
      <img src={towerImg} alt="JP Infra tower" draggable={false} className="absolute inset-0 h-full w-full object-cover object-center" />
      {w > 0 && (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", left: dx, top: dy, width: VIEW_W * scale, height: VIEW_H * scale }}
          role="group"
          aria-label="The tower, floor by floor"
        >
          {ALL.map((f) => {
            const on = live(f);
            const lit = on
              ? floorActive
              : (hover && hover.b === f.b && hover.n === f.n) || (soon && soon.b === f.b && soon.n === f.n);
            return f.pieces.map((points, i) => (
              <polygon
                key={`${f.b}-${f.n}-${i}`}
                points={points}
                transform={`translate(${OFFSET})`}
                className="cursor-pointer"
                fill={on ? (floorActive ? "rgba(220,38,38,0.55)" : "rgba(220,38,38,0.3)") : lit ? "rgba(255,255,255,0.22)" : "transparent"}
                stroke={on ? "rgba(248,113,113,0.95)" : lit ? "rgba(255,255,255,0.6)" : "transparent"}
                strokeWidth={1.5 / scale}
                onPointerEnter={() => setHover({ b: f.b, n: f.n })}
                onPointerLeave={() => setHover(null)}
                onClick={on ? onFloor : pickable(f) ? () => setFloor(f.n) : () => setSoon({ b: f.b, n: f.n, at: Date.now() })}
              >
                <title>{`Tower ${f.b} · Floor ${pad(f.n)}${on ? " — the plans on screen" : pickable(f) ? "" : " — plans coming soon"}`}</title>
              </polygon>
            ));
          })}
        </svg>
      )}
      {/* the other tower's floors: coming soon */}
      {soon && (
        // below lg the panel is a short strip under the plan: the note sits at its top, clear of
        // the floor's name at its foot
        <div className="pointer-events-none absolute inset-0 grid items-start justify-items-center p-3 lg:items-center lg:p-4 short:items-center">
          <div
            key={soon.at}
            role="status"
            className="jp-caption-in flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/15 bg-navy-950/85 py-3 pl-3 pr-5 shadow-premium backdrop-blur-xl short:gap-2.5 short:py-2 short:pr-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/50 bg-red-600/15 text-red-500 short:h-8 short:w-8">
              <Icon d={ICONS.lock} className="h-4 w-4" />
            </span>
            <div>
              <span className={`${LABEL} whitespace-nowrap`}>
                Tower {soon.b} · Floor {pad(soon.n)}
              </span>
              <p className="mt-0.5 font-display text-2xl uppercase leading-none tracking-[0.04em] short:text-xl">
                Coming <span className="text-red-600">Soon</span>
              </p>
              <p className="mt-1 text-[10px] text-white/55 sm:text-[11px] max-sm:hidden short:hidden">Its floor plans will be added shortly.</p>
            </div>
          </div>
        </div>
      )}
      {/* which floor the plan beside it is, over the foot of the render */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-transparent px-4 pb-3.5 pt-12">
        <span className={LABEL}>Tower {PLANS_TOWER} · Wing {wing}</span>
        <p className="font-display text-2xl leading-none lg:text-3xl">Floor {pad(floor)}</p>
      </div>
    </div>
  );
}

// A drawing's own width and height, so its white sheet can be cut to it
function useImageRatio(src) {
  // kept with the src it was measured from, so a new drawing reads as unknown until it loads
  const [seen, setSeen] = useState({ src: null, ratio: null });
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setSeen({ src, ratio: img.naturalWidth / img.naturalHeight });
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return seen.src === src ? seen.ratio : null;
}

// The largest box of that shape that fits in w × h: the white sheet is cut to the drawing
// rather than filling the area, so no white margin is left down its sides.
const fitBox = (w, h, r) => {
  if (!w || !h) return null;
  if (!r) return { width: w, height: h };
  const width = Math.min(w, h * r);
  return { width, height: width / r };
};

// The Floor Plan tab: the wing's plan to pick homes on, or the chosen home's own plan
function PlanTab({ wing, setWing, view, setView, selectedId, setSelectedId, compareIds, filters, clearFilters }) {
  const { floor } = useContext(FloorCtx);
  const unit = selectedId ? UNIT_BY_ID.get(selectedId) : null;
  const filtered = !isDefault(filters);
  // the homes in compare on each wing (only the wing on screen shows them red)
  const inCompare = Object.fromEntries(WING_IDS.map((w) => [w, compareIds.filter((id) => UNIT_BY_ID.get(id)?.wing === w).length]));
  const showHome = view === "Home" && !!unit;
  const planRef = useRef(null);
  const area = useSize(planRef);
  const homeRatio = useImageRatio(showHome ? unit.image : null);
  const box = fitBox(area.w, area.h, showHome ? homeRatio : PLAN_W / PLAN_H);
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,33%)] lg:grid-rows-1 lg:gap-8 short:grid-cols-[minmax(0,1fr)_minmax(240px,32%)] short:grid-rows-1 short:gap-4">
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
              badges={inCompare}
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">Floor {pad(floor)}</span>
            {/* homes in compare on the other wing are red on its plan, not this one: say so */}
            {WING_IDS.filter((w) => w !== wing && inCompare[w] > 0).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setWing(w);
                  if (unit?.wing !== w) setSelectedId(null);
                  setView("Floor");
                }}
                className="rounded-full border border-red-500/60 bg-red-600/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/85 transition-colors hover:bg-red-600/25 sm:text-[10px]"
              >
                +{inCompare[w]} in compare on Wing {w} →
              </button>
            ))}
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
        {/* the plan takes whatever height is left, its sheet cut to the drawing's own shape */}
        <div ref={planRef} className="relative mt-3 flex min-h-0 flex-1 items-center justify-center short:mt-2">
          {box && (
            <div className="relative" style={{ width: box.width, height: box.height }}>
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
                    onPick={(id) => {
                      // picking a home opens its own plan over the floor; "Floor" goes back
                      const next = id === selectedId ? null : id;
                      setSelectedId(next);
                      setView(next ? "Home" : "Floor");
                    }}
                  />
                </ZoomBox>
              )}
            </div>
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
      {/* below lg the tower sits under the plan, so it is given a height of its own there */}
      <aside className="h-44 min-h-0 overflow-hidden rounded-2xl shadow-premium sm:h-56 lg:h-auto short:h-auto short:self-stretch">
        <TowerPanel wing={wing} floorActive={!showHome} onFloor={() => setView("Floor")} />
      </aside>
    </div>
  );
}

// ---- Filter Units --------------------------------------------------------------------------

// Every home as a card with its own plan, as many as fit (in pages, never a scroll): tick a
// card's box to add it to the comparison; the card itself opens the home on the floor plan.
const CARD_MIN_W = 240; // a card's narrowest
const PLAN_MIN_H = 170; // the plan in it never gets shorter than this
const CARD_TEXT_H = 64; // its name and size, under the plan
const GRID_GAP = 14;

// How n results fill w × h: the columns and rows that show the most homes per page with
// every plan still readable, and among those, the one with the largest plans.
function cardGrid(w, h, n) {
  // on a short or narrow area the cards give way rather than spill out of it
  const minH = Math.min(PLAN_MIN_H, Math.max(90, h - CARD_TEXT_H));
  const minW = Math.min(CARD_MIN_W, w);
  let best = { cols: 1, rows: 1, planH: Math.max(minH, h - CARD_TEXT_H) };
  let bestShown = 0;
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const cardW = (w - GRID_GAP * (cols - 1)) / cols;
    if (cols > 1 && cardW < minW) break;
    for (let rows = 1; (rows - 1) * cols < n; rows++) {
      const planH = Math.min(cardW * 0.8, (h - GRID_GAP * (rows - 1)) / rows - CARD_TEXT_H);
      if (planH < minH) break;
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

// The homes picked for comparison, kept under the filters: each one a chip you can drop,
// and the way through to the comparison itself. Without it the only sign that a home had
// been picked was a count in the corner, so a visitor three homes in had nothing to read
// back. Holds its height when empty so the filters above don't jump as homes go in and out.
function ComparePicks({ compareIds, toggleCompare, clearCompare, onCompare }) {
  const picked = compareIds.map((id) => UNIT_BY_ID.get(id)).filter(Boolean);
  return (
    <div className="border-t border-white/10 pt-[min(12px,1.6vh)] short:pt-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className={LABEL}>
          Compare ({picked.length}/{MAX_COMPARE})
        </p>
        <button
          type="button"
          onClick={clearCompare}
          disabled={!picked.length}
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-white disabled:opacity-30"
        >
          Clear
        </button>
      </div>

      <div className="mt-1.5 flex min-h-[26px] flex-wrap gap-1.5">
        {picked.length === 0 ? (
          <p className="text-[10px] leading-[26px] text-white/35">Tick up to {MAX_COMPARE} homes to compare them.</p>
        ) : (
          picked.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1.5 rounded-full border border-red-500/60 bg-red-600/15 py-1 pl-2.5 pr-1.5 text-[10px] font-semibold tracking-[0.08em] text-white"
            >
              {u.id} <span className="text-white/40">—</span> {u.type}
              <button
                type="button"
                onClick={() => toggleCompare(u.id)}
                aria-label={`Remove ${u.id} from compare`}
                className="grid h-4 w-4 place-items-center rounded-full text-white/60 transition-colors hover:bg-red-600 hover:text-white"
              >
                <Icon d={ICONS.close} className="h-2.5 w-2.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onCompare}
        disabled={picked.length < 2}
        title={picked.length < 2 ? "Pick at least two homes to compare" : undefined}
        className="mt-2.5 w-full rounded-lg bg-red-600 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        Compare now
      </button>
    </div>
  );
}

function FilterPanel({ filters, set, count, sort, setSort, onDone, compareIds, toggleCompare, clearCompare, onCompare }) {
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
      <div className="short:col-span-2">
        <ComparePicks compareIds={compareIds} toggleCompare={toggleCompare} clearCompare={clearCompare} onCompare={onCompare} />
      </div>
    </div>
  );
}

// A home in the results: its plan, a tick box to compare it, its status, its name and size
function UnitCard({ u, planH, inCompare, compareFull, toggleCompare, showOnPlan }) {
  const { floor } = useContext(FloorCtx);
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
          <span className="font-semibold text-white/85">{sqft(u.carpet)}</span> carpet · Wing {u.wing} · Floor {pad(floor)}
          {u.code ? ` · ${u.code}` : ""}
        </p>
      </div>
    </li>
  );
}

function FilterTab({ filters, setFilters, compareIds, toggleCompare, clearCompare, showOnPlan, goTo }) {
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
          compareIds={compareIds}
          toggleCompare={toggleCompare}
          clearCompare={clearCompare}
          onCompare={() => goTo("units")}
        />
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div aria-live="polite">
            <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/55 sm:text-[10px] short:hidden">
              <span className="h-px w-5 bg-red-600" />
              Search by unit
            </span>
            <p className="mt-1 font-display text-3xl uppercase leading-none text-white sm:text-4xl short:mt-0 short:text-2xl">
              {results.length} {results.length === 1 ? "residence" : "residences"}
            </p>
            <p className="mt-1 text-[11px] text-white/45">{available} available</p>
          </div>
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

// A comparison table: a card per home across the top, then one row per fact underneath.
// Rows whose values differ carry a red dot so the differences stand out, and the largest
// number in such a row is red. The cards hold the plans; the rows hold the facts.
function CompareTable({ columns, rows, head }) {
  // the label column is kept narrow and the rows tight: every pixel they give up is a pixel
  // the plans above them grow by, and the plans are what the comparison is really about
  const cols = `minmax(78px,0.4fr) repeat(${columns.length}, minmax(0,1fr))`;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-2.5 sm:gap-3" style={{ gridTemplateColumns: cols }}>
        <div />
        {columns.map((c, i) => (
          <div key={i} className="flex min-h-0 min-w-0 flex-col">
            {head(c, i)}
          </div>
        ))}
      </div>
      <div className="mt-2 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/[0.02] short:mt-1.5">
        {rows.map(([label, get, best], r) => {
          const values = columns.map(get);
          const differs = new Set(values.map(String)).size > 1;
          const bestValue = best && differs ? Math.max(...columns.map(best)) : null;
          return (
            <div
              key={label}
              className={`grid items-center gap-2.5 px-3 py-[min(4px,0.55vh)] sm:gap-3 short:py-[2px] ${
                r % 2 ? "bg-white/[0.025]" : ""
              }`}
              style={{ gridTemplateColumns: cols }}
            >
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50 sm:text-[10px] sm:tracking-[0.2em]">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${differs ? "bg-red-600" : "bg-white/15"}`} title={differs ? "Differs" : undefined} />
                {label}
              </span>
              {columns.map((c, i) => (
                <span
                  key={i}
                  className={`min-w-0 truncate text-[11px] font-semibold leading-snug tabular-nums sm:text-[13px] short:text-[11px] ${
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
      <p className="mt-1.5 flex shrink-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40 short:hidden">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Differs
        <span className="ml-2.5 text-red-500">Red</span> Largest
      </p>
    </div>
  );
}

// A home's card above the table: its name, what it is, and its plan on a white sheet cut to
// the drawing's own shape — the plans used to be stretched across the column, wide and flat.
function CompareHead({ unit, action, onImage }) {
  const boxRef = useRef(null);
  const { w, h } = useSize(boxRef);
  const ratio = useImageRatio(unit.image);
  const box = fitBox(w, h, ratio);
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] transition-colors hover:border-white/30">
      {/* the name and the status share one line, so the plan below keeps the height */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-2.5 pt-2.5 short:px-2 short:pt-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="truncate font-display text-lg leading-none sm:text-2xl short:text-base">{unit.id}</p>
          <span className="truncate text-[10px] text-white/50">{typeName(unit)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="short:hidden">
            <StatusBadge status={unit.status} />
          </span>
          {action}
        </div>
      </div>
      {/* the plan: measured padding-free, so the sheet fits the room exactly */}
      <div className="min-h-0 flex-1 px-2.5 pb-2.5 pt-1.5 short:hidden">
        <div ref={boxRef} className="flex h-full w-full items-center justify-center">
          {box && (
            <button
              type="button"
              onClick={onImage}
              aria-label={`${unit.id}: open it on the floor plan`}
              className="group relative overflow-hidden rounded-xl bg-white shadow-premium"
              style={{ width: box.width, height: box.height }}
            >
              <img src={unit.image} alt="" className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Comparing homes has two panels: the plans themselves, and the views from Tower A (either
// wing, any height). The view belongs here because it is one more way of telling two homes
// apart — it used to be a tab of its own, which offered it everywhere, including where
// nothing was being compared.
function UnitsTab({ compareIds, toggleCompare, goTo, showOnPlan, panel, setPanel, sides, setSides }) {
  const { floor } = useContext(FloorCtx);
  const units = compareIds.map((id) => UNIT_BY_ID.get(id)).filter(Boolean);
  if (!units.length) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <p className="text-sm leading-relaxed text-white/65">
          Add up to {MAX_COMPARE} homes to compare them side by side: pick them on the floor plan or from the filter results.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Chip onClick={() => goTo("plan")}>Visual Selection</Chip>
          <Chip onClick={() => goTo("filter")}>Search by Unit</Chip>
        </div>
      </div>
    );
  }
  const panels = (
    <div className="mb-2 flex shrink-0 justify-center short:mb-1.5">
      <Segmented label="What to compare" value={panel} onChange={setPanel} options={PANELS} />
    </div>
  );
  if (panel === "Views") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {panels}
        <div className="min-h-0 flex-1">
          <ViewsTab units={units} sides={sides} setSides={setSides} />
        </div>
      </div>
    );
  }
  // the largest home in the comparison, for the row that reads each one against it
  const largest = Math.max(...units.map((u) => u.carpet));
  const sqm = (n) => `${(n * 0.092903).toFixed(1)} sq m`;
  const rows = [
    ["Wing", (u) => u.wing],
    ["Floor", () => pad(floor)],
    ["Configuration", (u) => u.type],
    ["Plan type", (u) => u.code ?? "—"],
    ["Bedrooms", (u) => u.bed, (u) => u.bed],
    ["Carpet area", (u) => sqft(u.carpet), (u) => u.carpet],
    ["Carpet (metric)", (u) => sqm(u.carpet), (u) => u.carpet],
    ["Per bedroom", (u) => sqft(Math.round(u.carpet / u.bed)), (u) => Math.round(u.carpet / u.bed)],
    ["Against largest", (u) => (u.carpet === largest ? "Largest" : `−${sqft(largest - u.carpet)}`), (u) => u.carpet],
    ["Status", (u) => u.status],
  ];
  return (
    <div className="flex h-full min-h-0 flex-col">
      {panels}
      <div className="min-h-0 flex-1">
        <CompareTable
          columns={units}
          rows={rows}
          head={(u) => (
            <CompareHead
              unit={u}
              onImage={() => showOnPlan(u, "Home")}
              action={
                <button
                  type="button"
                  aria-label={`Remove ${u.id} from compare`}
                  onClick={() => toggleCompare(u.id)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:border-red-500 hover:bg-red-600/20 sm:h-7 sm:w-7"
                >
                  <Icon d={ICONS.close} className="h-3 w-3" />
                </button>
              }
            />
          )}
        />
      </div>
    </div>
  );
}


// ---- Compare Views: the view from each home in the comparison, turning together ---------------

// the side a view looks out from (data/towerViews.js, facingScene), as its switch names them
const SIDES = ["Front", "Back"];
// the views laid out by how many homes are compared: stacked on phones, side by side from md
// (and on phones turned sideways)
const VIEW_GRID = {
  1: "grid-rows-1",
  2: "grid-rows-2 md:grid-cols-2 md:grid-rows-1 short:grid-cols-2 short:grid-rows-1",
  3: "grid-rows-3 md:grid-cols-3 md:grid-rows-1 short:grid-cols-3 short:grid-rows-1",
};

// One view per home in the comparison, in the same order as Plans: the view from that home's
// own wing and floor, looking out from its own side of the building (the front, the mountains;
// or the back). Each can be switched to the other side (`sides` holds those choices, by home).
function ViewsTab({ units, sides, setSides }) {
  const { floor } = useContext(FloorCtx);
  const link = useRef({ views: {}, centres: {}, on: true, lock: false });
  const [together, setTogether] = useState(true);
  useEffect(() => {
    link.current.on = together;
  }, [together]);
  const register = useCallback((id, view, centre = 0) => {
    link.current.views[id] = view;
    link.current.centres[id] = centre;
  }, []);
  // turning one view turns the others too (while "Turn together" is on); a view looking out
  // from the other side of the building turns the same amount about its own side
  const onTurn = useCallback((id, view) => {
    const l = link.current;
    if (!l.on || l.lock || l.views[id] !== view) return;
    l.lock = true;
    for (const [o, other] of Object.entries(l.views)) {
      if (o === id || !other) continue;
      const turn = (l.centres[o] ?? 0) - (l.centres[id] ?? 0);
      other.setParameters({ yaw: view.yaw() + turn, pitch: view.pitch(), fov: view.fov() });
    }
    l.lock = false;
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/65 sm:text-sm">The view from each home you are comparing. Switch any to its front or back, and drag one to look around.</p>
        {units.length > 1 && (
          <label className="flex cursor-pointer items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-[11px]">
            <input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} className="h-4 w-4 accent-red-600" />
            Turn together
          </label>
        )}
      </div>
      <div className={`mt-3 grid min-h-0 flex-1 gap-3 short:mt-2 ${VIEW_GRID[units.length]}`}>
        {units.map((u) => {
          const v = viewFor(u.wing, floor);
          const facing = sides[u.id] ?? u.faces;
          return (
            <div key={u.id} className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-2.5 sm:p-3 short:p-2">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
                <p className="flex min-w-0 items-baseline gap-2">
                  <span className="font-display text-xl leading-none sm:text-2xl short:text-lg">{u.id}</span>
                  <span className="truncate text-[10px] text-white/55 sm:text-[11px]">{typeName(u)}</span>
                </p>
                <Segmented
                  value={facing === "back" ? "Back" : "Front"}
                  options={SIDES}
                  onChange={(s) => setSides((all) => ({ ...all, [u.id]: s.toLowerCase() }))}
                  label={`${u.id}: front or back view`}
                />
              </div>
              <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-xl bg-navy-950">
                <PanoPane scene={facingScene(v.scene, facing)} side={u.id} register={register} onTurn={onTurn} />
                <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-navy-950/75 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur sm:text-[10px]">
                  Wing {u.wing} · {v.label} · {facing === "back" ? "Back" : "Front"} view
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

export default function FloorPlanStudio({ startWing = WING_IDS[0], startTab = "plan", startFloor = PLAN_FLOOR, onClose }) {
  const [floor, setFloor] = useState(startFloor);
  const [tab, setTab] = useState(startTab);
  const [wing, setWing] = useState(startWing);
  const [selectedId, setSelectedId] = useState(null);
  // the Floor Plan tab shows the whole floor; "Home" is the chosen home's own plan
  const [planView, setPlanView] = useState("Floor");
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // Compare Units' views: the side (front or back) each compared home's view was switched to
  const [viewSides, setViewSides] = useState({});
  // which panel of Compare Units is showing: the homes, or the view out of them
  const [comparePanel, setComparePanel] = useState(PANELS[0]);
  // the home whose view is open (its eye on the plan), full screen over this screen
  const [viewing, setViewing] = useState(null);
  const active = TABS.find((t) => t.id === tab);

  // Esc closes that view only: caught before the Floor Plans page's own Esc, which would
  // close this whole screen
  useEffect(() => {
    if (!viewing) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setViewing(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [viewing]);

  const toggleCompare = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]));
  const showOnPlan = (u, view = "Floor") => {
    setWing(u.wing);
    setSelectedId(u.id);
    setPlanView(view);
    setTab("plan");
  };

  return (
    <FloorCtx.Provider value={{ floor, setFloor, showView: setViewing }}>
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
        {NAV_TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={t.label}
              onClick={() => setTab(t.id)}
              className={`flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors max-sm:flex-1 sm:px-3.5 sm:py-2 sm:text-[11px] sm:tracking-[0.16em] short:flex-1 short:px-2 short:py-1 ${
                on ? "border-red-600 bg-red-600 text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
            >
              {/* short labels on phones and on short (landscape) screens */}
              <span className="sm:hidden short:!inline">{t.short}</span>
              <span className="max-sm:hidden short:!hidden">{t.label}</span>
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
            filters={filters}
            clearFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        )}
        {tab === "filter" && (
          <FilterTab
            filters={filters}
            setFilters={setFilters}
            compareIds={compareIds}
            toggleCompare={toggleCompare}
            clearCompare={() => setCompareIds([])}
            showOnPlan={showOnPlan}
            goTo={setTab}
          />
        )}
        {tab === "units" && (
          <UnitsTab
            compareIds={compareIds}
            toggleCompare={toggleCompare}
            goTo={setTab}
            showOnPlan={showOnPlan}
            panel={comparePanel}
            setPanel={setComparePanel}
            sides={viewSides}
            setSides={setViewSides}
          />
        )}
      </div>

      {/* The view from a home, opened from its eye on the plan: always the 8th floor's, the
          floor these plans are drawn for, whatever floor the screen is set to. */}
      {viewing && <TowerView floor={PLAN_FLOOR} startWing={viewing.wing} home={viewing} onClose={() => setViewing(null)} />}
    </div>
    </FloorCtx.Provider>
  );
}
