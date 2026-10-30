import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Marzipano from "marzipano";
import { APP_DATA } from "../data/data";
import BackButton from "../components/BackButton";
import Logo from "../components/Logo";

const DEG = Math.PI / 180;
const IDLE_MS = 1200;
const AUTOROTATE_YAW_SPEED = 0.05;
const TILE_URL = (sceneId) => `/assets/panoroma/tiles/${sceneId}/{z}/{f}/{y}/{x}.jpg`;
// Low-res cube strip the tiler exports per scene: the viewer shows it at once as the
// fallback level while the sharp tiles stream in, so there's never an empty frame.
const PREVIEW_URL = (sceneId) => `/assets/panoroma/tiles/${sceneId}/preview.jpg`;

// Day / Evening / Night: each shows its own panorama. Only the day view exists so far,
// so Evening and Night are shown but inactive. To add one, export its tiles to
// public/assets/panoroma/tiles/, add its scene to data.js and set its `scene` here.
const sceneNamed = (re) => APP_DATA.scenes.find((s) => re.test(s.name)) ?? null;
const MOODS = [
  { id: "day", label: "Day", scene: sceneNamed(/terrace/i) ?? APP_DATA.scenes[0] },
  { id: "evening", label: "Evening", scene: null },
  { id: "night", label: "Night", scene: null },
];
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
      const view = new Marzipano.RectilinearView(
        scene.initialViewParameters,
        Marzipano.util.compose(
          Marzipano.RectilinearView.limit.resolution(scene.faceSize),
          Marzipano.RectilinearView.limit.vfov(24 * DEG, 100 * DEG)
        )
      );
      const source = Marzipano.ImageUrlSource.fromString(TILE_URL(scene.id), {
        cubeMapPreviewUrl: PREVIEW_URL(scene.id),
      });
      const geometry = new Marzipano.CubeGeometry(scene.levels);
      map.set(scene.id, viewer.createScene({ source, geometry, view, pinFirstLevel: true }));
    }
    scenesRef.current = map;

    // no fade-in from the background: the picture (its preview first) is there at once
    map.get(MOODS[0].scene.id)?.switchTo({ transitionDuration: 0 });
    setReady(true);

    viewer.setIdleMovement(
      IDLE_MS,
      Marzipano.autorotate({ yawSpeed: AUTOROTATE_YAW_SPEED, targetPitch: null })
    );

    const onPointerDown = () => setInteracted(true);
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      viewer.destroy();
      scenesRef.current = new Map();
      setReady(false);
    };
  }, []);

  // switching the time of day crossfades to that panorama
  useEffect(() => {
    if (ready && mood.scene) scenesRef.current.get(mood.scene.id)?.switchTo({ transitionDuration: 1000 });
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
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-navy-700/50 p-1.5 backdrop-blur-md no-scrollbar 3xl:gap-2 3xl:p-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === moodId}
              disabled={!m.scene}
              title={m.scene ? undefined : "Coming soon"}
              onClick={() => setMoodId(m.id)}
              style={m.id === moodId || !m.scene ? undefined : { "--btn-fill-color": "rgba(255,255,255,0.12)" }}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-[color,background-color,transform] duration-200 3xl:px-5 3xl:py-3 3xl:text-sm 4xl:px-6 4xl:text-base ${
                m.id === moodId
                  ? "bg-red-600 text-white active:scale-95"
                  : m.scene
                    ? "btn-fill text-white/75 active:scale-95"
                    : "cursor-not-allowed text-white/40"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
