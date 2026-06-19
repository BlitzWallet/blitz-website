// Edge-level bot filter for the pool endpoints.
//
// Context: a scraper has been crawling every /pools/* page (and the
// /getPoolData API it calls) ~1.5 req/s from rotating source IPs, all sharing
// one forged User-Agent. Per-IP rate limiting can't catch a rotating bot, but
// the UA is a stable, low-false-positive signal: real desktop Firefox ALWAYS
// reports "Gecko/20100101" — the bot reports a fabricated "Gecko/20171809".
//
// This runs before the /getPoolData proxy redirect, so a blocked request never
// reaches the Cloud Function (no invocation, no Firestore read).

// Substrings that identify the abusive client. Extend this list if the bot
// rotates its UA. Exact, fabricated tokens are used to keep false positives ~0.
const BLOCKED_UA_SUBSTRINGS = ["Gecko/20171809"];

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  if (BLOCKED_UA_SUBSTRINGS.some((needle) => ua.includes(needle))) {
    return new Response("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain" },
    });
  }

  return context.next();
};

export const config = {
  // Guard both the API and the pages that trigger it.
  path: ["/getPoolData", "/pools/*"],
};
