import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, theme } from "./mapTheme";
import { PROJECTS, STATUS } from "../data/projects";

// About Us → Our Legacy: every JP Infra project as a pin on the Mumbai map, in the
// Location page's map style. Red pins are ongoing, navy pins delivered; pins close together
// gather into a numbered circle that opens up on a click. A pin shows its project's card.

const COLOR = { ongoing: "#ee3134", delivered: "#19497c" };
// pins gather into numbered circles up to this zoom; from the next whole zoom level up,
// every project has its own pin
const CLUSTER_MAX_ZOOM = 13;
const CLUSTER_RADIUS = 36;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "ongoing", label: STATUS.ongoing.label },
  { id: "delivered", label: STATUS.delivered.label },
];
const pad = (n) => String(n).padStart(2, "0");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const features = (filter) => ({
  type: "FeatureCollection",
  features: PROJECTS.filter((p) => filter === "all" || p.status === filter).map((p) => ({
    type: "Feature",
    properties: { id: p.id, name: p.name, status: p.status },
    geometry: { type: "Point", coordinates: p.lngLat },
  })),
});

// keep the pins clear of the cards over the map: set on the map itself (map.setPadding),
// so every move honours it — MapLibre adds a move's own padding on top of the map's
const padding = () => {
  const { innerWidth: w, innerHeight: h } = window;
  if (h <= 500) return { top: 80, bottom: 40, left: Math.min(300, w * 0.45), right: 40 };
  if (w >= 1024) return { top: 140, bottom: 100, left: 470, right: 90 };
  return { top: 360, bottom: 150, left: 40, right: 40 };
};

const fitAll = (map, list, animate) => {
  const bounds = list.reduce((b, p) => b.extend(p.lngLat), new maplibregl.LngLatBounds(list[0].lngLat, list[0].lngLat));
  map.fitBounds(bounds, { padding: 24, maxZoom: 13, duration: animate && !reduceMotion() ? 1400 : 0 });
};

// The markers' glow breathes slowly: [radius, opacity] at rest and at full breath
const GLOW = { point: [17, 0.55, 28, 0.95], cluster: [28, 0.5, 42, 0.85], seconds: 2.6 };
function breathe(map, t) {
  const k = (1 - Math.cos((t / GLOW.seconds) * 2 * Math.PI)) / 2; // 0 → 1 → 0
  const at = ([r0, o0, r1, o1]) => [r0 + (r1 - r0) * k, o0 + (o1 - o0) * k];
  const [pr, po] = at(GLOW.point);
  const [cr, co] = at(GLOW.cluster);
  map.setPaintProperty("jp-proj-glow", "circle-radius", pr);
  map.setPaintProperty("jp-proj-glow", "circle-opacity", po);
  map.setPaintProperty("jp-proj-cluster-glow", "circle-radius", cr);
  map.setPaintProperty("jp-proj-cluster-glow", "circle-opacity", co);
}

function addProjects(map) {
  map.addSource("jp-projects", { type: "geojson", data: features("all"), cluster: true, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM });
  const cluster = ["has", "point_count"];
  // a soft glow under every marker, in its own colour (breathing: see GLOW above)
  map.addLayer({
    id: "jp-proj-cluster-glow",
    type: "circle",
    source: "jp-projects",
    filter: cluster,
    paint: { "circle-color": "#19497c", "circle-radius": 30, "circle-blur": 0.7, "circle-opacity": 0.55 },
  });
  map.addLayer({
    id: "jp-proj-glow",
    type: "circle",
    source: "jp-projects",
    filter: ["!", cluster],
    paint: {
      "circle-color": ["match", ["get", "status"], "ongoing", COLOR.ongoing, COLOR.delivered],
      "circle-radius": 18,
      "circle-blur": 1,
      "circle-opacity": 0.6,
    },
  });
  map.addLayer({
    id: "jp-proj-cluster",
    type: "circle",
    source: "jp-projects",
    filter: cluster,
    paint: {
      "circle-color": "#0a1f36",
      "circle-radius": ["step", ["get", "point_count"], 15, 5, 19, 10, 23],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 3,
    },
  });
  map.addLayer({
    id: "jp-proj-cluster-count",
    type: "symbol",
    source: "jp-projects",
    filter: cluster,
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: "jp-proj-picked",
    type: "circle",
    source: "jp-projects",
    filter: ["==", ["get", "id"], ""],
    paint: { "circle-color": "rgba(238,49,52,0.22)", "circle-radius": 18, "circle-stroke-color": "#ee3134", "circle-stroke-width": 1.5 },
  });
  map.addLayer({
    id: "jp-proj-point",
    type: "circle",
    source: "jp-projects",
    filter: ["!", cluster],
    paint: {
      "circle-color": ["match", ["get", "status"], "ongoing", COLOR.ongoing, COLOR.delivered],
      "circle-radius": 7.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.5,
    },
  });
  map.addLayer({
    id: "jp-proj-label",
    type: "symbol",
    source: "jp-projects",
    filter: ["!", cluster],
    layout: {
      "text-field": ["upcase", ["get", "name"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": 10.5,
      "text-letter-spacing": 0.08,
      "text-anchor": "top",
      "text-offset": [0, 1.1],
      "text-optional": true,
    },
    paint: { "text-color": "#0a1f36", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
  });
}

export default function LegacyMap({ eyebrow, initialPick = null, onOpenProjects }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [picked, setPicked] = useState(initialPick);
  const project = PROJECTS.find((p) => p.id === picked);

  // Map setup, once
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [72.87, 19.15],
      zoom: 10,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    let glowFrame = 0;

    map.setPadding(padding());
    map.on("load", () => {
      theme(map);
      addProjects(map);
      fitAll(map, PROJECTS, false);
      setReady(true);
      if (!reduceMotion()) {
        const tick = (now) => {
          breathe(map, now / 1000);
          glowFrame = requestAnimationFrame(tick);
        };
        glowFrame = requestAnimationFrame(tick);
      }
    });
    // A numbered circle opens straight onto all its projects, each on its own pin: the view
    // fits them all and the pins stop gathering (on a phone a wide group can't spread far
    // enough apart to separate by zoom alone). Zooming back out gathers them again.
    const source = () => map.getSource("jp-projects");
    let openedAt = null; // the zoom an opened group was shown at
    map.on("click", "jp-proj-cluster", async (e) => {
      const leaves = await source().getClusterLeaves(e.features[0].properties.cluster_id, Infinity, 0);
      const coords = leaves.map((l) => l.geometry.coordinates);
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      const camera = map.cameraForBounds(bounds, { padding: 40 });
      if (!camera) return;
      source().setClusterOptions({ cluster: false });
      openedAt = camera.zoom;
      map.easeTo({ ...camera, duration: reduceMotion() ? 0 : 1100 });
    });
    map.on("zoomend", () => {
      if (openedAt === null || map.getZoom() >= openedAt - 0.5) return;
      openedAt = null;
      source().setClusterOptions({ cluster: true, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM });
    });
    map.on("click", "jp-proj-point", (e) => setPicked(e.features[0].properties.id));
    for (const id of ["jp-proj-cluster", "jp-proj-point"]) {
      map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
    }
    const onResize = () => {
      map.resize();
      map.setPadding(padding());
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(glowFrame);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Ongoing / Delivered / All
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource("jp-projects").setData(features(filter));
  }, [filter, ready]);

  // The picked project: ringed, and brought into view close enough to stand on its own
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setFilter("jp-proj-picked", ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], picked ?? ""]]);
    const p = PROJECTS.find((x) => x.id === picked);
    if (p) map.flyTo({ center: p.lngLat, zoom: Math.max(map.getZoom(), 15.2), duration: reduceMotion() ? 0 : 1600, essential: true });
  }, [picked, ready]);

  const choose = (f) => {
    setFilter(f);
    if (project && f !== "all" && project.status !== f) setPicked(null);
    const map = mapRef.current;
    if (map && ready) fitAll(map, PROJECTS.filter((p) => f === "all" || p.status === f), true);
  };

  const count = (s) => PROJECTS.filter((p) => p.status === s).length;

  return (
    <div className="absolute inset-0 z-[5] bg-[#e7edf4]">
      {/* positioned by this wrapper: MapLibre's stylesheet makes the map box itself relative */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
        <div ref={containerRef} className="jp-loc-map jp-legacy-map h-full w-full" />
      </div>
      <div className="jp-loc-vignette pointer-events-none absolute inset-0" />

      {/* The cards: one column down the left on wide screens; on phones the title sits at
          the top and the picked project at the bottom */}
      <div className="max-lg:contents lg:absolute lg:bottom-[clamp(64px,8vh,96px)] lg:left-10 lg:top-[clamp(104px,12vh,140px)] lg:z-10 lg:flex lg:w-[25rem] lg:flex-col lg:gap-3 3xl:left-14">
      {/* Title, the numbers, and the filter */}
      <div className="jp-caption-in absolute inset-x-4 top-[84px] z-10 shrink-0 rounded-2xl border border-white/15 bg-navy-950/80 p-4 text-white shadow-premium backdrop-blur-xl sm:inset-x-10 sm:top-[100px] sm:p-5 lg:static lg:p-6 short:inset-x-auto short:left-4 short:top-[84px] short:w-[min(18rem,44%)] short:p-3">
        <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-[11px] short:hidden">
          {eyebrow}
        </span>
        <h2 className="mt-2 font-display text-3xl uppercase leading-none sm:text-4xl lg:text-[clamp(2.4rem,5vh,3.6rem)] short:mt-0 short:text-xl">
          Our <span className="text-red-600">Legacy</span>
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-y border-white/10 py-3 lg:mt-4 short:hidden">
          {[
            [pad(count("delivered")), "Delivered"],
            [pad(count("ongoing")), "Ongoing"],
            ["2006", "Since"],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-3xl leading-none lg:text-4xl">{n}</dd>
              <dd className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{label}</dd>
            </div>
          ))}
        </dl>
        <div role="radiogroup" aria-label="Show projects" className="mt-3 flex rounded-full border border-white/20 p-1 lg:mt-4 short:mt-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => choose(f.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors sm:text-[11px] short:py-1 ${
                filter === f.id ? "bg-white text-navy-950" : "text-white/70 hover:text-white"
              }`}
            >
              {f.id !== "all" && (
                <span className="h-2 w-2 rounded-full ring-1 ring-white" style={{ background: COLOR[f.id] }} />
              )}
              {f.label}
            </button>
          ))}
        </div>
        {/* over to Our Projects, every project's photos */}
        <button
          type="button"
          onClick={onOpenProjects}
          className="group mt-3 flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white sm:text-[11px] lg:mt-4 short:mt-2"
        >
          See all projects
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* The picked project */}
      {project && (
        <div
          key={project.id}
          className="jp-caption-in absolute inset-x-4 bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-navy-950/85 p-2.5 text-white shadow-premium backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:right-10 sm:w-[24rem] lg:relative lg:inset-auto lg:min-h-0 lg:w-auto lg:flex-col lg:items-stretch lg:p-3 short:inset-x-auto short:right-4 short:bottom-4 short:w-[min(20rem,48%)]"
        >
          <img
            src={project.image}
            alt={`${project.name}, ${project.area}`}
            decoding="async"
            className="h-20 w-20 shrink-0 rounded-xl object-cover lg:h-[clamp(8rem,24vh,15rem)] lg:min-h-0 lg:w-full short:h-14 short:w-14"
          />
          <div className="min-w-0 flex-1 lg:flex-none lg:px-1 lg:pb-1">
            <div className="min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <span className="h-2 w-2 rounded-full ring-1 ring-white" style={{ background: COLOR[project.status] }} />
                {STATUS[project.status].label}
              </span>
              <p className="mt-1 truncate font-display text-2xl uppercase leading-none lg:text-3xl short:text-lg">{project.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">{project.area}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPicked(null)}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:absolute lg:right-5 lg:top-5 lg:bg-navy-950/60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
