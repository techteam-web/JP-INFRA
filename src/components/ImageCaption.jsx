// Name of the photo on screen, bottom-left, in the site's heading style: a
// small label after a brand-red rule, then the name in Bebas Neue. Re-keyed
// per photo so it eases in afresh each time the slide changes. Sits above
// the centred counter on small screens, beside it from sm up.
export default function ImageCaption({ id, label, name, detail }) {
  return (
    <div
      data-anim
      aria-live="polite"
      className="pointer-events-none absolute bottom-20 left-6 right-6 z-10 sm:bottom-8 sm:right-auto sm:left-10 sm:max-w-[38%] 2xl:bottom-10 3xl:bottom-12 3xl:left-14 4xl:bottom-14 4xl:left-16"
    >
      <div key={id} className="jp-caption-in">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75 3xl:text-xs 4xl:text-sm">
          <span className="h-px w-6 bg-red-600 3xl:w-8" />
          {label}
        </span>
        <p className="mt-2 font-display text-3xl uppercase leading-[1.02] text-white [text-shadow:0_2px_24px_rgba(10,31,54,0.55)] sm:text-4xl xl:text-5xl 3xl:text-6xl 4xl:text-7xl">
          {name}
        </p>
        {detail && (
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-red-500 sm:text-xs 3xl:text-sm">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}
