/**
 * sign-request.js — build the headers (and target origin) the OG preview
 * functions need to fetch Blitz data endpoints server-side.
 *
 * Two independent gates sit in front of the proxy, and a server-side fetch from a
 * Netlify Function must satisfy both:
 *
 *   1. Cloudflare bot challenge on proxy.blitz-wallet.com. A bare `fetch()` is
 *      fingerprinted as a bot and gets a managed challenge (HTTP 403,
 *      `cf-mitigated: challenge`) before it ever reaches the proxy. We send a
 *      secret bypass header (CF_BYPASS_SECRET) that a Cloudflare WAF "skip" rule
 *      matches to let this trusted server-to-server traffic through.
 *
 *   2. The proxy's own signed-request check (see
 *      blitz-vps-proxy/lib/websiteAuth.js): it requires `x-from: Netlify` and an
 *      HS256 `x-nf-sign` JWT ({ netlify_id, exp }) signed with API_SIGNATURE_TOKEN,
 *      else it returns 400. Netlify only signs *browser* traffic through its
 *      `signed` redirect, not function-originated fetches, so we mint the token.
 *
 * We therefore fetch the proxy ORIGIN directly (PROXY_ORIGIN), bypassing Netlify's
 * redirect, so this code fully controls every header.
 *
 * SECURITY: runs only in the server-side Netlify Function runtime. The secret and
 * the minted token must NEVER be interpolated into any HTML/`<script>` returned to
 * the browser — use these only on outbound fetches.
 */
import crypto from "node:crypto";

// Where to send the data fetches. The proxy hostname directly (NOT the site
// domain), so no Netlify redirect sits between us and Cloudflare/the proxy.
export const PROXY_ORIGIN = "https://proxy.blitz-wallet.com";

// Shared secret Netlify uses for `signed = "API_SIGNATURE_TOKEN"`. The proxy
// verifies the same value (as BLITZ_WEBSITE_API_KEY).
const SECRET = process.env.API_SIGNATURE_TOKEN;

// The proxy checks `netlify_id === BLITZ_WEBSITE_SITE_ID`. Netlify exposes the
// site's API ID to functions as SITE_ID; allow an explicit override.
const SITE_ID = process.env.BLITZ_WEBSITE_SITE_ID || process.env.SITE_ID;

// Secret shared with the Cloudflare "skip bot challenge" WAF rule. Sent as the
// header named by CF_BYPASS_HEADER; the rule matches on this value.
const CF_BYPASS_HEADER = process.env.CF_BYPASS_HEADER || "x-cf-bypass";
const CF_BYPASS_SECRET = process.env.CF_BYPASS_SECRET;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Returns the header set to attach to a server-side fetch of a proxy data
 * endpoint. Throws if the auth env vars are missing (callers already treat a
 * failed fetch as "no preview data" and fall back to the static image).
 */
export function signedRequestHeaders({ ttlSeconds = 60 } = {}) {
  if (!SECRET) throw new Error("API_SIGNATURE_TOKEN is not set");
  if (!SITE_ID)
    throw new Error("site id (SITE_ID / BLITZ_WEBSITE_SITE_ID) is not set");

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      netlify_id: SITE_ID,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  );
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const headers = {
    "x-from": "Netlify",
    "x-nf-sign": `${data}.${signature}`,
    "Content-Type": "application/json",
  };
  // Cloudflare bot-challenge bypass. Without this the request is challenged
  // (403) before reaching the proxy; the matching WAF skip rule must exist.
  if (CF_BYPASS_SECRET) headers[CF_BYPASS_HEADER] = CF_BYPASS_SECRET;
  return headers;
}
