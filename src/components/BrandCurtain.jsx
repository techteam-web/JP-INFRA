import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import EndgameLogo from "./EndgameLogo";

const COVER = 0.75; // panel slides up over the page
const HOLD = 0.12; // logo held on the closed curtain
const REVEAL = 0.75; // panel carries on up and away

// The page's own move, in perspective: the one being left shrinks and drifts up, tipping
// back about its top edge as the panel slides over it; the new one rises from below,
// tipped the other way, and settles into place as the panel lifts off.
const PERSPECTIVE = 1400;
const PAGE_AWAY = { scale: 0.86, yPercent: -8, rotateX: 10, transformOrigin: "50% 0%" };
const PAGE_IN = { scale: 0.86, yPercent: 8, rotateX: -10, transformOrigin: "50% 100%" };
const PAGE_REST = { scale: 1, yPercent: 0, rotateX: 0 };

// While the page moves in depth it pokes past the screen edge; locking scroll for the
// transition keeps that from summoning a scrollbar (a bright bar down the right side).
const lockScroll = (on) => document.documentElement.classList.toggle("jp-transitioning", on);

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The site's section transition: a navy curtain slides up from the bottom over the
// current screen — which shrinks, drifts up and tips back in perspective beneath it —
// the Codename Endgame logo rises in on it, the screen changes behind it, then the
// curtain carries on upward while the new section rises into place.
//
// Driven by App: `target` set → cover, then `onCovered` (App swaps the screen);
// once `screen` equals `target` (the new screen has committed) → reveal, then `onDone`.
// `pageRef` is App's screen wrapper (the element that moves in depth).
export default function BrandCurtain({ pageRef, target, screen, onCovered, onDone }) {
  const panelRef = useRef(null);
  const logoRef = useRef(null);
  const covered = useRef(false);
  const cb = useRef({ onCovered, onDone });
  useLayoutEffect(() => {
    cb.current = { onCovered, onDone };
  }, [onCovered, onDone]);

  // Cover: the panel slides up from below while the page goes back and up
  useLayoutEffect(() => {
    if (!target) return undefined;
    covered.current = false;
    lockScroll(true);
    const done = () => {
      covered.current = true;
      cb.current.onCovered?.(target);
    };
    if (reduceMotion()) {
      gsap.set(panelRef.current, { yPercent: 0, autoAlpha: 1 });
      gsap.set(logoRef.current, { autoAlpha: 1, y: 0 });
      done();
      return undefined;
    }
    const page = pageRef?.current;
    const tl = gsap
      .timeline({ onComplete: done })
      .set(panelRef.current, { autoAlpha: 1 })
      .fromTo(panelRef.current, { yPercent: 100 }, { yPercent: 0, duration: COVER, ease: "power4.inOut" }, 0)
      .fromTo(
        logoRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" },
        COVER - 0.2,
      )
      .to({}, { duration: HOLD });
    if (page) {
      tl.fromTo(
        page,
        { ...PAGE_REST, transformPerspective: PERSPECTIVE, transformOrigin: PAGE_AWAY.transformOrigin },
        { ...PAGE_AWAY, duration: COVER, ease: "power3.inOut" },
        0,
      );
    }
    return () => tl.kill();
  }, [target, pageRef]);

  // Reveal, once the new screen is in place behind the curtain: the panel carries on up,
  // the new page rises from below into place
  useEffect(() => {
    if (!target || screen !== target || !covered.current) return undefined;
    const page = pageRef?.current;
    const finish = () => {
      gsap.set(panelRef.current, { autoAlpha: 0 });
      if (page) gsap.set(page, { clearProps: "transform,transformOrigin" });
      lockScroll(false);
      cb.current.onDone?.();
    };
    if (reduceMotion()) {
      finish();
      return undefined;
    }
    const tl = gsap
      .timeline({ onComplete: finish })
      .to(logoRef.current, { autoAlpha: 0, y: -10, duration: 0.3, ease: "power2.in" })
      .to(panelRef.current, { yPercent: -100, duration: REVEAL, ease: "power4.inOut" }, 0.12);
    if (page) {
      tl.fromTo(
        page,
        { ...PAGE_IN, transformPerspective: PERSPECTIVE },
        { ...PAGE_REST, duration: REVEAL + 0.15, ease: "power3.out" },
        0.12,
      );
    }
    return () => tl.kill();
  }, [target, screen, pageRef]);

  return (
    <div
      ref={panelRef}
      aria-hidden="true"
      className="pointer-events-auto invisible fixed inset-0 z-[90] grid place-items-center bg-navy-950 opacity-0"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(36,90,148,0.28), transparent 70%)",
      }}
    >
      <div ref={logoRef} className="jp-logo-shadow opacity-0">
        <EndgameLogo className="w-[clamp(200px,18vw,300px)]" />
      </div>
    </div>
  );
}
