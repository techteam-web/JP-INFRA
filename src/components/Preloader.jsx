import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "./Logo";

const RINGS = [1, 2, 3, 4];

export default function Preloader({ onFinish }) {
  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const ringsRef = useRef(null);
  const spinRingRef = useRef(null);
  const markRef = useRef(null);
  const lineRef = useRef(null);
  const taglineRef = useRef(null);
  const barWrapRef = useRef(null);
  const barFillRef = useRef(null);
  const barGlowRef = useRef(null);
  const percentRef = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    const fill = barFillRef.current;
    const percent = percentRef.current;
    if (!root || !fill) return;

    const finish = () => {
      setDone(true);
      onFinish?.();
    };

    if (reduce) {
      const tl = gsap.timeline({ onComplete: finish });
      tl.to(fill, { width: "100%", duration: 0.3 });
      tl.to(root, { opacity: 0, duration: 0.3 });
      return () => tl.kill();
    }

    const ringEls = ringsRef.current ? Array.from(ringsRef.current.children) : [];
    const introEls = [
      markRef.current,
      lineRef.current,
      taglineRef.current,
      barWrapRef.current,
    ].filter(Boolean);

    gsap.set(ringEls, { scale: 0.7, opacity: 0 });
    gsap.set(introEls, { opacity: 0, y: 14 });
    gsap.set(glowRef.current, { opacity: 0 });
    gsap.set(markRef.current, { y: 0, scale: 0.85 });
    gsap.set(lineRef.current, { scaleX: 0, opacity: 1 });
    gsap.set(fill, { width: "0%" });

    let pulse;
    let spin;

    const tl = gsap.timeline({
      onComplete: () => {
        pulse?.kill();
        spin?.kill();
        gsap.to(root, {
          opacity: 0,
          scale: 1.03,
          duration: 0.7,
          ease: "power2.inOut",
          onComplete: finish,
        });
      },
    });

    tl.to(ringEls, {
      scale: 1,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      stagger: { each: 0.08, from: "center" },
    });
    tl.to(glowRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" }, "<");
    tl.to(markRef.current, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, "<0.1");
    tl.to(lineRef.current, { scaleX: 1, duration: 0.5, ease: "power2.out" }, "<0.25");
    tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "<0.1");
    tl.to(barWrapRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "<0.1");

    tl.add(() => {
      pulse = gsap.to(ringEls, {
        scale: 1.12,
        opacity: 0.12,
        duration: 1.8,
        ease: "sine.inOut",
        stagger: { each: 0.25, from: "center" },
        repeat: -1,
        yoyo: true,
      });
      spin = gsap.to(spinRingRef.current, {
        rotate: 360,
        duration: 22,
        ease: "none",
        repeat: -1,
      });
    });

    const counter = { value: 0 };
    tl.to(
      fill,
      { width: "100%", duration: 2.2, ease: "power2.inOut" },
      "<"
    );
    tl.to(
      counter,
      {
        value: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (percent) percent.textContent = String(Math.round(counter.value));
        },
      },
      "<"
    );
    if (barGlowRef.current) {
      tl.to(
        barGlowRef.current,
        { left: "100%", duration: 2.2, ease: "power2.inOut" },
        "<"
      );
    }

    tl.to({}, { duration: 0.35 });

    return () => {
      pulse?.kill();
      spin?.kill();
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-navy-950"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-20" />

      <Corners />

      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/20 blur-[100px]"
      />

      <div ref={ringsRef} className="pointer-events-none absolute inset-0">
        {RINGS.map((r) => (
          <span
            key={r}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.12]"
            style={{ width: `${r * 130}px`, height: `${r * 130}px` }}
          />
        ))}
        <span
          ref={spinRingRef}
          className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-red-500/25"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div ref={markRef}>
          <Logo className="h-14 w-auto sm:h-16" />
        </div>
        <span
          ref={lineRef}
          className="mt-4 h-px w-12 origin-center bg-red-600"
        />
        <p
          ref={taglineRef}
          className="mt-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45"
        >
          Building Landmarks. Creating Lifetimes.
        </p>

        <div ref={barWrapRef} className="mt-10 flex flex-col items-center">
          <div className="relative h-[3px] w-72 overflow-hidden rounded-full bg-white/10 sm:w-80">
            <div
              ref={barFillRef}
              className="relative h-full w-0 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-400"
            />
            <div
              ref={barGlowRef}
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 blur-[6px]"
              style={{ left: "0%" }}
            />
          </div>
          <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Loading Experience
            <span className="inline-flex text-white/65 [font-variant-numeric:tabular-nums]">
              <span ref={percentRef}>0</span>%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Corners() {
  const base = "pointer-events-none absolute h-6 w-6 border-white/20";
  return (
    <>
      <span className={`${base} left-6 top-6 border-l border-t sm:left-9 sm:top-9`} />
      <span className={`${base} right-6 top-6 border-r border-t sm:right-9 sm:top-9`} />
      <span className={`${base} bottom-6 left-6 border-b border-l sm:bottom-9 sm:left-9`} />
      <span className={`${base} bottom-6 right-6 border-b border-r sm:bottom-9 sm:right-9`} />
    </>
  );
}
