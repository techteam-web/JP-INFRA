import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSize } from "../hooks/useSize";
import { useCurtainSlider } from "../hooks/useCurtainSlider";
import CurtainStage from "./CurtainStage";
import ImageCaption from "./ImageCaption";
import { STATUS, projectsBy } from "../data/projects";

// About Us → Our Projects: Ongoing / Delivered, each a grid of project photos sized to fit
// the screen (pages, never a scroll). A photo opens the project large, with its neighbours
// a click (or arrow key) away and a link to its pin on Our Legacy's map.

const pad = (n) => String(n).padStart(2, "0");
const SMALLEST = { wide: 150, phone: 104, short: 88 }; // a card's photo never gets smaller

// the column count that gives n photos their largest size in w × h
function bestGrid(n, w, h, gap, cap) {
  let best = { cols: 1, size: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const size = Math.floor(Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows - cap));
    if (size > best.size) best = { cols, size };
  }
  return best;
}

// all the photos on one page if they fit at a decent size, otherwise as many pages as needed
function gridFor(n, w, h, mode) {
  const gap = mode === "wide" ? 16 : 10;
  const cap = mode === "short" ? 34 : 44; // the name and area under each photo
  const min = SMALLEST[mode];
  const all = bestGrid(n, w, h, gap, cap);
  if (all.size >= min) return { ...all, perPage: n, gap };
  const cols = Math.max(1, Math.floor((w + gap) / (min + gap)));
  const rows = Math.max(1, Math.floor((h + gap) / (min + cap + gap)));
  const perPage = cols * rows;
  return { ...bestGrid(perPage, w, h, gap, cap), perPage, gap };
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const roundBtn =
  "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true">
      <path
        d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.3" fill="currentColor" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The projects full screen, as the Gallery shows its photos: the same curtain slideshow,
// each photo whole and as tall as the screen with a blurred copy of itself filling the
// sides; its name bottom left, a counter, ‹ › and a close button. Over the page's own top
// bar, so it's portalled to <body>. Opens on `start`; closing hands back where it got to.
function FullPhotos({ list, start, onClose }) {
  const srcs = useMemo(() => list.map((q) => q.image), [list]); // stable: the slideshow restarts when it changes
  const { index, go, layerARef, layerBRef } = useCurtainSlider(srcs, start);
  const p = list[index];
  const side =
    "btn-fill absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 xl:h-12 xl:w-12";

  // ← → turn the slides, Esc closes. At the window's capture phase, like ProjectView's.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape") onClose(index);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, onClose, index]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${p.name}, full screen`} className="fixed inset-0 z-[80] overflow-hidden bg-navy-950">
      <CurtainStage layerARef={layerARef} layerBRef={layerBRef} label={p.name} shade={false} fit />

      <button
        type="button"
        onClick={() => onClose(index)}
        aria-label="Close full screen"
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className="btn-fill absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur sm:right-8 sm:top-8 xl:h-12 xl:w-12"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous project"
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className={`${side} left-4 sm:left-8`}
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next project"
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className={`${side} right-4 sm:right-8`}
      >
        <Chevron dir="right" />
      </button>

      <ImageCaption id={p.id} label={STATUS[p.status].plural} name={p.name} detail={p.area} />

      {/* Counter */}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit items-center gap-2.5 rounded-xl border border-white/25 bg-navy-950/55 px-5 py-2.5 text-white shadow-premium backdrop-blur-xl sm:bottom-8 xl:px-6 xl:py-3 2xl:bottom-10">
        <span className="text-xs font-bold tracking-widest text-red-600 xl:text-sm">{pad(index + 1)}</span>
        <span className="h-3 w-px bg-white/30" aria-hidden="true" />
        <span className="text-xs font-semibold tracking-widest text-white/70 xl:text-sm">{pad(list.length)}</span>
      </div>
    </div>,
    document.body,
  );
}

// One project, large: a framed card, its photo filling one half, the project in the other
// (photo on top on phones held upright), with the rest of the list as thumbnails to jump to.
// The photo (or its Full size button) opens it whole, over the whole screen.
function ProjectView({ list, at, onStep, onJump, onClose, onShowOnMap }) {
  const p = list[at];
  const [full, setFull] = useState(null); // full screen: the project it opened on, or null

  // ← → step through the projects, Esc goes back to the grid (full screen, FullPhotos takes
  // them instead). Taken at the window's capture phase, stopping them there, so the About Us
  // timeline and the slideshow's own keys (listening further along) don't move as well.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Escape") e.stopPropagation();
      if (full !== null) return;
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onStep, onClose, full]);

  // leaving full screen: the card shows the project the slideshow got to
  const closeFull = (reached) => {
    setFull(null);
    onJump(reached);
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-3xl border border-white/15 bg-navy-950/55 shadow-premium sm:grid-cols-2 sm:grid-rows-1 short:grid-cols-2 short:grid-rows-1">
      {full !== null && <FullPhotos list={list} start={full} onClose={closeFull} />}

      {/* The photo, filling its half */}
      <div className="relative min-h-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setFull(at)}
          aria-label={`${p.name}: view full size`}
          className="absolute inset-0 cursor-zoom-in"
        >
          <img
            key={p.id}
            src={p.image}
            alt={`${p.name}, ${p.area}`}
            decoding="async"
            className="jp-photo-in h-full w-full object-cover"
          />
        </button>
        <button
          type="button"
          onClick={() => setFull(at)}
          aria-label="View full size"
          className="btn-fill absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/25 bg-navy-950/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:right-6 sm:top-6 short:right-3 short:top-3 short:py-1.5"
          style={{ "--btn-fill-color": "#ee3134" }}
        >
          <ExpandIcon />
          <span className="max-sm:hidden short:hidden">Full size</span>
        </button>
        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/25 bg-navy-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-6 sm:top-6 short:left-3 short:top-3">
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${p.status === "ongoing" ? "bg-red-500" : "bg-white"}`} />
          {STATUS[p.status].label}
        </span>
      </div>

      {/* The project */}
      <div className="flex min-h-0 flex-col justify-between gap-4 border-white/10 p-5 max-sm:border-t sm:border-l sm:p-[clamp(24px,3.2vw,56px)] short:gap-2 short:border-l short:border-t-0 short:p-4">
        <span className="flex items-center gap-3 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-[11px]">
          <span className="font-bold text-red-500">
            {pad(at + 1)}
            <span className="text-white/35"> / {pad(list.length)}</span>
          </span>
          <span className="h-px w-8 bg-red-600 short:w-5" />
          <span className="short:hidden">{STATUS[p.status].plural}</span>
          <span className="hidden short:inline">{STATUS[p.status].label}</span>
        </span>

        <div key={p.id} className="jp-caption-in">
          <h3 className="font-display text-4xl uppercase leading-[0.92] text-white sm:text-[clamp(2.8rem,5vw,6.5rem)] short:text-3xl">
            {p.name}
          </h3>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/70 sm:text-sm short:mt-1 short:text-[11px]">
            <PinIcon />
            {p.area}
          </p>
          <dl className="mt-5 grid max-w-md grid-cols-3 gap-4 border-y border-white/10 py-4 max-sm:hidden short:hidden">
            {[
              ["Status", STATUS[p.status].label],
              ["Location", p.area],
              ["Developer", "JP Infra"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{k}</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4 short:gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onStep(-1)} aria-label="Previous project" className={roundBtn}>
              <Chevron dir="left" />
            </button>
            <button type="button" onClick={() => onStep(1)} aria-label="Next project" className={roundBtn}>
              <Chevron dir="right" />
            </button>
            <button
              type="button"
              onClick={() => onShowOnMap(p.id)}
              className="btn-fill ml-1 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-[11px] short:py-2"
              style={{ "--btn-fill-color": "#0a1f36" }}
            >
              <span className="short:hidden">See on</span> map
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white sm:text-[11px]"
            >
              All <span className="short:hidden">projects</span>
            </button>
          </div>
          {/* the rest of the list, to jump to */}
          <ol className="flex gap-1.5 max-sm:hidden short:hidden" aria-label={STATUS[p.status].plural}>
            {list.map((q, i) => (
              <li key={q.id} className="min-w-0 max-w-14 flex-1">
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  aria-label={q.name}
                  aria-current={i === at ? "true" : undefined}
                  className={`block aspect-square w-full overflow-hidden rounded-md border-2 transition-[opacity,border-color] ${
                    i === at ? "border-red-600 opacity-100" : "border-transparent opacity-45 hover:opacity-90"
                  }`}
                >
                  <img src={q.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPanel({ eyebrow, onShowOnMap, onOpenLegacy }) {
  const [status, setStatus] = useState("ongoing");
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null); // index in the list, or null for the grid
  const areaRef = useRef(null);
  const { w, h } = useSize(areaRef);
  const list = projectsBy(status);

  const mode =
    typeof window !== "undefined" && window.matchMedia("(max-height: 500px)").matches
      ? "short"
      : w >= 600
        ? "wide"
        : "phone";
  const grid = w && h ? gridFor(list.length, w, h, mode) : null;
  const pages = grid ? Math.ceil(list.length / grid.perPage) : 1;
  const current = Math.min(page, pages - 1);
  const shown = grid ? list.slice(current * grid.perPage, (current + 1) * grid.perPage) : [];

  const pick = (s) => {
    setStatus(s);
    setPage(0);
    setViewing(null);
  };

  return (
    <div className="absolute inset-0 z-[5] bg-navy-950/85 backdrop-blur-md">
      <div className="absolute inset-x-4 top-[84px] bottom-5 flex flex-col sm:inset-x-10 sm:top-[100px] sm:bottom-8 lg:top-[clamp(104px,12vh,140px)] lg:bottom-[clamp(64px,8vh,96px)] 3xl:inset-x-14 short:top-[90px] short:bottom-4">
        {/* Heading, Ongoing / Delivered, pages */}
        <div className="jp-caption-in flex flex-wrap items-end justify-between gap-x-6 gap-y-3 short:gap-y-1">
          <div>
            <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-[11px] short:hidden">
              {eyebrow}
            </span>
            <h2 className="mt-2 font-display text-4xl uppercase leading-none text-white sm:text-5xl lg:text-[clamp(2.8rem,6vh,5rem)] short:mt-0 short:text-2xl">
              Our <span className="text-red-600">Projects</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* over to Our Legacy, the map of every project */}
            <button
              type="button"
              onClick={onOpenLegacy}
              aria-label="Our Legacy: every project on the map"
              className="btn-fill flex h-[42px] items-center gap-2 rounded-full border border-white/20 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:px-4 sm:text-[11px] short:h-[34px]"
              style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            >
              <PinIcon />
              <span className="max-sm:hidden short:hidden">Our Legacy</span>
            </button>
            <div role="radiogroup" aria-label="Projects" className="flex rounded-full border border-white/20 p-1">
              {Object.keys(STATUS).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => pick(s)}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors sm:px-4 sm:text-[11px] short:py-1 ${
                    status === s ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {STATUS[s].label}
                  <span className={status === s ? "ml-1.5 text-white/75" : "ml-1.5 text-white/40"}>
                    {pad(projectsBy(s).length)}
                  </span>
                </button>
              ))}
            </div>
            {viewing === null && pages > 1 && (
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className={roundBtn}>
                  <Chevron dir="left" />
                </button>
                <span className="w-9 text-center text-[11px] font-semibold tabular-nums text-white/70">
                  {current + 1}/{pages}
                </span>
                <button type="button" aria-label="Next page" disabled={current === pages - 1} onClick={() => setPage(current + 1)} className={roundBtn}>
                  <Chevron dir="right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The photos (or one project, large) */}
        <div ref={areaRef} className="relative mt-4 min-h-0 flex-1 sm:mt-6 lg:mt-[clamp(20px,3vh,36px)] short:mt-2">
          {viewing !== null ? (
            <ProjectView
              list={list}
              at={viewing}
              onStep={(d) => setViewing((v) => (v + d + list.length) % list.length)}
              onJump={setViewing}
              onClose={() => setViewing(null)}
              onShowOnMap={onShowOnMap}
            />
          ) : (
            grid && (
              <div
                key={`${status}-${current}`}
                className="jp-caption-in grid h-full content-center justify-center"
                style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`, gap: grid.gap }}
              >
                {shown.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setViewing(current * grid.perPage + i)}
                    className="group text-left"
                  >
                    <span
                      className="block overflow-hidden rounded-xl border border-white/10 shadow-premium"
                      style={{ height: grid.size }}
                    >
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </span>
                    <span className="mt-2 block truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white sm:text-xs short:mt-1 short:text-[10px]">
                      {p.name}
                    </span>
                    <span className="block truncate text-[11px] text-white/55 short:text-[10px]">{p.area}</span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
