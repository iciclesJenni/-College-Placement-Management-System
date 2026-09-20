import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  OG_IMAGE,
  OG_LOCALE,
  OG_TYPE,
  SITE_NAME,
  TWITTER_CARD,
  resolveRouteMeta,
} from "@/lib/seo";

/**
 * SeoManager — the SPA equivalent of Next.js metadata resolution in a root
 * `app/layout.tsx`.
 *
 * MUST render inside `<BrowserRouter>` (it consumes `useLocation`). On every
 * navigation it applies the resolved metadata to the real document head:
 *
 *   • document.title          — hierarchical, template-applied
 *   • meta[name=description]  — rewritten per route
 *   • og:title / og:description / og:url / og:type / og:locale
 *   • og:image + dimensions + alt (the generated 1200×630 card)
 *   • twitter:card / twitter:title / twitter:description / twitter:image
 *   • link[rel=canonical]     — one per page, never duplicated
 *   • meta[name=robots]       — noindex on authenticated workspaces
 *
 * All tags are created once and mutated in place, so no duplicate meta tags
 * accumulate across client-side navigations.
 */

/** Creates or updates a `<meta>` tag identified by name or property. */
function upsertMeta(
  key: "name" | "property",
  value: string,
  content: string,
): void {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${key}="${value}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/** Single canonical link, updated in place. */
function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const meta = resolveRouteMeta(location.pathname);

    // ── Title (hierarchical, template-applied) ──────────────────────────────
    document.title = meta.title;

    // ── Primary description ────────────────────────────────────────────────
    upsertMeta("name", "description", meta.description);

    // ── Open Graph ─────────────────────────────────────────────────────────
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", meta.canonicalUrl);
    upsertMeta("property", "og:type", OG_TYPE);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", OG_LOCALE);
    upsertMeta("property", "og:image", OG_IMAGE.url);
    upsertMeta("property", "og:image:secure_url", OG_IMAGE.url);
    upsertMeta("property", "og:image:type", OG_IMAGE.type);
    upsertMeta("property", "og:image:width", String(OG_IMAGE.width));
    upsertMeta("property", "og:image:height", String(OG_IMAGE.height));
    upsertMeta("property", "og:image:alt", OG_IMAGE.alt);

    // ── Twitter / X ────────────────────────────────────────────────────────
    upsertMeta("name", "twitter:card", TWITTER_CARD);
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:image", OG_IMAGE.url);
    upsertMeta("name", "twitter:image:alt", OG_IMAGE.alt);

    // ── Canonical + indexing directives ────────────────────────────────────
    upsertCanonical(meta.canonicalUrl);
    upsertMeta(
      "name",
      "robots",
      meta.noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large",
    );
  }, [location.pathname]);

  return null;
}
