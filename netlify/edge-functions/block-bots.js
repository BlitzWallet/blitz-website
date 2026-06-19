// Edge-level bot filter for the pool endpoints.
//
// All pool traffic flows through Netlify (the public *.run.app Cloud Functions
// are only reached via the signed proxy redirects in netlify.toml), so this
// edge function — which runs BEFORE those redirects — is the one place that can
// inspect and block a request before it ever reaches the backend.
//
// Two layers, both chosen to have ~zero false positives:
//   A. Forged Firefox User-Agent  (catches the scraper that keeps spoofing FF)
//   B. Browser-fetch fingerprint on the API (catches okhttp / node / no-UA bots)
//
// Every block is logged as JSON so you can see exactly what's being dropped.

// ---------------------------------------------------------------------------
// Layer A: forged Firefox
// ---------------------------------------------------------------------------
// The scraper keeps impersonating desktop Firefox but gets details wrong that a
// real Firefox never does. Observed samples:
//   ...Gecko/20171809 Firefox/115.0
//   ...rv:134.0esr) Gecko/20100101 Firefox/134.0esr/Z7Sa4EnmnXXfM9E-61
//   ...rv:134.0) Gecko/20010101 Firefox/134.0      <- "20010101", year 2001
//
// Key fact: every real *desktop* Firefox reports the hardcoded literal
// "Gecko/20100101". Mobile Firefox (Android) uses "Gecko/<version>" and iOS
// Firefox uses "FxiOS" with no "Firefox/" token, so we exempt those and only
// hold desktop Firefox to the 20100101 rule. This catches all three bot
// variants — and any future one — without touching a single real user.
function isForgedFirefox(ua) {
  // Only desktop Firefox (and Firefox forks) carry the literal "Firefox/" token.
  if (!ua.includes("Firefox/")) return false;
  // Android Firefox legitimately uses Gecko/<version>, not the fixed date.
  if (ua.includes("Android")) return false;

  // Real desktop Firefox ALWAYS reports exactly "Gecko/20100101".
  if (!ua.includes("Gecko/20100101")) return true;
  // A token appended after the Firefox version (e.g. ".../Z7Sa4EnmnXXfM9E-61").
  if (/Firefox\/\S*\/[A-Za-z0-9_-]{4,}/.test(ua)) return true;
  // An "esr" suffix inside the rv: token — real ESR reports "rv:128.0".
  if (/rv:[\d.]+esr/.test(ua)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Layer B: browser-fetch fingerprint (API endpoints only)
// ---------------------------------------------------------------------------
// These endpoints are POSTed exclusively by the pool page's same-origin fetch().
// Every browser attaches an Origin header to a non-GET request, and modern ones
// also send Sec-Fetch-Site: same-origin. A raw HTTP client (okhttp, node, etc.)
// has to set those by hand and usually doesn't.
const API_PATHS = new Set([
  "/getPoolData",
  "/createPoolInvoice",
  "/checkPoolPayment",
]);
const ALLOWED_HOSTS = new Set(["blitzwalletapp.com", "www.blitzwalletapp.com"]);

function looksLikeSameOriginFetch(request) {
  if (request.headers.get("sec-fetch-site") === "same-origin") return true;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (ALLOWED_HOSTS.has(new URL(origin).hostname)) return true;
    } catch {
      /* malformed Origin -> not same-origin */
    }
  }
  return false;
}

// ---------------------------------------------------------------------------

function logBlock(reason, request, context) {
  console.log(
    JSON.stringify({
      tag: "bot-filter",
      reason,
      ip: context.ip,
      path: new URL(request.url).pathname,
      ua: request.headers.get("user-agent") || "",
    })
  );
}

const FORBIDDEN = new Response("Forbidden", {
  status: 403,
  headers: { "content-type": "text/plain" },
});

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const path = new URL(request.url).pathname;

  if (isForgedFirefox(ua)) {
    logBlock("forged-firefox", request, context);
    return FORBIDDEN;
  }

  if (API_PATHS.has(path) && !looksLikeSameOriginFetch(request)) {
    logBlock("not-same-origin-fetch", request, context);
    return FORBIDDEN;
  }

  return context.next();
};

export const config = {
  // Guard the pool pages and every backend endpoint the pool flow calls.
  path: ["/pools/*", "/getPoolData", "/createPoolInvoice", "/checkPoolPayment"],
};
