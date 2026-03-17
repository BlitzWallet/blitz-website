// @ts-nocheck
import type { Config, Context } from "@netlify/edge-functions";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";

// ─── brand ───────────────────────────────────────────────────────────────────

const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.75)";

const FONTS = [
  {
    name: "Poppins",
    weight: 400,
    style: "normal" as const,
    filePath: "Poppins-Regular.ttf",
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
      console.log(url);
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      return { name, weight, style, data };
    }),
  );
}

// ─── Bitcoin SVG icon ─────────────────────────────────────────────────────────
// Rendered inline — Satori supports SVG elements directly in JSX.
// Size is controlled by `width`/`height` on the <svg> element itself.
// `display: "flex"` on the wrapper is required by Satori's Yoga layout engine.

function BitcoinIcon({ size = 120 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingBottom: Math.round(size * 0.2),
        marginRight: Math.round(size * -0.15),
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        width={size}
        height={size}
      >
        <path
          fill-rule="evenodd"
          d="M13.425 6.432c1.983.19 3.538.778 3.71 2.528.117 1.276-.438 2.035-1.355 2.463 1.481.359 2.382 1.202 2.196 3.072-.227 2.343-2.035 2.952-4.62 3.08l.004 2.42-1.522.002-.004-2.42c-.166-.002-.34 0-.519.003-.238.003-.484.006-.731-.001l.004 2.42-1.52.001-.004-2.42-3.044-.058.256-1.768s1.15.024 1.129.012c.423-.002.549-.293.58-.485l-.008-3.878.012-2.76c-.046-.288-.248-.634-.87-.644.033-.03-1.115.001-1.115.001L6 6.38l3.12-.005-.004-2.37 1.571-.002.004 2.37c.304-.008.603-.005.906-.003l.3.002-.005-2.37L13.422 4l.003 2.432zm-2.92 4.46l.076.002c.926.04 3.67.155 3.673-1.457-.004-1.532-2.339-1.482-3.423-1.46-.129.003-.24.006-.327.005v2.91zm.129 4.75l-.134-.005v-2.91c.097.002.218 0 .359-.002 1.282-.015 4.145-.05 4.132 1.494.014 1.597-3.218 1.468-4.357 1.423z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  );
}

// ─── main card ───────────────────────────────────────────────────────────────

function PaylinkCard({
  username,
  amountLabel,
  description,
}: {
  username: string;
  amountLabel: string;
  description: string;
}) {
  const amountFontSize =
    amountLabel.length > 18 ? 62 : amountLabel.length > 7 ? 100 : 127;

  // Icon scales proportionally with the amount font size so they stay optically balanced
  const iconSize = Math.round(amountFontSize * 1.3);

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
      {/* top-left glow */}
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

      {/* bottom-right glow */}
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

      {/* ── header: Blitz Wallet wordmark ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: WHITE,
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            lineHeight: 1,
            padding: 0,
            margin: 0,
          }}
        >
          Blitz Wallet
        </div>
      </div>

      {/* ── amount row: icon + balance + SAT label ── */}
      {/*
        Key alignment rules for Satori / Yoga:
        - The outer div MUST have display:"flex" — Satori ignores block layout.
        - alignItems:"center" vertically centres children on the cross axis.
        - gap handles the space between icon and text without extra margins.
        - Both children are inline-flex themselves so their own content centres correctly.
      */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        <BitcoinIcon size={iconSize} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: amountFontSize,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: WHITE,
          }}
        >
          {amountLabel}
        </div>
      </div>
    </div>
  );
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async (request: Request, _context: Context) => {
  const p = new URL(request.url).searchParams;
  const { origin } = new URL(request.url);

  const username = decodeURIComponent(p.get("username") ?? "");
  const amount = Number(p.get("amount") ?? 0);
  const description = decodeURIComponent(p.get("description") ?? "");
  const amountLabel = amount ? `${amount.toLocaleString("en-US")}` : "—";
  const fonts = await loadFonts(origin);

  const image = new ImageResponse(
    <PaylinkCard
      username={username}
      amountLabel={amountLabel}
      description={description}
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

export const config: Config = { path: "/og-paylink" };
