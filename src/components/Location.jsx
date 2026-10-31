import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BANDS, PROJECT } from './locationData'
import ROUTES from './locationRoutes.json' // driving routes, from scripts/fetch-routes.mjs
import BackButton from './BackButton'
import Logo from './Logo'
import { LOGO_LABEL } from './EndgameLogo'
import endgameLogoUrl from '../assets/logo-endgame.png'

// OpenStreetMap data, served as free vector tiles by OpenFreeMap (no API key); restyled below.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

const HOME_VIEW = { center: PROJECT.lngLat, zoom: 15.3, pitch: 60, bearing: -22 }

const km = ([lng1, lat1], [lng2, lat2]) => {
  const r = Math.PI / 180
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(a))
}

// The part of a route covered at progress t (0..1), measured by distance so the line travels at an even pace.
const routeUpTo = (coords, lengths, t) => {
  const target = lengths[lengths.length - 1] * t
  let i = 1
  while (i < lengths.length - 1 && lengths[i] < target) i++
  const span = lengths[i] - lengths[i - 1] || 1
  const f = Math.min(1, Math.max(0, (target - lengths[i - 1]) / span))
  const [a, b] = [coords[i - 1], coords[i]]
  return [...coords.slice(0, i), [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]]
}

const cumulative = (coords) => coords.reduce((acc, c, i) => [...acc, i ? acc[i - 1] + km(coords[i - 1], c) : 0], [])

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

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
function theme(map) {
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

function addCityAndSite(map) {
  const style = map.getStyle()
  const ref = style.layers.find((l) => l['source-layer'] === 'building')
  const source = ref?.source ?? Object.keys(style.sources).find((s) => style.sources[s].type === 'vector')
  if (!source) return
  const firstLabel = style.layers.find((l) => l.type === 'symbol')?.id

  // pale blue-grey city, deepening slightly with height
  const height = ['coalesce', ['get', 'render_height'], ['get', 'height'], 14]
  map.addLayer(
    {
      id: 'jp-buildings',
      type: 'fill-extrusion',
      source,
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], height, 0, '#dde5ef', 30, '#c9d6e4', 90, '#b2c4d7'],
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, height],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    firstLabel,
  )

  // the project's site: a soft pool of brand red on the ground under the logo marker
  map.addSource('jp-project', { type: 'geojson', data: pointData(PROJECT.lngLat) })
  map.addLayer({
    id: 'jp-project-pool',
    type: 'circle',
    source: 'jp-project',
    paint: {
      'circle-color': '#ee3134',
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 12, 10, 17, 160],
      'circle-blur': 1,
      'circle-opacity': 0.28,
      'circle-pitch-alignment': 'map',
    },
  })

  map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.32, position: [1.3, 210, 40] })
}

const EMPTY = { type: 'FeatureCollection', features: [] }

// The connecting route: a navy-to-red line from the project's logo marker on a white
// casing with a soft red glow, led by a navy head.
function addRoute(map) {
  map.addSource('jp-route', { type: 'geojson', data: EMPTY, lineMetrics: true })
  map.addSource('jp-route-head', { type: 'geojson', data: EMPTY })
  const line = { type: 'line', source: 'jp-route', layout: { 'line-cap': 'round', 'line-join': 'round' } }
  map.addLayer({ ...line, id: 'jp-route-bloom', paint: { 'line-color': '#ee3134', 'line-width': 22, 'line-blur': 16, 'line-opacity': 0.25 } })
  map.addLayer({ ...line, id: 'jp-route-glow', paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.95 } })
  map.addLayer({
    ...line,
    id: 'jp-route',
    paint: {
      'line-width': 3.5,
      'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#19497c', 1, '#ee3134'],
    },
  })
  map.addLayer({
    id: 'jp-route-head-glow',
    type: 'circle',
    source: 'jp-route-head',
    paint: { 'circle-color': '#ee3134', 'circle-radius': 18, 'circle-blur': 1, 'circle-opacity': 0.5 },
  })
  map.addLayer({
    id: 'jp-route-head',
    type: 'circle',
    source: 'jp-route-head',
    paint: { 'circle-color': '#0a1f36', 'circle-radius': 5, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 },
  })
}

// While a route is shown, the rest of the road network steps back so the drive reads clearly.
function focusRoads(map, focused) {
  for (const layer of map.getStyle().layers) {
    if (layer['source-layer'] !== 'transportation' || layer.type !== 'line' || layer.layout?.visibility === 'none') continue
    map.setPaintProperty(layer.id, 'line-opacity-transition', { duration: 800 })
    map.setPaintProperty(layer.id, 'line-opacity', focused ? 0.45 : 1)
  }
}

const lineData = (coords) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } })
const pointData = (coord) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coord } })

// The project, marked by its own Codename Endgame logo (black, no plate), pointing down
// to the site with rings pulsing out from that point (where every route starts).
function projectMarker() {
  const el = document.createElement('div')
  el.className = 'jp-loc-project'
  el.innerHTML =
    '<span class="jp-loc-project-badge"><span class="jp-logo jp-loc-project-logo"></span></span>' +
    '<span class="jp-loc-project-stem"></span>' +
    '<span class="jp-loc-pulse jp-loc-project-pulse"><i></i><i></i></span>'
  const logo = el.querySelector('.jp-loc-project-logo')
  logo.style.setProperty('--jp-logo', `url("${endgameLogoUrl}")`)
  logo.setAttribute('role', 'img')
  logo.setAttribute('aria-label', LOGO_LABEL)
  return el
}

function placeMarker(name, onPick) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'jp-loc-poi'
  el.setAttribute('aria-label', name)
  el.innerHTML = `<span class="jp-loc-poi-dot"></span><span class="jp-loc-poi-label"></span>`
  el.lastChild.textContent = name
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onPick()
  })
  return el
}

// hover fill for the camera controls, as on the site's other icon buttons
const CTRL_FILL = { '--btn-fill-color': 'rgba(255,255,255,0.14)' }

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isWide = () => window.matchMedia('(min-width: 1024px)').matches
// keep the subject clear of the highlights panel
const viewPadding = () => (isWide() ? { top: 80, bottom: 60, left: 480, right: 80 } : { top: 80, bottom: 330, left: 30, right: 30 })

export default function Location({ label, active, onBack }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const orbitRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [bandId, setBandId] = useState(BANDS[0].id)
  const [picked, setPicked] = useState(null)
  const [is3d, setIs3d] = useState(true)
  const band = BANDS.find((b) => b.id === bandId)

  // Map setup, once
  useEffect(() => {
    if (!containerRef.current) return undefined
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: PROJECT.lngLat,
      zoom: 11,
      pitch: 0,
      bearing: 0,
      maxPitch: 75,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
    })
    mapRef.current = map

    map.on('load', () => {
      theme(map)
      addCityAndSite(map)
      addRoute(map)
      try {
        map.setSky({
          'sky-color': '#eef2f6',
          'horizon-color': '#f4f7fa',
          'fog-color': '#eef2f6',
          'sky-horizon-blend': 0.6,
          'horizon-fog-blend': 0.5,
          'fog-ground-blend': 0.5,
          'atmosphere-blend': 0,
        })
      } catch {
        // older renderer without sky: the vignette overlay carries the depth instead
      }
      new maplibregl.Marker({ element: projectMarker(), anchor: 'bottom' }).setLngLat(PROJECT.lngLat).addTo(map)
      setReady(true)
    })

    // Any hands-on interaction stops the slow orbit.
    const stopOrbit = () => {
      orbitRef.current = false
    }
    map.on('mousedown', stopOrbit)
    map.on('touchstart', stopOrbit)
    map.on('wheel', stopOrbit)

    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = now - last
      last = now
      if (orbitRef.current && !map.isMoving()) map.setBearing(map.getBearing() + dt * 0.003)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [])

  const flyHome = (opts = {}) => {
    const map = mapRef.current
    if (!map) return
    const reduce = reduceMotion()
    orbitRef.current = false
    map[reduce ? 'jumpTo' : 'flyTo']({ ...HOME_VIEW, padding: viewPadding(), duration: 4200, curve: 1.6, essential: true, ...opts })
    if (!reduce) map.once('moveend', () => (orbitRef.current = true))
  }

  // Cinematic arrival every time the page opens
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (!active) {
      orbitRef.current = false
      return
    }
    map.resize()
    map.jumpTo({ center: PROJECT.lngLat, zoom: 11, pitch: 0, bearing: 30 })
    const t = setTimeout(() => {
      setPicked(null)
      setIs3d(true)
      flyHome()
    }, 700)
    return () => clearTimeout(t)
  }, [active, ready])

  // Pins for the selected band
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return undefined
    markersRef.current = band.places.map((place) =>
      place.lngLat
        ? new maplibregl.Marker({ element: placeMarker(place.name, () => setPicked((p) => (p === place.name ? null : place.name))), anchor: 'bottom' })
            .setLngLat(place.lngLat)
            .addTo(map)
        : null,
    )
    return () => {
      for (const m of markersRef.current) m?.remove()
      markersRef.current = []
    }
  }, [band, ready])

  // Picking a place frames the drive there, then draws the route along the roads from the tower;
  // the place's pin pulses while the line travels and lights up when it arrives.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return undefined
    const route = map.getSource('jp-route')
    const head = map.getSource('jp-route-head')
    route?.setData(EMPTY)
    head?.setData(EMPTY)
    const index = band.places.findIndex((p) => p.name === picked && p.lngLat)
    // with nothing picked, every place in the chosen time band is lit; picking one narrows to it
    markersRef.current.forEach((m, i) => {
      const el = m?.getElement()
      if (!el) return
      el.classList.remove('is-active', 'is-connecting', 'is-arrived')
      el.style.setProperty('--lit-delay', `${i * 35}ms`)
      el.classList.toggle('is-lit', index < 0)
    })
    focusRoads(map, index >= 0)
    if (index < 0) return undefined

    const place = band.places[index]
    const pin = markersRef.current[index]?.getElement()
    pin?.classList.add('is-active', 'is-connecting')
    const coords = [PROJECT.lngLat, ...(ROUTES[place.name]?.coords ?? []), place.lngLat]
    const lengths = cumulative(coords)

    orbitRef.current = false
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(PROJECT.lngLat, PROJECT.lngLat))
    const reduce = reduceMotion()
    map.fitBounds(bounds, {
      padding: { ...viewPadding(), top: 160, bottom: viewPadding().bottom + 60 },
      pitch: 55,
      bearing: map.getBearing(),
      duration: reduce ? 0 : 2200,
      maxZoom: 16,
    })

    const arrive = () => {
      route?.setData(lineData(coords))
      head?.setData(EMPTY)
      pin?.classList.replace('is-connecting', 'is-arrived')
    }
    if (reduce) {
      arrive()
      return undefined
    }

    // pace the draw by distance: short hops are quick, longer drives take their time
    const duration = Math.min(4200, 1600 + lengths[lengths.length - 1] * 550)
    let raf = 0
    let start = 0
    const draw = (now) => {
      start ||= now
      const t = Math.min(1, (now - start) / duration)
      if (t >= 1) return arrive()
      const part = routeUpTo(coords, lengths, easeInOut(t))
      route?.setData(lineData(part))
      head?.setData(pointData(part[part.length - 1]))
      raf = requestAnimationFrame(draw)
    }
    const delay = setTimeout(() => (raf = requestAnimationFrame(draw)), 700)
    return () => {
      clearTimeout(delay)
      cancelAnimationFrame(raf)
    }
  }, [picked, band, ready])

  const pickBand = (id) => {
    if (id === bandId) return
    setBandId(id)
    setPicked(null)
    const map = mapRef.current
    const pinned = BANDS.find((b) => b.id === id).places.filter((p) => p.lngLat)
    if (!map || !pinned.length) return
    orbitRef.current = false
    const bounds = pinned.reduce((b, p) => b.extend(p.lngLat), new maplibregl.LngLatBounds(PROJECT.lngLat, PROJECT.lngLat))
    map.fitBounds(bounds, { padding: viewPadding(), pitch: 55, bearing: map.getBearing(), duration: reduceMotion() ? 0 : 2200, maxZoom: 15.3 })
  }

  const toggle3d = () => {
    const map = mapRef.current
    if (!map) return
    orbitRef.current = false
    map.easeTo({ pitch: is3d ? 0 : 60, bearing: is3d ? 0 : map.getBearing() || -22, duration: reduceMotion() ? 0 : 1400 })
    setIs3d(!is3d)
  }

  const zoom = (by) => mapRef.current?.easeTo({ zoom: mapRef.current.getZoom() + by, duration: 500 })

  return (
    <section className="jp-loc relative h-svh w-full overflow-hidden bg-[#eef2f6]" aria-label={label}>
      <div
        ref={containerRef}
        className={`jp-loc-map absolute inset-0 transition-opacity duration-[1600ms] ${ready ? 'opacity-100' : 'opacity-0'}`}
        role="region"
        aria-label="Map of the project and its surroundings"
      />
      <div className="jp-loc-vignette pointer-events-none absolute inset-0" />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-navy-950/70 3xl:text-xs"
            style={{ animation: 'jp-breathe 1.6s ease-in-out infinite' }}
          >
            Charting the neighbourhood
          </span>
        </div>
      )}

      {/* Top bar: back + page name, logo — the same chrome as the site's other pages */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[clamp(16px,4vw,56px)] pt-[clamp(16px,4svh,40px)]">
        <div className="pointer-events-auto flex items-center gap-3">
          {/* solid navy: the default 40% glass reads grey over the light map */}
          <BackButton onClick={onBack} className="bg-navy-950/85! shadow-card" />
          <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-navy-950/70 sm:flex 3xl:text-xs 4xl:text-sm">
            <span className="h-px w-6 bg-navy-950/40" />
            Location
          </span>
        </div>
        <div className="pointer-events-auto rounded-lg bg-navy-700 p-1.5 shadow-card 3xl:p-2">
          <Logo className="h-9 w-auto sm:h-10 2xl:h-11 3xl:h-12 4xl:h-14" />
        </div>
      </div>

      {/* Location highlights */}
      <aside className="jp-loc-panel" aria-label="Location highlights">
        <h2 className="jp-loc-panel-title">
          Location <span className="text-red-600">Highlights</span>
        </h2>
        <span className="jp-loc-panel-rule" aria-hidden="true" />

        <div className="jp-loc-tabs" role="tablist" aria-label="Travel time">
          {BANDS.map((b) => (
            <button key={b.id} type="button" role="tab" aria-selected={b.id === bandId} className="jp-loc-tab" onClick={() => pickBand(b.id)}>
              {b.label}
            </button>
          ))}
        </div>

        <ol className="jp-loc-list jp-no-scrollbar" key={bandId}>
          {band.places.map((place, i) => (
            <li key={place.name}>
              <button
                type="button"
                className="jp-loc-item"
                aria-pressed={picked === place.name}
                disabled={!place.lngLat}
                onClick={() => setPicked((p) => (p === place.name ? null : place.name))}
              >
                <span className="jp-loc-item-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="jp-loc-item-name">{place.name}</span>
                <span className="jp-loc-item-km">{place.lngLat ? `${(ROUTES[place.name]?.km ?? km(PROJECT.lngLat, place.lngLat)).toFixed(1)} km` : ''}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      {/* Camera controls */}
      {/* Camera controls — the site's round glass buttons with the rising .btn-fill hover */}
      <div className="jp-loc-controls">
        <div className="jp-loc-ctrl-group">
          <button type="button" className="btn-fill jp-loc-ctrl" style={CTRL_FILL} onClick={() => zoom(1)} aria-label="Zoom in">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <span className="jp-loc-ctrl-rule" />
          <button type="button" className="btn-fill jp-loc-ctrl" style={CTRL_FILL} onClick={() => zoom(-1)} aria-label="Zoom out">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <button type="button" className="btn-fill jp-loc-ctrl" style={CTRL_FILL} onClick={toggle3d} aria-pressed={is3d} aria-label="Toggle 3D view">
          <span className="jp-loc-ctrl-text">{is3d ? '2D' : '3D'}</span>
        </button>
        <button
          type="button"
          className="btn-fill jp-loc-ctrl"
          style={CTRL_FILL}
          onClick={() => {
            setPicked(null)
            setIs3d(true)
            flyHome({ duration: 2600 })
          }}
          aria-label="Return to the project"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="2.2" fill="currentColor" />
            <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.1" />
            <path d="M8 0.8v2M8 13.2v2M0.8 8h2M13.2 8h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </section>
  )
}
