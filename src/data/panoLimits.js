// How far the 360° panoramas can be turned: by default the same on the 360° View page and in
// the Floor Plans; a scene can narrow its own (`limits`, below).
import Marzipano from "marzipano";

const DEG = Math.PI / 180;

// Left and right: not limited at all. The view turns the whole way round and keeps going,
// wrapping past the direction it opened on rather than stopping dead against a wall.
// Up and down: the top and bottom of the picture never pass these, so the view can't tip
// up into the empty sky or down to the spot under the camera.
export const TOP_EDGE = 80 * DEG;
export const BOTTOM_EDGE = -90 * DEG;

// A scene can carry `limits` of its own, to keep part of its panorama out of sight:
//   top, bottom  the highest and lowest the picture's top and bottom edges reach
//   side         how far either way of `centre` its left and right edges reach; left out,
//                the view turns the whole way round
//   centre       the direction the side limits are measured from (yaw, default 0)
// The views from the floors of Tower A (data/towerViews.js) use it to keep the building
// itself, behind the camera, and the ground under it out of the picture.
const DEFAULTS = { top: TOP_EDGE, bottom: BOTTOM_EDGE, side: null, centre: 0 };

// the view's horizontal field of view, from its vertical one and the shape of its box
const hfovOf = (p) => 2 * Math.atan(Math.tan(p.fov / 2) * (p.width > 0 && p.height > 0 ? p.width / p.height : 1));
// an angle brought into -180°..180°
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const limitEdges = ({ top, bottom, side, centre }) => (params) => {
  const half = params.fov / 2; // the view's vertical field of view
  params.pitch = Math.min(top - half, Math.max(bottom + half, params.pitch));
  if (side != null) {
    // the edges, not the middle, stop at the limit, so the wider the screen the less it turns
    const room = Math.max(0, side - hfovOf(params) / 2);
    params.yaw = centre + Math.min(room, Math.max(-room, wrap(params.yaw - centre)));
  }
  return params;
};

// A scene's view limiter: its tiles' resolution, zoom (fully out, the picture spans exactly
// top edge to bottom edge), and the top and bottom edges. Unless the scene sets `side`,
// nothing limits the yaw, so turning left or right never hits a stop.
export const panoLimiter = (scene) => {
  const limits = { ...DEFAULTS, ...scene.limits };
  return Marzipano.util.compose(
    Marzipano.RectilinearView.limit.resolution(scene.faceSize),
    Marzipano.RectilinearView.limit.vfov(24 * DEG, limits.top - limits.bottom),
    limitEdges(limits),
  );
};
