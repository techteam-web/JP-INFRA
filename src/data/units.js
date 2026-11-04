// The homes in the Floor Plans screen (Explore Units): the 8th floor of wings A1 and A2,
// from the architect's plans in src/assets/floor-plans/ (WebP copies of
// src/assets/floor plan All/). Each wing's SVG holds every home's outline on its floor plan,
// so the plan itself is what you pick homes on.
//
// The homes, their types and their plans are real. Their sizes (carpet area) and
// availability are SAMPLE figures until the client's unit list arrives; while SAMPLE_DATA
// is true the screen says so.
import a1Plan from "../assets/floor-plans/A1-8th-floor.webp";
import a2Plan from "../assets/floor-plans/A2-8th-floor.webp";
import a1Outlines from "../assets/floor-plans/A1-8th-floor.svg?raw";
import a2Outlines from "../assets/floor-plans/A2-8th-floor.svg?raw";
import a101 from "../assets/floor-plans/A1-01.webp";
import a102 from "../assets/floor-plans/A1-02.webp";
import a103 from "../assets/floor-plans/A1-03.webp";
import a104 from "../assets/floor-plans/A1-04.webp";
import a105 from "../assets/floor-plans/A1-05.webp";
import a106 from "../assets/floor-plans/A1-06.webp";
import a201 from "../assets/floor-plans/A2-01.webp";
import a202 from "../assets/floor-plans/A2-02.webp";
import a203 from "../assets/floor-plans/A2-03.webp";
import a204 from "../assets/floor-plans/A2-04.webp";
import a205 from "../assets/floor-plans/A2-05.webp";

export const SAMPLE_DATA = true;

// The elevation drawing's floors per tower (the Floor Plans page and its 360° views)
export const FLOORS = 38;
// The floor the plans are of
export const PLAN_FLOOR = 8;

// The plans' own drawing space (their SVGs' viewBox), which the outlines are in
export const PLAN_W = 1191.12;
export const PLAN_H = 670.08;

// Every home's outline on its wing's plan, by id: an SVG path (polygons are turned into
// paths). Illustrator sometimes suffixes ids ("A2-03_0000…"), so only the first five
// characters count.
function outlines(svg) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const out = {};
  for (const el of doc.querySelectorAll("polygon[id], path[id]")) {
    const id = el.id.slice(0, 5);
    if (el.tagName === "path") out[id] = el.getAttribute("d");
    else {
      const v = el.getAttribute("points").trim().split(/[\s,]+/).map(Number);
      const pts = [];
      for (let i = 0; i < v.length; i += 2) pts.push(`${v[i]},${v[i + 1]}`);
      out[id] = `M${pts.join("L")}Z`;
    }
  }
  return out;
}

// the middle of an outline (for marks placed on a home), measured by the browser
function centreOf(d) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const b = path.getBBox();
  svg.remove();
  return [b.x + b.width / 2, b.y + b.height / 2];
}

export const WINGS = [
  { id: "A1", plan: a1Plan, shapes: outlines(a1Outlines) },
  { id: "A2", plan: a2Plan, shapes: outlines(a2Outlines) },
];
export const WING_BY_ID = Object.fromEntries(WINGS.map((w) => [w.id, w]));

// The homes, as labelled on the plans (A2-06 on the A2 plan is the refuge area, not a home).
// `code` is the plan's type code; `carpet` (sq ft) is sample.
const HOMES = [
  { id: "A1-01", type: "4 BHK", code: "R1", bed: 4, carpet: 1480, image: a101 },
  { id: "A1-02", type: "3 BHK", code: "R2", bed: 3, carpet: 1105, image: a102 },
  { id: "A1-03", type: "3 BHK", code: "R3", bed: 3, carpet: 1110, image: a103 },
  { id: "A1-04", type: "3 BHK", code: "R4", bed: 3, carpet: 1110, image: a104 },
  { id: "A1-05", type: "3 BHK", code: "R5", bed: 3, carpet: 1095, image: a105 },
  { id: "A1-06", type: "4 BHK", code: "R6", bed: 4, carpet: 1475, image: a106 },
  { id: "A2-01", type: "2 BHK", code: null, bed: 2, carpet: 760, image: a201 },
  { id: "A2-02", type: "2 BHK", code: null, bed: 2, carpet: 745, image: a202 },
  { id: "A2-03", type: "2 BHK", code: null, bed: 2, carpet: 745, image: a203 },
  { id: "A2-04", type: "2 BHK", code: "R9", bed: 2, carpet: 750, image: a204 },
  { id: "A2-05", type: "2 BHK", code: "R9", bed: 2, carpet: 750, image: a205 },
];

// Sample availability: a fixed pattern (the same on every visit)
const SAMPLE_STATUS = { "A1-02": "Sold", "A1-05": "On Hold", "A2-02": "Sold", "A2-04": "Sold" };

export const UNITS = HOMES.map((h) => {
  const shape = WING_BY_ID[h.id.slice(0, 2)].shapes[h.id];
  return { ...h, wing: h.id.slice(0, 2), floor: PLAN_FLOOR, status: SAMPLE_STATUS[h.id] ?? "Available", shape, centre: centreOf(shape) };
});
export const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));
export const unitsIn = (wing) => UNITS.filter((u) => u.wing === wing);
export const TYPES = [...new Set(UNITS.map((u) => u.type))].sort();

// View Comparison: which 360° panorama shows the view from a floor. Only the terrace has been
// captured so far (in three lights), so every floor uses it for now; add an entry per
// height as drone panoramas are shot, e.g. { from: 1, to: 12, label: "Floors 1–12", scenes: {...} }.
// `scenes` are scene ids from data.js by time of day.
export const VIEW_HEIGHTS = [
  {
    from: 1,
    to: FLOORS,
    label: "Terrace",
    scenes: { Day: "0-dji_0001_terrace-150", Evening: "2-dji_0071_d", Twilight: "1-dji_0075_d" },
  },
];
export const viewFor = (floor) => VIEW_HEIGHTS.find((v) => floor >= v.from && floor <= v.to) ?? VIEW_HEIGHTS[0];
