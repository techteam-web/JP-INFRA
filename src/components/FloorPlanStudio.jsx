import { useCallback, useEffect, useRef, useState } from "react";
import Marzipano from "marzipano";
import { useSize } from "../hooks/useSize";
import { APP_DATA } from "../data/data";
import { SAMPLE_DATA, TOWERS, FLOORS, TYPES, FACINGS, UNITS, UNIT_BY_ID, unitsOn, viewFor } from "../data/units";

// The Floor Plan screen (Explore Units), over the Floor Plans page: five tabs, all reading
// the unit list in data/units.js —
//   Floor Plan      visual selection: the floor's homes on a plan drawing; pick one for its details
//   Filter Units    narrow every home down by tower, type, size, facing, floor and availability
//   Compare Units   up to three homes side by side
//   Compare Floors  two floors side by side
//   Compare Views   the view from two floors side by side, turning together
// Nothing on it scrolls: every tab is laid out to fit the screen (results come in pages).
const TABS = [
  { id: "plan", label: "Floor Plan", short: "Plan", title: ["Floor", "Plan"] },
  { id: "filter", label: "Filter Units", short: "Filter", title: ["Find Your", "Home"] },
  { id: "units", label: "Compare Units", short: "Units", title: ["Compare", "Units"] },
  { id: "floors", label: "Compare Floors", short: "Floors", title: ["Compare", "Floors"] },
  { id: "views", label: "Compare Views", short: "Views", title: ["Compare", "Views"] },
];
const MAX_COMPARE = 3;

const pad = (n) => String(n).padStart(2, "0");
const sqft = (n) => `${n.toLocaleString("en-IN")} sq ft`;
const FLOOR_LIST = Array.from({ length: FLOORS }, (_, i) => i + 1);

// ---- Filters ----------------------------------------------------------------------------

const AREAS = [
  { id: "all", label: "Any size" },
  { id: "s", label: "Under 750", test: (a) => a < 750 },
  { id: "m", label: "750 – 1,000", test: (a) => a >= 750 && a <= 1000 },
  { id: "l", label: "Over 1,000", test: (a) => a > 1000 },
];
const DEFAULT_FILTERS = { tower: "All", types: [], facings: [], area: "all", from: 1, to: FLOORS, availableOnly: false };
const isDefault = (f) => JSON.stringify(f) === JSON.stringify(DEFAULT_FILTERS);
const activeCount = (f) =>
  (f.tower !== "All") + (f.types.length > 0) + (f.facings.length > 0) + (f.area !== "all") + (f.from !== 1 || f.to !== FLOORS) + f.availableOnly;
const matcher = (f) => (u) =>
  (f.tower === "All" || u.tower === f.tower) &&
  (!f.types.length || f.types.includes(u.type)) &&
  (!f.facings.length || f.facings.includes(u.facing)) &&
  (f.area === "all" || AREAS.find((a) => a.id === f.area).test(u.carpet)) &&
  u.floor >= f.from &&
  u.floor <= f.to &&
  (!f.availableOnly || u.status === "Available");
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
};

const LABEL = "text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:text-[10px] sm:tracking-[0.25em]";
const SELECT =
  "rounded-lg border border-white/20 bg-navy-950 px-2.5 py-1.5 text-xs font-semibold text-white outline-none transition-colors focus:border-red-600";

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

function Segmented({ value, options, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-white/20 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`min-w-8 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors sm:text-[11px] ${
            value === o ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// Tower + floor picker: tower toggle, then the floor with steps either side (`narrow`: the
// steps hide on phones, where a comparison column has no room for them)
function FloorPicker({ value, onChange, label = "Floor", narrow = false }) {
  const step = `grid h-7 w-7 place-items-center transition-colors hover:bg-white/10 disabled:opacity-30 ${narrow ? "max-sm:hidden" : ""}`;
  const set = (b, n) => onChange({ b, n: Math.min(FLOORS, Math.max(1, n)) });
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Segmented value={value.b} options={TOWERS} onChange={(b) => set(b, value.n)} label="Tower" />
      <div className="flex items-center rounded-lg border border-white/20">
        <button
          type="button"
          aria-label="Floor below"
          onClick={() => set(value.b, value.n - 1)}
          disabled={value.n === 1}
          className={`${step} rounded-l-lg`}
        >
          <Icon d={ICONS.down} className="h-3.5 w-3.5" />
        </button>
        <select
          aria-label={label}
          value={value.n}
          onChange={(e) => set(value.b, Number(e.target.value))}
          className="h-7 appearance-none bg-transparent px-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white outline-none sm:text-[11px]"
        >
          {FLOOR_LIST.map((n) => (
            <option key={n} value={n} className="bg-navy-950">
              Floor {pad(n)}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Floor above"
          onClick={() => set(value.b, value.n + 1)}
          disabled={value.n === FLOORS}
          className={`${step} rounded-r-lg`}
        >
          <Icon d={ICONS.up} className="h-3.5 w-3.5" />
        </button>
      </div>
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


// ---- The plan drawing -----------------------------------------------------------------------

// Where each home sits on the plan drawing (1000 × 600): three on the garden side, three on
// the city side, the corridor and lift core between them.
const SLOTS = {
  tl: { x: 60, y: 70, w: 300, h: 200, top: true },
  tc: { x: 360, y: 70, w: 280, h: 200, top: true },
  tr: { x: 640, y: 70, w: 300, h: 200, top: true },
  bl: { x: 60, y: 330, w: 300, h: 200, top: false },
  bc: { x: 360, y: 330, w: 280, h: 200, top: false },
  br: { x: 640, y: 330, w: 300, h: 200, top: false },
};

// `className` sizes it; the drawing keeps its proportions inside that box
function PlanDrawing({ units, selectedId, compareIds = [], match, onPick, label, compact = false, className = "block h-auto w-full" }) {
  const side = "fill-white/40 text-[15px] font-semibold uppercase tracking-[0.35em]";
  return (
    <svg viewBox="0 0 1000 600" role="group" aria-label={label} className={`select-none ${className}`}>
      {!compact && (
        <>
          <text x="500" y="46" textAnchor="middle" className={side}>
            Garden side
          </text>
          <text x="500" y="572" textAnchor="middle" className={side}>
            City side
          </text>
          <text transform="translate(975 300) rotate(90)" textAnchor="middle" className={side}>
            Hills side
          </text>
        </>
      )}
      <rect x="60" y="70" width="880" height="460" rx="10" className="fill-white/[0.02] stroke-white/25" strokeWidth="2" />
      <rect x="60" y="270" width="880" height="60" className="fill-white/[0.035]" />
      {!compact && (
        <text x="210" y="305" textAnchor="middle" className="fill-white/30 text-[13px] font-semibold uppercase tracking-[0.35em]">
          Corridor
        </text>
      )}

      {units.map((u) => {
        const s = SLOTS[u.slot];
        const on = u.id === selectedId;
        const dim = match && !match(u);
        const sold = u.status === "Sold";
        const hold = u.status === "On Hold";
        const inCompare = compareIds.includes(u.id);
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2 + (s.top ? 14 : -14);
        const fill = on ? "fill-red-600/30" : sold ? "fill-white/[0.015]" : "fill-white/[0.06]";
        const stroke = on ? "stroke-red-600" : sold ? "stroke-white/15" : "stroke-white/45";
        const pick = onPick ? () => onPick(u.id) : undefined;
        return (
          <g
            key={u.id}
            role={pick ? "button" : undefined}
            tabIndex={pick ? 0 : undefined}
            aria-label={pick ? `Home ${u.id}, ${u.type}, ${sqft(u.carpet)}, ${u.status}` : undefined}
            aria-pressed={pick ? on : undefined}
            onClick={pick}
            onKeyDown={pick && ((e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick()))}
            opacity={dim ? 0.2 : 1}
            className={`group outline-none transition-opacity duration-300 ${pick ? "cursor-pointer" : ""}`}
          >
            <rect
              x={s.x + 6}
              y={s.y + 6}
              width={s.w - 12}
              height={s.h - 12}
              rx="6"
              strokeWidth={on ? 3 : 1.5}
              strokeDasharray={hold && !on ? "9 7" : undefined}
              className={`${fill} ${stroke} transition-colors duration-200 ${
                pick && !on ? "group-hover:fill-white/[0.13] group-focus-visible:fill-white/[0.13]" : ""
              }`}
            />
            {/* balcony along the outer edge */}
            <rect
              x={s.x + 18}
              y={s.top ? s.y + 18 : s.y + s.h - 18 - 24}
              width={s.w - 36}
              height="24"
              rx="3"
              strokeDasharray="5 5"
              className="fill-white/[0.04] stroke-white/20"
            />
            <text x={cx} y={cy - 8} textAnchor="middle" className={`font-display text-[44px] ${sold ? "fill-white/35" : "fill-white"}`}>
              {u.floor}
              {pad(u.no)}
            </text>
            {!compact && (
              <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                // too small to read on a phone-width plan: the details panel has it there
                className={`text-[15px] font-semibold uppercase tracking-[0.15em] max-sm:hidden ${sold ? "fill-white/30" : "fill-white/70"}`}
              >
                {u.type} · {u.carpet}
                {sold ? " · Sold" : hold ? " · On hold" : ""}
              </text>
            )}
            {inCompare && (
              <g transform={`translate(${s.x + s.w - 30} ${s.top ? s.y + s.h - 30 : s.y + 30})`}>
                <circle r="13" className="fill-red-600" />
                <path d="M-6 0.5l4 4 8-8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        );
      })}

      {/* lift core */}
      <rect x="450" y="248" width="100" height="104" rx="6" className="fill-navy-950 stroke-white/35" strokeWidth="1.5" />
      <rect x="464" y="262" width="32" height="32" rx="3" className="fill-none stroke-white/30" />
      <rect x="504" y="262" width="32" height="32" rx="3" className="fill-none stroke-white/30" />
      {!compact && (
        <text x="500" y="328" textAnchor="middle" className="fill-white/45 text-[12px] font-bold uppercase tracking-[0.3em]">
          Lifts
        </text>
      )}
    </svg>
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
      {item("border-white/50 bg-white/10", "Available")}
      {item("border-white/50 bg-white/10", "On hold", true)}
      {item("border-white/15 bg-white/[0.02]", "Sold")}
      {item("border-red-600 bg-red-600/30", "Selected")}
      <span className="flex items-center gap-1.5">
        <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-red-600">
          <Icon d={ICONS.check} className="h-2 w-2" />
        </span>
        In compare
      </span>
    </div>
  );
}

// ---- Floor Plan ------------------------------------------------------------------------------

function UnitDetails({ unit, inCompare, compareFull, onCompare, onViews, emptyText = "Select a home on the plan to see its details." }) {
  if (!unit) {
    return <p className="text-xs leading-relaxed text-white/60 sm:text-sm">{emptyText}</p>;
  }
  const specs = [
    ["Type", unit.type],
    ["Carpet", sqft(unit.carpet)],
    ["Balcony", sqft(unit.balcony)],
    ["Bedrooms", unit.bed],
    ["Bathrooms", unit.bath],
    ["Facing", unit.facing],
  ];
  const btn =
    "btn-fill flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-transform active:scale-95 disabled:opacity-40 sm:tracking-[0.16em] lg:py-2.5 lg:text-[11px]";
  return (
    <div key={unit.id} className="jp-caption-in">
      <span className={LABEL}>
        Tower {unit.tower} · Floor {pad(unit.floor)}
      </span>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="font-display text-3xl leading-none lg:text-5xl short:text-2xl">{unit.id}</span>
        <StatusBadge status={unit.status} />
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-1.5 lg:mt-5 lg:grid-cols-2 lg:gap-y-3 short:mt-1.5 short:grid-cols-3 short:gap-x-2 short:gap-y-1">
        {specs.map(([k, v]) => (
          <div key={k} className="border-t border-white/10 pt-1 lg:pt-2 short:pt-0.5">
            <dt className={`${LABEL} short:tracking-[0.1em]`}>{k}</dt>
            <dd className="text-xs font-semibold lg:mt-0.5 lg:text-sm short:text-[10px]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-6 lg:grid-cols-1 short:mt-2 short:grid-cols-1 short:gap-1.5 short:[&>button]:py-1.5">
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
          <span className="lg:hidden">Floor View</span>
          <span className="max-lg:hidden">View From This Floor</span>
          <Icon d={ICONS.arrow} className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// The architect's drawing, zoomable inside its box (no scrolling): scroll or pinch to zoom
// in where the pointer is, drag to move around, double-click to zoom in or back out.
const MAX_ZOOM = 6;
function ZoomImage({ src, alt }) {
  const boxRef = useRef(null);
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);

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
    boxRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
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
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt(d / pinch.current, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      pinch.current = d;
    } else if (pointers.current.size === 1) {
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
        onWheel={(e) => zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, ...local(e))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => (z.s > 1 ? setZ({ s: 1, x: 0, y: 0 }) : zoomAt(2.5, ...local(e)))}
        className={`absolute inset-0 touch-none select-none ${z.s > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})`, transformOrigin: "0 0" }}
        />
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
          aria-label="Fit the whole floor"
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

function PlanTab({ at, setAt, view, setView, selectedId, setSelectedId, compareIds, toggleCompare, filters, clearFilters, drawingFor, openViews }) {
  const units = unitsOn(at.b, at.n);
  const unit = selectedId ? UNIT_BY_ID.get(selectedId) : null;
  const filtered = !isDefault(filters);
  const drawing = drawingFor?.(at.b, at.n);
  const showDrawing = !!drawing && view === "Drawing";
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-10 short:grid-cols-[minmax(0,1fr)_250px] short:grid-rows-1 short:gap-4">
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <FloorPicker
            value={at}
            onChange={(v) => {
              setAt(v);
              setSelectedId(null);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            {filtered && !showDrawing && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Filter on · Clear <Icon d={ICONS.close} className="h-3 w-3" />
              </button>
            )}
            {/* the architect's drawing, or the homes to pick from */}
            {drawing && <Segmented value={showDrawing ? "Drawing" : "Units"} options={["Drawing", "Units"]} onChange={setView} label="Drawing or units" />}
          </div>
        </div>
        {/* the plan fills whatever height is left */}
        <div className="relative mt-3 min-h-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.02] short:mt-2">
          {showDrawing ? (
            <ZoomImage key={drawing} src={drawing} alt={`Tower ${at.b} typical floor plan`} />
          ) : (
            <PlanDrawing
              units={units}
              selectedId={selectedId}
              compareIds={compareIds}
              match={filtered ? matcher(filters) : null}
              onPick={(id) => setSelectedId(id === selectedId ? null : id)}
              label={`Tower ${at.b}, floor ${at.n}: homes`}
              className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] sm:inset-3 sm:h-[calc(100%-1.5rem)] sm:w-[calc(100%-1.5rem)]"
            />
          )}
        </div>
        <div className="mt-2.5 shrink-0 short:hidden">
          {showDrawing ? (
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-[10px]">
              Tower {at.b} · Typical floor plan — scroll or pinch to zoom, drag to move
            </p>
          ) : (
            <Legend />
          )}
        </div>
      </div>
      <aside className="min-h-0 overflow-hidden rounded-2xl border border-white/15 bg-navy-950/60 p-3.5 shadow-premium sm:p-5 lg:self-start short:self-stretch short:p-3">
        <UnitDetails
          unit={unit}
          inCompare={!!unit && compareIds.includes(unit.id)}
          compareFull={compareIds.length >= MAX_COMPARE}
          onCompare={() => toggleCompare(unit.id)}
          onViews={() => openViews(unit)}
          emptyText={showDrawing ? "This is the typical floor plan. Switch to Units to pick a home and see its details." : undefined}
        />
      </aside>
    </div>
  );
}

// ---- Filter Units --------------------------------------------------------------------------

const CARD_H = 112; // a result card's height (px); the grid shows as many as fit, in pages
const CARD_MIN_W = 250;
const GRID_GAP = 10;

function FilterPanel({ filters, set, onDone }) {
  const group = (title, children) => (
    <div>
      <p className={LABEL}>{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
  return (
    <div className="grid content-start gap-x-6 gap-y-[min(14px,1.8vh)] sm:grid-cols-2 lg:grid-cols-1 short:grid-cols-3 short:gap-y-2">
      {group(
        "Tower",
        ["All", ...TOWERS].map((t) => (
          <Chip key={t} on={filters.tower === t} onClick={() => set({ tower: t })}>
            {t === "All" ? "Both" : `Tower ${t}`}
          </Chip>
        )),
      )}
      {group(
        "Type",
        TYPES.map((t) => (
          <Chip key={t} on={filters.types.includes(t)} onClick={() => set({ types: toggleIn(filters.types, t) })}>
            {t}
          </Chip>
        )),
      )}
      {group(
        "Carpet area (sq ft)",
        AREAS.map((a) => (
          <Chip key={a.id} on={filters.area === a.id} onClick={() => set({ area: a.id })}>
            {a.label}
          </Chip>
        )),
      )}
      {group(
        "Facing",
        FACINGS.map((f) => (
          <Chip key={f} on={filters.facings.includes(f)} onClick={() => set({ facings: toggleIn(filters.facings, f) })}>
            {f}
          </Chip>
        )),
      )}
      {group(
        "Floors",
        <div className="flex items-center gap-2">
          <select aria-label="From floor" value={filters.from} onChange={(e) => set({ from: Math.min(Number(e.target.value), filters.to) })} className={SELECT}>
            {FLOOR_LIST.map((n) => (
              <option key={n} value={n}>
                {pad(n)}
              </option>
            ))}
          </select>
          <span className="text-xs text-white/50">to</span>
          <select aria-label="To floor" value={filters.to} onChange={(e) => set({ to: Math.max(Number(e.target.value), filters.from) })} className={SELECT}>
            {FLOOR_LIST.map((n) => (
              <option key={n} value={n}>
                {pad(n)}
              </option>
            ))}
          </select>
        </div>,
      )}
      <div className="flex flex-col justify-end gap-2">
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

function FilterTab({ filters, setFilters, compareIds, toggleCompare, showOnPlan }) {
  const [page, setPage] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false); // below lg the filters open over the results
  const gridRef = useRef(null);
  const { w, h } = useSize(gridRef);
  const set = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const results = UNITS.filter(matcher(filters));
  const available = results.filter((u) => u.status === "Available").length;
  const full = compareIds.length >= MAX_COMPARE;
  const cols = Math.max(1, Math.floor((w + GRID_GAP) / (CARD_MIN_W + GRID_GAP)));
  const rows = Math.max(1, Math.floor((h + GRID_GAP) / (CARD_H + GRID_GAP)));
  const perPage = cols * rows;
  const pages = Math.max(1, Math.ceil(results.length / perPage));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * perPage, (current + 1) * perPage);
  const active = activeCount(filters);

  return (
    <div className="relative grid h-full gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
      {/* filters: a column from lg up; below it, a panel over the results */}
      <div
        className={`rounded-2xl border border-white/15 bg-navy-950 p-4 shadow-premium lg:block lg:self-start lg:bg-navy-950/60 lg:p-5 ${
          panelOpen ? "absolute inset-0 z-10 overflow-hidden lg:static" : "hidden"
        }`}
      >
        <FilterPanel filters={filters} set={set} onDone={() => setPanelOpen(false)} />
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-white/70 sm:text-sm" aria-live="polite">
            <span className="font-display text-2xl text-white sm:text-3xl">{results.length}</span> homes match
            <span className="text-white/45"> · {available} available</span>
          </p>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-500/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] lg:hidden"
          >
            <Icon d={ICONS.filter} className="h-3.5 w-3.5" />
            Filters{active ? ` (${active})` : ""}
          </button>
        </div>

        <div ref={gridRef} className="mt-3 min-h-0 flex-1">
          {results.length === 0 ? (
            <p className="text-sm text-white/60">No homes match these filters. Try widening the floors or sizes.</p>
          ) : (
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: GRID_GAP }}>
              {shown.map((u) => {
                const inCompare = compareIds.includes(u.id);
                return (
                  <li key={u.id} style={{ height: CARD_H }} className="flex flex-col rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-2xl leading-none">{u.id}</span>
                      <StatusBadge status={u.status} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-white/65">
                      <span className="font-semibold text-white">
                        {u.type} · {sqft(u.carpet)}
                      </span>{" "}
                      · {u.facing} · Floor {pad(u.floor)}
                    </p>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => showOnPlan(u)}
                        className="flex-1 rounded-lg border border-white/25 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white/10 sm:text-[10px]"
                      >
                        Show on Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompare(u.id)}
                        disabled={!inCompare && full}
                        aria-pressed={inCompare}
                        title={!inCompare && full ? `Compare holds up to ${MAX_COMPARE} units` : undefined}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-35 sm:text-[10px] ${
                          inCompare ? "border-red-600 bg-red-600 text-white" : "border-red-500/50 hover:bg-white/10"
                        }`}
                      >
                        <Icon d={inCompare ? ICONS.check : ICONS.plus} className="h-3 w-3" />
                        Compare
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
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
      <div className="grid shrink-0 gap-2 sm:gap-3" style={{ gridTemplateColumns: cols }}>
        <div />
        {columns.map((c, i) => (
          <div key={i} className="min-w-0">
            {head(c, i)}
          </div>
        ))}
      </div>
      <div className="mt-1 min-h-0">
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

function UnitsTab({ compareIds, toggleCompare, goTo }) {
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
    ["Floor", (u) => pad(u.floor), (u) => u.floor],
    ["Type", (u) => u.type],
    ["Carpet area", (u) => sqft(u.carpet), (u) => u.carpet],
    ["Balcony", (u) => sqft(u.balcony), (u) => u.balcony],
    ["Bedrooms", (u) => u.bed],
    ["Bathrooms", (u) => u.bath],
    ["Facing", (u) => u.facing],
    ["Status", (u) => u.status],
  ];
  return (
    <CompareTable
      columns={units}
      rows={rows}
      head={(u) => (
        <div className="rounded-xl border border-white/12 bg-white/[0.03] p-2 sm:p-3 short:p-1.5">
          <div className="flex items-start justify-between gap-1">
            <span className="whitespace-nowrap font-display text-lg leading-none sm:text-3xl short:text-lg">{u.id}</span>
            <button
              type="button"
              aria-label={`Remove ${u.id} from compare`}
              onClick={() => toggleCompare(u.id)}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white/10 sm:h-6 sm:w-6"
            >
              <Icon d={ICONS.close} className="h-3 w-3" />
            </button>
          </div>
          <PlanDrawing
            units={unitsOn(u.tower, u.floor)}
            selectedId={u.id}
            compact
            label={`Where ${u.id} is on its floor`}
            className="mx-auto mt-2 block h-[min(16vh,180px)] w-full short:hidden"
          />
        </div>
      )}
    />
  );
}

function floorFacts(b, n) {
  const us = unitsOn(b, n);
  return {
    homes: us.length,
    byType: Object.fromEntries(TYPES.map((t) => [t, us.filter((u) => u.type === t).length])),
    available: us.filter((u) => u.status === "Available").length,
    carpet: us.reduce((s, u) => s + u.carpet, 0),
    facings: FACINGS.filter((f) => us.some((u) => u.facing === f)).join(", "),
  };
}

function FloorsTab({ pair, setPair, pickUnit }) {
  const cols = pair.map((p) => ({ ...p, facts: floorFacts(p.b, p.n) }));
  const rows = [
    ["Height", (c) => `Floor ${pad(c.n)} of ${FLOORS}`, (c) => c.n],
    ["Homes", (c) => c.facts.homes],
    ...TYPES.map((t) => [t, (c) => c.facts.byType[t]]),
    ["Available", (c) => c.facts.available, (c) => c.facts.available],
    ["Total carpet", (c) => sqft(c.facts.carpet), (c) => c.facts.carpet],
    ["Facings", (c) => c.facts.facings],
    ["View", (c) => viewFor(c.n).label],
  ];
  return (
    <CompareTable
      columns={cols}
      rows={rows}
      head={(c, i) => (
        <div className="rounded-xl border border-white/12 bg-white/[0.03] p-2 sm:p-3 short:p-1.5">
          <FloorPicker value={c} onChange={(v) => setPair((p) => p.map((x, j) => (j === i ? v : x)))} label={`Floor ${i + 1}`} narrow />
          <PlanDrawing
            units={unitsOn(c.b, c.n)}
            onPick={(id) => pickUnit(UNIT_BY_ID.get(id))}
            compact
            label={`Tower ${c.b}, floor ${c.n}: homes. Choose one to open it on the floor plan`}
            className="mx-auto mt-2 block h-[min(20vh,230px)] w-full short:hidden"
          />
        </div>
      )}
    />
  );
}

// ---- Compare Views: two 360° views that turn together ---------------------------------------

const DEG = Math.PI / 180;
// the same tiles as the 360° page (public/assets/360pano/tiles/)
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
      const view = new Marzipano.RectilinearView(
        data.initialViewParameters,
        Marzipano.util.compose(
          Marzipano.RectilinearView.limit.resolution(data.faceSize),
          Marzipano.RectilinearView.limit.vfov(24 * DEG, 100 * DEG),
        ),
      );
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
          const view = viewFor(p.n);
          const times = Object.keys(view.scenes);
          const time = times.includes(p.time) ? p.time : times[0];
          const update = (patch) => setPair((all) => all.map((x, j) => (j === i ? { ...x, ...patch } : x)));
          return (
            <div key={i} className="flex min-h-0 flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-2.5 sm:p-3 short:p-2">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
                <FloorPicker value={p} onChange={(v) => update(v)} label={`View ${i + 1} floor`} />
                <Segmented value={time} options={times} onChange={(t) => update({ time: t })} label="Time of day" />
              </div>
              <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-xl bg-navy-950">
                <PanoPane sceneId={view.scenes[time]} side={i === 0 ? "a" : "b"} register={register} onTurn={onTurn} />
                <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-navy-950/75 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur sm:text-[10px]">
                  Tower {p.b} · Floor {pad(p.n)}
                </span>
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

export default function FloorPlanStudio({ start, startTab = "plan", onClose, drawingFor }) {
  const [tab, setTab] = useState(startTab);
  const [at, setAt] = useState(start);
  const [selectedId, setSelectedId] = useState(null);
  // the Floor Plan tab shows the architect's drawing first; "Units" is the plan to pick homes on
  const [planView, setPlanView] = useState("Drawing");
  const [compareIds, setCompareIds] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [floorPair, setFloorPair] = useState([start, { b: start.b, n: start.n < FLOORS - 9 ? start.n + 10 : Math.max(1, start.n - 10) }]);
  const [viewPair, setViewPair] = useState([
    { ...floorPair[0], time: "Day" },
    { ...floorPair[1], time: "Day" },
  ]);
  const active = TABS.find((t) => t.id === tab);

  const toggleCompare = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]));
  const showOnPlan = (u) => {
    setAt({ b: u.tower, n: u.floor });
    setSelectedId(u.id);
    setPlanView("Units");
    setTab("plan");
  };
  const openViews = (u) => {
    setViewPair((p) => [{ b: u.tower, n: u.floor, time: p[0].time }, p[1]]);
    setTab("views");
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
              title="Unit details are sample data until the final unit list is added"
              className="hidden rounded-full border border-white/25 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 sm:inline"
            >
              Sample units · for illustration
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
        <p className="mt-1.5 px-5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45 sm:hidden">Sample units · for illustration</p>
      )}

      {/* Body: fills the rest of the screen and never scrolls; bottom room for the Brainwing credit on large screens */}
      <div role="tabpanel" aria-label={active.label} className="mt-4 min-h-0 flex-1 overflow-hidden px-5 pb-5 sm:px-10 lg:px-14 lg:pb-[clamp(56px,7vh,84px)] short:mt-2 short:pb-2">
        {tab === "plan" && (
          <PlanTab
            at={at}
            setAt={setAt}
            view={planView}
            setView={setPlanView}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            compareIds={compareIds}
            toggleCompare={toggleCompare}
            filters={filters}
            clearFilters={() => setFilters(DEFAULT_FILTERS)}
            drawingFor={drawingFor}
            openViews={openViews}
          />
        )}
        {tab === "filter" && (
          <FilterTab filters={filters} setFilters={setFilters} compareIds={compareIds} toggleCompare={toggleCompare} showOnPlan={showOnPlan} />
        )}
        {tab === "units" && <UnitsTab compareIds={compareIds} toggleCompare={toggleCompare} goTo={setTab} />}
        {tab === "floors" && <FloorsTab pair={floorPair} setPair={setFloorPair} pickUnit={showOnPlan} />}
        {tab === "views" && <ViewsTab pair={viewPair} setPair={setViewPair} />}
      </div>
    </div>
  );
}
