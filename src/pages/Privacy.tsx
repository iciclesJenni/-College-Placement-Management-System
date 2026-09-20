import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  ShieldCheck,
  GraduationCap,
  FileText,
  Scale,
  Cookie,
  Lock,
  Eye,
  Server,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  Mail,
  Building2,
  Clock,
  Database,
  Share2,
  Trash2,
} from "lucide-react";

/**
 * Institutional Privacy Policy — the compliance page for the Placement
 * Portal. Covers student academic data protection, resume sharing with
 * accredited recruiting partners, FERPA-aligned rights, and cookie /
 * session retention, styled in the obsidian / purple / gold identity.
 *
 * Last substantive review: September 2026.
 */

const LAST_UPDATED = "September 20, 2026";

interface Section {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  intro: string;
  blocks: { heading: string; body: string[] }[];
}

const SECTIONS: Section[] = [
  {
    id: "academic-data",
    icon: GraduationCap,
    title: "1. Student Academic Data Protection",
    intro:
      "Your academic record is the foundation of every placement decision, so it receives the strongest protections in the system.",
    blocks: [
      {
        heading: "What we collect",
        body: [
          "We store your roll number, name, institutional email, department, graduation year, CGPA, active and total backlog counts, phone number, resume link, and professional profile links (GitHub, LinkedIn, LeetCode). These fields exist for exactly one purpose: computing your eligibility for placement drives and presenting verified credentials to recruiters.",
          "Academic fields (CGPA, backlogs, verification status) are locked once verified by the Training & Placement Cell. They cannot be edited from a student account — any correction requires a TPO override, and every override is written to an immutable audit ledger recording who changed what, when, and from where.",
        ],
      },
      {
        heading: "How it is protected",
        body: [
          "All academic values are transmitted over encrypted connections and re-verified server-side on every eligibility check. The browser is treated as a rendering layer, never an authority — eligibility rules are recomputed from institutional records at the database, so client-side tampering has no effect.",
          "Documents in the Student Vault (transcripts, marksheets, offer letters) are fingerprinted with SHA-256 hashes at upload, so any post-approval modification is detectable during TPO audit review.",
        ],
      },
      {
        heading: "Placement status visibility",
        body: [
          "Your placement status (Not Placed / Placed / Opted Out) is visible to the TPO office and, for coordination purposes, to recruiters of drives you have applied to. It is never published to other students or public pages.",
        ],
      },
    ],
  },
  {
    id: "resume-sharing",
    icon: FileText,
    title: "2. Resume Sharing with Recruiting Companies",
    intro:
      "Your resume and profile are shared with recruiting partners under strict, purpose-limited conditions.",
    blocks: [
      {
        heading: "When your data is shared",
        body: [
          "Applying to a drive is an explicit act of consent. By clicking Apply, you authorize the Placement Cell to share your verified profile — resume, CGPA, department, backlog status, and skills — with that specific company for that specific hiring process.",
          "Shortlisted candidates' resumes may be bundled and transmitted to the company's HR team for interview scheduling. Bulk exports sent to companies contain only roll number, name, department, CGPA, backlog status, institutional email, and resume link — nothing more.",
        ],
      },
      {
        heading: "Who may receive it",
        body: [
          "Only accredited recruiting partners with a registered company drive in the portal receive candidate data. Recruiter accounts are role-restricted: they can view applicants for their own drives only, and cannot browse the wider student directory.",
          "We do not sell, rent, or trade student data. We do not share your data with third-party advertisers, brokers, or any company that has not posted a drive you applied to.",
        ],
      },
      {
        heading: "Your controls",
        body: [
          "You choose which drives to apply to — there is no automatic sharing. You may request removal of your resume from a specific recruiter's pipeline at any time by contacting the TPO office; shortlisting that has already been communicated to a company cannot be un-sent, but further access can be revoked.",
          "The AI matching feature parses uploaded resumes (skills, experience, projects) to compute compatibility scores for recruiters. Parsing happens on institutional infrastructure; resume contents are never used to train external models.",
        ],
      },
    ],
  },
  {
    id: "compliance",
    icon: Scale,
    title: "3. FERPA & Local Privacy Compliance",
    intro:
      "As an institutional education record system, the portal is operated in alignment with FERPA and applicable Indian data-protection law (DPDP Act, 2023).",
    blocks: [
      {
        heading: "Education records under FERPA",
        body: [
          "CGPA, marks, enrollment, and disciplinary backlog data in the portal constitute education records. Consistent with FERPA, they are disclosed to school officials with a legitimate educational interest — that means the TPO office and, for hiring purposes, recruiting partners acting as authorized agents of the institution during the placement process.",
          "Directory-level information (name, department, graduation year) may be shared per the institution's directory policy. You may opt out of directory disclosures by filing a request with the Registrar, which will be honored in the portal.",
        ],
      },
      {
        heading: "Your rights (DPDP / FERPA-aligned)",
        body: [
          "Access & correction — you may view all data held about you and request correction of factual errors. Academic corrections route through TPO verification to preserve record integrity.",
          "Consent & withdrawal — placement participation is voluntary; you may opt out of the placement process at any time, which stops all new data sharing while preserving application history for audit purposes.",
          "Grievance redressal — data concerns may be escalated to the institution's Data Protection Officer via the TPO office, with resolution tracked in the audit ledger.",
        ],
      },
      {
        heading: "Institutional oversight",
        body: [
          "The TPO Security Audit Trail records every privileged access and modification — verification toggles, CGPA overrides, bulk offer releases — with actor identity, IP address, timestamp, and field-level diffs. These records support internal compliance reviews and accreditation audits (NAAC/NBA).",
        ],
      },
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "4. Cookies & Session Retention",
    intro:
      "The portal uses a minimal, first-party-only cookie strategy. No advertising or third-party tracking cookies are set.",
    blocks: [
      {
        heading: "What we store",
        body: [
          "placement_portal_session (cookie, 12-hour lifetime) — carries your user ID, name, email, and role so the correct dashboard renders after page reloads. It is strictly necessary; the portal cannot maintain a signed-in session without it.",
          "Session storage mirror — an in-browser copy of the same session for reactive UI state. Both stores are cleared together on sign-out.",
          "Feature workspace stores (localStorage) — hold your in-progress profile edits, read/unread markers for announcements and messages, and document vault metadata so your workspace persists between visits. These never contain password material.",
        ],
      },
      {
        heading: "Retention periods",
        body: [
          "Active sessions expire after 12 hours and are deleted automatically on sign-out. Announcement read-state and workspace preferences persist until you sign out or clear browser data.",
          "Placement records (applications, offers, audit entries) are retained per institutional record-keeping policy — typically for the duration of your enrollment plus the accreditation audit cycle — and are not deleted merely because a session ends.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You may clear cookies and site data at any time through your browser; the only cost is signing in again. Blocking the session cookie entirely will prevent the portal from keeping you signed in across page loads.",
        ],
      },
    ],
  },
  {
    id: "security",
    icon: Lock,
    title: "5. Data Security",
    intro:
      "Security is enforced in depth — at the network, application, and process layers.",
    blocks: [
      {
        heading: "Technical measures",
        body: [
          "All traffic is served over HTTPS. Every database operation is authenticated and role-checked server-side; a student session cannot read another student's record or reach TPO/recruiter endpoints.",
          "Form inputs are validated end-to-end with typed schemas shared between client and server, and all data access is parameterized — eliminating injection-class attacks.",
        ],
      },
      {
        heading: "Process measures",
        body: [
          "Privileged actions require an authenticated session in the correct role and are logged immutably. Document authenticity is verified with cryptographic hashes. Session tokens expire on a fixed schedule and are invalidated on sign-out.",
        ],
      },
    ],
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "6. Your Rights & Contact",
    intro:
      "Questions, corrections, and complaints have a single, accountable channel.",
    blocks: [
      {
        heading: "Exercising your rights",
        body: [
          "Access, correction, deletion, and opt-out requests should be directed to the Training & Placement Cell. Students may act directly through the portal for most needs: editing profile fields, uploading replacement resumes, opting out of placement, and reviewing which drives hold their applications.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Training & Placement Cell — tpo@college.edu.in",
          "Data Protection Officer — dpo@college.edu.in",
          "Placement Division, institutional campus. Responses are typically issued within 5 working days.",
        ],
      },
    ],
  },
];

const PRINCIPLES = [
  {
    icon: Database,
    title: "Minimized collection",
    desc: "We collect only the fields placement processing requires — nothing speculative, nothing sold.",
  },
  {
    icon: Eye,
    title: "Purpose-limited sharing",
    desc: "Your data moves to a recruiter only when you apply to their drive, and only for that process.",
  },
  {
    icon: Server,
    title: "Server-side authority",
    desc: "Eligibility and access decisions are computed from institutional records, never from the browser.",
  },
  {
    icon: Share2,
    title: "Audited access",
    desc: "Every privileged read and write lands in an immutable ledger with actor, IP, and diffs.",
  },
  {
    icon: Clock,
    title: "Finite retention",
    desc: "Sessions expire in 12 hours; workspace data clears on sign-out; records follow institutional policy.",
  },
  {
    icon: Trash2,
    title: "Real deletion paths",
    desc: "Sign-out wipes session stores; opt-out halts new sharing; correction requests are tracked to closure.",
  },
];

export default function PrivacyPolicy() {
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

  return (
    <div className="nb-scene min-h-screen bg-background text-slate-100">
      <div className="nb-noise" aria-hidden="true" />

      {/* Header */}
      <header className="border-b border-purple-950/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-purple-950/40 bg-slate-900/80 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight uppercase">
                Placement Portal
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Privacy Policy
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
            Privacy <span className="text-amber-400">Policy</span>
          </h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-2xl">
            How the College Placement Management System collects, protects,
            shares, and retains student academic data — written for the
            students whose records it holds, the recruiters who receive them,
            and the compliance officers who audit both.
          </p>
        </div>

        {/* Trust principles */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md p-4 transition-all duration-200 hover:border-purple-500/40"
              >
                <Icon className="h-4 w-4 text-purple-400 mb-2" />
                <p className="text-xs font-black text-slate-100">{p.title}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {p.desc}
                </p>
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
                  <span className="text-amber-400 font-black">{s.title.split(".")[0]}.</span>
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
                  {section.blocks.map((block) => (
                    <div key={block.heading}>
                      <h3 className="text-xs font-black uppercase tracking-wider text-purple-300 mb-2">
                        {block.heading}
                      </h3>
                      {block.body.map((para, i) => (
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
              Questions about your data?
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              The Training &amp; Placement Cell responds to all privacy
              requests within 5 working days.
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
