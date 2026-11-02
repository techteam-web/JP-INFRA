import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import FloorPlanStudio from "../components/FloorPlanStudio";
import renderImg from "../assets/building svg/CAM_01.png";
import typicalWingA from "../assets/Floor-plan webp/Typical Floor Wing A.webp";
import typicalWingB from "../assets/Floor-plan webp/Typical Floor Wing B.webp";
import floorsSvg from "../assets/jp_infra_SVG/Asset 1.svg?raw";

// The render and its floor outlines share one 1672 × 941 space.
const VIEW_W = 1672;
const VIEW_H = 941;

// The outlines were drawn on their own sheet; this puts them back over the render.
const OFFSET = [552.03, 119.63];

// Every floor of the two towers, from the SVG. Each tower is drawn in three sections (groups
// B, B1, B2 and A2, A1, A); a floor is its outline in every section, so choosing one lights
// the same floor across all three. `anchor` is the floor's right-hand tip, where the card
// points to. The SVG's group letters are the other way round from the towers' real names,
// so TOWER_OF swaps them: the "B" groups are Tower A and the "A" groups Tower B.
const TOWER_OF = { A: "B", B: "A" };
const BUILDINGS = (() => {
  const doc = new DOMParser().parseFromString(floorsSvg, "image/svg+xml");
  const sections = {};
  for (const poly of doc.querySelectorAll("polygon")) {
    const points = poly.getAttribute("points").trim();
    const v = points.split(/[\s,]+/).map(Number);
    const xy = [];
    for (let i = 0; i < v.length; i += 2) xy.push([v[i] + OFFSET[0], v[i + 1] + OFFSET[1]]);
    const y = xy.reduce((t, [, py]) => t + py, 0) / xy.length;
    (sections[poly.parentElement.id] ??= []).push({ n: Number(poly.getAttribute("data-name")) || 0, points, xy, y });
  }
  const out = {};
  for (const [id, list] of Object.entries(sections)) {
    // sections A and A1 come without floor numbers: they're numbered from the ground up
    if (list.some((o) => !o.n)) list.sort((p, q) => q.y - p.y).forEach((o, i) => (o.n = i + 1));
    const b = TOWER_OF[id[0]] ?? id[0];
    for (const { n, points, xy } of list) {
      const floor = ((out[b] ??= [])[n - 1] ??= { b, n, pieces: [], xy: [] });
      floor.pieces.push(points);
      floor.xy.push(...xy);
    }
  }
  for (const floors of Object.values(out)) {
    for (const f of floors) {
      const maxX = Math.max(...f.xy.map(([x]) => x));
      const tip = f.xy.filter(([x]) => x > maxX - 1);
      f.anchor = [maxX, tip.reduce((t, [, y]) => t + y, 0) / tip.length];
    }
  }
  return out;
})();
const ORDER = Object.keys(BUILDINGS).sort(); // A, B
const ALL = ORDER.flatMap((b) => BUILDINGS[b]);
const TOP = BUILDINGS[ORDER[0]].length;
const same = (x, y) => !!x && !!y && x.b === y.b && x.n === y.n;

// Floor-plan drawings: each tower's typical floor (Wing A = Tower A, Wing B = Tower B) on
// every floor, unless a floor has its own drawing in FLOOR_PLANS (e.g. "B-8": planB8Img).
// The drawings are WebP copies (4800 px wide) of src/assets/Floor-plan/.
const TYPICAL_PLANS = { A: typicalWingA, B: typicalWingB };
const FLOOR_PLANS = {};
const drawingFor = (b, n) => FLOOR_PLANS[`${b}-${n}`] ?? TYPICAL_PLANS[b];
// The floors' 360° views aren't uploaded yet: until then the card's 360° button shows locked.
const FLOOR_360_READY = false;

const pad = (n) => String(n).padStart(2, "0");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function IconLock({ className = "h-3 w-3" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow({ dir = "right", className = "h-3 w-3" }) {
  const d = { right: "M5 12h14M13 6l6 6-6 6", up: "M6 15l6-6 6 6", down: "M6 9l6 6 6-6" }[dir];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The building render with every floor selectable. On arrival a band of light climbs the
// building floor by floor; hovering a floor lights it, and choosing one lights that floor
// and opens its card — Floor Plan or the 360° view.
export default function FloorPlans({ onBack, onOpen360 }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const lightsRef = useRef(null);
  const sweepRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  // the Floor Plan screen (plan, filters, comparisons): null, or the tab it opens on
  const [studio, setStudio] = useState(null);
  const studioOpen = useRef(false);
  useEffect(() => {
    studioOpen.current = !!studio;
  }, [studio]);

  // Page chrome eases in
  useLayoutEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    if (reduceMotion()) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(els, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" });
  }, []);

  // Stage size, to place the floor card over the render
  useLayoutEffect(() => {
    const el = stageRef.current;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Light climbing the building, once, on arrival: floor by floor from the ground to the
  // top. Choosing a floor afterwards just lights that floor.
  useEffect(() => {
    if (reduceMotion()) return undefined;
    const tween = (sweepRef.current = gsap.fromTo(
      lightsRef.current.querySelectorAll("polygon"),
      { fillOpacity: 0 },
      {
        keyframes: [
          { fillOpacity: 0.7, duration: 0.18, ease: "power2.out" },
          { fillOpacity: 0, duration: 0.55, ease: "power1.in" },
        ],
        delay: (i, el) => 0.7 + (Number(el.dataset.n) - 1) * 0.045, // floor by floor, every building together
      },
    ));
    return () => tween.kill();
  }, []);

  const choose = (f) => {
    sweepRef.current?.progress(1); // a choice made while it's still climbing ends it at once
    setSelected(f ? { b: f.b, n: f.n } : null);
    setStudio(null);
  };
  const step = (by) => choose({ b: selected.b, n: Math.min(TOP, Math.max(1, selected.n + by)) });

  // Up / down move between floors (not while the Floor Plan screen is open); Esc closes
  // that screen, then the selection
  useEffect(() => {
    const onKey = (e) => {
      if (studioOpen.current && e.key !== "Escape") return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => s && { b: s.b, n: Math.min(TOP, s.n + 1) });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => s && { b: s.b, n: Math.max(1, s.n - 1) });
      } else if (e.key === "Escape") {
        if (studioOpen.current) setStudio(null);
        else setSelected(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Render space → screen (the render is shown like object-fit: cover)
  const scale = Math.max(size.w / VIEW_W, size.h / VIEW_H) || 1;
  const toScreen = ([x, y]) => [x * scale + (size.w - VIEW_W * scale) / 2, y * scale + (size.h - VIEW_H * scale) / 2];
  const floor = selected ? BUILDINGS[selected.b][selected.n - 1] : null;
  const hovered = hover ? BUILDINGS[hover.b][hover.n - 1] : null;
  const [ax, ay] = floor ? toScreen(floor.anchor) : [0, 0];
  const CARD_W = 300;
  const GAP = 56;
  const cardLeft = Math.min(ax + GAP, size.w - CARD_W - 24);
  const cardTop = Math.min(Math.max(ay - 90, 110), size.h - 260);
  // phones in landscape: too short to sit the card beside the floor — a compact card
  // pinned top-right instead, clear of the floor picker
  const short = size.h > 0 && size.h <= 500;
  const cardStyle = short
    ? { right: 16, top: 80, width: 260 }
    : size.w >= 768
      ? { left: cardLeft, top: cardTop }
      : undefined;

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Render + selectable floors */}
      <div ref={stageRef} className="absolute inset-0" onClick={() => choose(null)}>
        <img
          src={renderImg}
          alt="Codename Endgame — building elevation"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="group"
          aria-label="Floors"
        >
          <defs>
            <filter id="floor-glow" x="-10%" y="-60%" width="120%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* the climbing light */}
          <g ref={lightsRef} pointerEvents="none" filter="url(#floor-glow)" transform={`translate(${OFFSET})`}>
            {ALL.flatMap((f) =>
              f.pieces.map((pts, i) => (
                <polygon key={`${f.b}${f.n}-${i}`} data-n={f.n} points={pts} fill="#ffe8c2" fillOpacity="0" />
              )),
            )}
          </g>

          {/* the floors themselves */}
          <g transform={`translate(${OFFSET})`}>
            {ALL.map((f) => {
              const on = same(f, selected);
              const hot = same(f, hover) && !on;
              return (
                <g
                  key={`${f.b}${f.n}`}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Tower ${f.b}, floor ${f.n}`}
                  aria-pressed={on}
                  filter={on ? "url(#floor-glow)" : undefined}
                  className="cursor-pointer outline-none"
                  onPointerEnter={() => setHover({ b: f.b, n: f.n })}
                  onPointerLeave={() => setHover((h) => (same(h, f) ? null : h))}
                  onClick={(e) => {
                    e.stopPropagation();
                    choose(f);
                  }}
                >
                  {f.pieces.map((pts, i) => (
                    <polygon
                      key={i}
                      points={pts}
                      pointerEvents="all"
                      fill={on ? "#ffe8c2" : "#ffffff"}
                      fillOpacity={on ? 0.6 : hot ? 0.28 : 0}
                      stroke="#ffffff"
                      strokeOpacity={on ? 0.95 : hot ? 0.7 : 0}
                      strokeWidth={on ? 1.4 : 1}
                      className="transition-[fill-opacity,stroke-opacity] duration-300"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </svg>

        {/* hovered floor's number, beside the pointer's floor */}
        {hovered && !same(hover, selected) && (
          <span
            className="pointer-events-none absolute z-10 -translate-y-1/2 rounded-md bg-navy-950/75 px-2 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur max-md:hidden"
            style={{ left: toScreen(hovered.anchor)[0] + 12, top: toScreen(hovered.anchor)[1] }}
          >
            {hovered.b} · {pad(hover.n)}
          </span>
        )}
      </div>

      {/* Floor card: connector from the floor's tip, then the card (bottom sheet on phones) */}
      {floor && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 h-px origin-left bg-white/70 max-md:hidden short:hidden"
            style={{ left: ax, top: ay, width: Math.max(cardLeft - ax, 0) }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 -ml-1 -mt-1 h-2 w-2 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,232,194,0.8)] max-md:hidden short:hidden"
            style={{ left: ax, top: ay }}
          />
          <div
            key={`${floor.b}${floor.n}`}
            role="dialog"
            aria-label={`Tower ${floor.b}, floor ${floor.n}`}
            onClick={(e) => e.stopPropagation()}
            // on phones: a sheet at the top when the floor is low on screen, else at the bottom
            className={`jp-caption-in absolute z-20 rounded-2xl border border-white/20 bg-navy-950/70 p-5 text-white shadow-premium backdrop-blur-xl short:p-3.5 ${
              short ? "" : `max-md:inset-x-4 md:w-[300px] ${ay > size.h / 2 ? "max-md:top-24" : "max-md:bottom-24"}`
            }`}
            style={cardStyle}
          >
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
              <span className="h-px w-6 bg-red-600" />
              Tower {floor.b} · Floor
            </span>
            <div className="mt-1 flex items-end justify-between">
              <span className="font-display text-7xl leading-none short:text-5xl">{pad(floor.n)}</span>
              <span className="mb-2 text-[10px] font-semibold tracking-widest text-white/45">/ {TOP}</span>
            </div>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
              {floor.n === TOP ? "Top Floor" : "Typical Floor"}
            </span>
            <div className="mt-4 grid grid-cols-2 gap-2 short:mt-3">
              <button
                type="button"
                onClick={() => setStudio("plan")}
                style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
                className="btn-fill flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-500/50 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform active:scale-95"
              >
                Floor Plan <IconArrow />
              </button>
              {FLOOR_360_READY ? (
                <button
                  type="button"
                  onClick={onOpen360}
                  style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
                  className="btn-fill flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform active:scale-95"
                >
                  360° View <IconArrow />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="flex cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/10 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40"
                >
                  360° View <IconLock />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top bar */}
      <div
        data-anim
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12"
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80 sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-white/50" />
            Floor Plans
          </span>
        </div>
        <div className="pointer-events-auto rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {/* Floor stepper, and Explore Units beside it */}
      <div
        data-anim
        className="absolute inset-x-0 bottom-6 z-20 mx-auto flex w-fit items-center gap-2 sm:bottom-8 3xl:bottom-12"
      >
        <div className="flex items-center gap-1 rounded-xl border border-white/25 bg-navy-950/60 p-1 text-white shadow-premium backdrop-blur-xl">
        <button
          type="button"
          aria-label="Floor below"
          onClick={() => step(-1)}
          disabled={!selected || selected.n === 1}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <IconArrow dir="down" className="h-4 w-4" />
        </button>
        <span className="min-w-[11rem] text-center text-[11px] font-semibold uppercase tracking-[0.22em]">
          {selected ? (
            <>
              {selected.b} · Floor <span className="text-red-500">{pad(selected.n)}</span>
              <span className="text-white/45"> / {TOP}</span>
            </>
          ) : (
            "Select a floor"
          )}
        </span>
        <button
          type="button"
          aria-label="Floor above"
          onClick={() => step(1)}
          disabled={!selected || selected.n === TOP}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <IconArrow dir="up" className="h-4 w-4" />
        </button>
        </div>
        <button
          type="button"
          onClick={() => setStudio("filter")}
          aria-label="Explore units"
          style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
          className="btn-fill flex h-11 items-center gap-2 rounded-xl border border-red-500/60 bg-navy-950/60 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-premium backdrop-blur-xl transition-transform active:scale-95 sm:px-4 sm:text-[11px]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          <span className="max-sm:hidden">Explore Units</span>
        </button>
      </div>

      {/* Floor Plan screen: the plan, unit filtering and the comparisons */}
      {studio && (
        <FloorPlanStudio
          start={floor ? { b: floor.b, n: floor.n } : { b: ORDER[0], n: 1 }}
          startTab={studio}
          onClose={() => setStudio(null)}
          drawingFor={drawingFor}
        />
      )}
    </div>
  );
}
