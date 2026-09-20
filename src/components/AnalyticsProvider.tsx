import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { initAnalytics, trackPageView } from "@/services/analytics";

/**
 * Analytics provider — the SPA equivalent of mounting an analytics component
 * in a Next.js `app/layout.tsx`.
 *
 * MUST be rendered inside `<BrowserRouter>`: it consumes `useLocation()` to
 * emit page views on client-side navigation. Mounting it outside the router
 * would throw "useLocation() may be used only in the context of a <Router>".
 *
 * Renders nothing. In development (and when a privacy signal is present) every
 * call is a silent no-op.
 */
/**
 * Collapses dynamic segments to their route pattern so record IDs never reach
 * the analytics provider. `/tpo/drives/abc123/applicants` →
 * `/tpo/drives/:id/applicants`. Query strings are dropped entirely — they can
 * carry search terms and filter values.
 */
function normalizePath(pathname: string): string {
  return (
    pathname
      // cuid / uuid / numeric identifiers in a path segment
      .replace(/\/([a-z0-9]{20,}|[0-9a-f]{8}-[0-9a-f-]{27,}|\d+)(?=\/|$)/gi, "/:id")
      // anything that looks like a roll number
      .replace(/\/\d{2}[A-Z]{1,3}\d{4,}/g, "/:roll")
  );
}

export function AnalyticsProvider() {
  const location = useLocation();
  // Skip the first emission's duplicate — initAnalytics + first page view
  const trackPageViews = useRef(false);

  // One-time initialization (production only, DNT/GPC aware)
  useEffect(() => {
    initAnalytics();
  }, []);

  // Page views on every navigation
  useEffect(() => {
    // The first render is the initial page load, which providers count
    // automatically — emitting here would double-count it.
    if (!trackPageViews.current) {
      trackPageViews.current = true;
      return;
    }
    trackPageView(normalizePath(location.pathname));
  }, [location.pathname]);

  return null;
}
