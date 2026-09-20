/* eslint-disable react-refresh/only-export-components -- route metadata
   (`alt`, `size`, `contentType`) must sit beside the card component. */

/**
 * Next.js App Router OpenGraph image route (`src/app/opengraph-image.tsx`).
 *
 * Renders the 1200×630 social card at request time — deep obsidian canvas,
 * purple gradient headline, gold KPI callouts — and Next.js wires the result
 * into `<meta property="og:image">` automatically, including `alt`, `width`,
 * `height`, and `type`.
 *
 * ── Stack note ──────────────────────────────────────────────────────────────
 * This repository runs as a Vite + React SPA with no server runtime, so the
 * identical artwork is pre-rasterised instead:
 *
 *   bun run og:image   →  scripts/generate-og-image.mjs  →  public/og-image.png
 *
 * `public/og-image.svg` is the vector source of that card; this file is the
 * request-time contract for the Next.js deployment shape. The JSX below is
 * valid React today (so it type-checks and can be previewed) and becomes the
 * live route after one change:
 *
 *   import { ImageResponse } from "next/og";
 *
 *   export default function OpengraphImage() {
 *     return new ImageResponse(<OgCard />, { ...size });
 *   }
 *
 * Styling follows ImageResponse's constraints — inline styles only, flexbox
 * layout, no external stylesheets.
 */

import { OG_HEADLINE, OG_IMAGE, OG_KPIS, SITE_NAME } from "@/lib/seo";

/** Crawler/screen-reader description; also emitted as `og:image:alt`. */
export const alt = OG_IMAGE.alt;

/** Canvas size — the 1.91:1 ratio every major platform prefers. */
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };

export const contentType = OG_IMAGE.type;

const [PLACED, PACKAGE, OFFERS] = OG_KPIS;

function OgCard() {
  const kpiTile = (accent: "gold" | "purple") => ({
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    width: "320px",
    height: "92px",
    paddingLeft: "28px",
    borderRadius: "18px",
    border: `1.5px solid ${accent === "gold" ? "rgba(251,191,36,0.3)" : "rgba(168,85,247,0.3)"}`,
    backgroundColor:
      accent === "gold" ? "rgba(251,191,36,0.09)" : "rgba(168,85,247,0.09)",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "72px 80px 64px",
        backgroundColor: "#030307",
        backgroundImage:
          "radial-gradient(circle at 86% 12%, rgba(124,58,237,0.45), rgba(3,3,7,0) 46%), radial-gradient(circle at 8% 96%, rgba(245,158,11,0.22), rgba(3,3,7,0) 42%)",
        color: "#e2e8f0",
        fontFamily: "Outfit, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "46px",
            height: "46px",
            borderRadius: "13px",
            backgroundImage: "linear-gradient(135deg, #a855f7, #4f46e5)",
            color: "#ffffff",
            fontSize: "27px",
            fontWeight: 800,
          }}
        >
          N
        </div>
        <div
          style={{
            fontSize: "23px",
            fontWeight: 800,
            letterSpacing: "4.6px",
            color: "#e2e8f0",
          }}
        >
          {SITE_NAME.replace(" Portal", "").toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            padding: "10px 26px",
            borderRadius: "19px",
            border: "1px solid rgba(251,191,36,0.32)",
            backgroundColor: "rgba(251,191,36,0.08)",
            color: "#fbbf24",
            fontSize: "11.5px",
            fontWeight: 700,
            letterSpacing: "1.6px",
          }}
        >
          NAAC · NBA AUDIT READY
        </div>
      </div>

      {/* Headline — purple gradient text */}
      <div
        style={{
          display: "flex",
          marginTop: "82px",
          fontSize: "76px",
          fontWeight: 800,
          letterSpacing: "-1.2px",
          backgroundImage: "linear-gradient(90deg, #f3e8ff, #8b5cf6 62%, #6366f1)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {OG_HEADLINE}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "26px",
          fontSize: "20px",
          fontWeight: 400,
          color: "#94a3b8",
        }}
      >
        Automating placement drives, student eligibility, resume screening and
        interview workflows.
      </div>

      {/* Gold KPI callouts */}
      <div style={{ display: "flex", gap: "40px", marginTop: "42px" }}>
        <div style={kpiTile("gold")}>
          <div style={{ fontSize: "44px", fontWeight: 800, color: "#fbbf24" }}>
            {PLACED.value}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "2.2px",
              color: "rgba(251,191,36,0.75)",
            }}
          >
            {PLACED.label}
          </div>
        </div>

        <div style={kpiTile("gold")}>
          <div style={{ fontSize: "40px", fontWeight: 800, color: "#fbbf24" }}>
            {PACKAGE.value}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "2.2px",
              color: "rgba(251,191,36,0.75)",
            }}
          >
            {PACKAGE.label}
          </div>
        </div>

        <div style={kpiTile("purple")}>
          <div style={{ fontSize: "44px", fontWeight: 800, color: "#c4b5fd" }}>
            {OFFERS.value}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "2.2px",
              color: "rgba(196,181,253,0.8)",
            }}
          >
            {OFFERS.label}
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: "18px",
          borderTop: "1px solid rgba(168,85,247,0.35)",
          fontSize: "15px",
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex" }}>dull-dingos-fetch.freebuff.dev</div>
        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            fontSize: "12.5px",
            fontWeight: 700,
            letterSpacing: "2.4px",
          }}
        >
          STUDENT · TPO · RECRUITER
        </div>
      </div>
    </div>
  );
}

export default function OpengraphImage() {
  // On Next.js: return new ImageResponse(<OgCard />, { ...size });
  return <OgCard />;
}
