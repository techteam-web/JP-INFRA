import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const DURATION = 1.45;
const EASE = "expo.inOut";
// Next: the incoming photo is unveiled right → left (its clip's left edge sweeps
// from the right side across), while the photo inside drifts in from the right
// and the outgoing photo drifts away to the left underneath — a parallax curtain.
// Previous is the exact mirror (left → right).
const OPEN = "inset(0% 0% 0% 0%)";
const closedFrom = (delta) => (delta > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)");
const DRIFT_IN = 38; // xPercent the incoming photo travels
const DRIFT_OUT = 22; // xPercent the outgoing photo travels the other way
const NAME_AT = DURATION * 0.55; // when the caption and counter switch to the new photo

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Two permanent full-screen layers (A/B) that swap roles on every slide. GSAP alone
 * owns their clip-path / transforms / z-index, so a React re-render can never cut
 * into a transition. `start` is the photo it opens on (e.g. the amenity picked from
 * the Amenities list).
 *
 * Returns { index, go, layerARef, layerBRef } — pass the refs to <CurtainStage />.
 */
export function useCurtainSlider(srcs, start = 0) {
  const layerA = useRef(null);
  const layerB = useRef(null);
  const active = useRef("A");
  const busy = useRef(false);
  const tl = useRef(null);
  const [index, setIndex] = useState(0);
  const total = srcs.length;

  const img = (layer) => layer?.firstElementChild;

  // The opening photo on layer A; layer B closed and waiting.
  useLayoutEffect(() => {
    const a = layerA.current;
    const b = layerB.current;
    if (!a || !b || !total) return undefined;
    tl.current?.kill();
    busy.current = false;
    active.current = "A";
    setIndex(start);
    img(a).src = srcs[start];
    gsap.set(a, { clipPath: OPEN, zIndex: 1 });
    gsap.set(b, { clipPath: closedFrom(1), zIndex: 2 });
    gsap.set([img(a), img(b)], { xPercent: 0, scale: 1 });
    return () => tl.current?.kill();
  }, [srcs, total, start]);

  // Warm both neighbours so a slide never waits on the network.
  useEffect(() => {
    if (!total) return;
    for (const i of [index + 1, index - 1]) {
      const pre = new Image();
      pre.src = srcs[(i + total) % total];
    }
  }, [index, srcs, total]);

  const go = useCallback(
    (delta) => {
      if (!total || busy.current) return;
      const from = active.current === "A" ? layerA.current : layerB.current;
      const to = active.current === "A" ? layerB.current : layerA.current;
      if (!from || !to) return;

      const next = (index + delta + total) % total;
      busy.current = true;
      img(to).src = srcs[next];

      const finish = () => {
        active.current = active.current === "A" ? "B" : "A";
        busy.current = false;
      };

      gsap.set(from, { zIndex: 1 });
      if (reduceMotion()) {
        gsap.set(to, { clipPath: OPEN, zIndex: 2 });
        gsap.set(img(to), { xPercent: 0, scale: 1 });
        setIndex(next);
        finish();
        return;
      }

      const dir = delta > 0 ? 1 : -1;
      gsap.set(to, { clipPath: closedFrom(delta), zIndex: 2 });
      gsap.set(img(to), { xPercent: DRIFT_IN * dir, scale: 1.08 });
      gsap.set(img(from), { xPercent: 0, scale: 1 });

      tl.current = gsap
        .timeline({ defaults: { duration: DURATION, ease: EASE }, onComplete: finish })
        .fromTo(to, { clipPath: closedFrom(delta) }, { clipPath: OPEN, immediateRender: true }, 0)
        .to(img(to), { xPercent: 0, scale: 1 }, 0)
        .to(img(from), { xPercent: -DRIFT_OUT * dir, scale: 1.04 }, 0)
        // The name and counter change once the new photo has taken over most of the
        // screen, so they arrive with it rather than ahead of it.
        .call(() => setIndex(next), null, NAME_AT);
    },
    [index, srcs, total],
  );

  // Arrow keys
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goRef.current(-1);
      if (e.key === "ArrowRight") goRef.current(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { index, go, layerARef: layerA, layerBRef: layerB };
}
