import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import aboutImg from "../assets/menu.png";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const PILLARS = [
  { label: "Our People", icon: "people" },
  { label: "Our Places", icon: "places" },
  { label: "Sustainability", icon: "leaf" },
  { label: "Our Progress", icon: "progress" },
  { label: "Our Values", icon: "diamond" },
];

function PillarIcon({ name }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-6 w-6 text-red-600 sm:h-7 sm:w-7 3xl:h-8 3xl:w-8",
    fill: "none",
    "aria-hidden": true,
  };
  if (name === "people") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="16" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M14.5 14.8c2.2.2 3.8 1.7 4.3 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "places") {
    return (
      <svg {...common}>
        <path d="M5 19V10l4-2.5 4 2.5v9M5 19h12M13 19v-5h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M9 11h.01M9 14h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "leaf") {
    return (
      <svg {...common}>
        <path
          d="M19 5c.6 6.5-3 12-10 13-1 .1-2-.4-2-1.5C7 9.5 12.5 5.6 19 5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M8 16c2-3 5-6 9-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "progress") {
    return (
      <svg {...common}>
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M6 19v-4M11 19V9M16 19v-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 10l5-4 4 3 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 4h12l3 5-9 11L3 9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 9h18M9 4l-2.5 5L12 20l5.5-11L15 4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export default function AboutUs({ onBack }) {
  const rootRef = useRef(null);

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
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }
    );
  }, []);

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Background photo */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={aboutImg} alt="" className="animate-kenburns h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,31,54,0.6) 0%, rgba(10,31,54,0.12) 32%, rgba(10,31,54,0.18) 62%, rgba(10,31,54,0.88) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,31,54,0.55)_100%)]" />
      </div>

      {/* Top-left: back + breadcrumb */}
      <div
        data-anim
        className="absolute left-6 top-6 z-10 flex items-center gap-3 sm:left-10 sm:top-8 3xl:left-14 3xl:top-10 4xl:left-16 4xl:top-12"
      >
        <BackButton onClick={onBack} />
        <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
          <span className="h-px w-6 bg-white/40" />
          About Us
        </span>
      </div>

      {/* Top-right: logo */}
      <div
        data-anim
        className="absolute right-6 top-6 flex flex-col items-end gap-1.5 sm:right-10 sm:top-8 3xl:right-14 3xl:top-10 4xl:right-16 4xl:top-12"
      >
        <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50 sm:text-[10px] 3xl:text-xs 4xl:text-sm">
          A Brighter Tomorrow
        </p>
      </div>

      {/* Center: story headline */}
      <div
        data-anim
        className="pointer-events-none absolute inset-x-0 top-[32%] flex -translate-y-1/2 flex-col items-center px-6 text-center sm:top-1/2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70 sm:text-xs 3xl:text-sm">
          Our Story
        </span>
        <span className="mt-4 h-8 w-px bg-white/25 3xl:h-10" />
        <h1 className="mt-4 font-display uppercase text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] 2xl:text-[6rem] 3xl:text-[7rem] 4xl:text-[8.5rem]">
          Built On Trust
          <br />
          <span className="text-red-600">For A Brighter Tomorrow</span>
        </h1>
        <span className="mt-4 h-8 w-px bg-white/25 3xl:h-10" />
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.5em] text-white/60 sm:text-xs 3xl:text-sm">
          People &nbsp; Spaces &nbsp; Possibilities
        </p>
      </div>

      {/* Bottom: five pillars */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex flex-wrap items-start justify-center gap-x-6 gap-y-6 px-6 sm:bottom-10 sm:gap-x-10 lg:gap-x-14 3xl:bottom-12 3xl:gap-x-20">
        {PILLARS.map((p) => (
          <div
            key={p.label}
            data-anim
            className="flex w-20 flex-col items-center gap-2.5 text-center sm:w-24 3xl:w-28"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/20 backdrop-blur-sm transition-colors duration-300 hover:border-red-600/60 sm:h-14 sm:w-14 3xl:h-16 3xl:w-16">
              <PillarIcon name={p.icon} />
            </span>
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.2em] text-white sm:text-[10px] 3xl:text-xs">
              {p.label}
            </span>
            <span className="h-px w-6 bg-red-600/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
