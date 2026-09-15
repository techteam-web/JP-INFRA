// Thin wrapper around the GA4 gtag.js snippet already loaded in index.html.
// Every call no-ops safely if gtag isn't available yet (e.g. ad blockers).

export function trackButtonClick(buttonName) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "button_click", {
    button_name: buttonName,
  });
}

export function trackPageView(pageTitle, pagePath) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_title: pageTitle,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
  });
}
