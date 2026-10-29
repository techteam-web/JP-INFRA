import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NAV_ITEMS } from "../data/navItems";
import { trackButtonClick } from "../lib/analytics";
import EndgameLogo from "./EndgameLogo";

// Phone / tablet navigation for Home (below lg, where the bottom bar is
// hidden): a Menu button in the navbar's dress — navy glass, light red
// hairline — opening a full-screen navy sheet with the sections listed large,
// red numbers before Bebas labels, easing in one after another.
// Must sit inside a positioned, full-screen parent (for the button).
export default function MobileNav({ onSelect }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        data-anim
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="absolute bottom-5 left-5 z-20 flex items-center gap-3 rounded-xl border border-red-500/45 bg-navy-950/60 px-5 py-3.5 text-white shadow-premium backdrop-blur-xl transition-transform duration-200 active:scale-95 sm:bottom-8 sm:left-10 lg:hidden"
      >
        <span aria-hidden="true" className="flex w-4 flex-col gap-[4px]">
          <span className="h-px w-full bg-white" />
          <span className="h-px w-2/3 bg-red-500" />
          <span className="h-px w-full bg-white" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Menu</span>
      </button>

      {createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sections"
          aria-hidden={!open}
          inert={!open}
          className={`fixed inset-0 z-[70] flex flex-col bg-navy-950/96 backdrop-blur-xl transition-[opacity,visibility] duration-500 lg:hidden ${
            open ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          <div className="flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
            <span className="jp-logo-shadow">
              <EndgameLogo className="w-28 sm:w-32" />
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close menu"
              style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
              className="btn-fill grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white transition-transform duration-200 active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
  
          <nav className="flex flex-1 flex-col justify-center px-5 pb-16 sm:px-10">
            <span className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
              <span className="h-px w-6 bg-red-600" />
              Explore
            </span>
            <ul>
              {NAV_ITEMS.map((item, i) => (
                <li
                  key={item.n}
                  className={`border-b border-white/10 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${120 + i * 55}ms` : "0ms" }}
                >
                  <button
                    type="button"
                    data-button-name={item.trackingName}
                    onClick={() => {
                      trackButtonClick(item.label);
                      setOpen(false);
                      onSelect?.(item.label);
                    }}
                    className="group flex w-full items-baseline gap-4 py-3.5 text-left active:opacity-70"
                  >
                    <span className="w-6 text-xs font-bold tracking-widest text-red-600">{item.n}</span>
                    <span className="font-display text-[2.1rem] uppercase leading-none text-white transition-colors duration-300 group-hover:text-red-500 sm:text-5xl">
                      {item.caption ?? item.label}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 self-center text-white/40 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-red-500"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>,
        // portalled to <body>: above everything, the Brainwing credit included
        document.body,
      )}
    </>
  );
}
