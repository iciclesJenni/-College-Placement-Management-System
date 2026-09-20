import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  ScrollText,
  Lock,
  Ban,
  ShieldAlert,
  Gavel,
  Eye,
  ArrowLeft,
  ChevronRight,
  Building2,
  Mail,
  TrendingUp,
  LockKeyhole,
  UserCheck,
  Target,
} from "lucide-react";

/**
 * Terms of Service & Placement Portal Usage Guidelines — the binding
 * conduct agreement between students, recruiters, and the Training &
 * Placement Cell. Covers the institutional One-Job Policy, academic
 * fraud consequences, interview attendance accountability, recruiter
 * confidentiality, and TPO audit rights.
 *
 * Styled strictly in the obsidian / electric purple / subtle gold theme.
 */

const LAST_UPDATED = "September 20, 2026";

interface Clause {
  heading: string;
  body: string[];
  /** Severity accent for the heading marker */
  severity?: "gold" | "rose";
}

interface Section {
  id: string;
  icon: typeof ScrollText;
  title: string;
  intro: string;
  clauses: Clause[];
}

const SECTIONS: Section[] = [
  {
    id: "one-job-policy",
    icon: Lock,
    title: "1. The Institutional One-Job Policy",
    intro:
      "The placement process exists to place every eligible student once, fairly. The One-Job Policy is how we guarantee it.",
    clauses: [
      {
        heading: "Tier classification",
        body: [
          "Every registered drive is classified by annual compensation at the time of publication: Tier 1 — Core/Regular (below ₹6 LPA), Tier 2 — Dream (₹6–10 LPA), and Tier 3 — Super Dream (above ₹10 LPA). Classification is set by the TPO office and is not negotiable per candidate.",
        ],
      },
      {
        heading: "The upgrade rule",
        body: [
          "A student holding an offer in one tier may apply only to drives in strictly higher tiers. A Tier 1 offer unlocks Tier 2 and Tier 3 drives; a Tier 2 offer unlocks Tier 3 drives only. Lateral movement within the same tier — or downward — is blocked automatically by the portal's eligibility engine, regardless of interest.",
          "A student who accepts a Super Dream (Tier 3) offer is placed-final. The account is frozen (PLACED_LOCKED) and no further applications are possible in the cycle. This freeze is not appealable.",
        ],
        severity: "gold",
      },
      {
        heading: "Offer acceptance windows",
        body: [
          "Offers must be accepted or declined within the window stated in the offer (typically 48–72 hours). Silence past the window is treated as a decline. Holding an unaccepted offer does not grant tier-upgrade privileges — only an accepted offer does.",
        ],
      },
      {
        heading: "No private arrangements",
        body: [
          "Accepting an offer outside the portal, then continuing to sit for drives as 'unplaced', is a direct violation of this policy and is treated under Section 2 (fraud).",
        ],
        severity: "rose",
      },
    ],
  },
  {
    id: "eligibility",
    icon: Target,
    title: "2. Eligibility Criteria",
    intro:
      "Eligibility is computed from your verified institutional record — never self-declared, never negotiable.",
    clauses: [
      {
        heading: "Minimum academic gates",
        body: [
          "Each drive publishes a minimum CGPA, a maximum permitted active backlogs count, and an eligible-branch list. The portal evaluates your verified record against these thresholds at the moment you attempt to apply; if any gate fails, the Apply action is blocked with the specific reason shown.",
          "Boundary cases are inclusive: a drive requiring a CGPA of 8.0 accepts a CGPA of exactly 8.0, and a drive permitting one active backlog accepts exactly one. Values are never rounded in the candidate's favor or against them.",
        ],
      },
      {
        heading: "Branch and batch restrictions",
        body: [
          "Only students in the branches and graduating batch listed on the drive posting are eligible. Cross-branch applications are blocked by the engine even when academic thresholds are met. Batch eligibility follows your declared graduation year in the student directory.",
        ],
      },
      {
        heading: "Verification prerequisite",
        body: [
          "Academic fields must carry TPO verification before high-value drives accept your application. Unverified records remain visible to you but can be rejected by the drive's eligibility check; verification requests submitted late in a cycle may not clear before a deadline.",
        ],
        severity: "gold",
      },
      {
        heading: "Duplicate applications",
        body: [
          "One application per drive per student. The system enforces this at the database level — a second submission for the same drive is rejected rather than merged, and refreshing during submission cannot create duplicates.",
        ],
      },
      {
        heading: "No discretionary overrides",
        body: [
          "Eligibility is not waived on request, and approaching a recruiter directly does not alter it. Genuine data errors are corrected only through the TPO verification path described in Section 6.",
        ],
      },
    ],
  },
  {
    id: "academic-integrity",
    icon: ShieldAlert,
    title: "3. Academic Integrity & Fraudulent Marks Entry",
    intro:
      "The eligibility engine is only as honest as the records behind it. Falsifying academic data corrupts the process for every student.",
    clauses: [
      {
        heading: "What constitutes fraud",
        body: [
          "Uploading altered marksheets or transcripts; misreporting CGPA, backlog counts, or clearing status; fabricating offer letters, experience claims, or project authorship; and impersonating another candidate in any assessment are all acts of academic fraud under this agreement.",
        ],
        severity: "rose",
      },
      {
        heading: "Consequences",
        body: [
          "First confirmed instance: immediate deactivation of portal access for the remainder of the placement cycle, revocation of all in-pipeline applications, and written notification to the department head. Placement records already communicated to companies are withdrawn with cause noted.",
          "Fraud discovered after placement: the Placement Cell is obligated to inform the employing company. Offer revocation by the employer, if it follows, is solely the student's responsibility — the institution bears no liability.",
          "Repeat or egregious cases are referred to the institution's disciplinary committee under the academic misconduct code, independent of placement consequences.",
        ],
        severity: "rose",
      },
      {
        heading: "Why verification exists",
        body: [
          "Academic fields are locked behind TPO verification precisely so that honest students compete on equal footing. The audit trail means every override and every document hash is reconstructable — fraud has no grey area here.",
        ],
        severity: "gold",
      },
    ],
  },
  {
    id: "student-conduct",
    icon: UserCheck,
    title: "4. Student Conduct & Interview Accountability",
    intro:
      "A no-show is not a personal choice — it spends the institution's credibility with the recruiting partner.",
    clauses: [
      {
        heading: "Commitment on application",
        body: [
          "Applying to a drive is a commitment to appear at every round you are shortlisted for — online assessments, technical and HR interviews, and scheduled Google Meet sessions. Slot assignments are binding appointments, not invitations.",
        ],
      },
      {
        heading: "No-show policy",
        body: [
          "An unexcused absence from a scheduled round results in the application being marked Rejected (No-Show) on the record. Two unexcused no-shows within a cycle suspend drive-application privileges for one month.",
          "No-shows at assessments arranged at institutional cost (proctored labs, external platforms) may additionally carry a cost-recovery charge at the TPO office's discretion.",
        ],
        severity: "gold",
      },
      {
        heading: "Legitimate withdrawal",
        body: [
          "Students may withdraw from a process without penalty by notifying the TPO office at least 24 hours before the scheduled round — earlier for assessments with external capacity limits. Documented medical or family emergencies are excused retroactively with proof.",
        ],
      },
      {
        heading: "Professional conduct",
        body: [
          "Candidates must join interviews on time, in appropriate dress, with a working camera and connection where a video round is scheduled. Harassment, bad faith, or misrepresentation toward recruiters is handled under the disciplinary path in Section 3.",
        ],
      },
      {
        heading: "Platform conduct",
        body: [
          "Portal accounts are personal and non-transferable; credential sharing is prohibited. Sending abusive, harassing, or misrepresentative messages to recruiters or TPO staff through the messaging hub, uploading unlawful or non-academic content to the document vault, or interfering with another student's records or applications are each violations of this agreement.",
        ],
        severity: "rose",
      },
      {
        heading: "Misuse of placement data",
        body: [
          "Directly contacting recruiters outside the portal to solicit interviews, or using access to the candidate directory for anything other than your own applications, undermines the process for every peer and is treated as misconduct.",
        ],
      },
      {
        heading: "Broadcast compliance",
        body: [
          "Official placement cell broadcasts carry binding deadlines — consent forms, slot bookings, and document submissions. Failure to action a broadcast marked Urgent or Critical within its stated window is your responsibility, not an excuse, and may result in a missed round being recorded as a no-show.",
        ],
        severity: "gold",
      },
    ],
  },
  {
    id: "company-confidentiality",
    icon: Building2,
    title: "5. Company Data Confidentiality",
    intro:
      "Recruiters trust the institution with their hiring information. That trust is a shared obligation.",
    clauses: [
      {
        heading: "Confidential materials",
        body: [
          "Assessment questions, interview formats, compensation structures shared during negotiation, and any candidate evaluation feedback are confidential to the recruiting partner and the Placement Cell. Recording, redistributing, or posting them (publicly or to peer groups) is prohibited.",
        ],
        severity: "rose",
      },
      {
        heading: "Recruiter obligations",
        body: [
          "Recruiter accounts receive candidate data strictly for their own live hiring processes. Sharing candidate profiles outside the hiring panel, retaining data after the process concludes, or using portal data for any non-hiring purpose (marketing, poaching databases, analytics resale) breaches this agreement and results in immediate account termination and partner review.",
        ],
        severity: "rose",
      },
      {
        heading: "Offer integrity",
        body: [
          "Companies must honor the compensation package stated in the drive posting at the time of offer. Reneging on released offers, or extending offers materially different from the published role, is reported to the Placement Committee and may suspend the partner from future cycles.",
        ],
        severity: "gold",
      },
    ],
  },
  {
    id: "tpo-audit-rights",
    icon: Eye,
    title: "6. Administrative TPO Audit Rights",
    intro:
      "The Training & Placement Cell holds administrative authority over the portal and every record in it.",
    clauses: [
      {
        heading: "Scope of authority",
        body: [
          "The TPO office may verify, correct, lock, or override academic records (CGPA, backlogs, verification status), reclassify drive tiers, progress or revert any application stage, override placement status, and audit any document in the vault — in each case with the action, actor, timestamp, and field-level change written to the immutable audit ledger.",
        ],
        severity: "gold",
      },
      {
        heading: "Finality of decisions",
        body: [
          "TPO determinations on eligibility, tier classification, shortlisting disputes, and policy interpretation are final within the placement process. Appeals route through the institution's designated grievance officer, not through the portal.",
        ],
      },
      {
        heading: "Compliance & accreditation use",
        body: [
          "Placement records, audit ledgers, and aggregate analytics may be compiled into institutional reports for NAAC/NBA accreditation, government returns, and internal review. These outputs contain aggregated or anonymized data; individual profiles are shared externally only per the Privacy Policy.",
        ],
      },
      {
        heading: "Service availability",
        body: [
          "The portal is provided as-is for the placement cycle. The TPO office may schedule maintenance windows, close drives, or modify eligibility criteria mid-cycle to reflect company requirements — changes are announced through the portal's broadcast system.",
        ],
      },
    ],
  },
  {
    id: "acceptance",
    icon: Gavel,
    title: "7. Acceptance & Contact",
    intro:
      "Using the portal — signing in, applying to a drive, or posting a drive — constitutes acceptance of these terms.",
    clauses: [
      {
        heading: "Effective date & changes",
        body: [
          "These guidelines are effective as of the date below and remain in force for the placement cycle. Material changes are announced via the portal's broadcast system before taking effect; continued use after announcement constitutes acceptance.",
        ],
      },
      {
        heading: "Contact & grievances",
        body: [
          "Training & Placement Cell — tpo@college.edu.in • Grievance Officer — grievance@college.edu.in. Policy questions are typically answered within 5 working days.",
        ],
      },
    ],
  },
];

const PILLARS = [
  {
    icon: TrendingUp,
    title: "One offer, upward only",
    desc: "Tier 1 → Dream → Super Dream. Lateral and downward moves are engine-blocked.",
  },
  {
    icon: Ban,
    title: "Zero tolerance for fraud",
    desc: "Falsified marks end your cycle — and may end your offer after it.",
  },
  {
    icon: LockKeyhole,
    title: "Slots are binding",
    desc: "Two unexcused no-shows suspend applications for a month.",
  },
  {
    icon: ShieldAlert,
    title: "Confidential by default",
    desc: "Assessments, offers, and feedback never leave the hiring process.",
  },
];

export default function TermsOfService() {
  const location = useLocation();

  // Scroll to top (or to a #hash section) whenever the page mounts
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location]);

  const severityColor = (s?: Clause["severity"]) =>
    s === "rose"
      ? "text-rose-400"
      : s === "gold"
        ? "text-amber-400"
        : "text-purple-300";

  return (
    <div className="nb-scene min-h-screen bg-background text-slate-100">
      <div className="nb-noise" aria-hidden="true" />

      {/* Header */}
      <header className="border-b border-purple-950/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-purple-950/40 bg-slate-900/80 flex items-center justify-center shrink-0">
              <ScrollText className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight uppercase">
                Placement Portal
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Terms & Usage Guidelines
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 border border-purple-950/40 bg-slate-900/60 rounded-full px-3 py-1">
            Updated {LAST_UPDATED}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 pb-28">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
            Terms of Service &amp;{" "}
            <span className="text-amber-400">Usage Guidelines</span>
          </h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-2xl">
            The binding agreement between students, recruiting partners, and
            the Training &amp; Placement Cell. Read it once — it governs every
            application, offer, and audit decision in the portal.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md p-4 flex items-start gap-3 transition-all duration-200 hover:border-purple-500/40"
              >
                <div className="w-9 h-9 rounded-lg border border-purple-950/40 bg-slate-950/80 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-100">{p.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table of contents */}
        <nav className="rounded-2xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md p-5 mb-10">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-amber-400" />
            Contents
          </p>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-xs font-bold text-slate-300 hover:text-purple-300 transition-colors flex items-center gap-2 py-1"
                >
                  <span className="text-amber-400 font-black">
                    {s.title.split(".")[0]}.
                  </span>
                  {s.title.split(". ").slice(1).join(". ")}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                className="rounded-2xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md p-6 md:p-8 scroll-mt-24 transition-all duration-200 hover:border-purple-800/50"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl border border-purple-950/40 bg-slate-950/80 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-100">
                    {section.title}
                  </h2>
                </div>

                <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-5 border-l-2 border-amber-500/30 pl-3">
                  {section.intro}
                </p>

                <div className="space-y-5">
                  {section.clauses.map((clause) => (
                    <div key={clause.heading}>
                      <h3
                        className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2 ${severityColor(clause.severity)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            clause.severity === "rose"
                              ? "bg-rose-400"
                              : clause.severity === "gold"
                                ? "bg-amber-400"
                                : "bg-purple-400"
                          }`}
                        />
                        {clause.heading}
                      </h3>
                      {clause.body.map((para, i) => (
                        <p
                          key={i}
                          className="text-xs text-slate-300 leading-relaxed mb-2 last:mb-0"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer contact strip */}
        <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 bg-slate-950/80 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-100">
              Questions about these terms?
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              The Training &amp; Placement Cell responds within 5 working days.
              See also our{" "}
              <a
                href="/privacy"
                className="text-purple-300 hover:text-purple-200 underline underline-offset-2"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <a
            href="mailto:tpo@college.edu.in"
            className="text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-lg shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2 justify-center"
          >
            <Building2 className="h-3.5 w-3.5" />
            Contact the TPO Cell
          </a>
        </div>

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 text-xs font-bold text-slate-400 hover:text-slate-100 inline-flex items-center gap-1.5 transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </button>
      </main>
    </div>
  );
}
