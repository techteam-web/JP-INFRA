import { useEffect, useRef } from "react";
import Marzipano from "marzipano";
import { panoLimiter } from "../data/panoLimits";

// One 360° view, filling its box, within the site's turning limits (data/panoLimits.js).
// `scene`: { id, tileUrl, previewUrl, levels, faceSize, initialViewParameters }. Changing it
// crossfades to the new scene, looking the same way. For a pair that turns together, it
// tells the pair which view it shows (`register`) and when it turns (`onTurn`).
export default function PanoPane({ scene, side = "a", register, onTurn }) {
  const elRef = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    const viewer = new Marzipano.Viewer(elRef.current, { controls: { mouseViewMode: "drag" } });
    ctx.current = { viewer, scenes: new Map(), current: null };
    return () => {
      viewer.destroy();
      ctx.current = null;
      register?.(side, null);
    };
  }, [register, side]);

  useEffect(() => {
    const c = ctx.current;
    if (!c || !scene) return;
    let entry = c.scenes.get(scene.id);
    if (!entry) {
      const view = new Marzipano.RectilinearView(scene.initialViewParameters, panoLimiter(scene));
      const source = Marzipano.ImageUrlSource.fromString(scene.tileUrl, { cubeMapPreviewUrl: scene.previewUrl });
      const s = c.viewer.createScene({ source, geometry: new Marzipano.CubeGeometry(scene.levels), view, pinFirstLevel: true });
      if (onTurn) view.addEventListener("change", () => onTurn(side, view));
      entry = { scene: s, view };
      c.scenes.set(scene.id, entry);
    }
    const prev = c.current;
    // looking the same way; or, changing to a view held about another direction (the other
    // side of the building, data/towerViews.js facingScene), turned round by the difference
    if (prev && prev !== entry) {
      const turn = (scene.limits?.centre ?? 0) - (prev.centre ?? 0);
      entry.view.setParameters({ yaw: prev.view.yaw() + turn, pitch: prev.view.pitch(), fov: prev.view.fov() });
    }
    entry.centre = scene.limits?.centre ?? 0;
    entry.scene.switchTo({ transitionDuration: prev ? 600 : 0 });
    c.current = entry;
    register?.(side, entry.view);
  }, [scene, side, register, onTurn]);

  return <div ref={elRef} className="absolute inset-0" />;
}
