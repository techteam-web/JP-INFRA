import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Marzipano from "marzipano";
import { APP_DATA } from "../data/data";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const DEG = Math.PI / 180;
const IDLE_MS = 1200;
const AUTOROTATE_YAW_SPEED = 0.05;
const TILE_URL = (sceneId) => `/assets/panoroma/tiles/${sceneId}/{z}/{f}/{y}/{x}.jpg`;

function sceneLabel(scene) {
  return scene.name.replace(/^DJI_\d+_/, "").replace(/_/g, " ");
}

export default function Panorama({ onBack }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const scenesRef = useRef(new Map());
  const activeIdRef = useRef(APP_DATA.scenes[0]?.id);
  const yawElRef = useRef(null);
  const [activeId, setActiveId] = useState(APP_DATA.scenes[0]?.id);
  const [ready, setReady] = useState(false);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

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
    if (!el || APP_DATA.scenes.length === 0) return undefined;

    const viewer = new Marzipano.Viewer(el, { controls: { mouseViewMode: "drag" } });

    const map = new Map();
    for (const scene of APP_DATA.scenes) {
      const view = new Marzipano.RectilinearView(
        scene.initialViewParameters,
        Marzipano.util.compose(
          Marzipano.RectilinearView.limit.resolution(scene.faceSize),
          Marzipano.RectilinearView.limit.vfov(24 * DEG, 100 * DEG)
        )
      );
      const source = Marzipano.ImageUrlSource.fromString(TILE_URL(scene.id));
      const geometry = new Marzipano.CubeGeometry(scene.levels);
      const marzipanoScene = viewer.createScene({ source, geometry, view, pinFirstLevel: true });
      map.set(scene.id, { scene: marzipanoScene, view });
    }
    scenesRef.current = map;

    map.get(activeIdRef.current)?.scene.switchTo();
    setReady(true);

    viewer.setIdleMovement(
      IDLE_MS,
      Marzipano.autorotate({ yawSpeed: AUTOROTATE_YAW_SPEED, targetPitch: null })
    );

    let pendingFrame = null;
    const reportView = () => {
      if (pendingFrame != null) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null;
        const entry = map.get(activeIdRef.current);
        if (entry && yawElRef.current) {
          const deg = (entry.view.yaw() * 180) / Math.PI;
          yawElRef.current.textContent = `${Math.round(((deg % 360) + 360) % 360)}°`;
        }
      });
    };
    map.forEach(({ view }) => view.addEventListener("change", reportView));
    reportView();

    const onPointerDown = () => setInteracted(true);
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      map.forEach(({ view }) => view.removeEventListener("change", reportView));
      el.removeEventListener("pointerdown", onPointerDown);
      if (pendingFrame != null) cancelAnimationFrame(pendingFrame);
      viewer.destroy();
      scenesRef.current = new Map();
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    scenesRef.current.get(activeId)?.scene.switchTo({ transitionDuration: 0 });
  }, [activeId, ready]);

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      <div ref={containerRef} className="absolute inset-0" aria-label="360 degree view" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.45)_100%)]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12">
        <div data-anim className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-2.5 rounded-full bg-navy-700/60 px-3 py-2 backdrop-blur 3xl:px-4 3xl:py-2.5">
            <Logo className="h-8 w-auto sm:h-9 2xl:h-10 3xl:h-11 4xl:h-12" />
          </div>
        </div>

        <div
          ref={yawElRef}
          data-anim
          className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold tracking-widest text-white backdrop-blur 3xl:px-5 3xl:py-2 3xl:text-sm 4xl:px-6 4xl:text-base"
        >
          0°
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

      {/* Scene tabs */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4 sm:bottom-10 3xl:bottom-12 4xl:bottom-14" data-anim>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-navy-700/50 p-1.5 backdrop-blur-md no-scrollbar 3xl:gap-2 3xl:p-2">
          {APP_DATA.scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveId(scene.id)}
              style={scene.id === activeId ? undefined : { "--btn-fill-color": "rgba(255,255,255,0.12)" }}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-[color,background-color,transform] duration-200 active:scale-95 3xl:px-5 3xl:py-3 3xl:text-sm 4xl:px-6 4xl:text-base ${
                scene.id === activeId
                  ? "bg-red-600 text-white"
                  : "btn-fill text-white/75"
              }`}
            >
              {sceneLabel(scene)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
