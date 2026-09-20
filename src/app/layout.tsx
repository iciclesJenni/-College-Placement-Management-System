/* eslint-disable react-refresh/only-export-components -- this is a metadata
   manifest, not a component module: `metadata`, `viewport`, and `ogCardCopy`
   are exported alongside the root layout shell, exactly as Next.js requires. */

/**
 * Next.js App Router root metadata — the portal's metadata manifest.
 *
 * ── Stack note ──────────────────────────────────────────────────────────────
 * This repository runs as a Vite + React SPA, so this file is not executed
 * here. `src/components/SeoManager.tsx` applies the exact same values to the
 * live document head on every navigation, reading the shared registry in
 * `src/lib/seo.ts` — so the copy below can never drift from what ships.
 *
 * The file is the framework contract for the Next.js deployment shape:
 *
 *   1. Move it to `src/app/layout.tsx`.
 *   2. Replace the local `Metadata` interface with
 *      `import type { Metadata } from "next";`
 *   3. Keep exporting `metadata` and `viewport` exactly as they are.
 *
 * `title.template` is what makes every child route render as
 * "<Page name> | NexusPlacement Portal" without repeating the suffix.
 */

import type { ReactNode } from "react";
import {
  CANONICAL_ORIGIN,
  OG_HEADLINE,
  OG_IMAGE,
  OG_KPIS,
  OG_LOCALE,
  OG_TYPE,
  SITE_NAME,
  TITLE_TEMPLATE,
  TWITTER_CARD,
  VALUE_PROPOSITION,
} from "@/lib/seo";

/**
 * Structural stand-in for Next.js's `Metadata` type — kept local because the
 * `next` package is not installed in this SPA build.
 */
interface Metadata {
  metadataBase: URL;
  title: { template: string; default: string };
  description: string;
  applicationName: string;
  manifest: string;
  icons: { url: string; type: string }[];
  alternates: { canonical: string };
  openGraph: {
    type: string;
    siteName: string;
    locale: string;
    url: string;
    title: string;
    description: string;
    images: {
      url: string;
      width: number;
      height: number;
      alt: string;
      type: string;
    }[];
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: { url: string; alt: string }[];
  };
  robots: {
    index: boolean;
    follow: boolean;
    googleBot: { index: boolean; follow: boolean; "max-image-preview": string };
  };
}

const SITE_TITLE = "NexusPlacement Portal — College Placement Management System";

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: { template: TITLE_TEMPLATE, default: SITE_TITLE },
  description: VALUE_PROPOSITION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  icons: [{ url: "/logo.svg", type: "image/svg+xml" }],
  // Relative canonical — resolved against `metadataBase` per route, so every
  // child page emits its own absolute canonical URL
  // (https://dull-dingos-fetch.freebuff.dev/<path>) and duplicate-content
  // variants (query strings, trailing slashes, staging hosts) consolidate
  // onto one indexed origin. The SPA runtime mirror of this behaviour is
  // SeoManager's per-route link[rel=canonical] upsert.
  alternates: { canonical: "./" },
  openGraph: {
    type: OG_TYPE,
    siteName: SITE_NAME,
    locale: OG_LOCALE,
    url: CANONICAL_ORIGIN,
    title: SITE_TITLE,
    description: VALUE_PROPOSITION,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
        type: OG_IMAGE.type,
      },
    ],
  },
  twitter: {
    card: TWITTER_CARD,
    title: SITE_TITLE,
    description: VALUE_PROPOSITION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  themeColor: "#030307",
  colorScheme: "dark" as const,
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout shell. On Next.js this is where the font variables, providers,
 * and global stylesheet mount; in the SPA the same responsibilities live in
 * `src/main.tsx` and `index.html`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#030307",
          color: "#e2e8f0",
          margin: 0,
          fontFamily: "Outfit, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}

/** Re-exported so the card copy and the artwork stay in one place. */
export const ogCardCopy = { headline: OG_HEADLINE, kpis: OG_KPIS };
