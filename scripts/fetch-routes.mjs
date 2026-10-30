// Fetches the shortest driving route (by distance) from the project to every pinned place
// and writes src/components/locationRoutes.json. Two public routers are asked — Valhalla
// with its "shortest" option, and OSRM with alternatives — and the shorter route is kept.
// Re-run after moving PROJECT or adding pins:
//   node scripts/fetch-routes.mjs
import { writeFileSync } from 'node:fs'
import { BANDS, PROJECT } from '../src/components/locationData.js'

const OUT = new URL('../src/components/locationRoutes.json', import.meta.url)
const HEADERS = { 'User-Agent': 'jp-location-map/1.0' }
const wait = (ms) => new Promise((r) => setTimeout(r, ms)) // be gentle with the public routers

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

async function valhallaShortest(to) {
  const query = {
    locations: [
      { lon: PROJECT.lngLat[0], lat: PROJECT.lngLat[1] },
      { lon: to[0], lat: to[1] },
    ],
    costing: 'auto',
    costing_options: { auto: { shortest: true } },
    units: 'kilometers',
  }
  const url = `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(query))}`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  const leg = res.trip?.legs?.[0]
  if (!leg) return null
  return { km: res.trip.summary.length, coords: decodePolyline6(leg.shape) }
}

async function osrmShortest(to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${PROJECT.lngLat.join(',')};${to.join(',')}?overview=full&geometries=geojson&alternatives=3`
  const res = await fetch(url, { headers: HEADERS }).then((r) => r.json())
  const route = res.routes?.reduce((best, r) => (!best || r.distance < best.distance ? r : best), null)
  if (!route) return null
  return { km: route.distance / 1000, coords: route.geometry.coordinates }
}

const routes = {}
const used = { valhalla: 0, osrm: 0 }
for (const place of BANDS.flatMap((b) => b.places).filter((p) => p.lngLat)) {
  const found = []
  for (const [name, router] of [
    ['valhalla', valhallaShortest],
    ['osrm', osrmShortest],
  ]) {
    try {
      const r = await router(place.lngLat)
      if (r) found.push({ ...r, name })
    } catch {
      /* that router is unavailable: use the other */
    }
    await wait(400)
  }
  const best = found.reduce((a, r) => (!a || r.km < a.km ? r : a), null)
  if (!best) {
    console.warn('no route:', place.name)
    continue
  }
  used[best.name]++
  routes[place.name] = {
    km: +best.km.toFixed(1),
    coords: best.coords.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]),
  }
  console.log(place.name, routes[place.name].km, 'km', `(${best.name})`)
}

writeFileSync(OUT, JSON.stringify(routes))
console.log('shortest from:', used)
