import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "./Logo";

export default function Preloader({ onFinish }) {
  const rootRef = useRef(null);
  const [done, setDone] = useState(false);

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
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, delay: 0.2, ease: "power3.out" }
    );
  }, []);

  const handleEnter = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});

    const root = rootRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      setDone(true);
      onFinish?.();
    };

    if (reduce || !root) {
      finish();
      return;
    }
    gsap.to(root, { opacity: 0, duration: 0.6, ease: "power2.inOut", onComplete: finish });
  };

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-navy-700"
      role="dialog"
      aria-label="Enter site"
    >
      {/* Architectural line-art accents */}
      <svg
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 text-white/10 sm:h-96 sm:w-96"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-96 text-white/10 sm:h-80 sm:w-[28rem]"
        viewBox="0 0 320 220"
        fill="none"
        aria-hidden="true"
      >
        <path d="M40 220V90l90-40 150 40v130" stroke="currentColor" strokeWidth="1" />
        <path d="M40 90l90-40 150 40" stroke="currentColor" strokeWidth="1" />
        <line x1="90" y1="60" x2="90" y2="220" stroke="currentColor" strokeWidth="1" />
        <line x1="180" y1="70" x2="180" y2="220" stroke="currentColor" strokeWidth="1" />
        <line x1="270" y1="90" x2="270" y2="220" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="140" x2="280" y2="140" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="180" x2="280" y2="180" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Top-left */}
      <div data-anim className="absolute left-6 top-6 sm:left-10 sm:top-8">
        <div className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70 sm:text-xs">
          <p>Homes</p>
          <p>Communities</p>
          <p>Places</p>
          <p className="text-white">A Brighter Tomorrow</p>
        </div>
      </div>

      {/* Top-right */}
      <div
        data-anim
        className="absolute right-6 top-6 flex items-start gap-3 sm:right-10 sm:top-8"
      >
        <div className="flex flex-col gap-1 text-right text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70 sm:text-xs">
          <p>People</p>
          <p>Places</p>
          <p>Possibilities</p>
        </div>
        <span className="mt-0.5 h-12 w-px bg-white/25" />
      </div>

      {/* Center */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div data-anim>
          <Logo className="h-16 w-auto sm:h-20" />
        </div>
        <p
          data-anim
          className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-white sm:text-base"
        >
          Building A Better Tomorrow
        </p>
        <button
          type="button"
          data-anim
          onClick={handleEnter}
          className="group mt-9 inline-flex items-center gap-3 rounded-full border border-white/35 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-navy-700 active:translate-y-0 active:scale-[0.97]"
        >
          Enter Full Screen
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-red-600 transition-transform duration-300 group-hover:translate-x-1"
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
        </button>
      </div>

      {/* Bottom-left */}
      <div
        data-anim
        className="absolute bottom-6 left-6 flex flex-col gap-2 sm:left-10 sm:bottom-8"
      >
        <span className="h-px w-8 bg-white/30" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
          www.jpinfra.com
        </span>
      </div>
    </div>
  );
}
