import { useEffect, useRef } from "react";

// How far a photo's shape may differ from the screen's before `fit` shows it whole
// (a little trim is fine: it keeps near-screen-shaped photos full-bleed)
const FIT_TOLERANCE = 1.18;

// With `fit` on: a photo whose shape is close to the screen's fills it; any other photo
// (a square render on a wide screen, a wide photo on a phone held upright) is shown
// whole, with a blurred, darkened copy of itself filling the space around it.
function applyFit(photo) {
  const main = photo?.querySelector("[data-main]");
  const backdrop = photo?.querySelector("[data-backdrop]");
  if (!main?.naturalWidth || !photo.clientHeight) return;
  const ratio = main.naturalWidth / main.naturalHeight / (photo.clientWidth / photo.clientHeight);
  const whole = ratio > FIT_TOLERANCE || ratio < 1 / FIT_TOLERANCE;
  main.style.objectFit = whole ? "contain" : "cover";
  if (backdrop) backdrop.style.display = whole ? "block" : "none";
}

// One layer: its first child is the photo (what useCurtainSlider moves), holding the
// picture and, with `fit`, its blurred backdrop.
function Layer({ layerRef, fit }) {
  return (
    <div ref={layerRef} className="absolute inset-0 overflow-hidden will-change-[clip-path]">
      <div className="absolute inset-0 will-change-transform">
        {fit && (
          <img
            data-backdrop
            alt=""
            aria-hidden="true"
            decoding="async"
            style={{ display: "none" }}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.45]"
          />
        )}
        <img
          data-main
          alt=""
          decoding="async"
          onLoad={fit ? (e) => applyFit(e.currentTarget.parentElement) : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

// Full-screen photo stage driven by useCurtainSlider: two clipped layers, each
// holding a photo that drifts inside its clip, and (unless `shade` is off) the site's
// top/bottom navy grading. With `onNext`, a click anywhere on the photo advances; without
// it the photo is only a picture (the page's own ‹ › move it on). `fit` shows photos that
// aren't screen-shaped whole (see applyFit).
export default function CurtainStage({ layerARef, layerBRef, onNext, label, shade = true, fit = false }) {
  const Stage = onNext ? "button" : "div";
  const stageRef = useRef(null);

  // the screen's shape changes (a phone turned, a window resized): fit again
  useEffect(() => {
    if (!fit) return undefined;
    const onResize = () => stageRef.current?.querySelectorAll("[data-main]").forEach((m) => applyFit(m.parentElement));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  return (
    <Stage
      ref={stageRef}
      {...(onNext ? { type: "button", onClick: onNext, "aria-label": label } : { role: "img", "aria-label": label })}
      className={`absolute inset-0 z-0 overflow-hidden bg-navy-950 ${onNext ? "cursor-pointer" : ""}`}
    >
      <Layer layerRef={layerARef} fit={fit} />
      <Layer layerRef={layerBRef} fit={fit} />
      {shade && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,31,54,0.5) 0%, transparent 20%, transparent 70%, rgba(10,31,54,0.65) 100%)",
          }}
        />
      )}
    </Stage>
  );
}
