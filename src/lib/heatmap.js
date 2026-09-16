// Lightweight heatmap telemetry: click coordinates and max scroll depth,
// batched and sent straight to Supabase's REST API with the anon key
// (RLS on heatmap_events allows anon insert only — no read/update/delete).
// No @supabase/supabase-js dependency needed for this — it's one small
// POST, so a plain fetch keeps the bundle and the diff small.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const INSERT_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/rest/v1/heatmap_events`
  : null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Heatmap tracking disabled: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY " +
      "are missing from the build. Set them in the deployment environment " +
      "(or a committed .env) and rebuild — until then, every click/scroll " +
      "event is silently dropped instead of reaching heatmap_events."
  );
}

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

let currentPage = "home";
let sessionId = null;
let queue = [];
let maxScrollDepth = 0;
let listenersAttached = false;
let scrollTicking = false;

function getSessionId() {
  if (sessionId) return sessionId;

  try {
    const stored = sessionStorage.getItem("jp_heatmap_session");
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall through.
  }

  sessionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    sessionStorage.setItem("jp_heatmap_session", sessionId);
  } catch {
    // ignore — the id just won't persist across reloads in this tab
  }

  return sessionId;
}

function getDeviceType() {
  const width = window.innerWidth;
  if (width < MOBILE_BREAKPOINT) return "mobile";
  if (width < TABLET_BREAKPOINT) return "tablet";
  return "desktop";
}

async function sendBatch(rows) {
  if (rows.length === 0) return;

  if (!INSERT_URL || !SUPABASE_ANON_KEY) {
    // Already logged once at module load — repeat per-batch so it's
    // impossible to miss while watching the console during testing.
    console.error(
      `Heatmap: dropped ${rows.length} event(s) — Supabase URL/key not configured.`
    );
    return;
  }

  try {
    const response = await fetch(INSERT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
      keepalive: true,
    });

    if (!response.ok) {
      // fetch() only rejects on a network-level failure — a rejected
      // insert (bad RLS policy, a CHECK constraint violation, a schema
      // mismatch) comes back as a normal resolved response with a 4xx/5xx
      // status, which the old version of this function never inspected.
      const bodyText = await response.text().catch(() => "");

      console.error(
        `Heatmap insert failed (${response.status} ${response.statusText}) ` +
          `for ${rows.length} event(s): ${bodyText}`
      );
    }
  } catch (error) {
    console.error(
      `Heatmap flush failed (network error) for ${rows.length} event(s):`,
      error
    );
  }
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  sendBatch(batch);
}

function enqueue(row) {
  queue.push(row);
  if (queue.length >= MAX_BATCH_SIZE) {
    flush();
  }
}

function flushScrollDepth() {
  if (maxScrollDepth <= 0) return;

  enqueue({
    session_id: getSessionId(),
    page: currentPage,
    device_type: getDeviceType(),
    event_type: "scroll",
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    scroll_depth: maxScrollDepth,
  });

  maxScrollDepth = 0;
}

function handleClick(event) {
  const doc = document.documentElement;
  const docWidth = doc.scrollWidth || window.innerWidth;
  const docHeight = doc.scrollHeight || window.innerHeight;

  const xPct = Math.min(100, Math.max(0, (event.pageX / docWidth) * 100));
  const yPct = Math.min(100, Math.max(0, (event.pageY / docHeight) * 100));

  enqueue({
    session_id: getSessionId(),
    page: currentPage,
    device_type: getDeviceType(),
    event_type: "click",
    x_pct: Number(xPct.toFixed(2)),
    y_pct: Number(yPct.toFixed(2)),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
}

function handleScroll() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const scrollable = doc.scrollHeight - window.innerHeight;

  if (scrollable <= 0) {
    maxScrollDepth = Math.max(maxScrollDepth, 100);
    return;
  }

  const depth = Math.min(100, Math.round((scrollTop / scrollable) * 100));
  if (depth > maxScrollDepth) {
    maxScrollDepth = depth;
  }
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    handleScroll();
    scrollTicking = false;
  });
}

// One row per screen actually visited — the real, ordered per-session log
// the admin dashboard's User Journey panel reconstructs navigation paths
// from. No coordinates/scroll data, just "this session was on this page
// at this time."
function trackPageview() {
  enqueue({
    session_id: getSessionId(),
    page: currentPage,
    device_type: getDeviceType(),
    event_type: "pageview",
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
}

// Real-time button click record for the admin dashboard's Button
// Analytics panel — separate from the GA4 button_click event already
// sent via trackButtonClick() in lib/analytics.js (that stays as-is;
// this is an additional, faster-to-query record of the same click,
// since GA4's custom-dimension reports can take a while to reflect new
// data after being registered).
export function trackButtonEvent(buttonName) {
  enqueue({
    session_id: getSessionId(),
    page: currentPage,
    device_type: getDeviceType(),
    event_type: "button_click",
    button_name: buttonName,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
}

// Call once when the current screen changes, so clicks/scroll depth are
// attributed to the right page — this app has no URL routing, screens are
// swapped via React state (see App.jsx), so there's no navigation event to
// hook into instead.
export function setHeatmapPage(pageKey) {
  flushScrollDepth();
  currentPage = pageKey;
  maxScrollDepth = 0;
  trackPageview();
}

// Call once, on mount, with the initial screen key.
export function initHeatmapTracking(initialPage) {
  if (listenersAttached) return;
  listenersAttached = true;

  currentPage = initialPage;
  trackPageview();

  window.addEventListener("click", handleClick, {
    capture: true,
    passive: true,
  });

  window.addEventListener("scroll", onScroll, { passive: true });

  window.setInterval(() => {
    flushScrollDepth();
    flush();
  }, FLUSH_INTERVAL_MS);

  const flushOnExit = () => {
    flushScrollDepth();
    flush();
  };

  window.addEventListener("pagehide", flushOnExit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnExit();
  });
}
