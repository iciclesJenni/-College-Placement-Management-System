/**
 * Dynamic sitemap metadata route — Placement Portal.
 *
 * ── Next.js App Router migration ────────────────────────────────────────────
 * This file follows the Next.js metadata route contract exactly: a default
 * export returning an array of sitemap entries, which Next.js serves as
 * /sitemap.xml. When the project moves onto Next.js, swap the local
 * `SitemapEntry` type for the framework type and nothing else changes:
 *
 *     import type { MetadataRoute } from "next";
 *     export default function sitemap(): MetadataRoute.Sitemap { … }
 *
 * ── Current stack ───────────────────────────────────────────────────────────
 * The live app is a Vite + React SPA, where metadata routes cannot execute at
 * request time. The same route table is therefore also emitted as a static
 * file at `public/sitemap.xml` (served at /sitemap.xml). `renderSitemapXml()`
 * below is the single source of truth used to regenerate that file, so the
 * two can never drift.
 */

/** Production canonical origin. Change here only — everything derives from it. */
export const CANONICAL_DOMAIN = "https://dull-dingos-fetch.freebuff.dev";

/** Mirrors `MetadataRoute.Sitemap[number]` without depending on `next`. */
export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

/**
 * Public, crawlable routes. Authenticated namespaces (/student/*, /tpo/*,
 * /company/*, /messages, /dashboard) and API surfaces are deliberately
 * absent and are additionally blocked in robots.txt.
 */
export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFrequency }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/auth", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "weekly" },
];

/** Builds absolute URLs against the canonical domain. */
export function absoluteUrl(path: string): string {
  return `${CANONICAL_DOMAIN}${path === "/" ? "" : path}`;
}

/**
 * Default export consumed by the Next.js metadata API — and callable directly
 * from any build script that needs to regenerate the static sitemap.
 */
export default function sitemap(): SitemapEntry[] {
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

/** Escapes XML-significant characters in URLs. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Renders the sitemap as standards-compliant XML (sitemaps.org 0.9).
 * Output is byte-identical to `public/sitemap.xml`.
 */
export function renderSitemapXml(entries: SitemapEntry[] = sitemap()): string {
  const urls = entries
    .map((entry) => {
      const lastModified =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : entry.lastModified;
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    <lastmod>${lastModified}</lastmod>` : null,
        entry.changeFrequency
          ? `    <changefreq>${entry.changeFrequency}</changefreq>`
          : null,
        entry.priority !== undefined
          ? `    <priority>${entry.priority.toFixed(1)}</priority>`
          : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}
