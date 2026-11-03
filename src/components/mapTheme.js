// The site's map look, shared by Location and About Us → Our Legacy.

// OpenStreetMap data, served as free vector tiles by OpenFreeMap (no API key); restyled below.
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

// The arteries — the Western Express Highway and Ghodbunder Road — carry the site's navy;
// every other road stays a quiet white ribbon, so the main roads read at a glance.
const ARTERY = ['motorway', 'trunk', 'primary']
const isArtery = ['in', ['get', 'class'], ['literal', ARTERY]]
const ROAD_COLOR = ['case', isArtery, '#ffffff', ['match', ['get', 'class'], ['secondary', 'tertiary'], '#fcfdfe', '#f7fafc']]
// navy casing on the arteries, soft blue-grey on the rest
const CASING_COLOR = ['case', isArtery, '#2b5a8f', '#cbd6e2']
// widen a layer's own line-width by a factor, keeping its zoom curve
const wider = (layer, artery, rest) => [
  '*',
  ['case', isArtery, artery, rest],
  ['coalesce', layer.paint?.['line-width'], 1],
]

// Daylight palette from the site: a cool, navy-tinted ground (navy-50 family), pale
// blue-grey city, soft blue water and navy (#0a1f36) type; brand red is kept for the
// selection and the route.
export function theme(map) {
  for (const layer of map.getStyle().layers) {
    const { id, type } = layer
    const has = (re) => re.test(id)
    try {
      if (type === 'background') map.setPaintProperty(id, 'background-color', '#e7edf4')
      else if (type === 'fill') {
        if (has(/building/i)) map.setLayoutProperty(id, 'visibility', 'none')
        else if (has(/water/i)) map.setPaintProperty(id, 'fill-color', '#bed2e4')
        else if (has(/wood|forest|grass|park/i)) map.setPaintProperty(id, 'fill-color', '#d8e4db')
        else map.setPaintProperty(id, 'fill-color', '#e1e8f1')
      } else if (type === 'line') {
        if (has(/waterway/i)) map.setPaintProperty(id, 'line-color', '#aec4da')
        else if (has(/casing/i) && !has(/tunnel/i)) {
          map.setPaintProperty(id, 'line-color', CASING_COLOR)
          map.setPaintProperty(id, 'line-width', wider(layer, 1.7, 1.05))
        } else if (has(/^highway_(minor|major|motorway)/i)) {
          map.setPaintProperty(id, 'line-color', ROAD_COLOR)
          map.setPaintProperty(id, 'line-width', wider(layer, 1.45, 1))
        } else if (has(/railway/i)) map.setPaintProperty(id, 'line-color', 'rgba(10,31,54,0.22)')
        else map.setLayoutProperty(id, 'visibility', 'none')
      } else if (type === 'symbol') {
        if (has(/shield|airport|path/i)) map.setLayoutProperty(id, 'visibility', 'none')
        else if (has(/^highway-name-major/i)) {
          // the arteries name themselves in the site's navy
          map.setPaintProperty(id, 'text-color', '#19497c')
          map.setPaintProperty(id, 'text-halo-color', '#ffffff')
          map.setPaintProperty(id, 'text-halo-width', 1.6)
          map.setLayoutProperty(id, 'text-letter-spacing', 0.12)
        } else if (has(/^highway-name/i)) {
          map.setPaintProperty(id, 'text-color', 'rgba(10,31,54,0.55)')
          map.setPaintProperty(id, 'text-halo-color', 'rgba(255,255,255,0.95)')
          map.setPaintProperty(id, 'text-halo-width', 1.4)
        } else {
          // area names in wide-tracked capitals
          map.setLayoutProperty(id, 'text-transform', 'uppercase')
          map.setLayoutProperty(id, 'text-letter-spacing', 0.35)
          map.setPaintProperty(id, 'text-color', has(/water|waterway/i) ? '#5f7f9e' : 'rgba(10,31,54,0.7)')
          map.setPaintProperty(id, 'text-halo-color', 'rgba(238,242,246,0.9)')
          map.setPaintProperty(id, 'text-halo-width', 1.2)
        }
      }
    } catch {
      // a layer without that property: leave it as the base style has it
    }
  }
}
