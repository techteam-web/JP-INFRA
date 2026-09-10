import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import contactImg from "../assets/gallery/Meeting Room.webp";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-600 3xl:h-5 3xl:w-5" fill="none" aria-hidden="true">
      <path
        d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2 2C10.5 19 4 12.5 4 5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-600 3xl:h-5 3xl:w-5" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m3 7 9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-600 3xl:h-5 3xl:w-5" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const CONTACT_ITEMS = [
  {
    icon: IconPin,
    label: "Address",
    value: "JP Infra Tower, Bandra Kurla Complex, Mumbai 400051",
  },
  { icon: IconPhone, label: "Phone", value: "+91 22 6123 4567" },
  { icon: IconMail, label: "Email", value: "enquiry@jpinfra.com" },
];

export default function Contact({ onBack }) {
  const rootRef = useRef(null);
  const [sent, setSent] = useState(false);

  useLayoutEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-anim]");
    if (!els) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(els, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" }
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div ref={rootRef} className="relative h-[100svh] w-full overflow-hidden bg-navy-950">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src={contactImg}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,31,54,0.7) 0%, rgba(10,31,54,0.55) 40%, rgba(10,31,54,0.85) 100%)",
          }}
        />
      </div>

      {/* Top-left: back + breadcrumb */}
      <div
        data-anim
        className="absolute left-6 top-6 z-10 flex items-center gap-3 sm:left-10 sm:top-8 3xl:left-14 3xl:top-10 4xl:left-16 4xl:top-12"
      >
        <BackButton onClick={onBack} />
        <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex 3xl:text-xs 4xl:text-sm">
          <span className="h-px w-6 bg-white/40" />
          Contact
        </span>
      </div>

      {/* Top-right: logo */}
      <div
        data-anim
        className="absolute right-6 top-6 z-10 sm:right-10 sm:top-8 3xl:right-14 3xl:top-10 4xl:right-16 4xl:top-12"
      >
        <div className="rounded-lg bg-navy-700 p-1.5 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {/* Center: headline + info + form, all within one viewport */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pb-6 pt-20 sm:px-10 sm:pt-24 lg:px-16 lg:pt-20 xl:px-20 2xl:px-24 3xl:px-28 3xl:pt-24 4xl:px-32">
        <div className="pointer-events-auto w-full max-w-5xl 3xl:max-w-6xl">
          <div data-anim className="text-center lg:text-left">
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70 sm:text-xs 3xl:text-sm">
              Reach Out
            </span>
            <h1 className="mt-2 font-display uppercase text-3xl leading-[1.05] text-white sm:text-4xl lg:text-5xl xl:text-6xl 3xl:text-7xl">
              Get In <span className="text-red-600">Touch</span>
            </h1>
          </div>

          <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 3xl:mt-10 3xl:gap-14">
            <div data-anim className="space-y-3.5 3xl:space-y-4">
              {CONTACT_ITEMS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 backdrop-blur-sm 3xl:h-10 3xl:w-10">
                    <Icon />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 3xl:text-xs">
                      {label}
                    </p>
                    <p className="text-xs text-white/85 sm:text-sm 3xl:text-base">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <form data-anim onSubmit={handleSubmit} className="space-y-2.5 3xl:space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2 3xl:gap-3">
                <input
                  required
                  type="text"
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 outline-none transition-colors focus:border-red-600 sm:text-sm 3xl:px-4 3xl:py-3 3xl:text-base"
                />
                <input
                  required
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 outline-none transition-colors focus:border-red-600 sm:text-sm 3xl:px-4 3xl:py-3 3xl:text-base"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email Address"
                className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 outline-none transition-colors focus:border-red-600 sm:text-sm 3xl:px-4 3xl:py-3 3xl:text-base"
              />
              <textarea
                required
                rows={2}
                placeholder="Your Message"
                className="w-full resize-none rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 outline-none transition-colors focus:border-red-600 sm:text-sm 3xl:px-4 3xl:py-3 3xl:text-base"
              />
              <button
                type="submit"
                style={{ "--btn-fill-color": "#ffffff" }}
                className="btn-fill group flex w-full items-center justify-between rounded-xl border border-white/40 px-6 py-3 text-white transition-[color,border-color,transform] duration-300 ease-out hover:border-white hover:text-navy-950 active:scale-95 sm:w-auto 3xl:px-8 3xl:py-3.5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs 3xl:text-sm">
                  {sent ? "Message Sent" : "Send Message"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="ml-3 h-3.5 w-3.5 -rotate-45 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 3xl:h-4 3xl:w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
