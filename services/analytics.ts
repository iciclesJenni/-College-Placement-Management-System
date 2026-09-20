/**
 * Client analytics — lightweight, privacy-respecting, production-only.
 *
 * ── Stack note ──────────────────────────────────────────────────────────────
 * This is a Vite + React SPA, so there is no `src/app/layout.tsx`. The
 * framework-equivalent bootstrap is `src/main.tsx`, and the route-aware
 * provider lives in `src/components/AnalyticsProvider.tsx` (mounted inside
 * `<BrowserRouter>` so it can hook `useLocation`).
 *
 * ── Privacy posture ─────────────────────────────────────────────────────────
 *  • Default provider is Simple Analytics — cookie-free and GDPR-compliant
 *    without a consent banner.
 *  • GA4 is opt-in (only loads when a measurement ID is configured) and
 *    requires consent, so it is gated behind an explicit flag.
 *  • `navigator.doNotTrack` / Global Privacy Control are always honoured —
 *    when either is set, nothing loads and every track() call is a no-op.
 *  • No PII ever leaves the browser: `sanitize()` strips emails, roll
 *    numbers, and any field not on the allow-list.
 *
 * ── Activation ──────────────────────────────────────────────────────────────
 *   1. Production build only (`import.meta.env.PROD`) — matches the
 *      `process.env.NODE_ENV === 'production'` requirement, using Vite's
 *      compile-time equivalent.
 *   2. Scripts are injected at runtime, never bundled into the app shell.
 */

declare global {
  interface Window {
    sa_event?: (name: string, props?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Conversion events tracked across the portal. */
export type AnalyticsEvent =
  | "Drive_Applied"
  | "Resume_Generated"
  | "Demo_Role_Switched"
  | "Drive_Created"
  | "Candidate_Shortlisted"
  | "Offer_Accepted"
  | "Broadcast_Published"
  | "Report_Exported"
  | "Page_View";

type AnalyticsProvider = "simple-analytics" | "ga4" | "none";

/** Props are string/number/boolean only — never objects or PII. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

const ENV = import.meta.env as Record<string, string | boolean | undefined>;

const PROVIDER: AnalyticsProvider =
  (ENV.VITE_ANALYTICS_PROVIDER as AnalyticsProvider | undefined) ??
  "simple-analytics";

const SIMPLE_ANALYTICS_KEY = ENV.VITE_SIMPLE_ANALYTICS_KEY as string | undefined;
const GA4_MEASUREMENT_ID = ENV.VITE_GA4_MEASUREMENT_ID as string | undefined;

/** GA4 needs cookie consent; opt in explicitly to load it. */
const GA4_CONSENTED = ENV.VITE_GA4_CONSENT === "granted";

let initialized = false;

/** True only in a production build. Dev and preview stay completely silent. */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/** Privacy signals — when set, we neither load scripts nor send events. */
function privacyOptOut(): boolean {
  if (typeof navigator === "undefined") return true;
  const dnt =
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack === "1";
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
    .globalPrivacyControl;
  return dnt || gpc === true;
}

/**
 * Strips anything that looks like personal data. Only allow-listed scalar
 * props survive; emails, roll numbers, and free text are dropped.
 */
const ALLOWED_KEYS = new Set([
  "driveId",
  "company",
  "tier",
  "role",
  "destination",
  "format",
  "stage",
  "cohort",
  "priority",
  "channel",
  "path",
  "count",
  "section",
]);

function sanitize(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    const str = String(value);
    // Drop anything email-like or length-suspicious
    if (str.includes("@") || str.length > 64) continue;
    out[key] = str;
  }
  return out;
}

function injectScript(src: string, attrs: Record<string, string> = {}): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  document.head.appendChild(script);
}

/**
 * Initialises the configured provider. Safe to call multiple times; only runs
 * once, only in production, and never when a privacy signal is present.
 */
export function initAnalytics(): void {
  if (initialized) return;
  if (!isProduction()) return;
  if (privacyOptOut()) return;

  if (PROVIDER === "simple-analytics") {
    // Cookie-free — no consent banner required.
    const attrs: Record<string, string> = {};
    if (SIMPLE_ANALYTICS_KEY) attrs["data-api-key"] = SIMPLE_ANALYTICS_KEY;
    injectScript("https://scripts.simpleanalyticscdn.com/latest.js", attrs);
    initialized = true;
    return;
  }

  if (PROVIDER === "ga4") {
    if (!GA4_MEASUREMENT_ID || !GA4_CONSENTED) return;
    injectScript(
      `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`,
    );
    window.dataLayer = window.dataLayer ?? [];
    // gtag's standard bootstrap — arguments object, not a rest param.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: false,
    });
    initialized = true;
  }
}

/**
 * Records a custom conversion event. No-ops in development, respects privacy
 * signals, and sanitises props so no PII is transmitted.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!isProduction() || privacyOptOut()) return;

  const payload = sanitize(props);

  try {
    if (PROVIDER === "simple-analytics") {
      window.sa_event?.(event, payload);
      return;
    }
    if (PROVIDER === "ga4") {
      window.gtag?.("event", event, payload);
    }
  } catch {
    // Analytics must never break the app.
  }
}

/** SPA page view — call on every route change. */
export function trackPageView(path: string): void {
  track("Page_View", { path });
}

/** True when analytics is active in this environment (for UI hints). */
export function analyticsActive(): boolean {
  return isProduction() && !privacyOptOut() && PROVIDER !== "none";
}
