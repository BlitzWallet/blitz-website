/*
 * Blitz Wallet — WebMCP imperative tools (Lighthouse "Agentic Browsing").
 *
 * Exposes read-only discovery tools so AI agents can answer questions and
 * deep-link users without scraping the DOM. Progressive enhancement:
 * no-ops on browsers without `document.modelContext` (WebMCP origin trial /
 * chrome://flags/#enable-webmcp-testing). Registered synchronously at parse
 * time so Lighthouse captures them in its snapshot.
 *
 * See https://developer.chrome.com/docs/ai/webmcp/imperative-api
 */
(function () {
  "use strict";

  var SITE = "https://blitzwalletapp.com";
  var IOS_URL =
    "https://apps.apple.com/us/app/blitz-wallet/id6476810582";
  var ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.blitzwallet";
  var WEB_WALLET_URL = "https://wallet.blitzwalletapp.com/";
  var POS_URL = "https://pay.blitzwalletapp.com/";
  var RECOVERY_URL = "https://recover.blitzwalletapp.com/";

  // Static sitemap for the find_blitz_page tool. Keys are match terms.
  var PAGE_INDEX = [
    { path: "/", terms: ["home", "homepage", "overview", "main"] },
    { path: "/pages/download/", terms: ["download", "install", "ios", "android", "app store", "play store"] },
    { path: "/pages/faq/", terms: ["faq", "questions", "help", "support"] },
    { path: "/pages/contact/", terms: ["contact", "support", "email", "help", "partnership", "media"] },
    { path: "/pages/about/", terms: ["about", "company", "mission", "team"] },
    { path: "/pages/bitcoin-wallet/", terms: ["bitcoin wallet", "btc wallet", "create wallet", "setup"] },
    { path: "/pages/self-custody/", terms: ["self-custody", "self custodial", "keys", "backup", "seed", "12-word"] },
    { path: "/pages/stablecoins/", terms: ["stablecoin", "usdb", "usdc", "usdt", "dollar", "stable"] },
    { path: "/pages/gifts/", terms: ["gift", "gifts", "send gift", "present"] },
    { path: "/pages/pools/", terms: ["pool", "pools", "group", "collect", "fundraise", "split"] },
    { path: "/pages/point-of-sale/", terms: ["pos", "point of sale", "merchant", "business", "accept", "tips"] },
    { path: "/pages/accounts/", terms: ["account", "accounts", "sub-wallet", "kids", "family"] },
    { path: "/pages/dollar-goals/", terms: ["dollar goals", "savings", "goals", "save"] },
    { path: "/pages/accumulation-addresses/", terms: ["accumulation", "address", "deposit", "static address"] },
    { path: "/pages/analytics/", terms: ["analytics", "spending", "budget", "insights"] },
    { path: "/pages/spend-and-replace/", terms: ["spend and replace", "spend", "replace", "auto"] },
    { path: "/pages/nostr/", terms: ["nostr", "nip-05", "nwc", "wallet connect"] },
    { path: "/pages/lightning-address/", terms: ["lightning address", "lnurl", "receive"] },
    { path: "/pages/blog/", terms: ["blog", "articles", "news", "learn", "guide"] },
    { path: "/pages/brand/", terms: ["brand", "logo", "assets", "press"] },
    { path: "/pages/privacyPolicy/", terms: ["privacy", "privacy policy", "data"] },
    { path: "/pages/terms/", terms: ["terms", "terms of use", "legal"] },
  ];

  function findPages(query) {
    var q = String(query || "").toLowerCase().trim();
    if (!q) return [];
    return PAGE_INDEX.filter(function (entry) {
      if (entry.path.toLowerCase().indexOf(q) !== -1) return true;
      return entry.terms.some(function (t) {
        return t.indexOf(q) !== -1 || q.indexOf(t) !== -1;
      });
    }).map(function (entry) {
      return SITE + entry.path;
    });
  }

  function registerTools() {
    if (!("modelContext" in document)) return;
    var mc = document.modelContext;
    if (!mc || typeof mc.registerTool !== "function") return;

    var tools = [
      {
        name: "get_download_links",
        description:
          "Get the official Blitz Wallet download links for iOS, Android, and the browser-based web wallet. Use when the user wants to install or open Blitz Wallet.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: async function () {
          return JSON.stringify({
            ios: IOS_URL,
            android: ANDROID_URL,
            webWallet: WEB_WALLET_URL,
            pointOfSale: POS_URL,
            recovery: RECOVERY_URL,
          });
        },
      },
      {
        name: "find_blitz_page",
        description:
          "Find the best blitzwalletapp.com page URL for a topic such as downloads, FAQ, gifts, pools, point of sale, stablecoins, self-custody, recovery, or contact. Returns matching page URLs.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Topic or keyword to look up, e.g. 'gifts', 'merchant POS', 'stablecoins', 'download'.",
            },
          },
          required: ["query"],
        },
        annotations: { readOnlyHint: true },
        execute: async function (args) {
          var matches = findPages(args && args.query);
          if (!matches.length) {
            return "No matching page. Suggest the homepage (" + SITE + "/) or FAQ (" + SITE + "/pages/faq/).";
          }
          return JSON.stringify(matches.slice(0, 5));
        },
      },
      {
        name: "get_blitz_overview",
        description:
          "Get a short summary of what Blitz Wallet is, its products, and its core features. Use to answer 'what is Blitz Wallet' questions.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: async function () {
          return (
            "Blitz Wallet is a self-custodial global payments app (iOS, Android, web). " +
            "Products: mobile app, web wallet (" + WEB_WALLET_URL + "), " +
            "point of sale (" + POS_URL + "), open-source recovery (" + RECOVERY_URL + "). " +
            "Features: free contact payments, Bitcoin gifts via shareable links, " +
            "group payment pools, payment links, USDT/USDC stablecoin swaps, " +
            "instant global settlement, offline receive. Full machine-readable guide: " +
            SITE + "/llms.txt"
          );
        },
      },
    ];

    tools.forEach(function (tool) {
      try {
        var result = mc.registerTool(tool);
        if (result && typeof result.catch === "function") {
          result.catch(function () {
            /* Registration not supported here; declarative form tools still apply. */
          });
        }
      } catch (e) {
        /* Older or non-supporting browsers: ignore. */
      }
    });
  }

  // Register as early as possible for deterministic Lighthouse capture.
  registerTools();
})();
