import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const RESIDENCES = [
  { id: "3bhk", label: "3 BHK", unit: "3 BHK", area: "1,850 SQ.FT.", beds: 3, baths: 3, tower: "Tower A" },
  { id: "4bhk", label: "4 BHK", unit: "4 BHK", area: "2,450 SQ.FT.", beds: 4, baths: 4, tower: "Tower A" },
  { id: "penthouse", label: "Penthouse", unit: "Penthouse", area: "4,200 SQ.FT.", beds: 5, baths: 5, tower: "Tower A" },
  { id: "duplex", label: "Duplex", unit: "Duplex", area: "3,600 SQ.FT.", beds: 4, baths: 4, tower: "Tower B" },
  { id: "towera", label: "Tower A", unit: "4 BHK", area: "2,450 SQ.FT.", beds: 4, baths: 4, tower: "Tower A" },
  { id: "towerb", label: "Tower B", unit: "3 BHK", area: "1,950 SQ.FT.", beds: 3, baths: 3, tower: "Tower B" },
];

const UNITS = ["Unit 01", "Unit 02", "Unit 03", "Unit 04"];

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
      <path d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}
function IconTower() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 7h.01M14 7h.01M10 11h.01M14 11h.01M10 15h.01M14 15h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBed() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18v2M21 18v2M3 13V8a1 1 0 0 1 1-1h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBath() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 12V6a2 2 0 0 1 3-1.7M8 21v1.5M16 21v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconSofa() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 12h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 17v3M20 17v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconDeck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 3xl:h-6 3xl:w-6" fill="none" aria-hidden="true">
      <path d="M4 21V9l8-6 8 6v12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 21h16M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function FloorPlanDiagram() {
  return (
    <svg viewBox="0 0 440 300" className="h-auto w-full max-w-sm text-white/20 sm:max-w-md 3xl:max-w-lg" fill="none" aria-hidden="true">
      <rect x="20" y="20" width="400" height="260" stroke="currentColor" strokeWidth="1.4" />
      <line x1="20" y1="130" x2="220" y2="130" stroke="currentColor" strokeWidth="1" />
      <line x1="220" y1="20" x2="220" y2="280" stroke="currentColor" strokeWidth="1" />
      <line x1="220" y1="190" x2="420" y2="190" stroke="currentColor" strokeWidth="1" />
      <line x1="320" y1="130" x2="320" y2="190" stroke="currentColor" strokeWidth="1" />
      <line x1="120" y1="130" x2="120" y2="280" stroke="currentColor" strokeWidth="1" />
      <rect x="150" y="145" width="55" height="55" stroke="#ee3134" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x="70" y="78" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="1.5" textAnchor="middle">BEDROOM</text>
      <text x="270" y="65" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="1.5" textAnchor="middle">LIVING</text>
      <text x="70" y="207" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="1.5" textAnchor="middle">BEDROOM</text>
      <text x="270" y="163" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="1.5" textAnchor="middle">KITCHEN</text>
      <text x="370" y="217" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="1.5" textAnchor="middle">BATH</text>
    </svg>
  );
}

export default function FloorPlans({ onBack }) {
  const rootRef = useRef(null);
  const [activeId, setActiveId] = useState("4bhk");
  const [activeUnit, setActiveUnit] = useState(0);

  const active = RESIDENCES.find((r) => r.id === activeId) ?? RESIDENCES[0];

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
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power3.out" }
    );
  }, []);

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-y-auto bg-navy-950 lg:flex lg:flex-col lg:overflow-hidden">
      {/* Header */}
      <div
        data-anim
        className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-10 sm:py-5 3xl:px-14 3xl:py-6 4xl:px-16 4xl:py-7"
      >
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-white/40" />
            Floor Plans
          </span>
        </div>
        <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {/* Body: 3-column on desktop, stacked (scrollable) below lg */}
      <div className="lg:flex lg:min-h-0 lg:flex-1">
        {/* Left: residence selector */}
        <aside
          data-anim
          className="border-b border-white/10 px-6 py-6 sm:px-10 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:flex lg:flex-col lg:justify-between lg:px-8 lg:py-8 3xl:w-64 3xl:px-9 3xl:py-10"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50 3xl:text-xs">
              Choose Your
              <br />
              Residence
            </p>
            <span className="mt-3 block h-px w-8 bg-red-600" />

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar lg:mt-6 lg:flex-col lg:gap-2.5 lg:overflow-visible lg:pb-0">
              {RESIDENCES.map((r) => {
                const isActive = r.id === activeId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    style={{ "--btn-fill-color": "rgba(255,255,255,0.06)" }}
                    className={`btn-fill flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 3xl:px-4 3xl:py-3 3xl:text-sm ${
                      isActive
                        ? "border-red-600/70 bg-red-600/10 text-white"
                        : "border-white/10 text-white/60 hover:text-white/85"
                    }`}
                  >
                    {r.label}
                    {isActive && <IconArrow />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 hidden lg:block">
            <span className="mb-3 block h-px w-8 bg-white/20" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/40 3xl:text-xs">
              A Brighter Tomorrow
            </p>
          </div>
        </aside>

        {/* Center: floor plan + unit tabs + stat strip */}
        <div className="flex flex-col items-center justify-center gap-5 border-b border-white/10 px-6 py-8 sm:px-10 lg:min-w-0 lg:flex-1 lg:gap-6 lg:border-b-0 lg:border-r lg:px-10 lg:py-6 3xl:px-14">
          <div data-anim className="flex w-full justify-center">
            <FloorPlanDiagram />
          </div>

          <div data-anim className="flex w-full max-w-md overflow-hidden rounded-lg border border-white/10 3xl:max-w-lg">
            {UNITS.map((u, i) => (
              <button
                key={u}
                type="button"
                onClick={() => setActiveUnit(i)}
                style={{ "--btn-fill-color": "rgba(238,49,52,0.85)" }}
                className={`btn-fill flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 3xl:py-3 3xl:text-xs ${
                  activeUnit === i ? "bg-red-600 text-white" : "text-white/60 hover:text-white/85"
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <div
            data-anim
            className="grid w-full max-w-2xl grid-cols-2 gap-4 divide-white/10 text-center sm:grid-cols-4 sm:divide-x 3xl:max-w-3xl"
          >
            <div className="px-2">
              <p className="font-display text-lg text-white sm:text-xl 3xl:text-2xl">{active.unit}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45 3xl:text-[10px]">
                Unit Type
              </p>
            </div>
            <div className="px-2">
              <p className="font-display text-lg text-white sm:text-xl 3xl:text-2xl">{active.area}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45 3xl:text-[10px]">
                Super Built-Up Area
              </p>
            </div>
            <div className="flex flex-col items-center px-2">
              <IconCompass />
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45 3xl:text-[10px]">
                Orientation
              </p>
            </div>
            <div className="flex flex-col items-center px-2">
              <IconTower />
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45 3xl:text-[10px]">
                {active.tower}
              </p>
            </div>
          </div>
        </div>

        {/* Right: headline + specs + CTA */}
        <aside
          data-anim
          className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:w-72 lg:shrink-0 lg:px-8 lg:py-10 3xl:w-80 3xl:px-9"
        >
          <div>
            <p className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-white/45 3xl:text-xs">
              Spaces That Belong
              <br />
              To A Brighter Tomorrow
            </p>
            <span className="mt-4 block h-px w-8 bg-red-600" />

            <h1 className="mt-4 font-display uppercase text-4xl leading-none text-white sm:text-5xl 3xl:text-6xl">
              {active.unit}
            </h1>
            <span className="mt-4 block h-px w-8 bg-white/20" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 3xl:text-xs">
              {active.tower}
              <br />
              Typical Floor
            </p>

            <div className="mt-6 space-y-3.5 3xl:mt-8 3xl:space-y-4">
              <div className="flex items-center gap-3">
                <IconExpand />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 3xl:text-sm">
                  {active.area} <span className="text-white/40">Super Built-Up Area</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IconBed />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 3xl:text-sm">
                  {active.beds} Bedrooms
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IconBath />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 3xl:text-sm">
                  {active.baths} Bathrooms
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IconSofa />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 3xl:text-sm">
                  Living &amp; Dining
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IconDeck />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 3xl:text-sm">
                  Spacious Deck
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            style={{ "--btn-fill-color": "#ee3134" }}
            className="btn-fill group mt-8 flex items-center justify-center gap-3 self-center rounded-full border border-red-600/60 px-6 py-3 text-white transition-colors duration-300 hover:border-red-600 lg:self-end 3xl:px-7 3xl:py-3.5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] 3xl:text-xs">View Details</span>
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 -rotate-45 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 3xl:h-4 3xl:w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </aside>
      </div>
    </div>
  );
}
