import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const CORNER_STYLES = {
  "top-left": "left-6 top-6 border-l border-t sm:left-9 sm:top-9",
  "top-right": "right-6 top-6 border-r border-t sm:right-9 sm:top-9",
  "bottom-left": "left-6 bottom-6 border-l border-b sm:left-9 sm:bottom-9",
  "bottom-right": "right-6 bottom-6 border-r border-b sm:right-9 sm:bottom-9",
};

function CornerBracket({ position }) {
  return <span className={`absolute h-7 w-7 border-white/50 ${CORNER_STYLES[position]}`} />;
}

// "Cinematic Architectural Reveal": two navy doors close to a red-sealed
// centre seam (screen swap happens invisibly behind them), then reopen while
// the incoming screen racks from a soft, zoomed establishing shot into sharp
// focus — like a slow crane shot settling on a building facade. Viewfinder-
// style corner brackets frame the moment of full coverage.
export default function ScreenTransition({ screenKey, children }) {
  const [display, setDisplay] = useState({ key: screenKey, node: children });
  const [incoming, setIncoming] = useState(null);
  const outRef = useRef(null);
  const inRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const seamRef = useRef(null);
  const bracketsRef = useRef(null);

  // Same screen re-rendering with fresh props (e.g. Home's `animate` flag
  // flipping once the preloader finishes) — sync the displayed node in
  // place, no transition needed.
  if (screenKey === display.key && children !== display.node) {
    setDisplay({ key: screenKey, node: children });
  }

  // A genuine screen change — kick off (or redirect) a transition.
  if (screenKey !== display.key && incoming?.key !== screenKey) {
    setIncoming({ key: screenKey, node: children });
  }

  useEffect(() => {
    if (!incoming) return;
    const outEl = outRef.current;
    const inEl = inRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const seam = seamRef.current;
    const brackets = bracketsRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The overlay pieces only ever show up mid-sweep — reset them fully
    // invisible on completion so nothing (including the seam's glow) can
    // bleed onto the screen while at rest.
    const finish = () => {
      if (leftPanel) gsap.set(leftPanel, { opacity: 0 });
      if (rightPanel) gsap.set(rightPanel, { opacity: 0 });
      if (seam) gsap.set(seam, { opacity: 0 });
      if (brackets) gsap.set(brackets, { opacity: 0, scale: 0.85 });
      setDisplay(incoming);
      setIncoming(null);
    };

    if (reduce || !outEl || !inEl || !leftPanel || !rightPanel) {
      finish();
      return;
    }

    gsap.set([leftPanel, rightPanel], { opacity: 1 });
    gsap.set(leftPanel, { xPercent: -100 });
    gsap.set(rightPanel, { xPercent: 100 });
    gsap.set(seam, { opacity: 0 });
    gsap.set(brackets, { opacity: 0, scale: 0.85 });
    gsap.set(outEl, { opacity: 1, scale: 1, filter: "blur(0px)" });
    gsap.set(inEl, { opacity: 0, scale: 1.08, filter: "blur(14px)" });

    const tl = gsap.timeline({ onComplete: finish });

    // The camera pulls back off the outgoing scene as the frame engages.
    tl.to(outEl, { scale: 0.94, filter: "blur(4px)", duration: 0.55, ease: "power4.inOut" }, 0);
    tl.to(brackets, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }, 0.05);

    // Doors close to full coverage, sealing shut on the brand-red seam.
    tl.to(leftPanel, { xPercent: 0, duration: 0.55, ease: "power4.inOut" }, 0);
    tl.to(rightPanel, { xPercent: 0, duration: 0.55, ease: "power4.inOut" }, 0);
    tl.to(seam, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0.35);

    // The swap happens invisibly behind the closed doors.
    tl.set(outEl, { opacity: 0 }, 0.55);
    tl.set(inEl, { opacity: 1 }, 0.55);
    tl.to(seam, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0.55);

    // Doors reopen to reveal — the incoming scene racks from a soft,
    // zoomed establishing shot into sharp focus as it settles into place.
    tl.to(leftPanel, { xPercent: -100, duration: 0.7, ease: "power4.inOut" }, 0.6);
    tl.to(rightPanel, { xPercent: 100, duration: 0.7, ease: "power4.inOut" }, 0.6);
    tl.to(inEl, { scale: 1, filter: "blur(0px)", duration: 0.95, ease: "power3.out" }, 0.65);
    tl.to(brackets, { opacity: 0, scale: 1.08, duration: 0.5, ease: "power2.in" }, 1.0);

    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={outRef} className="absolute inset-0">
        {display.node}
      </div>
      {incoming && (
        <div ref={inRef} className="absolute inset-0">
          {incoming.node}
        </div>
      )}

      <div
        ref={leftPanelRef}
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 bg-navy-700"
        style={{ transform: "translateX(-100%)", opacity: 0 }}
      />
      <div
        ref={rightPanelRef}
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2 bg-navy-700"
        style={{ transform: "translateX(100%)", opacity: 0 }}
      />
      <div
        ref={seamRef}
        className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[3px] -translate-x-1/2 bg-red-600"
        style={{ opacity: 0, boxShadow: "0 0 32px 6px rgba(238,49,52,0.55)" }}
      />
      <div ref={bracketsRef} className="pointer-events-none absolute inset-0 z-20" style={{ opacity: 0 }}>
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />
      </div>
    </div>
  );
}
