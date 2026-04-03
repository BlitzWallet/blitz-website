// @ts-nocheck
import type { Config, Context } from "@netlify/edge-functions";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import { Logo } from "./assets/Logo.tsx";

// ─── brand ───────────────────────────────────────────────────────────────────

const NAVY = "#0a1f36";
const BLUE = "#0375f6";
const BLUE_MID = "#3d6e9e";
const BLUE_FAINT = "rgba(3,117,246,0.10)";
const BLUE_BORDER = "rgba(3,117,246,0.20)";
const BLUE_RULE = "rgba(3,117,246,0.15)";
const MUTED = "#6b93bb";

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
];

async function loadFonts(origin: string) {
  return Promise.all(
    FONTS.map(async ({ name, weight, style, filePath }) => {
      const data = await fetch(`${origin}/fonts/${filePath}`).then((r) =>
        r.arrayBuffer(),
      );
      return { name, weight, style, data };
    }),
  );
}

// ─── amount formatter ─────────────────────────────────────────────────────────

function formatAmount(amount: string, denom: string, satDisplay: string) {
  const n = Number(amount);
  if (!n) return { primary: "—", unit: "", isBtc: false };

  if (denom === "usd") {
    return {
      primary: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(n / 100),
      unit: "",
      isBtc: false,
    };
  }

  return {
    primary: n.toLocaleString("en-US"),
    unit: satDisplay === "symbol" || !satDisplay ? "" : "SAT",
    isBtc: satDisplay === "symbol" || !satDisplay,
  };
}

// ─── bitcoin icon ─────────────────────────────────────────────────────────────

function BitcoinIcon({
  color = BLUE,
  size = 14,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={color}
      width={size}
      height={size}
      style={{
        display: "flex",
        marginRight: -25,
        marginLeft: -25,
        marginBottom: 25,
      }}
    >
      <path
        fill-rule="evenodd"
        d="M13.425 6.432c1.983.19 3.538.778 3.71 2.528.117 1.276-.438 2.035-1.355 2.463 1.481.359 2.382 1.202 2.196 3.072-.227 2.343-2.035 2.952-4.62 3.08l.004 2.42-1.522.002-.004-2.42c-.166-.002-.34 0-.519.003-.238.003-.484.006-.731-.001l.004 2.42-1.52.001-.004-2.42-3.044-.058.256-1.768s1.15.024 1.129.012c.423-.002.549-.293.58-.485l-.008-3.878.012-2.76c-.046-.288-.248-.634-.87-.644.033-.03-1.115.001-1.115.001L6 6.38l3.12-.005-.004-2.37 1.571-.002.004 2.37c.304-.008.603-.005.906-.003l.3.002-.005-2.37L13.422 4l.003 2.432zm-2.92 4.46l.076.002c.926.04 3.67.155 3.673-1.457-.004-1.532-2.339-1.482-3.423-1.46-.129.003-.24.006-.327.005v2.91zm.129 4.75l-.134-.005v-2.91c.097.002.218 0 .359-.002 1.282-.015 4.145-.05 4.132 1.494.014 1.597-3.218 1.468-4.357 1.423z"
        clip-rule="evenodd"
      />
    </svg>
  );
}

// ─── gift icon ────────────────────────────────────────────────────────────────

function GiftIcon({
  color = BLUE,
  size = 14,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width={size}
      height={size}
      style={{ display: "flex" }}
    >
      <path d="M20 12v10H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// ─── card ─────────────────────────────────────────────────────────────────────

function GiftCard({
  primary,
  unit,
  message,
  isBtc,
}: {
  primary: string;
  unit: string;
  message: string;
  isBtc: boolean;
}) {
  const amountFontSize =
    primary.length > 12 ? 90 : primary.length > 7 ? 130 : 150;
  const iconSize = Math.round(amountFontSize * 1.1);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Poppins', sans-serif",
        background:
          "linear-gradient(150deg, #f0f7ff 0%, #ddeeff 40%, #c8e2ff 100%)",
        padding: "52px 68px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(3,117,246,0.07) 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* top-right glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(3,117,246,0.18) 0%, transparent 70%)",
        }}
      />

      {/* bottom-left glow */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: 60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 70%)",
        }}
      />

      {/* content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* logo — top right */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Logo fill={BLUE} />
        </div>

        {/* center */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flex: 1,
            gap: 20,
          }}
        >
          {/* chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: BLUE_FAINT,
              border: `1px solid ${BLUE_BORDER}`,
              borderRadius: 100,
              padding: "15px 23px",
              marginBottom: 50,
            }}
          >
            <GiftIcon color={BLUE} size={40} />
            <span
              style={{
                fontSize: 35,
                fontWeight: 700,
                marginBottom: -10,
                color: BLUE,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              You've received a gift
            </span>
          </div>

          {/* amount row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              // gap: 8,
            }}
          >
            {isBtc ? <BitcoinIcon color={NAVY} size={iconSize} /> : null}
            <span
              style={{
                fontSize: amountFontSize,
                fontWeight: 700,
                color: NAVY,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: -20,
              }}
            >
              {primary}
            </span>
            {unit ? (
              <span
                style={{
                  fontSize: Math.round(amountFontSize * 0.36),
                  fontWeight: 400,
                  color: BLUE_MID,
                  alignSelf: "flex-end",
                  paddingBottom: 6,
                  marginLeft: 10,
                }}
              >
                {unit}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── handler ──────────────────────────────────────────────────────────────────

export default async (request: Request, _context: Context) => {
  const p = new URL(request.url).searchParams;
  const { origin } = new URL(request.url);

  const amount = p.get("amount") ?? "";
  const denom = p.get("denom") ?? "BTC";
  const satDisplay = p.get("satDisplay") ?? "SAT";
  const message = decodeURIComponent(p.get("message") ?? "");

  const { primary, unit, isBtc } = formatAmount(amount, denom, satDisplay);
  const fonts = await loadFonts(origin);

  const image = new ImageResponse(
    <GiftCard primary={primary} unit={unit} message={message} isBtc={isBtc} />,
    { width: 1200, height: 628, fonts },
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

export const config: Config = { path: "/og-gift" };
