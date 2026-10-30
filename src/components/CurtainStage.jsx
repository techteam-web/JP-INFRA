// Full-screen photo stage driven by useCurtainSlider: two clipped layers, each
// holding a photo that drifts inside its clip, and (unless `shade` is off) the site's
// top/bottom navy grading. Click anywhere to advance.
function Layer({ layerRef }) {
  return (
    <div ref={layerRef} className="absolute inset-0 overflow-hidden will-change-[clip-path]">
      <img alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover will-change-transform" />
    </div>
  );
}

export default function CurtainStage({ layerARef, layerBRef, onNext, label, shade = true }) {
  return (
    <button
      type="button"
      onClick={onNext}
      aria-label={label}
      className="absolute inset-0 z-0 cursor-pointer overflow-hidden bg-navy-950"
    >
      <Layer layerRef={layerARef} />
      <Layer layerRef={layerBRef} />
      {shade && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,31,54,0.5) 0%, transparent 20%, transparent 70%, rgba(10,31,54,0.65) 100%)",
          }}
        />
      )}
    </button>
  );
}
