import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// Relative depth of each screen — used to decide whether a transition should
// read as "pushing forward" or "pulling back".
const DEPTH = { home: 0, explore: 1, panorama: 2 };

export default function ScreenTransition({ screenKey, children }) {
  const [display, setDisplay] = useState({ key: screenKey, node: children });
  const [incoming, setIncoming] = useState(null);
  const outRef = useRef(null);
  const inRef = useRef(null);

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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setDisplay(incoming);
      setIncoming(null);
    };

    if (reduce || !outEl || !inEl) {
      finish();
      return;
    }

    const forward = (DEPTH[incoming.key] ?? 0) > (DEPTH[display.key] ?? 0);

    gsap.set(inEl, { opacity: 0, scale: forward ? 1.04 : 0.96, filter: "blur(8px)" });
    gsap.set(outEl, { opacity: 1, scale: 1, filter: "blur(0px)" });

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(
      outEl,
      {
        opacity: 0,
        scale: forward ? 0.96 : 1.04,
        filter: "blur(8px)",
        duration: 0.55,
        ease: "power2.inOut",
      },
      0
    );
    tl.to(
      inEl,
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.65, ease: "power3.out" },
      0.12
    );

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
    </div>
  );
}
