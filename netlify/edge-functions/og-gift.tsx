// @ts-nocheck
// (Deno URL imports are not resolvable by the local TS LSP — this is expected.
//  The file runs correctly on Netlify's Deno edge runtime.)

import type { Config, Context } from "@netlify/edge-functions";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";

// ─── brand ───────────────────────────────────────────────────────────────────

const BLUE_DARK = "#21374f";
const BLUE_MID = "#0e4f8a";
const BLUE_LIGHT = "#0375f6";
const BLUE_BRIGHT = "#38bdf8";
const BLUE_BG = "#eef6ff";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const WHITE_FAINT = "rgba(255,255,255,0.15)";
const WHITE_GLASS = "rgba(255,255,255,0.18)";
const WHITE_BORDER = "rgba(255,255,255,0.28)";

const FONTS = [
  {
    name: "Poppins",
    weight: 400,
    style: "normal" as const,
    filePath: "Poppins-Regular.ttf", // match your actual filenames
  },
  {
    name: "Poppins",
    weight: 700,
    style: "normal" as const,
    filePath: "Poppins-Bold.ttf",
  },
  {
    name: "Poppins",
    weight: 800,
    style: "normal" as const,
    filePath: "Poppins-ExtraBold.ttf",
  },
];

async function loadFonts(origin: string) {
  return await Promise.all(
    FONTS.map(async ({ name, weight, style, filePath }) => {
      const url = `${origin}/fonts/${filePath}`;
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      return { name, weight, style, data };
    }),
  );
}

// ─── amount formatter ─────────────────────────────────────────────────────────

function formatAmount(
  amount: string,
  denom: string,
  satDisplay: string,
): string {
  const n = Number(amount);
  if (!n) return "—";
  const useSatSymbol = satDisplay === "symbol" || !satDisplay;

  if (denom === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n / 100);
  }
  return useSatSymbol
    ? `₿${n.toLocaleString("en-US")}`
    : `${n.toLocaleString("en-US")} SAT`;
}

// ─── logo ─────────────────────────────────────────────────────────────────────
function BlitzLogo({ origin }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          color: WHITE,
          fontSize: 60,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          display: "flex",
          alignItems: "center", // ← explicit alignment on text node
          lineHeight: 1, // ← removes default line-height breathing room
          padding: 0,
          margin: 0,
        }}
      >
        Blitz Wallet
      </div>
    </div>
  );
}

// ─── main card ───────────────────────────────────────────────────────────────
function GiftCard({
  amountLabel,
  message,
  senderName,
  origin,
}: {
  amountLabel: string;
  message: string;
  senderName: string;
}) {
  const amountFontSize =
    amountLabel.length > 18 ? 62 : amountLabel.length > 12 ? 78 : 120;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        background:
          "linear-gradient(160deg,#0b1a2b 0%,#102a43 40%,#0e4f8a 100%)",

        fontFamily: "'Poppins', sans-serif",
        padding: "48px 60px",
        boxSizing: "border-box",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* glow accent top */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -150,
          width: 600,
          height: 600,
          borderRadius: "50%",
          filter: "blur(80px)",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(56,189,248,0) 70%)",
        }}
      />

      {/* glow accent bottom */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -150,
          width: 600,
          height: 600,
          borderRadius: "50%",
          filter: "blur(80px)",
          background:
            "radial-gradient(circle, rgba(3,117,246,0.45) 0%, rgba(3,117,246,0) 70%)",
        }}
      />

      {/* top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <BlitzLogo origin={origin} />
      </div>

      {/* center */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          marginTop: "auto",
          marginBottom: "auto",
          gap: 20,
        }}
      >
        {/* amount */}
        <div
          style={{
            fontSize: amountFontSize,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: WHITE,
            display: "flex",
          }}
        >
          {amountLabel}
        </div>

        {/* message */}
        {message ? (
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 30,
              fontWeight: 400,
              maxWidth: 680,
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            "{message}"
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async (request: Request, _context: Context) => {
  const p = new URL(request.url).searchParams;
  const { origin } = new URL(request.url);

  const amount = p.get("amount") ?? "";
  const denom = p.get("denom") ?? "BTC";
  const satDisplay = p.get("satDisplay") ?? "SAT";
  const message = decodeURIComponent(p.get("message") ?? "");
  const senderName = decodeURIComponent(p.get("sender") ?? "");

  const amountLabel = formatAmount(amount, denom, satDisplay);

  // ── load Poppins via jsDelivr (@fontsource) — reliably reachable from Netlify edge ──
  const fonts = await loadFonts(origin);
  const image = new ImageResponse(
    <GiftCard
      amountLabel={amountLabel}
      message={message}
      senderName={senderName}
      origin={origin}
    />,
    {
      width: 1200,
      height: 628,
      fonts,
    },
  );

  const response = new Response(image.body, image);
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800",
  );
  return response;
};

export const config: Config = { path: "/og-gift" };
