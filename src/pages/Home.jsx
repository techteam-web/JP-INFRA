import { useEffect, useRef } from "react";
import gsap from "gsap";
import heroImg from "../assets/hero.png";
import Logo from "../components/Logo";

export default function Home({ animate = false, onExplore }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const els = contentRef.current?.querySelectorAll("[data-anim]");
    if (els) gsap.set(els, { opacity: 0, y: 22 });
  }, []);

  useEffect(() => {
    if (!animate) return;
    const els = contentRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.12,
      delay: 0.15,
      ease: "power3.out",
    });
  }, [animate]);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Background photo */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImg}
          alt=""
          className="animate-kenburns h-full w-full object-cover"
        />
        {/* left-to-right scrim so the hero copy stays legible over the sky */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,31,54,0.75) 0%, rgba(10,31,54,0.35) 40%, rgba(10,31,54,0.05) 65%, transparent 80%)",
          }}
        />
        {/* subtle top scrim so the logo stays legible over bright sky */}
        <div
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background: "linear-gradient(180deg, rgba(10,31,54,0.55) 0%, transparent 100%)",
          }}
        />
      </div>

      <div ref={contentRef} className="relative z-10 flex h-full flex-col">
        {/* Logo */}
        <div
          data-anim
          className="absolute right-6 top-6 flex flex-col items-end gap-1.5 sm:right-10 sm:top-8"
        >
          <div className="rounded-lg bg-navy-700 p-1.5">
            <Logo className="h-9 w-auto sm:h-10" />
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50 sm:text-[10px]">
            Building Landmarks. Creating Lifetimes.
          </p>
        </div>

        {/* Hero copy */}
        <div className="flex h-full items-center px-6 sm:px-12 lg:px-20">
          <div className="max-w-xl">
            <div
              data-anim
              className="text-xs font-semibold uppercase leading-relaxed tracking-[0.3em] text-white/85"
            >
              <p>Homes For</p>
              <p>A Brighter Tomorrow</p>
            </div>

            <span data-anim className="mt-4 block h-px w-16 bg-white/30" />

            <h1
              data-anim
              className="mt-5 font-display uppercase text-5xl leading-[1.05] text-white sm:text-6xl lg:text-[4.5rem]"
            >
              A Life Beyond
              <br />
              <span className="text-red-600">The Ordinary</span>
            </h1>

            <p
              data-anim
              className="mt-6 max-w-md text-xs font-medium uppercase leading-relaxed tracking-[0.12em] text-white/70 sm:text-sm"
            >
              Thoughtfully designed residences for a more
              <br />
              connected, fulfilling life.
            </p>

            <button
              type="button"
              data-anim
              onClick={onExplore}
              className="group relative mt-10 flex h-24 w-24 items-center justify-center rounded-full border border-white/40 text-white transition-all duration-300 ease-out hover:border-white hover:bg-white hover:text-navy-950 active:scale-95 sm:h-28 sm:w-28"
            >
              <span className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                  Explore
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 -rotate-45 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
