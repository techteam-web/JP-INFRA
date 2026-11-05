import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Marzipano from "marzipano";
import { APP_DATA } from "../data/data";
import { panoLimiter } from "../data/panoLimits";
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

// Day / Evening / Twilight: each shows its own panorama. To change one, export its tiles to
// public/assets/360pano/tiles/, put its scene in data.js and point its `scene` here.
const sceneNamed = (id) => APP_DATA.scenes.find((s) => s.id === id) ?? null;
const MOODS = [
  { id: "day", label: "Day", icon: "sun", scene: sceneNamed("0-dji_0001_terrace-150") },
  { id: "evening", label: "Evening", icon: "sunset", scene: sceneNamed("2-dji_0071_d") },
  { id: "twilight", label: "Twilight", icon: "moon", scene: sceneNamed("1-dji_0075_d") },
];

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
const SCENES = MOODS.map((m) => m.scene).filter(Boolean);

// Warm each panorama's preview as soon as this page is fetched (App prefetches it in the
// background), so opening the 360° view or switching shows the picture instantly.
if (typeof window !== "undefined") {
  for (const scene of SCENES) {
    const img = new Image();
    img.src = PREVIEW_URL(scene.id);
  }
}

export default function Panorama({ onBack }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const scenesRef = useRef(new Map());
  const currentSceneIdRef = useRef(null); // the panorama on screen, to carry its angle across
  const [moodId, setMoodId] = useState(MOODS[0].id);
  const mood = MOODS.find((m) => m.id === moodId);
  const [ready, setReady] = useState(false);
  const [interacted, setInteracted] = useState(false);

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
    if (!el || SCENES.length === 0) return undefined;

    const viewer = new Marzipano.Viewer(el, { controls: { mouseViewMode: "drag" } });

    const map = new Map();
    for (const scene of SCENES) {
      const view = new Marzipano.RectilinearView(scene.initialViewParameters, panoLimiter(scene));
      const source = Marzipano.ImageUrlSource.fromString(TILE_URL(scene.id), {
        cubeMapPreviewUrl: PREVIEW_URL(scene.id),
      });
      const geometry = new Marzipano.CubeGeometry(scene.levels);
      map.set(scene.id, viewer.createScene({ source, geometry, view, pinFirstLevel: true }));
    }
    scenesRef.current = map;

    // no fade-in from the background: the picture (its preview first) is there at once
    map.get(MOODS[0].scene.id)?.switchTo({ transitionDuration: 0 });
    currentSceneIdRef.current = MOODS[0].scene.id;
    setReady(true);

    // left idle, the view turns slowly on and on
    viewer.setIdleMovement(IDLE_MS, drift);

    const onPointerDown = () => setInteracted(true);
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      viewer.destroy();
      scenesRef.current = new Map();
      currentSceneIdRef.current = null;
      setReady(false);
    };
  }, []);

  // Switching the time of day crossfades to that panorama, from the angle you were already
  // looking at. Each scene carries its own view, which otherwise sits at the direction that
  // panorama opens on, so changing the time of day used to swing the camera away. The yaw,
  // pitch and zoom are copied over first; each view clamps them to its own limits.
  useEffect(() => {
    if (!ready || !mood.scene) return;
    const next = scenesRef.current.get(mood.scene.id);
    if (!next) return;

    const current = scenesRef.current.get(currentSceneIdRef.current);
    if (current && current !== next) {
      const { yaw, pitch, fov } = current.view().parameters();
      next.view().setParameters({ yaw, pitch, fov });
    }
    currentSceneIdRef.current = mood.scene.id;
    next.switchTo({ transitionDuration: 1000 });
  }, [mood, ready]);

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

      {/* Time of day */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4 sm:bottom-10 3xl:bottom-12 4xl:bottom-14" data-anim>
        <div
          role="group"
          aria-label="Time of day"
          className="flex max-w-full items-center gap-1 rounded-2xl border border-white/20 bg-navy-950/80 p-1.5 shadow-premium backdrop-blur-xl 3xl:gap-2 3xl:p-2"
        >
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === moodId}
              disabled={!m.scene}
              title={m.scene ? undefined : "Coming soon"}
              onClick={() => setMoodId(m.id)}
              style={m.id === moodId || !m.scene ? undefined : { "--btn-fill-color": "rgba(255,255,255,0.14)" }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-[color,background-color,transform] duration-200 sm:px-5 sm:text-xs 3xl:px-6 3xl:py-3 3xl:text-sm 4xl:text-base ${
                m.id === moodId
                  ? "bg-red-600 text-white shadow-[0_6px_18px_-6px_rgba(238,49,52,0.7)] active:scale-95"
                  : m.scene
                    ? "btn-fill text-white active:scale-95"
                    : "cursor-not-allowed text-white/40"
              }`}
            >
              <MoodIcon name={m.icon} />
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
