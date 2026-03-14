// @ts-nocheck
import type { Config, Context } from "@netlify/edge-functions";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";

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
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      return { name, weight, style, data };
    }),
  );
}

function dynamicFontSize(label: string, maxWidth: number): number {
  const AVG_CHAR_RATIO = 0.58; // Poppins bold avg char width ≈ 58% of font size
  const BASE = 70;

  // Calculate what font size fits within maxWidth
  const fitted = maxWidth / (label.length * AVG_CHAR_RATIO);

  return Math.min(BASE, Math.floor(fitted));
}

// Arc geometry: 220° sweep, r=210, center=(350,240) inside 700×480 card
const R = 210;
const CIRC = 2 * Math.PI * R; // 1319.47
const ARC_DEG = 220;
const ARC_LEN = (ARC_DEG / 360) * CIRC; // 806.3  — the visible track
const GAP_LEN = CIRC - ARC_LEN; // 513.17 — the hidden gap

function arcFill(pct: number): string {
  const clamp = Math.min(100, Math.max(0, pct));
  const fill = ARC_LEN * (clamp / 100);
  return `${fill} ${CIRC - fill}`;
}

function PoolCard({
  goalLabel,
  progressPct,
}: {
  goalLabel: string;
  progressPct: number;
}) {
  const clamp = Math.min(100, Math.max(0, progressPct));
  const subLabel = clamp > 0 ? `${clamp}% funded` : "to goal";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BLUE_BG,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Soft blue blob — top-left */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -150,
          width: 700,
          height: 700,
          borderRadius: "50%",
          filter: "blur(20px)",
          background:
            "radial-gradient(circle, rgba(3,117,246,0.35) 0%, rgba(3,117,246,0) 68%)",
        }}
      />
      {/* Soft green blob — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -150,
          width: 700,
          height: 700,
          borderRadius: "50%",
          filter: "blur(20px)",
          background:
            "radial-gradient(circle, rgba(3,117,246,0.35) 0%, rgba(3,117,246,0) 68%)",
        }}
      />

      {/* White card */}
      <div
        style={{
          position: "relative",
          width: 700,
          height: 380,
          background: "#ffffff",
          borderRadius: 52,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 80px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        {/* Arc SVG — fills the card exactly */}
        <svg
          width="700"
          height="480"
          viewBox="0 0 700 480"
          style={{ position: "absolute", top: 0, left: 0, display: "flex" }}
        >
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={BLUE_BRIGHT} />
              <stop offset="100%" stopColor={BLUE_LIGHT} />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx="350"
            cy="240"
            r={R}
            fill="none"
            stroke="#ebebeb"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN} ${GAP_LEN}`}
            strokeDashoffset="0"
            transform="rotate(160 350 240)"
          />

          {/* Fill */}
          {clamp > 0 && (
            <circle
              cx="350"
              cy="240"
              r={R}
              fill="none"
              stroke="url(#g)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={arcFill(clamp)}
              strokeDashoffset="0"
              transform="rotate(160 350 240)"
            />
          )}
        </svg>

        {/* Text centered in the arc */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            gap: 1,
            marginTop: "50px",
          }}
        >
          <div
            style={{
              fontSize: dynamicFontSize(goalLabel, 360),
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {goalLabel}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#aaaaaa",
              fontWeight: 400,
              letterSpacing: "0",
            }}
          >
            {subLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const { origin } = new URL(request.url);
  const p = url.searchParams;

  const goalNumber = decodeURIComponent(p.get("goal") ?? "");
  const progressPct = Number(p.get("pct") ?? 0);
  const fonts = await loadFonts(origin);
  const goalAmount = Number(goalNumber ?? 0);

  const goalLabel = `${goalAmount.toLocaleString("en-US")} SAT`;

  const image = new ImageResponse(
    <PoolCard goalLabel={goalLabel} progressPct={progressPct} />,
    { width: 1200, height: 628, fonts },
  );

  const response = new Response(image.body, image);
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800",
  );
  return response;
};

export const config: Config = { path: "/og-pool" };
