// Edge-level bot filter for the pool endpoints.
//
// Context: a scraper has been crawling /pools/* (and the backend endpoints the
// pool flow calls) from rotating source IPs, all using a forged Firefox
// User-Agent. Per-IP rate limiting can't catch a rotating bot, but its UA
// *generator* leaves a structural fingerprint that a real browser never has.
//
// Rather than chase the exact strings the bot emits (which forces us to watch
// logs and redeploy every time it rotates), we match the malformed *shape* of
// its UA. This catches future rotations of the version/token automatically.
//
//   Observed bot UAs:
//     ...rv:134.0esr) Gecko/20100101 Firefox/134.0esr/Z7Sa4EnmnXXfM9E-61
//     ...Gecko/20171809...
//
//   Real Firefox always looks like:
//     ...rv:134.0) Gecko/20100101 Firefox/134.0     (desktop)
//     ...Gecko/134.0 Firefox/134.0                  (Android)
//
// This runs before the proxy redirects, so a blocked request never reaches the
// Cloud Function (no invocation, no Firestore read).

const BLOCKED_UA_PATTERNS = [
  // A random token appended after the Firefox version, e.g.
  // "Firefox/134.0esr/Z7Sa4EnmnXXfM9E-61". A real UA ends at the version.
  /Firefox\/[^\s/]+\/[A-Za-z0-9_-]{4,}/,

  // The rv: token carrying an "esr" suffix, e.g. "rv:134.0esr". Real Firefox
  // ESR reports "rv:128.0" — "esr" never appears inside the rv version.
  /rv:[\d.]+esr/,

  // The original bot's fabricated Gecko build date. Real desktop Firefox is
  // always "Gecko/20100101"; Android uses "Gecko/<version>".
  /Gecko\/20171809/,
];

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  if (BLOCKED_UA_PATTERNS.some((re) => re.test(ua))) {
    return new Response("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain" },
    });
  }

  return context.next();
};

export const config = {
  // Guard the pool pages and every backend endpoint the pool flow calls.
  // The bot has pivoted from reading data to generating invoices, so cover
  // the whole flow, not just /getPoolData.
  path: ["/pools/*", "/getPoolData", "/createPoolInvoice", "/checkPoolPayment"],
};
