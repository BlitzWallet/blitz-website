// @ts-nocheck
import type { Config, Context } from "@netlify/edge-functions";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";

// ─── brand ───────────────────────────────────────────────────────────────────

const WHITE = "#ffffff";

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

async function loadIcon(origin: string): Promise<string> {
  const res = await fetch(`${origin}/public/iconWhite.png`);
  const buf = await res.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `data:image/png;base64,${b64}`;
}

// ─── Bitcoin SVG icon ─────────────────────────────────────────────────────────

function BitcoinIcon({ size = 120 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingBottom: Math.round(size * 0.2),
        marginRight: Math.round(size * -0.2),
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
  amountLabel,
  currencyType,
  showUSD,
  rawAmount,
  iconSrc,
}: {
  amountLabel: string;
  currencyType: string;
  showUSD: boolean;
  rawAmount: number;
  iconSrc: string;
}) {
  const amountFontSize =
    amountLabel.length > 12 ? 90 : amountLabel.length > 7 ? 130 : 150;

  const iconSize = Math.round(amountFontSize * 1.3);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #0476F6 0%, #009BF0 100%)",
        fontFamily: "'Poppins', sans-serif",
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          marginTop: "48px",
          marginLeft: "96px",
        }}
      >
        <img src={iconSrc} width={65} height={65} />
      </div>

      {/* ── amount row: bitcoin icon + balance ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          marginTop: "auto",
          padding: `0px 60px ${showUSD ? 20 : 0}px ${showUSD ? 50 : 0}px`,
        }}
      >
        {!showUSD ? <BitcoinIcon size={iconSize} /> : null}
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
          {!showUSD ? amountLabel : `$${rawAmount.toLocaleString("en-US")}`}
        </div>
      </div>
    </div>
  );
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default async (request: Request, _context: Context) => {
  const p = new URL(request.url).searchParams;
  const { origin } = new URL(request.url);

  const amount = Number(p.get("amount") ?? 0);
  const rawAmount = Number(p.get("rawAmount") ?? 0);
  const currencyType = decodeURIComponent(p.get("currencyType") ?? "BTC");
  const amountLabel = amount ? `${amount.toLocaleString("en-US")}` : "—";

  const showUSD = currencyType === "USD" && rawAmount > 0;

  const [fonts, iconSrc] = await Promise.all([
    loadFonts(origin),
    loadIcon(origin),
  ]);

  const image = new ImageResponse(
    <PaylinkCard
      amountLabel={amountLabel}
      currencyType={currencyType}
      rawAmount={rawAmount}
      showUSD={showUSD}
      iconSrc={iconSrc}
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
  response.headers.set("Content-Type", "image/png");
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
};

export const config: Config = { path: "/og-paylink" };
