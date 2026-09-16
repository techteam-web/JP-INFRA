// Privacy-safe geolocation fallback for sessions GA4 can't resolve a
// city for. Vercel's edge network already resolves coarse geolocation
// from the request's IP *before* this function ever runs, and exposes
// it as request headers — this handler only reads those headers. The
// raw IP address is never read, stored, or logged anywhere: only the
// already-resolved country/region/city strings leave this function.
//
// These headers are only populated for requests actually routed through
// Vercel's edge network in production — running locally (`vite dev`) or
// on any other host, every field comes back null.
export const config = { runtime: "edge" };

export default function handler(request) {
  const headers = request.headers;

  const decode = (value) => {
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const body = {
    country: headers.get("x-vercel-ip-country") || null,
    region: headers.get("x-vercel-ip-country-region") || null,
    city: decode(headers.get("x-vercel-ip-city")),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
