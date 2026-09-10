export default function BackButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      style={{ "--btn-fill-color": "rgba(255,255,255,0.14)" }}
      className={`btn-fill group grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-transform duration-200 hover:scale-105 active:scale-90 2xl:h-11 2xl:w-11 3xl:h-12 3xl:w-12 4xl:h-14 4xl:w-14 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 3xl:h-5 3xl:w-5"
        aria-hidden="true"
      >
        <path
          d="M15 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
