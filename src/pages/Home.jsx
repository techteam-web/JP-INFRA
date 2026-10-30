import { useEffect, useRef } from "react";
import gsap from "gsap";
import heroImg from "../assets/jpinfra hero.png";
import Logo from "../components/Logo";
import EndgameLogo from "../components/EndgameLogo";
import BottomNav from "../components/BottomNav";
import MobileNav from "../components/MobileNav";

export default function Home({ animate = false, onNavigate }) {
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
          decoding="async"
          fetchPriority="high"
          className="animate-kenburns h-full w-full object-cover"
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
        {/* Top bar: project logo left, JP Infra right — one row, so both sit on the
            same centre line with the same edge padding as the other pages' top bars.
            The Endgame logo matches the JP Infra badge's full height (logo + padding);
            its widest step uses a rem breakpoint because the px-defined 3xl/4xl ones
            lose to 2xl in the cascade (see --breakpoint-3xl in index.css). */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12">
          <div data-anim className="jp-logo-shadow">
            <EndgameLogo className="h-12 w-auto sm:h-[52px] 2xl:h-14 min-[120rem]:h-15" />
          </div>

          <div data-anim className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
            <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
          </div>
        </div>

        <BottomNav onSelect={onNavigate} />
        <MobileNav onSelect={onNavigate} />
      </div>
    </div>
  );
}
