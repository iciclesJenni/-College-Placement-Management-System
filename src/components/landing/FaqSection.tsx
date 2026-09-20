import { useMemo, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Target,
  Video,
  FileText,
  Clock,
  ShieldCheck,
  Users,
  Building2,
  GraduationCap,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

/**
 * Landing-page FAQ — accessible Radix accordion covering the questions
 * students, recruiters, and TPOs actually ask. Frosted glass items, amber
 * icon tiles, and a purple accent toggle that rotates on expand.
 *
 * Accessibility: built on Radix Accordion primitives, so triggers are
 * real buttons with aria-expanded / aria-controls wiring, arrow-key
 * navigation between items, and Home/End support.
 */

type Audience = "student" | "recruiter" | "tpo";

interface FaqItem {
  id: string;
  audience: Audience;
  icon: typeof Target;
  question: string;
  /** Short lead-in shown above the answer body */
  summary: string;
  bullets: string[];
  footnote?: string;
}

const AUDIENCE_META: Record<
  Audience,
  { label: string; icon: typeof GraduationCap }
> = {
  student: { label: "Students", icon: GraduationCap },
  recruiter: { label: "Recruiters", icon: Building2 },
  tpo: { label: "TPO Office", icon: Users },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "eligibility",
    audience: "student",
    icon: Target,
    question: "How is my eligibility for a drive actually calculated?",
    summary:
      "Four gates are evaluated the moment you open a drive — and again server-side when you apply.",
    bullets: [
      "Cutoff CGPA — your verified CGPA must be greater than or equal to the drive's minimum. Boundary values are inclusive: a drive requiring 8.0 accepts exactly 8.0.",
      "Active backlogs — your current active backlog count must not exceed the drive's permitted maximum. Cleared history is not counted.",
      "Eligible branches — only the departments listed on the drive posting qualify. Cross-branch applications are blocked even when academic thresholds are met.",
      "One-Job Policy tier — if you hold an accepted offer, you may only apply upward: Tier 1 (below ₹6 LPA) unlocks Dream and Super Dream; a Tier 2 (₹6–10 LPA) offer unlocks Super Dream only; an accepted Super Dream (above ₹10 LPA) offer freezes further applications.",
      "If any gate fails, the Apply button is replaced with a disabled status tag showing the exact reason on hover — for example, “Ineligible: Requires Min 8.0 CGPA — your CGPA is 7.20”.",
    ],
    footnote:
      "The same rule engine runs on the server when your application is submitted, so a stale browser tab can never submit an ineligible application.",
  },
  {
    id: "meet-links",
    audience: "student",
    icon: Video,
    question: "How do I get the Google Meet link for my interview?",
    summary:
      "Links are issued by the recruiter when a slot is assigned to you — never shared in group channels.",
    bullets: [
      "The TPO or recruiter defines the interview window (for example, 10:00 AM–4:00 PM), and the portal automatically splits it into 30-minute slots.",
      "When you are placed into a slot, the portal generates a unique video room link for that slot and attaches it to your application record.",
      "The link appears in three places at once: the Upcoming Interview card on your student dashboard, the round details inside your application pipeline, and the notification bell alert.",
      "Countdowns update live — the card flips to “LIVE NOW” and the button changes to “Join Interview Now” when your slot starts.",
      "Add the session to your calendar in one click with the .ics export (works with Google Calendar, Outlook, and Apple Calendar).",
    ],
    footnote:
      "Joining from the portal card is preferred — it confirms your attendance and avoids the no-show record described in the Terms of Service.",
  },
  {
    id: "resume-format",
    audience: "student",
    icon: FileText,
    question: "What formatting does the institutional resume follow?",
    summary:
      "One page, generated from your verified profile — no manual formatting decisions required.",
    bullets: [
      "Open Profile → Generate Resume to render the standardized single-page institutional format directly from your live profile data: name, contact line, education block, skills, and projects.",
      "Verified academic values and the gold “Academically Verified — Training & Placement Cell” seal are added automatically once your record carries TPO verification.",
      "Keep it to projects and skills you can defend in an interview; the AI matching engine parses the same resume to compute your compatibility score, so keyword stuffing hurts rather than helps.",
      "Upload PDF only, under 5 MB, in the Document Vault if a recruiter requests a copy through the vault flow. Every uploaded document is fingerprinted with a SHA-256 hash for tamper evidence.",
      "Export with Download PDF / Print — the output is already A4-formatted and stays on a single page.",
    ],
    footnote:
      "Scan the preview before exporting: recruiters receive exactly what the preview shows.",
  },
  {
    id: "package-delay",
    audience: "student",
    icon: Clock,
    question: "What if my offer letter or package details are delayed?",
    summary:
      "Escalate through the built-in offer workflow — every step is timestamped and auditable.",
    bullets: [
      "Check the offer timeline first: offers are negotiated and accepted inside the portal, where each milestone (extended → viewed → extension requested → accepted/declined) is stamped and visible on your offer card.",
      "If the company is silent past the stated response window, use the messaging hub thread on that drive to raise the query — recruiters and the TPO office see the same thread, so nothing gets lost between channels.",
      "Request a formal extension from the offer card if you need more decision time; the TPO office is notified automatically and the offer status flips to “Extension Requested” pending approval.",
      "If the package communicated at offer stage differs from the drive posting, report it to the TPO office immediately. Offer integrity is a Terms of Service obligation on the recruiting partner, and verified discrepancies can suspend that partner from future cycles.",
      "Accepted offers generate a digitally signature-verified record with a SHA-256 hash over the acceptance terms, so the agreed package is always reconstructable.",
    ],
    footnote:
      "Never accept or decline verbally outside the portal — only in-portal actions carry institutional protection.",
  },
  {
    id: "recruiter-screening",
    audience: "recruiter",
    icon: Users,
    question: "How do I screen and shortlist candidates efficiently?",
    summary:
      "Rank first, then act in bulk — the AI matching view orders candidates by compatibility score.",
    bullets: [
      "Open your drive → AI Matches to see every eligible applicant ranked by an AI compatibility score built from skills, project relevance, and academic fit.",
      "The ELITE MATCHES counter highlights the qualified pool — anyone scoring 60% or above — so you can gauge pipeline depth at a glance.",
      "Expand “Why this score?” on any candidate to inspect the factor breakdown: matched skills, missing skills, and the weight each carries.",
      "Shortlist for Tech Round directly from the ranked list, or use the batch selection in the applicant tracker to bulk-shortlist, reject, or bundle resume downloads.",
      "Every shortlisting action is logged in the institutional audit ledger with actor, timestamp, and the candidate set affected.",
    ],
  },
  {
    id: "tpo-audit",
    audience: "tpo",
    icon: ShieldCheck,
    question: "What audit and verification controls does the TPO office have?",
    summary:
      "Administrative authority over every record, with each action written immutably to the ledger.",
    bullets: [
      "Verify or correct academic records — CGPA, backlog counts, and verification status — from the Students Directory. Verified fields are locked for students and change only through this path.",
      "Every override is written to the Audit Trail with actor identity, IP address, timestamp, and field-level before → after diffs, exportable as CSV or JSON for NAAC/NBA submissions.",
      "Reclassify drive tiers, progress or revert any application stage, and bulk-release offers; all stage changes dispatch student notifications automatically.",
      "Generate institutional reports — batch summaries, departmental placement rates, and company-wise CTC distributions — as formatted PDFs or multi-sheet Excel workbooks.",
      "Publish cohort-targeted broadcasts (all students, unplaced only, specific branches, or CGPA tiers) across in-app, email, and webhook/SMS channels with delivery receipts.",
    ],
  },
];

const FILTERS: { key: "all" | Audience; label: string }[] = [
  { key: "all", label: "All questions" },
  { key: "student", label: "Students" },
  { key: "recruiter", label: "Recruiters" },
  { key: "tpo", label: "TPO Office" },
];

export function FaqSection() {
  const [filter, setFilter] = useState<"all" | Audience>("all");

  const visible = useMemo(
    () => (filter === "all" ? FAQ_ITEMS : FAQ_ITEMS.filter((f) => f.audience === filter)),
    [filter],
  );

  return (
    <section id="faq" className="border-b-2 border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 py-20">
        {/* Heading */}
        <div className="mb-10">
          <div className="nb-tag bg-accent/15 text-accent mb-4">
            <HelpCircle className="h-3 w-3 mr-1.5" aria-hidden="true" />
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Questions, answered
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
            The queries students, recruiters, and the placement office ask
            most — eligibility maths, interview links, resume format, and what
            happens when an offer package is delayed.
          </p>
        </div>

        {/* Audience filter */}
        <div
          className="flex flex-wrap items-center gap-2 mb-6"
          role="group"
          aria-label="Filter questions by role"
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`text-[10px] font-black px-3.5 py-2 rounded-full border inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-500/40 shadow-lg shadow-purple-950/40"
                    : "border-purple-950/40 bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-slate-100 hover:border-purple-500/40"
                }`}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="opacity-70">
                    {FAQ_ITEMS.filter((i) => i.audience === f.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Accordion */}
        <AccordionPrimitive.Root
          type="single"
          collapsible
          defaultValue={visible[0]?.id}
          key={filter}
          className="space-y-3"
        >
          {visible.map((item) => {
            const Icon = item.icon;
            const audience = AUDIENCE_META[item.audience];
            const AudienceIcon = audience.icon;
            return (
              <AccordionPrimitive.Item
                key={item.id}
                value={item.id}
                className="rounded-2xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-purple-500/40 data-[state=open]:border-purple-500/40 data-[state=open]:shadow-lg data-[state=open]:shadow-purple-950/40"
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="group flex flex-1 items-start gap-3 p-4 md:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-inset">
                    {/* Amber icon tile */}
                    <span className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-black text-slate-100 leading-snug">
                        {item.question}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                        <AudienceIcon className="h-2.5 w-2.5" aria-hidden="true" />
                        {audience.label}
                      </span>
                    </span>

                    {/* Purple accent toggle */}
                    <span className="w-7 h-7 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center shrink-0 transition-all duration-300 group-data-[state=open]:bg-gradient-to-r group-data-[state=open]:from-purple-600 group-data-[state=open]:to-indigo-600 group-data-[state=open]:border-purple-500/50">
                      <ChevronDown className="h-3.5 w-3.5 text-purple-300 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-white" aria-hidden="true" />
                    </span>
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>

                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-4 md:px-5 pb-5 pt-0">
                    {/* Amber left-rule lead-in */}
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed border-l-2 border-amber-500/30 pl-3 mb-4">
                      {item.summary}
                    </p>
                    <ul className="space-y-2.5">
                      {item.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span className="text-xs text-slate-300 leading-relaxed">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {item.footnote && (
                      <p className="mt-4 text-[10px] text-slate-500 font-semibold border-t border-purple-950/40 pt-3">
                        {item.footnote}
                      </p>
                    )}
                  </div>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            );
          })}
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}

export default FaqSection;
