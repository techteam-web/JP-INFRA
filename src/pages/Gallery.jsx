import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { GALLERY_IMAGES } from "../data/gallery";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import ImageCaption from "../components/ImageCaption";
import CurtainStage from "../components/CurtainStage";
import { useCurtainSlider } from "../hooks/useCurtainSlider";

// Photo URLs in display order (module-level so the slider sees a stable array)
const SRCS = GALLERY_IMAGES.map((g) => g.image);

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

// Full-screen slideshow: the shared parallax curtain (useCurtainSlider) — next
// unveils right → left, previous left → right.
export default function Gallery({ onBack }) {
  const rootRef = useRef(null);
  const { index, go, layerARef, layerBRef } = useCurtainSlider(SRCS);
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
          <CurtainStage
            layerARef={layerARef}
            layerBRef={layerBRef}
            onNext={() => go(1)}
            label="Next image"
            shade={false}
          />

          {/* Prev / next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous image"
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:left-8 xl:h-12 xl:w-12 2xl:left-10 3xl:left-12 3xl:h-14 3xl:w-14 4xl:left-16 4xl:h-16 4xl:w-16"
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next image"
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:right-8 xl:h-12 xl:w-12 2xl:right-10 3xl:right-12 3xl:h-14 3xl:w-14 4xl:right-16 4xl:h-16 4xl:w-16"
          >
            <IconChevron dir="right" />
          </button>

          <ImageCaption id={GALLERY_IMAGES[index].id} label="Gallery" name={GALLERY_IMAGES[index].name} />

          {/* Counter */}
          <div
            data-anim
            className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit items-center gap-2.5 rounded-xl border border-white/25 bg-navy-950/55 px-5 py-2.5 text-white shadow-premium backdrop-blur-xl sm:bottom-8 xl:px-6 xl:py-3 2xl:bottom-10 3xl:bottom-12 3xl:px-7 4xl:bottom-14 4xl:px-8"
          >
            <span className="text-xs font-bold tracking-widest text-red-600 xl:text-sm 3xl:text-base 4xl:text-lg">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="h-3 w-px bg-white/30 3xl:h-4" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-widest text-white/70 xl:text-sm 3xl:text-base 4xl:text-lg">
              {String(total).padStart(2, "0")}
            </span>
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
