import towerImg from "../assets/building svg/CAM_01.png";
import floorsSvg from "../assets/jp_infra_SVG/Asset 1.svg?raw";

// The tower render and its floor outlines, shared by the Floor Plans page and the Floor Plan
// screen's tower panel so both draw the same building from one source.

// The render and its floor outlines share one 1672 × 941 space.
export const VIEW_W = 1672;
export const VIEW_H = 941;

// The outlines were drawn on their own sheet; this puts them back over the render.
export const OFFSET = [552.03, 119.63];

// Every floor of the two towers, from the SVG. Each tower is drawn in three sections (groups
// B, B1, B2 and A2, A1, A); a floor is its outline in every section, so choosing one lights
// the same floor across all three. `anchor` is the floor's right-hand tip, where the card
// points to. The SVG's group letters are the other way round from the towers' real names,
// so TOWER_OF swaps them: the "B" groups are Tower A and the "A" groups Tower B.
const TOWER_OF = { A: "B", B: "A" };
export const BUILDINGS = (() => {
  const doc = new DOMParser().parseFromString(floorsSvg, "image/svg+xml");
  const sections = {};
  for (const poly of doc.querySelectorAll("polygon")) {
    const points = poly.getAttribute("points").trim();
    const v = points.split(/[\s,]+/).map(Number);
    const xy = [];
    for (let i = 0; i < v.length; i += 2) xy.push([v[i] + OFFSET[0], v[i + 1] + OFFSET[1]]);
    const y = xy.reduce((t, [, py]) => t + py, 0) / xy.length;
    (sections[poly.parentElement.id] ??= []).push({ n: Number(poly.getAttribute("data-name")) || 0, points, xy, y });
  }
  const out = {};
  for (const [id, list] of Object.entries(sections)) {
    // sections A and A1 come without floor numbers: they're numbered from the ground up
    if (list.some((o) => !o.n)) list.sort((p, q) => q.y - p.y).forEach((o, i) => (o.n = i + 1));
    const b = TOWER_OF[id[0]] ?? id[0];
    for (const { n, points, xy } of list) {
      const floor = ((out[b] ??= [])[n - 1] ??= { b, n, pieces: [], xy: [] });
      floor.pieces.push(points);
      floor.xy.push(...xy);
    }
  }
  // each floor's tips, where its card's connector starts: `anchor` on the right, `leftTip`
  // on the left (the card sits on the side of the building the floor is on)
  const tipAt = (xy, x) => {
    const tip = xy.filter(([px]) => Math.abs(px - x) < 1);
    return [x, tip.reduce((t, [, y]) => t + y, 0) / tip.length];
  };
  for (const floors of Object.values(out)) {
    for (const f of floors) {
      f.anchor = tipAt(f.xy, Math.max(...f.xy.map(([x]) => x)));
      f.leftTip = tipAt(f.xy, Math.min(...f.xy.map(([x]) => x)));
    }
  }
  return out;
})();
export const ORDER = Object.keys(BUILDINGS).sort(); // A, B
export const ALL = ORDER.flatMap((b) => BUILDINGS[b]);
export const TOP = BUILDINGS[ORDER[0]].length;

// The floor plans (data/units.js) are Tower A's: wings A1 and A2, as drawn for the 8th floor.
export const PLANS_TOWER = "A";

export { towerImg };
