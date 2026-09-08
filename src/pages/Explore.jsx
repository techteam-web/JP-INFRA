import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import menuImg from "../assets/menus.png";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const NAV_ITEMS = [
  { n: "01", label: "360°" },
  { n: "02", label: "About Us" },
  { n: "03", label: "Gallery" },
  { n: "04", label: "Amenities" },
  { n: "05", label: "Floor Plans" },
  { n: "07", label: "Location" },
  { n: "08", label: "Contact" },
];

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconChevron({ dir = "left" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 3xl:h-4 3xl:w-4" aria-hidden="true">
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

function IconHamburger() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Explore({ onBack, onOpen360, onOpenGallery }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState("Home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" }
    );
  }, []);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.label === active)
  );

  const goRelative = (delta) => {
    const next = (activeIndex + delta + NAV_ITEMS.length) % NAV_ITEMS.length;
    setActive(NAV_ITEMS[next].label);
  };

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img src={menuImg} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,31,54,0.55) 0%, rgba(10,31,54,0.05) 30%, rgba(10,31,54,0.1) 60%, rgba(10,31,54,0.75) 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-72"
          style={{
            background: "linear-gradient(90deg, rgba(10,31,54,0.6) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Top-left: back + breadcrumb */}
      <div
        data-anim
        className="absolute left-6 top-6 z-10 flex items-center gap-3 sm:left-10 sm:top-8 3xl:left-14 3xl:top-10 4xl:left-16 4xl:top-12"
      >
        <BackButton onClick={onBack} />
        {/* <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
          <span className="h-px w-6 bg-white/40" />
          Explore &middot; 360&deg; View
        </span> */}
        {/* Mobile-only nav trigger — hidden from md upward, where the
            existing lg:flex left index nav (or, between md and lg, no nav
            at all) takes over exactly as before. */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 md:hidden"
        >
          <IconHamburger />
        </button>
      </div>

      {/* Top-right: logo */}
      <div
        data-anim
        className="absolute right-6 top-6 flex flex-col items-end gap-1.5 sm:right-10 sm:top-8 3xl:right-14 3xl:top-10 4xl:right-16 4xl:top-12"
      >
        <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
        {/* <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50 sm:text-[10px] 3xl:text-xs 4xl:text-sm">
          Shaping Better Tomorrow
        </p> */}
      </div>

      {/* Left index nav */}
      <nav className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 sm:left-10 lg:flex 2xl:gap-5 3xl:left-14 3xl:gap-6 4xl:left-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;
          return (
            <button
              key={item.n}
              type="button"
              data-anim
              onClick={() => {
                setActive(item.label);
                if (item.label === "360°") onOpen360?.();
                if (item.label === "Gallery") onOpenGallery?.();
              }}
              className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-all duration-300 active:scale-95 3xl:gap-4 3xl:px-3 3xl:py-2 ${
                isActive ? "bg-navy-700/40" : ""
              }`}
            >
              <span
                className={`h-px transition-all duration-300 ${
                  isActive ? "w-8 bg-red-600" : "w-4 bg-navy-700/70 group-hover:w-6 group-hover:bg-white/60"
                }`}
              />
              <span
                className={`text-sm font-bold tracking-widest transition-colors duration-300 3xl:text-base 4xl:text-lg ${
                  isActive ? "text-red-600" : "text-white/40"
                }`}
              >
                {item.n}
              </span>
              <span
                className={`font-display text-lg uppercase tracking-[0.15em] transition-colors sm:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl ${
                  isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile nav overlay — below md only. Does not touch the desktop
          <nav> above at all; from md upward this never renders. */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-navy-950/98 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90"
          >
            <IconClose />
          </button>

          {NAV_ITEMS.map((item) => {
            const isActive = item.label === active;
            return (
              <button
                key={item.n}
                type="button"
                onClick={() => {
                  setActive(item.label);
                  if (item.label === "360°") onOpen360?.();
                  if (item.label === "Gallery") onOpenGallery?.();
                  setMobileNavOpen(false);
                }}
                className="group flex items-center gap-3"
              >
                <span
                  className={`text-xs font-bold tracking-widest transition-colors duration-300 ${
                    isActive ? "text-red-600" : "text-white/40"
                  }`}
                >
                  {item.n}
                </span>
                <span
                  className={`font-display text-2xl uppercase tracking-[0.15em] transition-colors ${
                    isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Center: headline + 360 control */}
      <div
        data-anim
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-display text-4xl uppercase leading-[1.05] text-white sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5.5rem] 3xl:text-[6.5rem] 4xl:text-[8rem]">
          Experience
          <br />
          In Every <span className="text-red-600">Angle</span>
        </h2>
        <span className="mt-4 block h-px w-16 bg-white/30 3xl:w-20 4xl:w-24" />
        <p className="mt-4 max-w-sm text-xs font-medium uppercase leading-relaxed tracking-[0.12em] text-white/70 sm:text-sm xl:max-w-md xl:text-base 3xl:max-w-lg 3xl:text-lg">
          Step into a 360&deg; world and explore spaces crafted for a more
          inspired life.
        </p>

        <div className="pointer-events-auto mt-8 flex items-center gap-5 3xl:mt-10 3xl:gap-6">
          <button
            type="button"
            onClick={() => goRelative(-1)}
            aria-label="Previous section"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 xl:h-10 xl:w-10 3xl:h-12 3xl:w-12"
          >
            <IconChevron dir="left" />
          </button>

          <button
            type="button"
            onClick={() => onOpen360?.()}
            className="group grid h-20 w-20 place-items-center rounded-full border border-white/40 text-white backdrop-blur transition-all duration-300 ease-out hover:border-white hover:bg-white hover:text-navy-950 active:scale-95 sm:h-24 sm:w-24 xl:h-28 xl:w-28 2xl:h-32 2xl:w-32 3xl:h-36 3xl:w-36 4xl:h-40 4xl:w-40"
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold tracking-widest 3xl:text-base 4xl:text-lg">360&deg;</span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] opacity-70 3xl:text-[10px]">
                Drag
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label="Next section"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 xl:h-10 xl:w-10 3xl:h-12 3xl:w-12"
          >
            <IconChevron dir="right" />
          </button>
        </div>
      </div>

      {/* Bottom-left: Info */}
      <button
        type="button"
        data-anim
        onClick={() => setActive("About Us")}
        className="group absolute bottom-6 left-6 z-10 hidden items-center gap-2 text-white/60 transition-colors duration-200 hover:text-white sm:left-10 sm:flex 3xl:bottom-10 3xl:left-14 4xl:bottom-12 4xl:left-16"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 backdrop-blur transition-all duration-200 group-hover:scale-105 group-hover:bg-white/10 group-active:scale-90 3xl:h-9 3xl:w-9 4xl:h-10 4xl:w-10">
          <IconInfo />
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] 3xl:text-xs 4xl:text-sm">Info</span>
      </button>
      <div
        data-anim
        className="absolute bottom-6 right-6 z-10 hidden items-center gap-3 sm:right-10 sm:flex 3xl:bottom-10 3xl:right-14 4xl:bottom-12 4xl:right-16"
      >
        <span className="h-px w-6 bg-white/30" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/40 3xl:text-xs 4xl:text-sm">
          Building Landmarks. Creating Lifetimes.
        </span>
      </div>
    </div>
  );
}
