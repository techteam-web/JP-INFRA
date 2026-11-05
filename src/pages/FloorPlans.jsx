import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import FloorPlanStudio from "../components/FloorPlanStudio";
import { PLAN_FLOOR } from "../data/units";
import { ALL, BUILDINGS, OFFSET, PLANS_TOWER, TOP, VIEW_H, VIEW_W, towerImg as renderImg } from "../data/tower";

const same = (x, y) => !!x && !!y && x.b === y.b && x.n === y.n;

// Tower B's plans aren't in yet: its Floor Plan button shows locked.
// The floors' 360° views aren't uploaded yet: until then the card's 360° button shows locked.
const FLOOR_360_READY = false;

const pad = (n) => String(n).padStart(2, "0");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The height gauge beside the floor number, which is also how you pick a floor: the tower
// ground to top, ticked every ten floors, with this floor marked. Drag the marker or press
// anywhere on the rail to go to that floor; arrow keys step, Home and End reach the ends.
// It reports every floor it passes through as a drag (`onDrag`) and the one it is let go on
// as a drop (`onDrop`), so the card can stay put while the finger is down.
function FloorRail({ n, onDrag, onDrop }) {
  const railRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const floorAt = (clientY) => {
    const r = railRef.current.getBoundingClientRect();
    const up = 1 - (clientY - r.top) / r.height; // the rail runs bottom (floor 1) to top
    return Math.round(1 + Math.min(1, Math.max(0, up)) * (TOP - 1));
  };
  const onKeyDown = (e) => {
    const to =
      e.key === "ArrowUp" || e.key === "ArrowRight" ? n + 1
      : e.key === "ArrowDown" || e.key === "ArrowLeft" ? n - 1
      : e.key === "PageUp" ? n + 10
      : e.key === "PageDown" ? n - 10
      : e.key === "Home" ? 1
      : e.key === "End" ? TOP
      : null;
    if (to === null) return;
    e.preventDefault();
    e.stopPropagation(); // the page's own arrow keys would otherwise move the floor twice
    onDrop(to);
  };
  const pct = ((n - 1) / (TOP - 1)) * 100;

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={0}
      aria-label="Floor"
      aria-valuemin={1}
      aria-valuemax={TOP}
      aria-valuenow={n}
      aria-valuetext={`Floor ${pad(n)}`}
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onDrag(floorAt(e.clientY));
      }}
      onPointerMove={(e) => dragging && onDrag(floorAt(e.clientY))}
      onPointerUp={(e) => {
        setDragging(false);
        onDrop(floorAt(e.clientY));
      }}
      onPointerCancel={() => setDragging(false)}
      className={`group relative -mx-2 min-h-[6.5rem] w-7 flex-1 touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 short:min-h-[3.5rem] ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* the track, the floors below this one, the ten-floor ticks and the marker */}
      <span aria-hidden="true" className="absolute inset-y-1 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-white/12">
        {Array.from({ length: Math.floor(TOP / 10) }, (_, i) => (
          <span key={i} className="absolute -left-1 w-3.5 border-t border-white/20" style={{ bottom: `${(((i + 1) * 10) / TOP) * 100}%` }} />
        ))}
        <span
          className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-red-600/40 to-red-600 shadow-[0_0_12px_-2px_rgba(238,49,52,0.8)]"
          style={{ height: `${pct}%` }}
        />
        <span
          className={`absolute left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-[0_0_10px_-1px_rgba(238,49,52,0.9)] transition-[height,width] ${
            dragging ? "h-4 w-4" : "h-3 w-3 group-hover:h-4 group-hover:w-4"
          }`}
          style={{ bottom: `${pct}%` }}
        />
      </span>
    </div>
  );
}

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
  // the latest `step`, so the arrow keys move floors exactly as the card's buttons do
  const stepRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  // The floor the open card's position is measured from. Stepping floors leaves it alone, so
  // the card holds still and its step buttons stay under the pointer; it used to re-centre on
  // every floor, which slid the buttons away and made all but the first click miss.
  const [anchorN, setAnchorN] = useState(null);
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
    setAnchorN(f ? f.n : null); // a floor chosen on the building always re-places the card
    setStudio(null);
  };

  // Up / down move between floors (not while the Floor Plan screen is open); Esc closes
  // that screen, then the selection
  useEffect(() => {
    const onKey = (e) => {
      if (studioOpen.current && e.key !== "Escape") return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        stepRef.current?.(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepRef.current?.(-1);
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
  // The card sits on the side of the building the floor is on: a floor on the left half
  // opens it on the left, joined to the floor's left tip; on the right half, on the right.
  const onLeft = !!floor && toScreen(floor.leftTip)[0] + toScreen(floor.anchor)[0] < size.w;
  const [ax, ay] = floor ? toScreen(onLeft ? floor.leftTip : floor.anchor) : [0, 0];
  const CARD_W = 320;
  const CARD_H = 330; // about its height, to keep it on screen
  const GAP = 48;
  const cardLeft = onLeft ? Math.max(24, ax - GAP - CARD_W) : Math.min(ax + GAP, size.w - CARD_W - 24);
  // the card is placed from its anchor floor, not the floor showing, so stepping holds it still
  const tipY = (n) => {
    const f = BUILDINGS[selected.b][n - 1];
    return toScreen(onLeft ? f.leftTip : f.anchor)[1];
  };
  const cardTop = Math.min(Math.max((selected && anchorN ? tipY(anchorN) : ay) - CARD_H / 2, 100), size.h - CARD_H - 96);
  // Moving the floor moves the floor, not the card — until the floor has climbed past the
  // card's edge, when the card follows it and takes a new anchor. `hold` keeps the card
  // still no matter what, for while the rail is being dragged: the card must not slide out
  // from under the finger mid-drag.
  const setFloor = (n, hold = false) => {
    if (!selected) return;
    const next = Math.min(TOP, Math.max(1, n));
    setSelected({ b: selected.b, n: next });
    if (!hold && (!anchorN || Math.abs(tipY(next) - tipY(anchorN)) > CARD_H / 2 - 48)) setAnchorN(next);
  };
  const step = (by) => selected && setFloor(selected.n + by);
  useEffect(() => {
    stepRef.current = step;
  });
  // the connector runs from the floor's tip to the card's near edge
  const line = onLeft ? { left: cardLeft + CARD_W, width: Math.max(ax - cardLeft - CARD_W, 0) } : { left: ax, width: Math.max(cardLeft - ax, 0) };
  // phones in landscape: too short to sit the card beside the floor — a compact card pinned
  // to the top corner away from the floor, clear of the floor picker
  const short = size.h > 0 && size.h <= 500;
  const cardStyle = short
    ? { [onLeft ? "right" : "left"]: 16, top: 80, width: 270 }
    : size.w >= 768
      ? { left: cardLeft, top: cardTop }
      : undefined;
  // where the floor sits in its tower, for the card's height gauge
  const level = floor ? (floor.n <= Math.round(TOP / 3) ? "Lower floors" : floor.n <= Math.round((2 * TOP) / 3) ? "Mid floors" : "Upper floors") : "";

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

      {/* Floor card: a connector from the floor's tip, then the card, on the floor's side of
          the building (a sheet on phones) */}
      {floor && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 h-px bg-white/70 transition-[top,left,width] duration-300 ease-out max-md:hidden motion-reduce:transition-none short:hidden"
            style={{ ...line, top: ay }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 -ml-1 -mt-1 h-2 w-2 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,232,194,0.8)] transition-[top,left] duration-300 ease-out max-md:hidden motion-reduce:transition-none short:hidden"
            style={{ left: ax, top: ay }}
          />
          <div
            // keyed on the tower, not the floor: stepping up and down used to rebuild the card,
            // which replayed its entrance animation and slid the step buttons out from under the
            // pointer, so a second click within that 0.7s landed on nothing. Now it stays put and
            // glides to the new floor's height instead.
            key={floor.b}
            role="dialog"
            aria-label={`Tower ${floor.b}, floor ${floor.n}`}
            onClick={(e) => e.stopPropagation()}
            // on phones: a sheet at the top when the floor is low on screen, else at the bottom
            className={`jp-caption-in absolute z-20 overflow-hidden rounded-2xl border border-white/15 bg-navy-950/80 text-white shadow-premium backdrop-blur-xl transition-[top,left,right] duration-300 ease-out motion-reduce:transition-none ${
              short ? "" : `max-md:inset-x-4 md:w-[320px] ${ay > size.h / 2 ? "max-md:top-24" : "max-md:bottom-24"}`
            }`}
            style={cardStyle}
          >
            {/* the card's own light: a red edge that fades at the ends, a sheen off the top-left
                corner and a soft red bloom above it, so it reads as lit rather than boxed in */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-600/40 via-red-600 to-red-600/40" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
            <span aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/2 h-32 w-56 -translate-x-1/2 rounded-full bg-red-600/25 blur-3xl" />

            <div className="relative p-5 short:p-3.5">
              {/* the tower, and close */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75">
                  <span className="h-px w-6 bg-red-600" />
                  Tower {floor.b}
                </span>
                <button
                  type="button"
                  onClick={() => choose(null)}
                  aria-label="Close"
                  className="-mr-1.5 grid h-7 w-7 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* the floor: its number, where it sits in the tower, and steps up and down */}
              <div className="mt-2 flex items-stretch gap-4 short:mt-1">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">Floor</span>
                  <div className="flex items-end gap-2">
                    <span className="font-display text-[5.25rem] leading-[0.82] short:text-6xl">{pad(floor.n)}</span>
                    <span className="mb-1.5 text-xs font-semibold tracking-widest text-white/40">/ {TOP}</span>
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-red-500 short:mt-1">
                    <span className="h-1 w-1 rounded-full bg-red-600" />
                    {level}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    aria-label="Floor above"
                    onClick={() => step(1)}
                    disabled={floor.n === TOP}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/[0.04] transition-colors hover:border-white/45 hover:bg-white/10 disabled:opacity-25"
                  >
                    <IconArrow dir="up" className="h-3.5 w-3.5" />
                  </button>
                  <FloorRail n={floor.n} onDrag={(n) => setFloor(n, true)} onDrop={(n) => setFloor(n)} />
                  <button
                    type="button"
                    aria-label="Floor below"
                    onClick={() => step(-1)}
                    disabled={floor.n === 1}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/[0.04] transition-colors hover:border-white/45 hover:bg-white/10 disabled:opacity-25"
                  >
                    <IconArrow dir="down" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* what's on the floor, as two tiles split by a hairline */}
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 short:hidden">
                <div className="bg-navy-950/85 px-3 py-2.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/45">Wings</dt>
                  <dd className="mt-1 text-sm font-semibold">{floor.b === PLANS_TOWER ? "A1 · A2" : "—"}</dd>
                </div>
                <div className="bg-navy-950/85 px-3 py-2.5">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/45">Plan</dt>
                  <dd className="mt-1 text-sm font-semibold">{floor.b === PLANS_TOWER ? `As on Floor ${pad(PLAN_FLOOR)}` : "Coming soon"}</dd>
                </div>
              </dl>

              {/* where to go from here */}
              <div className="mt-3.5 grid grid-cols-[1.2fr_1fr] gap-2 short:mt-2.5">
                {floor.b === PLANS_TOWER ? (
                  <button
                    type="button"
                    onClick={() => setStudio("plan")}
                    style={{ "--btn-fill-color": "#0a1f36" }}
                    className="btn-fill flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-2 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_22px_-10px_rgba(238,49,52,0.9)] transition-transform active:scale-95 short:py-2"
                  >
                    Floor Plan <IconArrow />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 short:py-2"
                  >
                    Floor Plan <IconLock />
                  </button>
                )}
                {FLOOR_360_READY ? (
                  <button
                    type="button"
                    onClick={onOpen360}
                    style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
                    className="btn-fill flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform active:scale-95 short:py-2"
                  >
                    360° View <IconArrow />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 short:py-2"
                  >
                    360° View <IconLock />
                  </button>
                )}
              </div>
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
        <FloorPlanStudio startTab={studio} onClose={() => setStudio(null)} />
      )}
    </div>
  );
}
