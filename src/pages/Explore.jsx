import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import menuImg from "../assets/menu.png";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const NAV_ITEMS = [
  { n: "01", label: "Home" },
  { n: "02", label: "About Us" },
  { n: "03", label: "Amenities" },
  { n: "04", label: "Gallery" },
  { n: "05", label: "Floor Plans" },
  { n: "06", label: "Location" },
  { n: "07", label: "Contact" },
  { n: "08", label: "360°" },
];

export default function Explore({ onBack, onOpen360 }) {
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

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <div data-anim className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-auto sm:h-10" />
            <span className="block text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50 sm:text-[10px]">
              Shaping Better Tomorrow
            </span>
          </div>
        </div>

        <div data-anim className="flex items-center gap-3">
          <a
            href="#"
            className="group hidden items-center gap-2 rounded-full border border-white/35 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-navy-950 active:translate-y-0 active:scale-[0.97] sm:flex"
          >
            Enquire Now
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
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
              }}
              className="group flex items-center gap-3 text-left transition-transform duration-200 active:scale-95"
            >
              <span
                className={`h-px transition-all duration-300 ${
                  isActive ? "w-6 bg-red-500" : "w-3 bg-white/30 group-hover:w-5 group-hover:bg-white/60"
                }`}
              />
              <span
                className={`text-[10px] font-bold tracking-widest transition-colors duration-300 ${
                  isActive ? "text-red-500" : "text-white/40"
                }`}
              >
                {item.n}
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                  isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
