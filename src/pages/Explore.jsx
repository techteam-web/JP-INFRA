import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import menuImg from "../assets/menus.png";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const NAV_ITEMS = [
  { n: "01", label: "360°" },
  { n: "02", label: "Home" },
  { n: "03", label: "About Us" },
  { n: "04", label: "Gallery" },
  { n: "05", label: "Amenities" },
  { n: "06", label: "Floor Plans" },
  { n: "07", label: "Location" },
  { n: "08", label: "Contact" },
];

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

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
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
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

export default function Explore({ onBack, onOpen360, onOpenGallery }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState("Home");

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const RIGHT_ACTIONS = [
    { label: "Fullscreen", icon: <IconExpand />, onClick: toggleFullscreen },
    { label: "Floor Plan", icon: <IconPin />, onClick: () => setActive("Floor Plans") },
    { label: "Info", icon: <IconInfo />, onClick: () => setActive("About Us") },
  ];

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
        className="absolute left-6 top-6 z-10 flex items-center gap-3 sm:left-10 sm:top-8"
      >
        <BackButton onClick={onBack} />
        <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex">
          <span className="h-px w-6 bg-white/40" />
          Explore &middot; 360&deg; View
        </span>
      </div>

      {/* Top-right: logo */}
      <div
        data-anim
        className="absolute right-6 top-6 flex flex-col items-end gap-1.5 sm:right-10 sm:top-8"
      >
        <div className="rounded-lg bg-navy-700 p-1.5">
          <Logo className="h-9 w-auto sm:h-10" />
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50 sm:text-[10px]">
          Shaping Better Tomorrow
        </p>
      </div>

      {/* Left index nav */}
      <nav className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 sm:left-10 lg:flex">
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
              className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-all duration-300 active:scale-95 ${
                isActive ? "bg-navy-700/40" : ""
              }`}
            >
              <span
                className={`h-px transition-all duration-300 ${
                  isActive ? "w-8 bg-red-600" : "w-4 bg-navy-700/70 group-hover:w-6 group-hover:bg-white/60"
                }`}
              />
              <span
                className={`text-sm font-bold tracking-widest transition-colors duration-300 ${
                  isActive ? "text-red-600" : "text-white/40"
                }`}
              >
                {item.n}
              </span>
              <span
                className={`font-display text-lg uppercase tracking-[0.15em] transition-colors sm:text-xl ${
                  isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right action stack */}
      <div
        data-anim
        className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-6 sm:right-10 lg:flex"
      >
        {RIGHT_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="group flex flex-col items-center gap-2 text-white/70 transition-colors duration-200 hover:text-white"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 backdrop-blur transition-all duration-200 group-hover:scale-105 group-hover:bg-white/10 group-active:scale-90">
              {action.icon}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Center: headline + 360 control */}
      <div
        data-anim
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-display text-4xl uppercase leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          Experience
          <br />
          In Every <span className="text-red-600">Angle</span>
        </h2>
        <span className="mt-4 block h-px w-16 bg-white/30" />
        <p className="mt-4 max-w-sm text-xs font-medium uppercase leading-relaxed tracking-[0.12em] text-white/70 sm:text-sm">
          Step into a 360&deg; world and explore spaces crafted for a more
          inspired life.
        </p>

        <div className="pointer-events-auto mt-8 flex items-center gap-5">
          <button
            type="button"
            onClick={() => goRelative(-1)}
            aria-label="Previous section"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90"
          >
            <IconChevron dir="left" />
          </button>

          <button
            type="button"
            onClick={() => onOpen360?.()}
            className="group grid h-20 w-20 place-items-center rounded-full border border-white/40 text-white backdrop-blur transition-all duration-300 ease-out hover:border-white hover:bg-white hover:text-navy-950 active:scale-95 sm:h-24 sm:w-24"
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold tracking-widest">360&deg;</span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] opacity-70">
                Drag
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label="Next section"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90"
          >
            <IconChevron dir="right" />
          </button>
        </div>
      </div>

      {/* Bottom taglines */}
      <div
        data-anim
        className="absolute bottom-6 left-6 z-10 hidden sm:left-10 sm:block"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/40">
          People &middot; Places &middot; Possibilities
        </span>
      </div>
      <div
        data-anim
        className="absolute bottom-6 right-6 z-10 hidden items-center gap-3 sm:right-10 sm:flex"
      >
        <span className="h-px w-6 bg-white/30" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/40">
          Building Landmarks. Creating Lifetimes.
        </span>
      </div>
    </div>
  );
}
