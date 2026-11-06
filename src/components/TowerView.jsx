import { useState } from "react";
import PanoPane from "./PanoPane";
import { TOWER_VIEWS, VIEW_WINGS, facingScene, viewFor } from "../data/towerViews";

// The view from a floor of Tower A, full screen over the Floor Plans page: the drone
// panorama captured nearest (at or below) the chosen floor, in either wing. The wing toggle
// switches A1 / A2 at the same height; ▲ ▼ step through the heights captured (8th floor to
// the terrace); the view keeps looking the same way as it changes.
const pad = (n) => String(n).padStart(2, "0");
// the two sides a view can look out from (data/towerViews.js, facingScene), as the caption names them
const FACING_LABEL = { front: "Front View", back: "Back View" };

function Arrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d={dir === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// `home`: when opened from a home's eye on the plan, that home, named in the caption (while its
// own wing is on screen). The view faces the side of the building that home is on: the
// mountains from the front, the opposite way from the back. Without a home, the front. The
// side is fixed: the caption names it, but a home's view can't be turned to the other side.
export default function TowerView({ floor, startWing = VIEW_WINGS[0], home = null, onClose }) {
  const facing = home?.faces ?? "front";
  const [wing, setWing] = useState(startWing);
  const [key, setKey] = useState(() => viewFor(startWing, floor).key);
  const [stepped, setStepped] = useState(false); // a height picked here, rather than the floor's own
  const views = TOWER_VIEWS[wing];
  const at = Math.max(0, views.findIndex((v) => v.key === key));
  const view = views[at];
  const go = (i) => {
    setKey(views[Math.min(views.length - 1, Math.max(0, i))].key);
    setStepped(true);
  };
  const pickWing = (w) => {
    setWing(w);
    setKey((TOWER_VIEWS[w].find((v) => v.floor === view.floor) ?? TOWER_VIEWS[w][0]).key);
  };
  // the floor asked for has no view of its own: say which height is shown (until another
  // height is picked)
  const nearest = !stepped && view.floor && view.floor !== floor;
  const step =
    "grid h-10 w-10 place-items-center rounded-xl text-white transition-colors hover:bg-white/10 disabled:opacity-30 short:h-8 short:w-8";

  return (
    <div role="dialog" aria-modal="true" aria-label={`View from Tower A, wing ${wing}, ${view.label}`} className="jp-caption-in absolute inset-0 z-40 overflow-hidden bg-navy-950">
      <PanoPane scene={facingScene(view.scene, facing)} />

      {/* what's on screen, and close */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8 short:pt-4">
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-navy-950/50 text-white shadow-premium backdrop-blur-md">
          <span className="w-[3px] shrink-0 bg-red-600" aria-hidden="true" />
          <div className="py-2.5 pl-4 pr-6 short:py-1.5 short:pl-3 short:pr-5">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:text-[10px]">
              {home && home.wing === wing ? (
                <>
                  Home {home.id} <span className="px-0.5 text-red-500">·</span> {home.type}
                </>
              ) : (
                <>
                  Tower A <span className="px-0.5 text-red-500">·</span> Wing {wing}
                </>
              )}
            </span>
            <p className="mt-1 font-display text-[26px] uppercase leading-none tracking-[0.04em] sm:text-[30px] short:text-[22px]">{view.label}</p>
            {/* which side of the building the view looks out from */}
            <span className="mt-2.5 inline-flex rounded-md bg-red-600 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white sm:text-[10px] short:mt-1.5 short:py-1">
              {FACING_LABEL[facing]}
            </span>
            {nearest && (
              <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/50">Nearest to floor {pad(floor)}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the view"
          style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
          className="btn-fill pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 bg-navy-950/60 text-white backdrop-blur"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* wing, and height */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4 sm:bottom-10 short:bottom-3">
        <div className="flex max-w-full items-center gap-2 rounded-2xl border border-white/20 bg-navy-950/80 p-1.5 text-white shadow-premium backdrop-blur-xl">
          <div role="radiogroup" aria-label="Wing" className="flex rounded-xl border border-white/15 p-0.5">
            {VIEW_WINGS.map((w) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={w === wing}
                onClick={() => pickWing(w)}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors short:py-1.5 ${
                  w === wing ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <span className="h-6 w-px bg-white/15" aria-hidden="true" />
          <button type="button" aria-label="Lower view" onClick={() => go(at - 1)} disabled={at === 0} className={step}>
            <Arrow dir="down" />
          </button>
          <span className="min-w-[7.5rem] text-center text-[11px] font-semibold uppercase tracking-[0.2em] short:min-w-[6.5rem]">
            {view.label}
          </span>
          <button type="button" aria-label="Higher view" onClick={() => go(at + 1)} disabled={at === views.length - 1} className={step}>
            <Arrow dir="up" />
          </button>
        </div>
      </div>
    </div>
  );
}
