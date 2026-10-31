// Fetches the shortest driving route (by distance) from the project to every pinned place
// and writes src/components/locationRoutes.json. Re-run after moving PROJECT or adding pins:
//   node scripts/fetch-routes.mjs
//
// The site's own point can snap to a road that only leads one way, so routes are asked from
// the site and from points 150 m round it, in every direction, and the shortest wins. Each
// route is then cut where it first reaches the destination, so the line stops at the pin and
// never runs past it and turns back.
// Give place names as arguments to refresh only those routes (the rest of the file is kept).
import { readFileSync, writeFileSync } from 'node:fs'
import { BANDS, PROJECT } from '../src/components/locationData.js'

const OUT = new URL('../src/components/locationRoutes.json', import.meta.url)
const HEADERS = { 'User-Agent': 'jp-location-map/1.0' }
const wait = (ms) => new Promise((r) => setTimeout(r, ms)) // be gentle with the public routers

const COS = Math.cos((PROJECT.lngLat[1] * Math.PI) / 180)
const metres = ([x1, y1], [x2, y2]) => Math.hypot((x2 - x1) * 111320 * COS, (y2 - y1) * 111320)

// the site itself, then 150 m north / east / south / west of it
const STARTS = [[0, 0], [0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => [
  PROJECT.lngLat[0] + (dx * 150) / (111320 * COS),
  PROJECT.lngLat[1] + (dy * 150) / 111320,
])

// Valhalla returns its path as an encoded polyline with 6-digit precision
function decodePolyline6(str) {
  const coords = []
  let i = 0
  let lat = 0
  let lng = 0
  while (i < str.length) {
    for (const axis of [0, 1]) {
      let shift = 0
      let result = 0
      let byte
      do {
        byte = str.charCodeAt(i++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta
      else lng += delta
    }
    coords.push([lng / 1e6, lat / 1e6])
  }
  return coords
}

async function valhallaShortest(from, to) {
  const query = {
    locations: [
      { lon: from[0], lat: from[1] },
      { lon: to[0], lat: to[1] },
    ],
    costing: 'auto',
    costing_options: { auto: { shortest: true } },
  }
  const url = `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(query))}`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  const leg = res.trip?.legs?.[0]
  return leg ? [decodePolyline6(leg.shape)] : []
}

async function osrmAll(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson&alternatives=3`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  return (res.routes ?? []).map((r) => r.geometry.coordinates)
}

// Places where OpenStreetMap's car data blocks a short link that exists in reality (the car
// routers send the line a long way round): these follow the bike router's short road instead.
const BIKE = new Set(['Western Express Highway', 'Surya Legacy', 'Hotel Western', "Dara's Dhaba", 'Royal Hometel Suites', 'Ghodbunder Road'])

async function bikeAll(from, to) {
  const url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  return (res.routes ?? []).map((r) => r.geometry.coordinates)
}

// Cut a route where it first gets as close to the destination as it ever does, so it
// ends at the pin; then measure the walk from the site in and from the road out to the pin.
function finish(coords, from, to) {
  const d = coords.map((c) => metres(c, to))
  const closest = Math.min(...d)
  const end = d.findIndex((x) => x <= closest + 20)
  const kept = coords.slice(0, end + 1)
  let len = metres(PROJECT.lngLat, from) + metres(from, kept[0]) + closest
  for (let i = 1; i < kept.length; i++) len += metres(kept[i - 1], kept[i])
  return { km: len / 1000, coords: kept }
}

const only = process.argv.slice(2)
const routes = only.length ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
for (const place of BANDS.flatMap((b) => b.places).filter((p) => p.lngLat && (!only.length || only.includes(p.name)))) {
  const found = []
  for (const from of BIKE.has(place.name) ? [STARTS[0]] : STARTS) {
    const routers = BIKE.has(place.name) ? [bikeAll] : [osrmAll, ...(from === STARTS[0] ? [valhallaShortest] : [])]
    for (const router of routers) {
      try {
        for (const coords of await router(from, place.lngLat)) found.push(finish(coords, from, place.lngLat))
      } catch {
        /* that router is unavailable: the others still answer */
      }
      await wait(250)
    }
  }
  const best = found.reduce((a, r) => (!a || r.km < a.km ? r : a), null)
  if (!best) {
    console.warn('no route:', place.name)
    continue
  }
  routes[place.name] = {
    km: +best.km.toFixed(1),
    coords: best.coords.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]),
  }
  console.log(place.name, routes[place.name].km, 'km')
}

writeFileSync(OUT, JSON.stringify(routes))
console.log('done:', Object.keys(routes).length, 'routes')
