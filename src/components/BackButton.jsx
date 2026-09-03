export default function BackButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className={`group grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-navy-950/40 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
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
