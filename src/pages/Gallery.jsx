import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GALLERY_IMAGES } from "../data/gallery";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

function IconChevron({ dir = "left" }) {
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

// Fullscreen, one image at a time — click the photo (or the arrows / ←→
// keys) to reveal the next one through an expanding clip-path "iris",
// opening from wherever you clicked (or centered, for arrow/keyboard nav).
// No grid.
export default function Gallery({ onBack }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [index, setIndex] = useState(0);
  const layerTopRef = useRef(null);
  const prevIndexRef = useRef(0);
  const originRef = useRef({ x: 0.5, y: 0.5 });
  const tweenRef = useRef(null);
  const total = GALLERY_IMAGES.length;

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
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" }
    );
  }, []);

  // Clip-path iris reveal: the incoming image opens from a point (the
  // click, or center for arrow/keyboard nav) out to a circle large enough
  // to cover the whole frame, over the static outgoing image beneath it.
  // useLayoutEffect (not useEffect) so the reset-to-closed happens before
  // the browser paints the new image — otherwise there's a frame where the
  // new src is showing through the *previous* transition's fully-open
  // clip-path, which reads as "no animation at all".
  useLayoutEffect(() => {
    const top = layerTopRef.current;
    const stage = stageRef.current;
    if (!top || !stage) return;

    tweenRef.current?.kill();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = stage.getBoundingClientRect();
    const { x, y } = originRef.current;
    const cx = x * 100;
    const cy = y * 100;
    const maxRadius = Math.hypot(rect.width, rect.height);

    const setClip = (px) => {
      const value = `circle(${px}px at ${cx}% ${cy}%)`;
      top.style.clipPath = value;
      top.style.webkitClipPath = value;
    };

    if (reduce) {
      setClip(maxRadius);
      gsap.set(top, { scale: 1 });
      prevIndexRef.current = index;
      return;
    }

    setClip(0);
    gsap.set(top, { scale: 1.04 });

    const proxy = { r: 0 };
    tweenRef.current = gsap.to(proxy, {
      r: maxRadius,
      duration: 1,
      ease: "power4.inOut",
      onUpdate: () => setClip(proxy.r),
    });
    gsap.to(top, { scale: 1, duration: 1, ease: "power4.inOut" });

    prevIndexRef.current = index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goRelative = (delta, origin) => {
    if (!total) return;
    originRef.current = origin ?? { x: 0.5, y: 0.5 };
    setIndex((i) => (i + delta + total) % total);
  };

  const handleStageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    goRelative(1, {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goRelative(-1);
      if (e.key === "ArrowRight") goRelative(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const outgoingIndex = prevIndexRef.current;

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Top bar */}
      <div
        data-anim
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8"
      >
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex">
            <span className="h-px w-6 bg-white/40" />
            Gallery
          </span>
        </div>
        <div className="rounded-lg bg-navy-700 p-1.5">
          <Logo className="h-9 w-auto sm:h-10" />
        </div>
      </div>

      {total > 0 ? (
        <>
          {/* Image stage — click to advance */}
          <button
            ref={stageRef}
            type="button"
            onClick={handleStageClick}
            aria-label="Next image"
            className="absolute inset-0 z-0 cursor-pointer overflow-hidden"
          >
            <img
              src={GALLERY_IMAGES[outgoingIndex]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <img
              ref={layerTopRef}
              src={GALLERY_IMAGES[index]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
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
            className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 sm:left-8"
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
            className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 sm:right-8"
          >
            <IconChevron dir="right" />
          </button>

          {/* Counter */}
          <div
            data-anim
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold tracking-widest text-white backdrop-blur sm:bottom-8"
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
