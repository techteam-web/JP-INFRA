// SAMPLE unit data, for illustration only, until the client's unit list arrives.
// Every Floor Plan feature (the plan, unit filtering and the unit / floor / view
// comparisons) reads from this file, so replacing it with the real inventory updates them
// all. While SAMPLE_DATA is true the Floor Plan screen says the units are sample data.
export const SAMPLE_DATA = true;

// Each tower's floors, from the ground up (the elevation drawing has 38 per tower)
export const TOWERS = ["A", "B"];
export const FLOORS = 38;

// The typical floor: six homes around the lift core. `slot` is the home's place on the plan
// drawing (t = garden side, b = city side; l / c / r = left, centre, right; r is the hills side). Areas in sq ft.
export const TYPICAL_FLOOR = [
  { no: 1, type: "3 BHK", carpet: 1045, balcony: 92, bed: 3, bath: 3, facing: "Garden", slot: "tl" },
  { no: 2, type: "2 BHK", carpet: 742, balcony: 64, bed: 2, bath: 2, facing: "Garden", slot: "tc" },
  { no: 3, type: "3 BHK", carpet: 1010, balcony: 88, bed: 3, bath: 3, facing: "Hills", slot: "tr" },
  { no: 4, type: "2 BHK", carpet: 735, balcony: 60, bed: 2, bath: 2, facing: "Hills", slot: "br" },
  { no: 5, type: "2 BHK", carpet: 698, balcony: 58, bed: 2, bath: 2, facing: "City", slot: "bc" },
  { no: 6, type: "2 BHK", carpet: 760, balcony: 66, bed: 2, bath: 2, facing: "City", slot: "bl" },
];

export const TYPES = [...new Set(TYPICAL_FLOOR.map((u) => u.type))];
export const FACINGS = [...new Set(TYPICAL_FLOOR.map((u) => u.facing))];

// Sample availability: a fixed pattern (the same on every visit), about a third sold
function sampleStatus(tower, floor, no) {
  const h = (tower.charCodeAt(0) * 131 + floor * 37 + no * 17) % 10;
  return h < 3 ? "Sold" : h === 3 ? "On Hold" : "Available";
}

const pad = (n) => String(n).padStart(2, "0");
// A home's number: tower, floor, then its number on the floor (A-1203 = Tower A, floor 12, home 3)
export const unitId = (tower, floor, no) => `${tower}-${floor}${pad(no)}`;

export const UNITS = TOWERS.flatMap((tower) =>
  Array.from({ length: FLOORS }, (_, i) => i + 1).flatMap((floor) =>
    TYPICAL_FLOOR.map((u) => ({
      ...u,
      id: unitId(tower, floor, u.no),
      tower,
      floor,
      status: sampleStatus(tower, floor, u.no),
    })),
  ),
);
export const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));
export const unitsOn = (tower, floor) => UNITS.filter((u) => u.tower === tower && u.floor === floor);

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
