// How far the 360° panoramas can be turned: the same on the 360° View page and in the Floor
// Plans' Compare Views. Change these to change both.
import Marzipano from "marzipano";

const DEG = Math.PI / 180;

// Left and right: how far the view turns in all, half to each side of the direction each
// panorama opens on (360 = all the way round).
export const YAW_RANGE = 360 * DEG;
// Up and down: the top and bottom of the picture never pass these, so the view can't tip
// up into the empty sky or down to the spot under the camera.
export const TOP_EDGE = 80 * DEG;
export const BOTTOM_EDGE = -90 * DEG;

const limitEdges = (params) => {
  const half = params.fov / 2; // the view's vertical field of view
  params.pitch = Math.min(TOP_EDGE - half, Math.max(BOTTOM_EDGE + half, params.pitch));
  return params;
};

// the range a panorama may turn within, around the direction it opens on
export const yawRange = (scene) => {
  const mid = scene.initialViewParameters.yaw;
  return [mid - YAW_RANGE / 2, mid + YAW_RANGE / 2];
};

// A scene's view limiter: its tiles' resolution, zoom (fully out, the picture spans exactly
// top edge to bottom edge), the turning range, and the top and bottom edges.
export const panoLimiter = (scene) =>
  Marzipano.util.compose(
    Marzipano.RectilinearView.limit.resolution(scene.faceSize),
    Marzipano.RectilinearView.limit.vfov(24 * DEG, TOP_EDGE - BOTTOM_EDGE),
    Marzipano.RectilinearView.limit.yaw(...yawRange(scene)),
    limitEdges,
  );
