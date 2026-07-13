/**
 * sign-request.js — mint the signed request headers a Netlify `signed` redirect
 * would normally add, so a Netlify Function's *server-side* fetch is accepted by
 * the Blitz backend's signature check.
 *
 * Netlify only signs requests it proxies from an external browser through a
 * `signed = "API_SIGNATURE_TOKEN"` redirect. The OG preview functions
 * (handle-paylink/pool/gift) fetch their data server-side, so those requests
 * arrive unsigned and the backend rejects them with 403. This helper reproduces
 * the exact token the backend verifies (see blitz-vps-proxy/lib/websiteAuth.js):
 * an HS256 JWT signed with API_SIGNATURE_TOKEN, payload { netlify_id, exp }, sent
 * as `x-nf-sign` alongside `x-from: Netlify`.
 *
 * SECURITY: this runs only inside the server-side Netlify Function runtime. The
 * secret and the minted token must NEVER be interpolated into any HTML/`<script>`
 * returned to the browser — use these headers only on outbound fetches.
 */
import crypto from "node:crypto";

// Shared secret Netlify uses for `signed = "API_SIGNATURE_TOKEN"`. The backend
// verifies the same value (as BLITZ_WEBSITE_API_KEY).
const SECRET = process.env.API_SIGNATURE_TOKEN;

// The backend checks `netlify_id === BLITZ_WEBSITE_SITE_ID`. Netlify exposes the
// site's API ID to functions as SITE_ID; allow an explicit override.
const SITE_ID = process.env.BLITZ_WEBSITE_SITE_ID || process.env.SITE_ID;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Returns the header set to attach to a server-side fetch of a signed endpoint.
 * Throws if the required env vars are missing (callers already treat a failed
 * fetch as "no preview data" and fall back to the static image).
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

  return {
    "x-from": "Netlify",
    "x-nf-sign": `${data}.${signature}`,
    "Content-Type": "application/json",
  };
}
