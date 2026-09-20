/**
 * SEO metadata registry — hierarchical route titles + descriptions.
 *
 * ── Stack note ──────────────────────────────────────────────────────────────
 * This is a Vite + React SPA, so the Next.js `metadata` export is not
 * executed here. The live implementation is a route-driven metadata manager
 * (`src/components/SeoManager.tsx`) mounted inside `<BrowserRouter>`, which
 * applies these values to `document.title`, the `<meta>` tags (description,
 * OpenGraph, Twitter), and the canonical link on every navigation.
 *
 * The same constants feed the Next.js contract files — `src/app/layout.tsx`
 * (title template, OG/Twitter metadata, robots) and
 * `src/app/opengraph-image.tsx` (the 1200×630 card route) — and the static
 * defaults in `index.html`, so one registry drives every surface.
 *
 * The `title.template` behaviour is reproduced exactly: child routes render
 * their page name and get the site suffix appended, while `absolute: true`
 * titles bypass the template (used for the landing page and 404).
 *
 * On a Next.js migration, this table maps 1:1 to `metadata` exports:
 *
 *     export const metadata: Metadata = { title: "Student Command Center" };
 *     // root layout: title: { template: "%s | NexusPlacement Portal", default: … }
 */

export const SITE_NAME = "NexusPlacement Portal";

/** Root `title.template` — `%s` is replaced by the page's own title. */
export const TITLE_TEMPLATE = "%s | NexusPlacement Portal";

/** Fallback used when a route has no registered metadata. */
export const DEFAULT_TITLE = "NexusPlacement Portal — College Placement Management";

/** Canonical production origin (matches src/app/sitemap.ts). */
export const CANONICAL_ORIGIN = "https://dull-dingos-fetch.freebuff.dev";

/**
 * Anchor value proposition — 156 characters, so search engines render it
 * whole. Shared by the landing route, the static index.html defaults, and the
 * Next.js metadata manifest in src/app/layout.tsx.
 */
export const VALUE_PROPOSITION =
  "NexusPlacement: enterprise campus recruitment management platform automating college placement drives, student eligibility, resume screening and interviews.";

/** Headline baked into the social card (purple gradient text). */
export const OG_HEADLINE = "NexusPlacement — Campus placements, systematized";

/** Gold KPI callouts baked into the social card, in render order. */
export const OG_KPIS = [
  { value: "85%", label: "STUDENTS PLACED" },
  { value: "₹44 LPA", label: "HIGHEST PACKAGE" },
  { value: "412", label: "OFFERS RELEASED" },
] as const;

/** Screen-reader / crawler description of the artwork. */
export const OG_ALT = `${OG_HEADLINE}. ${OG_KPIS.map(
  (kpi) => `${kpi.value} ${kpi.label.toLowerCase()}`,
).join(" · ")}.`;

/**
 * OpenGraph / Twitter artwork — the 1200×630 obsidian-purple-gold card.
 * Rasterised by `scripts/generate-og-image.mjs` (bun run og:image) from
 * `public/og-image.svg`; the Next.js request-time equivalent lives in
 * `src/app/opengraph-image.tsx`.
 */
export const OG_IMAGE = {
  path: "/og-image.png",
  url: `${CANONICAL_ORIGIN}/og-image.png`,
  type: "image/png",
  width: 1200,
  height: 630,
  alt: OG_ALT,
} as const;

/** Card-level social metadata shared by every route. */
export const OG_LOCALE = "en_IN";
export const OG_TYPE = "website";
export const TWITTER_CARD = "summary_large_image";

/** Applies the root template, mirroring Next.js `title.template` semantics. */
export function applyTitleTemplate(
  pageTitle: string,
  absolute = false,
): string {
  if (absolute || pageTitle.includes(SITE_NAME)) return pageTitle;
  return TITLE_TEMPLATE.replace("%s", pageTitle);
}

export interface RouteMeta {
  /**
   * Exact path, or a matcher for dynamic routes. String patterns may include
   * `:param` segments (e.g. `/tpo/drives/:id/applicants`).
   */
  path: string;
  /** Page-level title — the template appends the site suffix. */
  title: string;
  description: string;
  /** Bypass the template (landing page, error pages). */
  absolute?: boolean;
  /** Not indexed — dashboard, auth, and error surfaces. */
  noIndex?: boolean;
}

/**
 * Route table — ordered from most specific to least so the first match wins.
 * Role-specific titles are deliberate: they tell a recruiter, TPO, or student
 * exactly which workspace a tab belongs to when several are open.
 *
 * Every `description` is tuned to 150–160 characters — long enough to state the
 * value proposition with a concrete differentiator, short enough that search
 * engines render it without truncation. `__tests__`-style verification of the
 * length window lives in the summary script; keep new entries in range.
 *
 * Anchoring value proposition (echoed across public pages) — see
 * `VALUE_PROPOSITION`, which every description compresses to fit 150–160.
 */
export const ROUTE_META: RouteMeta[] = [
  // ─── Public ───────────────────────────────────────────────────────────────
  {
    path: "/",
    title: "NexusPlacement Portal — College Placement Management System",
    description: VALUE_PROPOSITION,
    absolute: true,
  },
  {
    path: "/auth",
    title: "Sign In",
    description:
      "Sign in to NexusPlacement: the enterprise campus recruitment platform automating placement drives, student eligibility, resume screening and interviews.",
    noIndex: true,
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions",
    description:
      "Answers on NexusPlacement eligibility calculations, Google Meet interview links, institutional resume formatting and delayed offer package escalation.",
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description:
      "NexusPlacement usage terms: the One-Job Policy, eligibility criteria, interview attendance rules, recruiter confidentiality and institutional TPO audit rights.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How NexusPlacement protects student academic data and resumes, what is shared with accredited campus recruiters, and how cookies and sessions are retained.",
  },

  // ─── Student workspace ────────────────────────────────────────────────────
  {
    path: "/student/dashboard",
    title: "Student Command Center",
    description:
      "Your NexusPlacement command center: CGPA and backlog standing, eligible campus drives, live application pipeline and upcoming interviews with Meet links.",
    noIndex: true,
  },
  {
    path: "/student/drives",
    title: "Placement Drive Catalog",
    description:
      "Browse NexusPlacement campus drives with automated eligibility checks, tier classification, application deadlines and one-click apply for roles you qualify for.",
    noIndex: true,
  },
  {
    path: "/student/drives/:id",
    title: "Drive Details",
    description:
      "Full NexusPlacement drive breakdown: eligibility checklist, hiring rounds, compensation package, application deadline and live status for this company role.",
    noIndex: true,
  },
  {
    path: "/student/applications",
    title: "Application Pipeline Tracker",
    description:
      "Track every NexusPlacement application from applied through assessment, technical and HR interviews to offer or rejection, with complete round history.",
    noIndex: true,
  },
  {
    path: "/student/profile",
    title: "Profile & Resume Studio",
    description:
      "Maintain verified academics, skills and projects on NexusPlacement, then export a standardized single-page institutional resume for campus recruiters.",
    noIndex: true,
  },
  {
    path: "/student/vault",
    title: "Document Vault",
    description:
      "Store official transcripts, marksheets and offer letters in the NexusPlacement document vault with TPO audit review and tamper-evident SHA-256 verification.",
    noIndex: true,
  },
  {
    path: "/student/notifications",
    title: "Notification Center",
    description:
      "NexusPlacement alerts: interview slot assignments, application stage changes, offer releases and campus drive deadline reminders for your recruitment cycle.",
    noIndex: true,
  },
  {
    path: "/student/announcements",
    title: "Placement Announcements",
    description:
      "Official NexusPlacement placement cell broadcasts with priority tags, cohort targeting and actionable calls to action for upcoming drives and deadlines.",
    noIndex: true,
  },

  // ─── TPO workspace ────────────────────────────────────────────────────────
  {
    path: "/tpo/dashboard",
    title: "TPO Institutional Analytics",
    description:
      "NexusPlacement TPO analytics: overall placement rate, CTC distribution, branch-wise performance and live drive progress across your institution cycle.",
    noIndex: true,
  },
  {
    path: "/tpo/drives",
    title: "Drive Management",
    description:
      "Create, monitor and close NexusPlacement campus drives with eligibility cutoffs, eligible branches, hiring rounds and real-time applicant tracking dashboards.",
    noIndex: true,
  },
  {
    path: "/tpo/drives/create",
    title: "Create Placement Drive",
    description:
      "Configure a new NexusPlacement drive: company details, CTC package, eligibility CGPA and backlog cutoffs, eligible branches, hiring rounds and deadlines.",
    noIndex: true,
  },
  {
    path: "/tpo/drives/:id/applicants",
    title: "Applicant Tracking",
    description:
      "NexusPlacement applicant tracking: screen, filter and progress candidates through hiring stages with bulk shortlisting, resume preview drawer and CSV export.",
    noIndex: true,
  },
  {
    path: "/tpo/drives/:id/schedule",
    title: "Interview Scheduler",
    description:
      "NexusPlacement interview scheduler: generate conflict-free slots from daily windows, assign shortlisted candidates and issue Google Meet links automatically.",
    noIndex: true,
  },
  {
    path: "/tpo/students",
    title: "Student Directory & Verification",
    description:
      "Search the NexusPlacement student register, verify academic records, override placement status and export verified candidate lists with full audit logging.",
    noIndex: true,
  },
  {
    path: "/tpo/broadcasts",
    title: "Broadcast Composer",
    description:
      "Publish cohort-targeted NexusPlacement placement announcements across in-app, email and webhook channels with real-time delivery receipts and priority alerts.",
    noIndex: true,
  },
  {
    path: "/tpo/reports",
    title: "Institutional Reports",
    description:
      "NexusPlacement institutional audit reports: NAAC/NBA-ready batch summaries, departmental placement rates and company-wise CTC distribution as PDF or Excel.",
    noIndex: true,
  },
  {
    path: "/tpo/audit",
    title: "Security Audit Trail",
    description:
      "NexusPlacement security audit trail: every privileged admin action logged with actor, IP address, timestamp and field-level diffs for compliance reviews.",
    noIndex: true,
  },
  {
    path: "/tpo/applications",
    title: "Placement Overview",
    description:
      "NexusPlacement placement overview: monitor applications across every active campus drive with stage-level visibility for the Training & Placement office.",
    noIndex: true,
  },

  // ─── Recruiter workspace ──────────────────────────────────────────────────
  {
    path: "/company/dashboard",
    title: "Recruiter Candidate Screening",
    description:
      "Recruiter candidate screening on NexusPlacement: review applicants registered for your campus drives and progress them through your hiring pipeline stages.",
    noIndex: true,
  },
  {
    path: "/company/drives/:id/matches",
    title: "AI Candidate Matching",
    description:
      "NexusPlacement AI candidate matching: eligible applicants ranked by AI compatibility score with skill-gap breakdowns and one-click batch shortlisting.",
    noIndex: true,
  },

  // ─── Shared ───────────────────────────────────────────────────────────────
  {
    path: "/messages",
    title: "Messages",
    description:
      "Secure real-time NexusPlacement messaging between recruiters, the placement cell and shortlisted candidates, with read receipts and offer negotiation.",
    noIndex: true,
  },
  {
    path: "/dashboard",
    title: "Placement Dashboard",
    description:
      "Your role-specific NexusPlacement workspace: placement analytics, campus drive management and candidate screening in one enterprise recruitment platform.",
    noIndex: true,
  },
];

export interface ResolvedMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex: boolean;
}

/** Converts a `:param` pattern into a regex for dynamic route matching. */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .split("/")
    .map((segment) =>
      segment.startsWith(":")
        ? "[^/]+"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${escaped}/?$`);
}

const COMPILED = ROUTE_META.map((meta) => ({
  meta,
  exact: !meta.path.includes(":"),
  regex: meta.path.includes(":") ? patternToRegex(meta.path) : null,
}));

/**
 * Resolves metadata for a pathname. Falls back to the default title so an
 * unregistered route still gets a sane, templated title.
 */
export function resolveRouteMeta(pathname: string): ResolvedMeta {
  const clean = pathname.replace(/\/+$/, "") || "/";

  const match = COMPILED.find(({ meta, exact, regex }) =>
    exact ? meta.path === clean : regex?.test(clean) ?? false,
  );

  if (!match) {
    return {
      title: applyTitleTemplate("Page Not Found"),
      description:
        "Signal lost in the grid — this NexusPlacement route or placement record does not exist. Head back to your dashboard to keep your placement cycle on track.",
      canonicalUrl: `${CANONICAL_ORIGIN}${pathname}`,
      noIndex: true,
    };
  }

  const { meta } = match;
  return {
    title: applyTitleTemplate(meta.title, meta.absolute),
    description: meta.description,
    canonicalUrl: `${CANONICAL_ORIGIN}${meta.path.replace(/:id/g, "listing")}`,
    noIndex: meta.noIndex ?? false,
  };
}
