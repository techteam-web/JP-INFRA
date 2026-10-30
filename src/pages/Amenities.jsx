import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AMENITIES } from "../data/amenities";
import { AMENITY_CATEGORIES } from "../data/amenityList";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import ImageCaption from "../components/ImageCaption";
import CurtainStage from "../components/CurtainStage";
import { useCurtainSlider } from "../hooks/useCurtainSlider";


// Amenity name → index of its first photo in the slideshow
const PHOTO_INDEX = new Map();
AMENITIES.forEach((a, i) => {
  const key = a.name.toLowerCase();
  if (!PHOTO_INDEX.has(key)) PHOTO_INDEX.set(key, i);
});
const photoIndexOf = (item) => (item.photo ? PHOTO_INDEX.get(item.photo.toLowerCase()) : undefined);

// Captions use the client's amenity names where a photo belongs to exactly one listed
// amenity ("Golf Simulator", not the photo's file name); otherwise the file's name.
const LISTED_NAMES = new Map();
for (const cat of AMENITY_CATEGORIES) {
  for (const item of cat.items) {
    if (!item.photo) continue;
    const key = item.photo.toLowerCase();
    LISTED_NAMES.set(key, LISTED_NAMES.has(key) ? null : item.label);
  }
}
const captionOf = (amenity) => LISTED_NAMES.get(amenity.name.toLowerCase()) || amenity.name;

// Photo sets for the slideshow: every photo, then one per category — the photos its
// listed amenities point to, in the list's order (a category without photos is left out).
const PHOTO_SETS = [
  { id: "all", title: "All Photos", indices: AMENITIES.map((_, i) => i) },
  ...AMENITY_CATEGORIES.map((cat) => {
    const indices = [];
    for (const item of cat.items) {
      if (!item.photo) continue;
      const name = item.photo.toLowerCase();
      AMENITIES.forEach((a, i) => {
        if (a.name.toLowerCase() === name && !indices.includes(i)) indices.push(i);
      });
    }
    return { id: cat.id, title: cat.title, indices };
  }).filter((set) => set.indices.length),
];
const SET_BY_ID = new Map(PHOTO_SETS.map((set) => [set.id, set]));
// stable source arrays per set (the slider resets when its array changes)
const SET_SRCS = new Map(PHOTO_SETS.map((set) => [set.id, set.indices.map((i) => AMENITIES[i].image)]));


const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// A view (list or photos) eases in when it replaces the other.
function useViewIn(ref) {
  useLayoutEffect(() => {
    if (!ref.current || reduceMotion()) return undefined;
    const tween = gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: "power2.out" });
    return () => tween.kill();
  }, [ref]);
}

function IconChevron({ dir = "left" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 3xl:h-5 3xl:w-5 4xl:h-6 4xl:w-6" aria-hidden="true">
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

// Line icons for the category headings (24px grid, currentColor)
const CATEGORY_ICONS = {
  health: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM7.5 12h2.5l1.5-2.5 2 5 1.5-2.5h1.5" />,
  nature: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7" />,
  sports: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 9.5c3 1 5 3.5 5.5 10.3M19.5 14.5c-3-1-5-3.5-5.5-10.3" />
    </>
  ),
  recreation: <path d="M4 5h16v10H4zM9 19h6M12 15v4M10 8.5l4 1.5-4 1.5z" />,
  lifestyle: <path d="M5 9h12v4a6 6 0 0 1-12 0zM17 10h1.5a2 2 0 0 1 0 4H17M9 3v3M13 3v3" />,
};

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

// The page opens on the full-screen slideshow of every amenity photo. The "All Amenities"
// button pops up the categories — picking one shows only that category's photos — and
// "Full List" opens the complete list over the slideshow (sized to fit the screen); an
// amenity with a photo jumps the slideshow to it.
export default function Amenities({ onBack }) {
  const rootRef = useRef(null);
  const [photos, setPhotos] = useState({ set: "all", start: 0, key: 0 });
  const [listOpen, setListOpen] = useState(false);

  useLayoutEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    if (reduceMotion()) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" }
    );
  }, []);

  // Esc closes the list
  useEffect(() => {
    if (!listOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setListOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listOpen]);

  const pick = (start) => {
    setPhotos({ set: "all", start, key: Date.now() });
    setListOpen(false);
  };
  const showSet = (set) => setPhotos({ set, start: 0, key: Date.now() });

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Top bar */}
      <div
        data-anim
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 3xl:px-14 3xl:pt-10 4xl:px-16 4xl:pt-12"
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-white/40" />
            Amenities
          </span>
        </div>
        <div className="pointer-events-auto rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      <AmenityPhotos
        key={photos.key}
        set={SET_BY_ID.get(photos.set)}
        start={photos.start}
        listOpen={listOpen}
        onList={() => setListOpen(true)}
        onSet={showSet}
      />
      {listOpen && <AmenityList onPick={pick} onClose={() => setListOpen(false)} />}
    </div>
  );
}

// One amenity in the list: a link to its photo, or plain (dimmer) text when it has none.
function AmenityItem({ item, onPick }) {
  const index = photoIndexOf(item);
  const text = "text-[clamp(11px,1.5vh,15.5px)] leading-[1.25]";
  if (index === undefined) {
    return <span className={`block py-[0.42vh] text-white/45 ${text}`}>{item.label}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      className={`group flex w-full items-center py-[0.42vh] text-left font-medium text-white/90 transition-colors duration-200 hover:text-white ${text}`}
    >
      <span className="h-px w-0 shrink-0 bg-red-500 transition-[width,margin] duration-300 ease-out group-hover:mr-2 group-hover:w-3 group-focus-visible:mr-2 group-focus-visible:w-3" />
      <span className="border-b border-white/0 transition-colors duration-200 group-hover:border-white/40">
        {item.label}
      </span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="ml-1.5 h-[0.8em] w-[0.8em] shrink-0 -translate-x-1 text-red-500 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100"
      >
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function CategoryHeading({ cat, as: Tag = "h2" }) {
  return (
    <Tag
      id={`amenity-cat-${cat.id}`}
      className="flex items-center gap-2 font-display text-[clamp(1.15rem,2.6vh,2rem)] uppercase leading-none tracking-wide text-red-500"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[1.05em] w-[1.05em] shrink-0"
      >
        {CATEGORY_ICONS[cat.id]}
      </svg>
      {cat.title}
    </Tag>
  );
}

// The full list, over the slideshow — never scrolls. From lg up it's a grid: one column per
// category with every heading on the same line, Lifestyle (the longest) spread over two
// columns, sizes tied to the screen height so it all fits. Below lg, category tabs show
// one category at a time (in two columns).
function AmenityList({ onPick, onClose }) {
  const ref = useRef(null);
  useViewIn(ref);
  const [tab, setTab] = useState(AMENITY_CATEGORIES[0].id);
  const tabCat = AMENITY_CATEGORIES.find((c) => c.id === tab);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="amenity-list-title"
      className="absolute inset-0 z-[15] overflow-hidden bg-navy-950/90 backdrop-blur-xl"
    >
      <div className="flex h-full flex-col px-6 pb-28 pt-24 short:pb-3 short:pt-[4.75rem] sm:px-10 sm:pt-28 lg:px-16 lg:pb-[clamp(96px,13vh,140px)] lg:pt-[clamp(104px,13vh,150px)] 3xl:px-24">
        {/* Title row */}
        <div className="flex shrink-0 items-end justify-between gap-6 border-b border-white/10 pb-[2.2vh]">
          <div>
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 short:hidden 3xl:text-xs">
              <span className="h-px w-6 bg-red-600" />
              Select an amenity to view it
            </span>
            <h1
              id="amenity-list-title"
              className="mt-2 font-display text-[clamp(2rem,5.2vh,4.75rem)] uppercase leading-none text-white short:mt-0 short:text-3xl"
            >
              All <span className="text-red-600">Amenities</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
            className="btn-fill flex shrink-0 items-center gap-2.5 rounded-xl border border-white/25 bg-navy-950/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-transform duration-200 active:scale-95 3xl:text-xs"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Close
          </button>
        </div>

        {/* lg and up: every category at once */}
        <div className="mt-[3vh] hidden min-h-0 flex-1 grid-cols-6 gap-x-[clamp(20px,2.4vw,48px)] lg:grid">
          {AMENITY_CATEGORIES.map((cat) => {
            const wide = cat.id === "lifestyle";
            const half = Math.ceil(cat.items.length / 2);
            return (
              <section key={cat.id} aria-labelledby={`amenity-cat-${cat.id}`} className={wide ? "col-span-2" : undefined}>
                <CategoryHeading cat={cat} />
                <span className="mt-[1.1vh] mb-[0.9vh] block h-px w-8 bg-red-600/70" />
                {wide ? (
                  <div className="grid grid-cols-2 gap-x-[clamp(20px,2.4vw,48px)]">
                    {[cat.items.slice(0, half), cat.items.slice(half)].map((col, i) => (
                      <ul key={i}>
                        {col.map((item) => (
                          <li key={item.label}>
                            <AmenityItem item={item} onPick={onPick} />
                          </li>
                        ))}
                        {i === 1 && (
                          <li className="mt-[1.4vh]">
                            <AndManyMore onPick={onPick} />
                          </li>
                        )}
                      </ul>
                    ))}
                  </div>
                ) : (
                  <ul>
                    {cat.items.map((item) => (
                      <li key={item.label}>
                        <AmenityItem item={item} onPick={onPick} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {/* below lg: one category at a time */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col short:mt-2 lg:hidden">
          <div role="tablist" aria-label="Amenity categories" className="flex shrink-0 gap-1.5 overflow-hidden">
            {AMENITY_CATEGORIES.map((cat) => {
              const on = cat.id === tab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(cat.id)}
                  className={`flex-1 rounded-lg border px-1 py-2 short:py-1 font-display text-[15px] uppercase tracking-wide transition-colors sm:text-lg ${
                    on ? "border-red-600 bg-red-600 text-white" : "border-white/15 text-white/70"
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>
          <div key={tab} role="tabpanel" className="jp-caption-in mt-4 min-h-0 flex-1 short:mt-2">
            <ul className="grid grid-cols-2 gap-x-4 sm:gap-x-8 short:grid-cols-4 short:gap-x-6">
              {tabCat.items.map((item) => (
                <li key={item.label}>
                  <AmenityItem item={item} onPick={onPick} />
                </li>
              ))}
            </ul>
            <div className="mt-4 short:mt-1">
              <AndManyMore onPick={onPick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AndManyMore({ onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(0)}
      className="group flex items-center gap-2 font-display text-[clamp(1.05rem,2.3vh,1.75rem)] uppercase tracking-wide text-red-500 transition-colors hover:text-white"
    >
      And Many More
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[0.7em] w-[0.7em] transition-transform duration-300 group-hover:translate-x-1">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function AmenityPhotos({ set, start, listOpen, onList, onSet }) {
  const ref = useRef(null);
  useViewIn(ref);
  const { index, go, layerARef, layerBRef } = useCurtainSlider(SET_SRCS.get(set.id), start);
  const amenity = AMENITIES[set.indices[index]];
  const total = set.indices.length;

  return (
    <div ref={ref} className="absolute inset-0">
      <CurtainStage layerARef={layerARef} layerBRef={layerBRef} onNext={() => go(1)} label="Next amenity" />

      {/* Prev / next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
        aria-label="Previous amenity"
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className="btn-fill absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:left-8 xl:h-12 xl:w-12 2xl:left-10 3xl:left-12 3xl:h-14 3xl:w-14 4xl:left-16 4xl:h-16 4xl:w-16"
      >
        <IconChevron dir="left" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
        aria-label="Next amenity"
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className="btn-fill absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 sm:right-8 xl:h-12 xl:w-12 2xl:right-10 3xl:right-12 3xl:h-14 3xl:w-14 4xl:right-16 4xl:h-16 4xl:w-16"
      >
        <IconChevron dir="right" />
      </button>

      <ImageCaption id={amenity.id} label={set.id === "all" ? "Amenities" : set.title} name={captionOf(amenity)} />

      {!listOpen && <CategoryMenu activeId={set.id} onSet={onSet} onList={onList} />}

      {/* Counter, bottom centre (bottom-left on phones, clear of the button) */}
      <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit items-center max-sm:left-6 max-sm:right-auto max-sm:mx-0 sm:bottom-8 2xl:bottom-10 3xl:bottom-12 4xl:bottom-14">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/25 bg-navy-950/55 px-5 py-2.5 text-white shadow-premium backdrop-blur-xl xl:px-6 xl:py-3 3xl:px-7">
          <span className="text-xs font-bold tracking-widest text-red-600 xl:text-sm 3xl:text-base">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-3 w-px bg-white/30 3xl:h-4" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-widest text-white/70 xl:text-sm 3xl:text-base">
            {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

// "All Amenities", bottom right — on desktop stacked just above the Brainwing credit,
// which keeps the very bottom (same right edge; its bottom offset + height + a gap; see
// .jp-credit — height is width × 112/420). Hovering it (or tapping it) pops up the
// categories; picking one shows just that category's photos. "Full List" opens the list.
function CategoryMenu({ activeId, onSet, onList }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Esc or a tap outside closes it
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const choose = (fn) => {
    setOpen(false);
    fn();
  };

  return (
    <div
      ref={wrapRef}
      // hover opens/closes it for a mouse only; on touch, a tap opens it and a tap outside closes it
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
      className="absolute bottom-6 right-6 z-30 sm:bottom-8 sm:right-10 lg:right-[clamp(16px,3vw,40px)] lg:bottom-[calc(clamp(16px,3svh,28px)+clamp(29px,2.4vw,40px)+12px)]"
    >
      {/* the menu pops up from the button; its bottom padding bridges the gap for the pointer */}
      <div
        className={`absolute bottom-full right-0 pb-3 transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
        }`}
      >
        <div
          role="menu"
          aria-label="Amenity categories"
          className="w-64 rounded-2xl border border-white/15 bg-navy-950/85 p-2 shadow-premium backdrop-blur-xl 3xl:w-72"
        >
          {PHOTO_SETS.map((s) => {
            const on = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => choose(() => onSet(s.id))}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 short:py-1.5 text-left transition-colors duration-200 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none ${
                  on ? "bg-white/[0.08]" : ""
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 shrink-0 ${on ? "text-red-500" : "text-white/60 group-hover:text-red-500"}`}
                >
                  {s.id === "all" ? <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> : CATEGORY_ICONS[s.id]}
                </svg>
                <span
                  className={`flex-1 font-display text-lg uppercase leading-none tracking-wide 3xl:text-xl ${
                    on ? "text-white" : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {s.title}
                </span>
                <span className={`text-[10px] font-bold tracking-widest ${on ? "text-red-500" : "text-white/40"}`}>
                  {String(s.indices.length).padStart(2, "0")}
                </span>
              </button>
            );
          })}
          <div className="mx-3 my-1.5 h-px bg-white/10 short:my-0.5" />
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onList)}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 short:py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline-none"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-white/60 group-hover:text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
            </svg>
            Full List
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={show}
        onFocus={show}
        style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
        className="btn-fill flex items-center gap-2.5 rounded-xl border border-red-500/45 bg-navy-950/55 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-premium backdrop-blur-xl transition-transform duration-200 active:scale-95 xl:px-5 xl:py-3 3xl:text-xs"
      >
        <IconGrid />
        All Amenities
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-3 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
