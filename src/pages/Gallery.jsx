import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GALLERY_IMAGES } from "../data/gallery";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const TRANSITION_DURATION = 1.3;
const TRANSITION_EASE = "power3.inOut";
// Next: incoming image starts fully off-screen to the right (xPercent 100)
// and slides to 0; outgoing slides from 0 to fully off-screen left
// (xPercent -100) at the same time. Previous is the mirror: incoming starts
// off-screen left (-100) and slides to 0; outgoing slides to the right
// (100). Both layers move simultaneously — a real horizontal slide, not a
// mask/reveal.
const OFFSCREEN = 100;

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

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    if (img.complete) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

// Two permanent fullscreen layers (A/B) that ping-pong roles. On Next, the
// incoming layer is preloaded and parked off-screen right, then both layers
// slide left simultaneously (incoming in, outgoing out); Previous mirrors
// this from/to the left — a true horizontal slide via xPercent, not a
// mask/reveal. GSAP exclusively owns xPercent/z-index on these two
// persistent DOM nodes — neither is driven by React props/state — so a
// React re-render can never interrupt or reset an in-flight transition.
export default function Gallery({ onBack }) {
  const rootRef = useRef(null);
  const layerARef = useRef(null);
  const layerBRef = useRef(null);
  const activeRef = useRef("A");
  const isAnimatingRef = useRef(false);
  const [index, setIndex] = useState(0);
  const total = GALLERY_IMAGES.length;

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

  // One-time setup: layer A shows image 0, fully visible; layer B is primed
  // with the next image, parked off-screen to the right and ready to slide in.
  useLayoutEffect(() => {
    const a = layerARef.current;
    const b = layerBRef.current;
    if (!a || !b || total === 0) return;

    a.src = GALLERY_IMAGES[0];
    gsap.set(a, { xPercent: 0, zIndex: 1 });

    b.src = GALLERY_IMAGES[total > 1 ? 1 : 0];
    gsap.set(b, { xPercent: OFFSCREEN, zIndex: 2 });

    activeRef.current = "A";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const goRelative = async (delta) => {
    if (!total || isAnimatingRef.current) return;

    const nextIndex = (index + delta + total) % total;
    const nextSrc = GALLERY_IMAGES[nextIndex];

    const activeEl = activeRef.current === "A" ? layerARef.current : layerBRef.current;
    const inactiveEl = activeRef.current === "A" ? layerBRef.current : layerARef.current;
    if (!activeEl || !inactiveEl) return;

    const enterFrom = delta > 0 ? OFFSCREEN : -OFFSCREEN;
    const exitTo = delta > 0 ? -OFFSCREEN : OFFSCREEN;

    isAnimatingRef.current = true;
    await preloadImage(nextSrc);

    inactiveEl.src = nextSrc;
    gsap.set(inactiveEl, { xPercent: enterFrom, zIndex: 2 });
    gsap.set(activeEl, { xPercent: 0, zIndex: 1 });

    const finish = () => {
      activeRef.current = activeRef.current === "A" ? "B" : "A";
      isAnimatingRef.current = false;
      setIndex(nextIndex);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(inactiveEl, { xPercent: 0 });
      gsap.set(activeEl, { xPercent: exitTo });
      finish();
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(inactiveEl, { xPercent: 0, duration: TRANSITION_DURATION, ease: TRANSITION_EASE }, 0);
    tl.to(activeEl, { xPercent: exitTo, duration: TRANSITION_DURATION, ease: TRANSITION_EASE }, 0);
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
            Gallery
          </span>
        </div>
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
            aria-label="Next image"
            className="absolute inset-0 z-0 cursor-pointer overflow-hidden"
          >
            <img ref={layerARef} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <img ref={layerBRef} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 sm:left-8 xl:h-12 xl:w-12 2xl:left-10 3xl:left-12 3xl:h-14 3xl:w-14 4xl:left-16 4xl:h-16 4xl:w-16"
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goRelative(1);
            }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 sm:right-8 xl:h-12 xl:w-12 2xl:right-10 3xl:right-12 3xl:h-14 3xl:w-14 4xl:right-16 4xl:h-16 4xl:w-16"
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
          No images yet — add photos to src/assets/gallery/.
        </p>
      )}
    </div>
  );
}
