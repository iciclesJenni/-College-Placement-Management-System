import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Sparkles,
  ArrowLeft,
  Trophy,
  Star,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  BrainCircuit,
  FileSearch,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import { parseResume, rankCandidates, type MatchResult } from "@/services/ai-parser";
import { dispatchStageChange } from "@/services/notifications";
import { logAudit, diffRecords } from "@/services/logger";
import type { Drive, StudentProfile } from "@/types";

// ─── Score tier styling (obsidian / purple / gold) ──────────────────────────

const TIER_STYLE: Record<MatchResult["tier"], { badge: string; label: string }> = {
  elite: { badge: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Elite Match" },
  strong: { badge: "text-purple-300 bg-purple-600/10 border-purple-500/30", label: "Strong Match" },
  moderate: { badge: "text-slate-300 bg-secondary border-border", label: "Moderate Match" },
  weak: { badge: "text-slate-500 bg-secondary/60 border-border", label: "Low Match" },
};

/** Animated-style horizontal score meter (gold → purple by tier). */
function ScoreMeter({ score, tier }: { score: number; tier: MatchResult["tier"] }) {
  const barColor =
    tier === "elite"
      ? "bg-gradient-to-r from-amber-500 to-amber-400"
      : tier === "strong"
        ? "bg-gradient-to-r from-purple-600 to-indigo-500"
        : "bg-gradient-to-r from-slate-600 to-slate-500";
  return (
    <div className="w-full min-w-[90px]">
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-black ${
            tier === "elite" ? "text-amber-400" : tier === "strong" ? "text-purple-300" : "text-slate-400"
          }`}
        >
          {score}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/** Expandable AI score breakdown card. */
function ScoreBreakdown({ match }: { match: MatchResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-black uppercase tracking-wider text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 transition-colors"
      >
        <BrainCircuit className="h-3 w-3" />
        {open ? "Hide AI breakdown" : "Why this score?"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-purple-950/40 bg-slate-950/80 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Factor bars */}
          {match.factors.map((f) => {
            const pct = f.weight > 0 ? (f.score / f.weight) * 100 : 0;
            return (
              <div key={f.kind} className="group flex items-center gap-3 hover:bg-purple-950/20 rounded-lg p-1.5 -m-1.5 transition-colors duration-200">
                <div className="w-32 shrink-0">
                  <p className="text-[10px] font-black text-slate-100">{f.label}</p>
                  <p className="text-[9px] text-slate-500">{f.detail}</p>
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80 ? "bg-amber-400" : pct >= 50 ? "bg-purple-500" : "bg-slate-600"
                    }`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-slate-400 w-12 text-right shrink-0">
                  {f.score}/{f.weight}
                </span>
              </div>
            );
          })}

          {/* Skill chips */}
          <div className="pt-1 border-t border-purple-950/40 space-y-1.5">
            {match.matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.matchedSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  >
                    <CircleCheck className="h-2.5 w-2.5" />
                    {s}
                  </span>
                ))}
              </div>
            )}
            {match.missingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400"
                  >
                    <CircleX className="h-2.5 w-2.5" />
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecruiterSmartMatches() {
  const { id } = useParams();
  const navigate = useNavigate();
  const drive: Drive | undefined = mockDrives.find((d) => d.id === id) ?? mockDrives[0];
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  /**
   * Ranked eligible applicants. Each candidate's resume is run through the
   * NLP parser (simulated from their profile skill set — the demo resumes
   * are hosted URLs), then scored against the drive.
   */
  const ranked = useMemo(() => {
    const applicants = mockApplications
      .filter((a) => a.driveId === drive.id)
      .map((a) => mockStudents.find((s) => s.id === a.studentId))
      .filter((s): s is StudentProfile => Boolean(s));
    // Deduplicate (a student may have one application per drive by constraint)
    const unique = Array.from(new Map(applicants.map((s) => [s.id, s])).values());
    return rankCandidates(unique, drive);
  }, [drive]);

  const handleShortlist = (student: StudentProfile, match: MatchResult) => {
    setShortlisted((prev) => new Set(prev).add(student.id));
    const app = mockApplications.find((a) => a.driveId === drive.id && a.studentId === student.id);
    logAudit({
      category: app?.status === "offered" ? "BULK_OFFER_RELEASED" : "STAGE_CHANGE",
      action: `Recruiter shortlisted candidate (AI score ${match.score}%)`,
      targetType: "Application",
      targetId: app?.id ?? student.id,
      targetLabel: `${student.name} → ${drive.companyName}`,
      diff: diffRecords({ status: app?.status ?? "applied" }, { status: "shortlisted" }),
    });
    dispatchStageChange({
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      companyName: drive.companyName,
      roleTitle: drive.roleTitle,
      newStatus: "shortlisted",
      applicationId: app?.id ?? "unknown",
    });
    toast.success(`${student.name} shortlisted`, {
      description: `AI match score: ${match.score}% — notification dispatched.`,
    });
  };

  // Qualified-talent counter: every candidate scoring ≥ 60% (Strong or Elite
  // tier) counts as active qualified talent — so the KPI reflects the real
  // actionable pipeline instead of reading 0 when no candidate clears the
  // 80% elite bar alone.
  const eliteCount = ranked.filter(
    (r) => r.match.score >= 60 || r.match.tier === "elite" || r.match.tier === "strong",
  ).length;
  const avgScore = ranked.length > 0
    ? Math.round(ranked.reduce((sum, r) => sum + r.match.score, 0) / ranked.length)
    : 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/company/dashboard")}
        className="nb-btn-secondary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 mb-6 active:scale-[0.98] transition-all duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Portal
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          AI Candidate Matching
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          {drive.companyName} — {drive.roleTitle}
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          {ranked.length} eligible applicants ranked by AI compatibility score
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Users className="h-3 w-3" /> Applicants
          </span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{ranked.length}</p>
        </div>
        <div className="nb-card p-3.5 border-amber-500/30 bg-amber-500/5">
          <span className="text-[10px] font-bold text-amber-400/80 uppercase flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Elite Matches
          </span>
          <p className="text-xl font-black text-amber-400 mt-0.5">{eliteCount}</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Target className="h-3 w-3" /> Avg Score
          </span>
          <p className="text-xl font-black text-purple-300 mt-0.5">{avgScore}%</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <FileSearch className="h-3 w-3" /> Resumes Parsed
          </span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{ranked.length}</p>
        </div>
      </div>

      {/* Ranked candidate list */}
      {ranked.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <Sparkles className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-300">No applicants to rank yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Once students apply to this drive, the AI engine will score and rank them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ student, match }, idx) => {
            const tier = TIER_STYLE[match.tier];
            const isTop = idx === 0 && match.tier === "elite";
            const isShortlisted = shortlisted.has(student.id);
            const parsed = parseResume(
              `${student.skills.join(" ")} projects built with ${student.skills.join(" and ")}. ${student.department} graduate.`,
            );
            return (
              <div
                key={student.id}
                className={`nb-card nb-card-hover p-5 ${isTop ? "border-amber-500/40 shadow-lg shadow-purple-950/30" : ""}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Rank + identity */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm border ${
                        isTop
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-purple-950/40 bg-purple-600/10 text-purple-300"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-100 truncate">{student.name}</h3>
                        {isTop && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                            <Trophy className="h-2.5 w-2.5" /> TOP CANDIDATE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {student.rollNumber} • {student.department} • CGPA {student.cgpa.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        Resume parsed: {parsed.skills.length} skills detected
                        {parsed.yearsOfExperience > 0 && ` • ${parsed.yearsOfExperience}y experience`}
                      </p>
                    </div>
                  </div>

                  {/* Score meter */}
                  <div className="flex items-center gap-4 md:w-64 shrink-0">
                    <ScoreMeter score={match.score} tier={match.tier} />
                    <span
                      className={`text-[9px] font-black px-2 py-1 rounded-full border whitespace-nowrap ${tier.badge}`}
                    >
                      {tier.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:w-36 shrink-0 md:justify-end">
                    {isShortlisted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <CircleCheck className="h-3 w-3" /> Shortlisted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleShortlist(student, match)}
                        className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/40 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
                      >
                        <Star className="h-3 w-3 text-amber-400" />
                        Shortlist for Tech Round
                      </button>
                    )}
                  </div>
                </div>

                {/* AI score breakdown */}
                <ScoreBreakdown match={match} />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="nb-card p-4 mt-8 flex items-start gap-3 border-purple-950/40">
        <Briefcase className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
          <span className="text-slate-300 font-black">How scoring works:</span> skill overlap with the
          role requirements (45%), academic fit against the CGPA cutoff (25%), branch eligibility (15%),
          backlog cleanliness (10%), and graduation cycle (5%). Parse and scoring run entirely
          on-device — resumes are never uploaded to third-party services.
        </p>
      </div>
    </div>
  );
}
