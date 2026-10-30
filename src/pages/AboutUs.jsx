import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import CurtainStage from "../components/CurtainStage";
import { useCurtainSlider } from "../hooks/useCurtainSlider";
import storyImg from "../assets/aboutUs.png";
import peopleImg from "../assets/Amenities final webp/Yoga & Meditation Lawn.webp";
import natureImg from "../assets/Amenities final webp/Urban Forest.webp";
import valuesImg from "../assets/Amenities final webp/Club Marvel.webp";

// The story in five chapters, each on its own full-screen photo.
const CHAPTERS = [
  {
    id: "story",
    short: "Our Story",
    label: "Since 2006",
    image: storyImg,
    text: "Since 2006, JP Infra has been shaping living spaces that bring thoughtful design, modern amenities and community living together. With a focus on elevating everyday experiences, we create places that reflect today's aspirations and tomorrow's possibilities.",
  },
  {
    id: "people",
    short: "People",
    label: "Our People",
    image: peopleImg,
    title: "People at the heart of every place.",
    text: "Our approach begins with the people who call our developments home. By bringing together thoughtfully designed residences, shared spaces and lifestyle amenities, we create environments that encourage connection and enrich everyday living.",
  },
  {
    id: "places",
    short: "Places",
    label: "Our Places",
    image: "/images/jpinfra-hero.webp", // the building elevation, as the light WebP the intro loads
    title: "Thoughtfully designed. Made for living.",
    text: "From integrated communities to design-led luxury residences and curated city addresses, our developments respond to different lifestyles and aspirations. Each brings together purposeful planning, considered details and experiences that make a place feel like home.",
  },
  {
    id: "sustainability",
    short: "Sustainability",
    label: "Sustainability",
    image: natureImg,
    title: "Building with a bigger purpose.",
    text: "Our philosophy of conscious capitalism guides us to look beyond the spaces we build. It reflects an approach that considers the wider impact of development, with care and responsibility shaping our vision for the future.",
  },
  {
    id: "values",
    short: "Values",
    label: "Our Values",
    image: valuesImg,
    title: "Thoughtful in design. Purposeful in approach.",
    text: "Design innovation, integrated living, care and conscious capitalism guide our approach. Together, they express our commitment to creating living environments where thoughtful spaces and meaningful experiences come together.",
  },
];
const SRCS = CHAPTERS.map((c) => c.image);
const CHAPTER_MS = 9000; // each chapter's time on screen before the story moves on

const pad = (n) => String(n).padStart(2, "0");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function IconChevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// About Us as a story told over full-screen photos: Our Story, then the four pillars.
// Each chapter's photo arrives with the site's wipe (the same as the Gallery), its words
// on a navy glass card; a timeline along the bottom shows the chapters, fills as each
// one plays, moves on by itself (holding while the pointer is on the card or timeline) and lets the
// visitor jump to any chapter.
export default function AboutUs({ onBack }) {
  const rootRef = useRef(null);
  const { index, go, layerARef, layerBRef } = useCurtainSlider(SRCS);
  const [paused, setPaused] = useState(false);
  const autoplay = typeof window !== "undefined" && !reduceMotion();
  const chapter = CHAPTERS[index];
  // the story holds still while the pointer is on the words or the timeline
  const holdWhileOver = {
    onPointerEnter: (e) => e.pointerType === "mouse" && setPaused(true),
    onPointerLeave: (e) => e.pointerType === "mouse" && setPaused(false),
  };

  useLayoutEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    if (reduceMotion()) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" });
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-[100svh] w-full overflow-hidden bg-navy-950"
    >
      <h1 className="sr-only">About JP Infra</h1>

      {/* The chapter's photo, full screen */}
      <CurtainStage
        layerARef={layerARef}
        layerBRef={layerBRef}
        onNext={() => go(1)}
        label="Next chapter"
        shade={false}
      />

      {/* The chapter's words */}
      <div
        data-anim
        className="pointer-events-none absolute inset-x-4 bottom-[7.5rem] z-10 sm:inset-x-auto sm:left-10 sm:w-[min(36rem,calc(100%-5rem))] lg:bottom-[clamp(124px,16vh,170px)] lg:w-[clamp(30rem,40vw,44rem)] 3xl:left-14 short:bottom-[5.5rem] short:w-[min(30rem,58%)]"
      >
        <div
          key={chapter.id}
          {...holdWhileOver}
          className="jp-caption-in pointer-events-auto rounded-2xl border border-white/15 bg-navy-950/70 p-5 text-white shadow-premium backdrop-blur-xl sm:p-7 lg:p-[clamp(24px,3vh,40px)] short:p-4"
        >
          <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-[11px]">
            <span className="font-bold text-red-500">
              {pad(index)}
              <span className="text-white/35"> / {pad(CHAPTERS.length - 1)}</span>
            </span>
            <span className="h-px w-8 bg-red-600" />
            {chapter.label}
          </span>

          {index === 0 ? (
            <p className="mt-3 font-display text-[2.4rem] uppercase leading-[0.96] sm:text-6xl lg:text-[clamp(3.2rem,7vh,6rem)] short:text-3xl">
              Built On Trust.
              <br />
              <span className="text-red-600">For A Brighter Tomorrow.</span>
            </p>
          ) : (
            <h2 className="mt-3 font-display text-3xl uppercase leading-[1.02] sm:text-4xl lg:text-[clamp(2.4rem,5vh,4.25rem)] short:text-2xl">
              {chapter.title}
            </h2>
          )}

          <p className="mt-3 text-[13px] leading-relaxed text-white/80 sm:text-sm lg:mt-[clamp(12px,2vh,22px)] lg:text-[clamp(13px,1.7vh,17px)] short:mt-2 short:text-xs">
            {chapter.text}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <nav
        data-anim
        aria-label="Chapters"
        {...holdWhileOver}
        className="absolute inset-x-4 bottom-4 z-10 mx-auto flex max-w-[56rem] items-center gap-1 rounded-2xl border border-white/20 bg-navy-950/65 p-1.5 shadow-premium backdrop-blur-xl sm:inset-x-10 sm:bottom-8 lg:inset-x-[clamp(170px,14vw,220px)] lg:bottom-[clamp(28px,4vh,48px)] short:bottom-3"
      >
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous chapter"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition-colors hover:bg-white/10"
        >
          <IconChevron dir="left" />
        </button>
        <ol className="flex flex-1 items-stretch">
          {CHAPTERS.map((c, i) => {
            const on = i === index;
            return (
              <li key={c.id} className="flex-1">
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  aria-label={c.short}
                  onClick={() => i !== index && go(i - index)}
                  className="group w-full px-1.5 py-2 text-left sm:px-2.5"
                >
                  <span className="relative block h-[2px] overflow-hidden rounded-full bg-white/20">
                    <span
                      key={on ? `play-${index}` : c.id}
                      className={`absolute inset-0 origin-left bg-red-600 ${
                        i < index ? "scale-x-100" : on && autoplay ? "jp-progress" : on ? "scale-x-100" : "scale-x-0"
                      }`}
                      style={on && autoplay ? { "--jp-progress-ms": `${CHAPTER_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                      onAnimationEnd={on && autoplay ? () => go(1) : undefined}
                    />
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    <span className={on ? "text-red-500" : "text-white/45"}>{pad(i)}</span>
                    <span
                      className={`truncate transition-colors max-sm:hidden ${
                        on ? "text-white" : "text-white/55 group-hover:text-white"
                      }`}
                    >
                      {c.short}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next chapter"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white transition-colors hover:bg-white/10"
        >
          <IconChevron dir="right" />
        </button>
      </nav>

      {/* Top bar */}
      <div
        data-anim
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12"
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 rounded-full bg-navy-950/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white backdrop-blur sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-white/60" />
            About Us
          </span>
        </div>
        <div className="pointer-events-auto rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>
    </div>
  );
}
