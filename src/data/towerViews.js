// The view from Tower A, wing by wing and height by height: drone panoramas shot at the 8th
// floor, every third floor up to the 44th, and the terrace, exported by the Marzipano tool
// to public/pano/tower<wing>/tiles/<scene>/ (cube faces, 4 levels up to 4096 px, preview.jpg).
// The Floor Plans page shows them from a floor's card, and Explore Units compares them.
//
// The tiles came without the tool's data.js, so every view opens facing the same way (yaw 0);
// set a scene's `yaw` below to open it elsewhere.

const LEVELS = [
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 },
];
const OPEN = { yaw: 0, pitch: 0, fov: 1.35 };

// [floor, height in metres, scene folder]; floor 0 is the terrace
const SHOTS = {
  A1: [
    [8, 39.9, "13-dji_0070_gr-8th-floor_399m"],
    [11, 48.6, "12-dji_0069_11th-floor_486m"],
    [14, 57.3, "11-dji_0068_14th-floor_573m"],
    [17, 66.0, "10-dji_0067_17th-floor_66m"],
    [20, 74.7, "9-dji_0066_20th-floor_747m"],
    [23, 83.4, "8-dji_0065_23rd-floor_834m"],
    [26, 92.1, "7-dji_0064_26th-floor_921m"],
    [29, 100.8, "6-dji_0063_29th-floor_1008m"],
    [32, 109.5, "5-dji_0062_32nd-floor_1095m"],
    [35, 118.2, "4-dji_0061_35th-floor_1182m"],
    [38, 126.9, "3-dji_0060_38th-floor_1269m"],
    [41, 135.6, "2-dji_0059_41st-floor_1356m"],
    [44, 144.3, "1-dji_0058_44th-floor_1443m"],
    [0, 150.1, "0-dji_0057_terrace-1501m"],
  ],
  A2: [
    [8, 39.9, "0-dji_0043_gr-8th-floor_399m"],
    [11, 48.6, "1-dji_0044_11th-floor_486m"],
    [14, 57.3, "2-dji_0045_14th-floor_573m"],
    [17, 66.0, "3-dji_0046_17th-floor_66m"],
    [20, 74.7, "4-dji_0047_20th-floor_747m"],
    [23, 83.4, "5-dji_0048_23rd-floor_834m"],
    [26, 92.1, "6-dji_0049_26th-floor_921m"],
    [29, 100.8, "7-dji_0050_29th-floor_1008m"],
    [32, 109.5, "8-dji_0051_32nd-floor_1095m"],
    [35, 118.2, "9-dji_0052_35th-floor_1182m"],
    [38, 126.9, "10-dji_0053_38th-floor_1269m"],
    [41, 135.6, "11-dji_0054_41st-floor_1356m"],
    [44, 144.3, "12-dji_0055_44th-floor_1443m"],
    [0, 150.1, "13-dji_0056_terrace-1501m"],
  ],
};

const ordinal = (n) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

export const VIEW_WINGS = Object.keys(SHOTS);

// Each wing's views, from the lowest: { key, floor, label, height, scene }; a scene carries
// what a Marzipano view needs (tile and preview urls, levels, face size, opening angle).
export const TOWER_VIEWS = Object.fromEntries(
  VIEW_WINGS.map((wing) => [
    wing,
    SHOTS[wing].map(([floor, height, id]) => {
      const base = `/pano/tower${wing}/tiles/${id}`;
      return {
        key: `${wing}-${floor || "T"}`,
        floor,
        label: floor ? `${ordinal(floor)} floor` : "Terrace",
        height,
        scene: {
          id: `${wing}/${id}`,
          tileUrl: `${base}/{z}/{f}/{y}/{x}.jpg`,
          previewUrl: `${base}/preview.jpg`,
          levels: LEVELS,
          faceSize: 4096,
          initialViewParameters: OPEN,
        },
      };
    }),
  ]),
);

// The view to show for a floor: the nearest one captured at or below it (the 8th floor's
// for anything lower)
export function viewFor(wing, floor) {
  const views = TOWER_VIEWS[wing].filter((v) => v.floor);
  return [...views].reverse().find((v) => v.floor <= floor) ?? views[0];
}
