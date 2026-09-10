import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AMENITIES } from "../data/amenities";
import { INFLUENCER_AMENITIES } from "../data/influencerAmenities";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

// Two separate slideshows sharing the same fullscreen viewer: the general
// amenities, and — only when the "Influencer Amenities" toggle is on — the
// influencer shots exclusively, with nothing else mixed in.
const GENERAL_ITEMS = AMENITIES.map((a) => ({ id: a.id, image: a.image }));
const INFLUENCER_ITEMS = INFLUENCER_AMENITIES.map((i) => ({ id: i.id, image: i.image }));

const TRANSITION_DURATION = 1.7;
const TRANSITION_EASE = "power4.inOut";
// Next: incoming image is clipped from the right (inset(0 0 0 100%)) and
// reveals right -> left as the left inset recedes to 0 — a hard wipe-line
// sweeps from right to left across the screen, uncovering the new image as
// it goes. Previous is the exact mirror: clipped from the left
// (inset(0 100% 0 0)) and reveals left -> right as the right inset recedes
// to 0. A gentle scale is layered on top of the clip-path on both images
// (incoming settles in from a slight zoom, outgoing drifts to a slight
// zoom as it's covered) so the wipe reads as a cinematic push rather than
// a flat, static cut.
const CLIP_OPEN = "inset(0 0 0 0)";
const clipStart = (delta) => (delta > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)");
const ENTER_SCALE = 1.06;
const EXIT_SCALE = 1.04;

function IconChevron({ dir = "left" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 3xl:h-5 3xl:w-5 4xl:h-6 4xl:w-6" aria-hidden="true">
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

// Two permanent fullscreen layers (A/B) that ping-pong roles, identical
// mechanics to Gallery.jsx: the outgoing image stays put, the incoming
// layer is preloaded, clipped fully hidden from the appropriate edge, then
// revealed via clip-path. GSAP exclusively owns clipPath/z-index on these
// persistent DOM nodes — neither is driven by React props/state — so a
// React re-render can never interrupt or reset an in-flight transition.
export default function Amenities({ onBack }) {
  const rootRef = useRef(null);
  const layerARef = useRef(null);
  const layerBRef = useRef(null);
  const activeRef = useRef("A");
  const isAnimatingRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [showInfluencers, setShowInfluencers] = useState(false);
  const items = showInfluencers ? INFLUENCER_ITEMS : GENERAL_ITEMS;
  const total = items.length;

  const toggleInfluencers = () => {
    setShowInfluencers((v) => !v);
    setIndex(0);
    isAnimatingRef.current = false;
  };

  useLayoutEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" }
    );
  }, []);

  // One-time setup: layer A shows item 0, fully open (unclipped); layer B
  // is primed with the next item, fully clipped and ready to reveal in.
  useLayoutEffect(() => {
    const a = layerARef.current;
    const b = layerBRef.current;
    if (!a || !b || total === 0) return;

    a.src = items[0].image;
    gsap.set(a, { clipPath: CLIP_OPEN, zIndex: 1, scale: 1, transformOrigin: "50% 50%" });

    b.src = items[total > 1 ? 1 : 0].image;
    gsap.set(b, { clipPath: clipStart(1), zIndex: 2, scale: ENTER_SCALE, transformOrigin: "right center" });

    activeRef.current = "A";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, showInfluencers]);

  // Warm the browser's cache for both neighbors of the current item in the
  // background so Next/Previous almost never has to wait on a network
  // fetch before the reveal can start.
  useLayoutEffect(() => {
    if (!total) return;
    const nextSrc = items[(index + 1) % total].image;
    const prevSrc = items[(index - 1 + total) % total].image;
    for (const src of [nextSrc, prevSrc]) {
      const img = new Image();
      img.src = src;
    }
  }, [index, total, showInfluencers]);

  const goRelative = (delta) => {
    if (!total || isAnimatingRef.current) return;

    const nextIndex = (index + delta + total) % total;
    const nextSrc = items[nextIndex].image;

    const activeEl = activeRef.current === "A" ? layerARef.current : layerBRef.current;
    const inactiveEl = activeRef.current === "A" ? layerBRef.current : layerARef.current;
    if (!activeEl || !inactiveEl) return;

    isAnimatingRef.current = true;
    // No preload wait here — the background neighbor cache-warming effect
    // above means this image is almost always already downloaded by the
    // time the user clicks, so the reveal starts the instant the click
    // happens instead of pausing on a network round-trip first.
    const enterOrigin = delta > 0 ? "right center" : "left center";
    const exitOrigin = delta > 0 ? "left center" : "right center";

    inactiveEl.src = nextSrc;
    gsap.set(inactiveEl, {
      clipPath: clipStart(delta),
      zIndex: 2,
      scale: ENTER_SCALE,
      transformOrigin: enterOrigin,
    });
    gsap.set(activeEl, { clipPath: CLIP_OPEN, zIndex: 1, scale: 1, transformOrigin: exitOrigin });

    const finish = () => {
      activeRef.current = activeRef.current === "A" ? "B" : "A";
      isAnimatingRef.current = false;
      setIndex(nextIndex);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(inactiveEl, { clipPath: CLIP_OPEN, scale: 1 });
      finish();
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(
      inactiveEl,
      { clipPath: CLIP_OPEN, scale: 1, duration: TRANSITION_DURATION, ease: TRANSITION_EASE },
      0
    );
    tl.to(activeEl, { scale: EXIT_SCALE, duration: TRANSITION_DURATION, ease: TRANSITION_EASE }, 0);
  };

  useLayoutEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goRelative(-1);
      if (e.key === "ArrowRight") goRelative(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, index]);

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Top bar */}
      <div
        data-anim
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12"
      >
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-white/40" />
            Amenities
          </span>
        </div>
        <button
          type="button"
          onClick={toggleInfluencers}
          style={{ "--btn-fill-color": "rgba(238,49,52,0.85)" }}
          className={`btn-fill rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-200 sm:text-xs 3xl:px-5 3xl:py-2 3xl:text-sm ${
            showInfluencers ? "border-red-600 bg-red-600 text-white" : "border-white/25 text-white/70 hover:text-white"
          }`}
        >
          {showInfluencers ? "All Amenities" : "Influencer Amenities"}
        </button>

        <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {total > 0 ? (
        <>
          {/* Image stage — click to advance */}
          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label="Next amenity"
            className="absolute inset-0 z-0 cursor-pointer overflow-hidden"
          >
            <img
              ref={layerARef}
              alt=""
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <img
              ref={layerBRef}
              alt=""
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0 z-[3]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,31,54,0.5) 0%, transparent 20%, transparent 70%, rgba(10,31,54,0.65) 100%)",
              }}
            />
          </button>

          {/* Prev / next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goRelative(-1);
            }}
            aria-label="Previous amenity"
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:left-8 xl:h-12 xl:w-12 2xl:left-10 3xl:left-12 3xl:h-14 3xl:w-14 4xl:left-16 4xl:h-16 4xl:w-16"
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goRelative(1);
            }}
            aria-label="Next amenity"
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:right-8 xl:h-12 xl:w-12 2xl:right-10 3xl:right-12 3xl:h-14 3xl:w-14 4xl:right-16 4xl:h-16 4xl:w-16"
          >
            <IconChevron dir="right" />
          </button>

          {/* Counter */}
          <div
            data-anim
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold tracking-widest text-white backdrop-blur sm:bottom-8 xl:px-5 xl:py-2 xl:text-sm 2xl:bottom-10 3xl:bottom-12 3xl:px-6 3xl:text-base 4xl:bottom-14 4xl:px-7 4xl:text-lg"
          >
            {index + 1} / {total}
          </div>
        </>
      ) : (
        <p
          data-anim
          className="relative z-10 flex h-full items-center justify-center px-6 text-center text-sm text-white/40"
        >
          No amenities yet — add photos to src/assets/Aminities/.
        </p>
      )}
    </div>
  );
}
