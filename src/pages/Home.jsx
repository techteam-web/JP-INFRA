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
        {/* Project logo */}
        <div
          data-anim
          className="jp-logo-shadow absolute left-6 top-6 sm:left-12 sm:top-8 lg:left-20 xl:left-24 2xl:left-28 3xl:left-32 3xl:top-10 4xl:left-40 4xl:top-12"
        >
          <EndgameLogo className="w-28 sm:w-32 2xl:w-36 3xl:w-40 4xl:w-48" />
        </div>

        {/* Logo */}
        <div
          data-anim
          className="absolute right-6 top-6 flex flex-col items-end gap-1.5 sm:right-10 sm:top-8 3xl:right-14 3xl:top-10 4xl:right-16 4xl:top-12"
        >
          <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
            <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
          </div>
        </div>

        <BottomNav onSelect={onNavigate} />
        <MobileNav onSelect={onNavigate} />
      </div>
    </div>
  );
}
