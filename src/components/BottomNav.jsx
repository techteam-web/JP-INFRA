import { NAV_ITEMS } from "../data/navItems";
import { trackButtonClick } from "../lib/analytics";

const EASE = "ease-[cubic-bezier(0.7,0,0.2,1)]";

// Label that rolls on hover: each letter slides up out of view while an
// identical white copy rolls in from below, staggered left to right.
function RollingLabel({ text }) {
  return (
    <span aria-hidden="true" className="flex">
      {[...text].map((ch, i) => {
        const glyph = ch === " " ? " " : ch;
        return (
          <span key={i} className="relative inline-block overflow-hidden leading-[1.25]">
            <span
              className={`block transition-transform duration-500 ${EASE} group-hover:-translate-y-full group-focus-visible:-translate-y-full`}
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {glyph}
            </span>
            <span
              className={`absolute inset-x-0 top-full block text-white transition-transform duration-500 ${EASE} group-hover:-translate-y-full group-focus-visible:-translate-y-full`}
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {glyph}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Section bar along the bottom of Home, in the site's own language: navy
// glass with a light brand-red hairline border, Montserrat uppercase labels
// and brand-red numbers. Hover: the label rolls letter by letter, the number
// lifts, a red underline sweeps in from the left and a soft red glow rises
// from the bottom edge. Softly rounded corners — never a pill. lg and up.
// Centred with inset-x-0 + mx-auto + w-fit (no translate) so a GSAP
// data-anim y-tween doesn't clobber it. Must sit inside a positioned,
// full-screen parent.
export default function BottomNav({ onSelect }) {
  return (
    <nav
      data-anim
      aria-label="Sections"
      className="absolute inset-x-0 bottom-6 z-20 mx-auto hidden w-fit items-center rounded-2xl border border-red-500/45 bg-navy-950/55 p-1.5 shadow-premium backdrop-blur-xl lg:flex 3xl:bottom-10 3xl:p-2 4xl:bottom-12"
    >
      {NAV_ITEMS.map((item, i) => {
        const text = item.caption ?? item.label;
        return (
          <div key={item.n} className="flex items-center">
            {i > 0 && <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-white/15 3xl:h-5" />}
            <button
              type="button"
              aria-label={text}
              data-button-name={item.trackingName}
              onClick={() => {
                trackButtonClick(item.label);
                onSelect?.(item.label);
              }}
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-white/75 outline-none transition-transform duration-300 active:scale-95 xl:gap-3 xl:px-5 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5"
            >
              {/* soft red glow rising from the bottom edge */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-y-3 bg-[radial-gradient(120%_90%_at_50%_120%,rgba(238,49,52,0.38),transparent_70%)] opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              />

              <span
                aria-hidden="true"
                className={`relative text-[10px] font-bold tracking-widest text-red-600 transition-[transform,color] duration-500 ${EASE} group-hover:-translate-y-0.5 group-hover:text-red-500 xl:text-[11px] 3xl:text-sm 4xl:text-base`}
              >
                {item.n}
              </span>

              <span className="relative whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.2em] xl:text-[11px] 2xl:text-xs 3xl:text-sm 4xl:text-base">
                <RollingLabel text={text} />
                {/* red underline sweeping in from the left */}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-1.5 left-0 h-px w-full origin-right scale-x-0 bg-red-500 transition-transform duration-500 ${EASE} group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100`}
                />
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
