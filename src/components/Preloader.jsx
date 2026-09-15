import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

// The logo lives in /public as a real vector (two <path> outlines) — fetched
// by URL and injected inline so GSAP can stroke-trace the actual paths,
// rather than importing it as an opaque <img>.
const LOGO_SRC = "/Jp%20Infra.svg";
const BRAND_WHITE = "#ffffff";

// Cinematic ink-trace preloader: the logo mark's own paths draw themselves
// in like a pen tracing the artwork, a red divider line grows in between it
// and the wordmark, the "JP INFRA" name draws in the same way, then an
// "Enter Full Screen" button fades in beneath the mark. Fullscreen requires
// a real user gesture, so the site only reveals itself once that button is
// clicked — same requestFullscreen()-then-fade pattern as before.
export default function Preloader({ onFinish }) {
  const rootRef = useRef(null);
  const logoWrapRef = useRef(null);
  const lineRef = useRef(null);
  const textSvgRef = useRef(null);
  const textRef = useRef(null);
  const enterRef = useRef(null);
  const [logoReady, setLogoReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    fetch(LOGO_SRC)
      .then((res) => res.text())
      .then((markup) => {
        if (cancelled || !logoWrapRef.current) return;
        logoWrapRef.current.innerHTML = markup;

        const svg = logoWrapRef.current.querySelector("svg");
        svg?.setAttribute(
          "class",
          "h-20 w-auto sm:h-24 md:h-28 xl:h-32 2xl:h-36 3xl:h-40 4xl:h-44 overflow-visible"
        );

        setLogoReady(true);
      })
      .catch(() => {
        if (!cancelled) setLogoReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!logoReady) return;

    const paths = logoWrapRef.current?.querySelectorAll("svg path") ?? [];
    const text = textRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(logoWrapRef.current, { opacity: 1 });
    gsap.set(enterRef.current, { opacity: 0, y: 10 });

    if (lineRef.current) {
      const lineLength = lineRef.current.getTotalLength();
      lineRef.current.style.strokeDasharray = lineLength;
      lineRef.current.style.strokeDashoffset = lineLength;
    }

    // The text SVG's viewBox was a guessed fixed size, which almost never
    // matches "JP INFRA"'s actual rendered width exactly — any leftover gap
    // between the real glyphs and the guessed box edge is invisible but
    // still takes up flex layout space, throwing off the whole row's visual
    // center. Measuring the real bounding box and fitting the viewBox to it
    // exactly removes that invisible slack.
    if (text && textSvgRef.current) {
      const pad = 4;
      const bbox = text.getBBox();
      textSvgRef.current.setAttribute(
        "viewBox",
        `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
      );
    }

    const drawables = [...paths, text].filter(Boolean);
    drawables.forEach((el) => {
      const length = el === text ? el.getComputedTextLength() * 2.2 || 400 : el.getTotalLength();
      el.style.fill = BRAND_WHITE;
      el.style.fillOpacity = 0;
      el.style.stroke = BRAND_WHITE;
      el.style.strokeWidth = el === text ? 1.4 : 2;
      el.style.strokeLinecap = "round";
      el.style.strokeLinejoin = "round";
      el.style.strokeDasharray = length;
      el.style.strokeDashoffset = length;
    });

    if (reduce) {
      gsap.set(drawables, { strokeDashoffset: 0, fillOpacity: 1, strokeOpacity: 0 });
      gsap.set(lineRef.current, { strokeDashoffset: 0 });
      gsap.set(enterRef.current, { opacity: 1, y: 0 });
      setReady(true);
      return;
    }

    const tl = gsap.timeline({ onComplete: () => setReady(true) });

    // 1. Draw the logo's own paths, like ink tracing the mark.
    if (paths.length) {
      tl.to(paths, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.inOut",
        stagger: 0.25,
      }).to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.3");
    }

    // 2. A slow, cinematic line draws itself in between logo and name.
    tl.to(lineRef.current, { strokeDashoffset: 0, duration: 1.3, ease: "power4.inOut" }, "+=0.1");

    // 3. The "JP INFRA" name draws in the same way as the logo.
    if (text) {
      tl.to(text, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, "-=0.5").to(
        text,
        { fillOpacity: 1, strokeOpacity: 0, duration: 0.5 },
        "-=0.2"
      );
    }

    // 4. Reveal the Enter Full Screen button underneath the mark.
    tl.to(enterRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "+=0.1");

    return () => tl.kill();
  }, [logoReady]);

  const handleEnter = () => {
    if (!ready) return;
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
    gsap.to(root, { opacity: 0, duration: 0.8, ease: "power2.inOut", onComplete: finish });
  };

  if (done) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Loading JP Infra"
      className="fixed inset-0 z-[999] flex items-center justify-center bg-navy-700"
    >
      <div className="flex flex-col items-center px-6">
        <div className="flex flex-row items-center gap-7 sm:gap-9">
          <div
            ref={logoWrapRef}
            className="opacity-0 drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]"
            aria-hidden="true"
          />

          <svg
            className="h-14 w-2 overflow-visible sm:h-16 md:h-20 3xl:h-24"
            viewBox="0 0 10 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              ref={lineRef}
              x1="5"
              y1="2"
              x2="5"
              y2="98"
              stroke="#ee3134"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>

          <svg
            ref={textSvgRef}
            className="h-16 w-auto overflow-visible sm:h-20 md:h-24 xl:h-28 2xl:h-32 3xl:h-36 4xl:h-40"
            viewBox="0 0 380 80"
            aria-hidden="true"
          >
            <text
              ref={textRef}
              x="0"
              y="56"
              fontSize="50"
              fontWeight="600"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
            >
              JP INFRA
            </text>
          </svg>
        </div>

        <button
          ref={enterRef}
          type="button"
          onClick={handleEnter}
          disabled={!ready}
          style={{ "--btn-fill-color": "#ffffff" }}
          className="btn-fill group mt-12 inline-flex items-center gap-3 rounded-full border border-white/35 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-[color,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:text-navy-700 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none sm:mt-14 3xl:mt-16 3xl:px-9 3xl:py-4 3xl:text-sm 4xl:px-10 4xl:py-5 4xl:text-base"
        >
          Enter Full Screen
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-red-600 transition-transform duration-300 group-hover:translate-x-1 3xl:h-5 3xl:w-5"
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

      <span className="sr-only">Loading JP Infra, please wait.</span>
    </div>
  );
}
