import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Marzipano from "marzipano";
import { APP_DATA } from "../data/data";
import { panoLimiter } from "../data/panoLimits";
import { CENTRE_VIEWS } from "../data/towerViews";
import BackButton from "../components/BackButton";
import Logo from "../components/Logo";

const IDLE_MS = 1200;
const AUTOROTATE_YAW_SPEED = 0.05;
// How far the view turns (left / right, up / down) is set in data/panoLimits.js, shared with
// the Floor Plans' Compare Views.

// Idle drift: with nothing stopping the view left or right, it simply keeps turning.
const drift = Marzipano.autorotate({ yawSpeed: AUTOROTATE_YAW_SPEED, targetPitch: 0, targetFov: null });

const TILE_URL = (sceneId) => `/assets/360pano/tiles/${sceneId}/{z}/{f}/{y}/{x}.jpg`;
// Low-res cube strip the tiler exports per scene: the viewer shows it at once as the
// fallback level while the sharp tiles stream in, so there's never an empty frame.
const PREVIEW_URL = (sceneId) => `/assets/360pano/tiles/${sceneId}/preview.jpg`;

// A terrace panorama from data.js, in the same shape as the floors' (data/towerViews.js).
// `turn` 0: these are the ones the floors' `turn` is measured against.
const terraceScene = (id) => {
  const s = APP_DATA.scenes.find((x) => x.id === id);
  return s
    ? {
        id: s.id,
        tileUrl: TILE_URL(s.id),
        previewUrl: PREVIEW_URL(s.id),
        levels: s.levels,
        faceSize: s.faceSize,
        initialViewParameters: s.initialViewParameters,
        turn: 0,
      }
    : null;
};

// Day / Evening / Twilight, from the terrace: each shows its own panorama. To change one,
// export its tiles to public/assets/360pano/tiles/, put its scene in data.js and name it here.
const MOODS = [
  { id: "day", label: "Day", icon: "sun", scene: terraceScene("0-dji_0001_terrace-150") },
  { id: "evening", label: "Evening", icon: "sunset", scene: terraceScene("2-dji_0071_d") },
  { id: "twilight", label: "Twilight", icon: "moon", scene: terraceScene("1-dji_0075_d") },
];

// Where to look from, top down: the terrace (at any time of day), then the floors shot from
// the middle of the building (by day). Only these are offered, every second height: the
// others (41st, 35th … 11th) are left out of the list, though their panoramas stay in
// data/towerViews.js.
const SHOWN_FLOORS = [44, 38, 32, 26, 20, 14, 8];
const FLOORS = [
  { key: "T", label: "Terrace" },
  ...CENTRE_VIEWS.filter((v) => SHOWN_FLOORS.includes(v.floor))
    .reverse()
    .map((v) => ({ key: v.key, label: v.label, scene: v.scene })),
];
const TERRACE = FLOORS[0].key;

function MoodIcon({ name }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 3xl:h-5 3xl:w-5" aria-hidden="true">
      {name === "sun" && (
        <g {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
      )}
      {name === "sunset" && (
        <g {...common}>
          <path d="M7 16a5 5 0 0 1 10 0" />
          <path d="M3 16h18M6 20h12M12 5v3.5M4.9 9.4l1.6 1.2M19.1 9.4l-1.6 1.2" />
        </g>
      )}
      {name === "moon" && (
        <g {...common}>
          <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" />
          <path d="M17 3.5v3M15.5 5h3" />
        </g>
      )}
    </svg>
  );
}

// Warm the terrace panoramas' previews as soon as this page is fetched (App prefetches it in
// the background), so opening the 360° view or switching shows the picture instantly. The
// floors' previews are warmed when the floor list is opened.
const warmed = new Set();
const warm = (scene) => {
  if (!scene || warmed.has(scene.previewUrl) || typeof window === "undefined") return;
  warmed.add(scene.previewUrl);
  const img = new Image();
  img.src = scene.previewUrl;
};
for (const m of MOODS) warm(m.scene);

function IconBuilding() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 3xl:h-5 3xl:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 21V5l7-2v18M12 7l7 2v12M3 21h18M8 8h1M8 12h1M8 16h1M15 12h1M15 16h1" />
    </svg>
  );
}

// The floor to look from: a button showing the one on screen, opening the list of floors
// upwards. Up / down move through the list; Esc or a click outside closes it.
function FloorMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const current = FLOORS.find((f) => f.key === value) ?? FLOORS[0];

  useEffect(() => {
    if (!open) return undefined;
    for (const f of FLOORS) warm(f.scene);
    listRef.current?.querySelector('[aria-checked="true"]')?.focus();
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onListKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...listRef.current.querySelectorAll('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`View from: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        /* the button is the pill itself, so the list below lines up with its own edges */
        className="btn-fill flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-navy-950/80 py-2.5 pl-3.5 pr-3 text-white shadow-premium backdrop-blur-xl transition-transform active:scale-95 short:py-2 3xl:py-3 3xl:pl-4"
      >
        <span className="shrink-0 text-red-500">
          <IconBuilding />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start text-left leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-[0.26em] text-white/55 3xl:text-[10px]">View from</span>
          <span className="mt-1 max-w-full truncate text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs 3xl:text-sm">{current.label}</span>
        </span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "" : "rotate-180"}`} aria-hidden="true">
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-full">
          <div
            ref={listRef}
            role="menu"
            aria-label="View from"
            onKeyDown={onListKey}
            /* the same width as the button above it; only the short-screen grids run wider */
            className="jp-caption-in grid w-full gap-0.5 rounded-2xl border border-white/20 bg-navy-950/90 p-1.5 shadow-premium backdrop-blur-xl [animation-duration:0.35s] [@media(min-height:501px)_and_(max-height:720px)]:w-max [@media(min-height:501px)_and_(max-height:720px)]:grid-cols-2 short:w-max short:grid-cols-3"
          >
            <span className="col-span-full flex items-center gap-2 px-3 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50">
              <span className="h-px w-5 bg-red-600" />
              View from the
            </span>
            {FLOORS.map((f) => {
              const on = f.key === value;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onChange(f.key);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-left text-[11px] font-bold uppercase tracking-[0.16em] outline-none transition-colors [@media(max-height:720px)]:min-w-[7.5rem] short:py-1.5 ${
                    on
                      ? "bg-red-600 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                  }`}
                >
                  {f.label}
                  {f.key === TERRACE && (
                    <span className={`text-[8px] tracking-[0.18em] [@media(max-height:720px)]:hidden ${on ? "text-white/75" : "text-white/40"}`}>Day to Twilight</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Panorama({ onBack }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const scenesRef = useRef(new Map()); // the Marzipano scenes made so far, by id
  const currentRef = useRef(null); // the panorama on screen ({ data, scene }), to carry its angle across
  const [moodId, setMoodId] = useState(MOODS[0].id);
  const [floorKey, setFloorKey] = useState(TERRACE);
  const [ready, setReady] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const atTerrace = floorKey === TERRACE;
  const mood = MOODS.find((m) => m.id === moodId);
  // the terrace shows its time of day; the floors were shot by day
  const shown = atTerrace ? mood.scene : FLOORS.find((f) => f.key === floorKey).scene;

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      els,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, delay: 0.15, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const viewer = new Marzipano.Viewer(el, { controls: { mouseViewMode: "drag" } });
    viewerRef.current = viewer;
    setReady(true);

    // left idle, the view turns slowly on and on
    viewer.setIdleMovement(IDLE_MS, drift);

    const onPointerDown = () => setInteracted(true);
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      viewer.destroy();
      viewerRef.current = null;
      scenesRef.current = new Map();
      currentRef.current = null;
      setReady(false);
    };
  }, []);

  // Switching the floor or the time of day crossfades to that panorama, from the angle you
  // were already looking at: the yaw, pitch and zoom are copied over first (each view clamps
  // them to its own limits), the yaw turned by the two panoramas' `turn` so the same
  // direction stays in front. Each panorama is set up the first time it's shown.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer || !shown) return;
    let next = scenesRef.current.get(shown.id);
    if (!next) {
      const view = new Marzipano.RectilinearView(shown.initialViewParameters, panoLimiter(shown));
      const source = Marzipano.ImageUrlSource.fromString(shown.tileUrl, { cubeMapPreviewUrl: shown.previewUrl });
      next = viewer.createScene({ source, geometry: new Marzipano.CubeGeometry(shown.levels), view, pinFirstLevel: true });
      scenesRef.current.set(shown.id, next);
    }
    const current = currentRef.current;
    if (current?.scene === next) return;
    if (current) {
      const { yaw, pitch, fov } = current.scene.view().parameters();
      next.view().setParameters({ yaw: yaw - current.data.turn + shown.turn, pitch, fov });
    }
    currentRef.current = { data: shown, scene: next };
    // no fade-in from the background at first: the picture (its preview first) is there at once
    next.switchTo({ transitionDuration: current ? 1000 : 0 });
  }, [shown, ready]);

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-[#0a0908]">
      <div ref={containerRef} className="absolute inset-0" aria-label="360 degree view" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.45)_100%)]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12">
        <div data-anim>
          <BackButton onClick={onBack} />
        </div>
        <div data-anim className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {/* Drag hint */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center transition-opacity duration-500 ${
          interacted ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="animate-pulse rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur 3xl:px-5 3xl:py-2.5 3xl:text-sm 4xl:text-base">
          Drag to look around
        </span>
      </div>

      {/* The floor to look from: top left under the back button on every screen (beside it on
          phones turned sideways), its list opening downwards */}
      <div
        className="absolute left-6 top-[5.5rem] z-20 w-[13.5rem] sm:left-10 sm:top-[6.75rem] 3xl:left-14 3xl:w-[15.5rem] 4xl:left-16 short:left-[6.25rem] short:top-8"
        data-anim
      >
        <FloorMenu value={floorKey} onChange={setFloorKey} />
      </div>

      {/* Time of day */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4 sm:bottom-10 short:bottom-3 3xl:bottom-12 4xl:bottom-14" data-anim>
        <div>
          <div
            role="group"
            aria-label="Time of day"
            className="flex max-w-full items-center gap-1 rounded-2xl border border-white/20 bg-navy-950/80 p-1.5 shadow-premium backdrop-blur-xl short:p-1 3xl:gap-2 3xl:p-2"
          >
            {MOODS.map((m) => {
              const on = atTerrace ? m.id === moodId : m.id === "day";
              // away from the terrace there is only the day's view
              const usable = !!m.scene && (atTerrace || m.id === "day");
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!usable}
                  title={!m.scene ? "Coming soon" : usable ? undefined : "From the terrace only"}
                  onClick={() => setMoodId(m.id)}
                  style={on || !usable ? undefined : { "--btn-fill-color": "rgba(255,255,255,0.14)" }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-[color,background-color,transform] duration-200 sm:px-5 sm:text-xs short:px-3 short:py-2 3xl:px-6 3xl:py-3 3xl:text-sm 4xl:text-base ${
                    on
                      ? "bg-red-600 text-white shadow-[0_6px_18px_-6px_rgba(238,49,52,0.7)] active:scale-95"
                      : usable
                        ? "btn-fill text-white active:scale-95"
                        : "cursor-not-allowed text-white/35"
                  }`}
                >
                  <MoodIcon name={m.icon} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
