// Fetches the driving route from the project to every pinned place and writes
// src/components/locationRoutes.json: along the Western Express Highway wherever that's
// barely longer than the shortest road (see pick() below), otherwise the shortest road.
// Re-run after moving PROJECT or adding pins:
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
  return leg ? [{ coords: decodePolyline6(leg.shape), highwayKm: 0 }] : []
}

// how much of a route runs on the Western Express Highway (NH 48), in km
const highwayKm = (steps) =>
  steps.filter((s) => /western express|NH ?48/i.test(`${s.name} ${s.ref ?? ''}`)).reduce((a, s) => a + s.distance, 0) / 1000

async function osrmAll(from, to, via) {
  const points = (via ? [from, via, to] : [from, to]).map((p) => p.join(',')).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=true&alternatives=3`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  return (res.routes ?? []).map((r) => ({
    coords: r.geometry.coordinates,
    highwayKm: highwayKm(r.legs.flatMap((l) => l.steps)),
  }))
}

// Places where OpenStreetMap's car data blocks a short link that exists in reality (the car
// routers send the line a long way round): these follow the bike router's short road instead.
const BIKE = new Set(['Western Express Highway', 'Hotel Western', "Dara's Dhaba", 'Royal Hometel Suites'])

// Places where the shortest road is a chain of back lanes nobody actually drives: these keep
// the car router's main-road drive from the site, the way a phone's navigation gives it.
const MAIN_ROADS = new Set(['Nakoda Hospital', 'Samartha Hospital'])

// Places the drive should reach by the Western Express Highway even though a shorter run of
// back roads exists — the length rule in pick() below would never choose it. The route is
// asked through the given point on the highway itself, so it joins and leaves it there.
const VIA = { 'D-Mart (Mira Road)': [72.876356, 19.266392] }

// Places the line should stop at as the drive passes them, in metres (see finish() below).
const STOP_SHORT = { 'D-Mart (Mira Road)': 200 }

async function bikeAll(from, to) {
  const url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  return (res.routes ?? []).map((r) => ({ coords: r.geometry.coordinates, highwayKm: 0 }))
}

// Cut a route where it first gets as close to the destination as it ever does, so it
// ends at the pin; then measure the walk from the site in and from the road out to the pin.
// A place in STOP_SHORT is cut as soon as the drive comes within its distance instead, so a
// store passed on the highway ends there rather than looping off and back to its entrance.
function finish(coords, from, to, stopShort = 0) {
  const d = coords.map((c) => metres(c, to))
  const reach = stopShort && d.some((x) => x <= stopShort) ? stopShort : Math.min(...d) + 20
  const end = d.findIndex((x) => x <= reach)
  const kept = coords.slice(0, end + 1)
  let len = metres(PROJECT.lngLat, from) + metres(from, kept[0]) + d[end]
  for (let i = 1; i < kept.length; i++) len += metres(kept[i - 1], kept[i])
  return { km: len / 1000, coords: kept }
}

// The drive takes the Western Express Highway (at least 1 km of it) when that route is no
// more than a little longer than the shortest road — 400 m or a fifth, whichever is more —
// so drives south and out of town follow the highway, while places close by keep their
// direct road and never detour.
const shortestOf = (list) => list.reduce((a, r) => (!a || r.km < a.km ? r : a), null)
function pick(found) {
  const shortest = shortestOf(found)
  const highway = shortestOf(found.filter((r) => r.highwayKm >= 1))
  return highway && highway.km <= shortest.km + Math.max(0.4, shortest.km * 0.2) ? highway : shortest
}

// Places whose lines are drawn by hand in locationRoutes.json and must survive a re-run.
// The lanes around the site aren't in OpenStreetMap, so every router leaves the wrong way
// and loops back — 1.2 km of driving for a 260 m walk. Their routes are kept as they are.
const HAND_DRAWN = new Set([
  // these two sit in the lanes beside the site, which OpenStreetMap doesn't have: every
  // router stops on the main road ~80 m short of the pin
  'Euro Kids (Vinay Nagar)',
  'Bhaktivedanta Wellness Centre',
])

const only = process.argv.slice(2)
// a full run starts from scratch, but the hand-drawn lines are carried over from the file
const saved = JSON.parse(readFileSync(OUT, 'utf8'))
const routes = only.length ? saved : Object.fromEntries([...HAND_DRAWN].filter((n) => saved[n]).map((n) => [n, saved[n]]))
for (const place of BANDS.flatMap((b) => b.places).filter((p) => p.lngLat && (!only.length || only.includes(p.name)))) {
  if (HAND_DRAWN.has(place.name)) {
    console.log(place.name, '— kept, drawn by hand')
    continue
  }
  const found = []
  const via = VIA[place.name]
  // only the bike router is tied to the site itself; the rest still try the ring of starts,
  // or the line leaves the site the wrong way and U-turns to come back past it
  for (const from of BIKE.has(place.name) ? [STARTS[0]] : STARTS) {
    const routers = BIKE.has(place.name)
      ? [bikeAll]
      : MAIN_ROADS.has(place.name) || via
        ? [osrmAll]
        : [osrmAll, ...(from === STARTS[0] ? [valhallaShortest] : [])]
    for (const router of routers) {
      try {
        for (const r of await router(from, place.lngLat, via)) found.push({ ...finish(r.coords, from, place.lngLat, STOP_SHORT[place.name]), highwayKm: r.highwayKm })
      } catch {
        /* that router is unavailable: the others still answer */
      }
      await wait(250)
    }
  }
  const best = pick(found)
  if (!best) {
    console.warn('no route:', place.name)
    continue
  }
  routes[place.name] = {
    km: +best.km.toFixed(1),
    coords: best.coords.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]),
  }
  console.log(place.name, routes[place.name].km, 'km', best.highwayKm >= 1 ? `(highway ${best.highwayKm.toFixed(1)} km)` : '')
}

writeFileSync(OUT, JSON.stringify(routes))
console.log('done:', Object.keys(routes).length, 'routes')
