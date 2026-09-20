import { useState, useMemo } from "react";
import type { Application } from "@/types";
import { mockUpcomingInterviews } from "@/lib/interview-schedule";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageSquare,
  Award,
  ArrowRight,
  Video,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// PIPELINE DEFINITION
// ─────────────────────────────────────────────

const PIPELINE = [
  { key: "applied", label: "Applied", short: "Applied", icon: FileText },
  { key: "shortlisted", label: "Shortlisted", short: "Short", icon: CheckCircle2 },
  { key: "online_assessment", label: "Assessment", short: "Test", icon: FileText },
  { key: "technical_interview", label: "Tech Interview", short: "Tech", icon: Clock },
  { key: "hr_interview", label: "HR Round", short: "HR", icon: Clock },
  { key: "offered", label: "Offered", short: "Offer", icon: Award },
  { key: "rejected", label: "Rejected", short: "Reject", icon: XCircle },
] as const;

const PIPELINE_KEYS = PIPELINE.map((s) => s.key);
const HAPPY_PATH_LEN = 6; // indices 0-5 are the happy path; index 6 is "rejected"

// ─────────────────────────────────────────────
// LINEAR PIPELINE MATH
// ─────────────────────────────────────────────

type StageState = "completed" | "active" | "pending" | "rejected";

/**
 * Compare the array index of the current stage against all possible
 * stages. Predecessors → COMPLETED (emerald). The active stage itself
 * → ACTIVE (animated pulse). Successors → PENDING (neutral gray).
 * On rejection the current + all successors become REJECTED (rose)
 * without breaking the UI connector lines — the line FROM the last
 * completed stage TO the rejection node turns rose, and everything
 * after it is skipped.
 */
function getStageState(
  stepIndex: number,
  currentIndex: number,
  finalStatus: "offered" | "rejected" | string,
): StageState {
  // Happy path: before current = completed, at current = active, after = pending
  if (finalStatus !== "rejected") {
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  }

  // Rejection path: everything up to the current stage is completed,
  // the current stage is the last thing the candidate saw, and the
  // "rejected" node (index 6) is the terminal state.
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  // The rejected node itself
  if (stepIndex === HAPPY_PATH_LEN) return "rejected";
  // Steps between current and rejected are skipped — not shown
  return "pending";
}

/**
 * Determine which PIPELINE entries to render. We hide steps that sit
 * between the current stage and the "rejected" terminal so the line
 * jumps cleanly from active → rejected.
 */
function getVisibleSteps(
  currentIndex: number,
  finalStatus: string,
): number[] {
  if (finalStatus === "rejected") {
    // Show: 0..currentIndex (happy path) + the "rejected" node
    const visible = [];
    for (let i = 0; i <= currentIndex; i++) visible.push(i);
    visible.push(HAPPY_PATH_LEN); // rejected
    return visible;
  }
  if (finalStatus === "offered") {
    // Show: 0..offered (index 5)
    const offeredIdx = PIPELINE_KEYS.indexOf("offered");
    return Array.from({ length: offeredIdx + 1 }, (_, i) => i);
  }
  // Active pipeline: show 0..currentIndex+1 (peek at next step)
  const peek = Math.min(currentIndex + 2, HAPPY_PATH_LEN);
  return Array.from({ length: peek }, (_, i) => i);
}

// ─────────────────────────────────────────────
// VISUAL STYLE MAPS
// ─────────────────────────────────────────────

const NODE_STYLES: Record<StageState, string> = {
  completed:
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  active:
    "bg-primary/25 text-primary border-primary ring-4 ring-primary/20 animate-pulse",
  pending:
    "bg-secondary text-muted-foreground border-border",
  rejected:
    "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

const LINE_STYLES: Record<StageState, string> = {
  completed: "bg-emerald-500/50",
  active: "bg-primary/40",
  pending: "bg-border",
  rejected: "bg-rose-500/40",
};

const LABEL_STYLES: Record<StageState, string> = {
  completed: "text-emerald-400",
  active: "text-primary font-black",
  pending: "text-muted-foreground",
  rejected: "text-rose-400",
};

const STATUS_CHIP: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  active: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-secondary text-muted-foreground border-border",
  rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const STATUS_LABEL: Record<StageState, string> = {
  completed: "Completed",
  active: "In Progress",
  pending: "Pending",
  rejected: "Rejected",
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const rawIdx = PIPELINE_KEYS.indexOf(application.status);
  const activeIdx = rawIdx >= 0 ? rawIdx : 0;
  const finalStatus = application.status;
  const myState = getStageState(activeIdx, activeIdx, finalStatus);

  const visibleIndices = getVisibleSteps(activeIdx, finalStatus);

  /**
   * Scheduled interview for this application's active round — powers the
   * Meet join link + round date in the expandable section. Matched by
   * drive + student; only when the pipeline is still live.
   */
  const activeInterview = useMemo(
    () =>
      finalStatus !== "rejected"
        ? mockUpcomingInterviews.find(
            (iv) => iv.driveId === application.driveId && iv.studentId === application.studentId,
          )
        : undefined,
    [application.driveId, application.studentId, finalStatus],
  );

  /**
   * Cleared-round history with dates and recruiter feedback — derived from
   * the pipeline position; the demo feedback mirrors the application notes
   * where richer data isn't recorded per-round.
   */
  const roundHistory = useMemo(() => {
    const history: { round: string; date: string; feedback?: string }[] = [];
    for (let i = 0; i < activeIdx && i < HAPPY_PATH_LEN; i++) {
      history.push({
        round: PIPELINE[i].label,
        date: i === 0 ? application.appliedAt : application.updatedAt,
        feedback:
          i === activeIdx - 1 && application.notes ? application.notes : undefined,
      });
    }
    return history;
  }, [activeIdx, application.appliedAt, application.updatedAt, application.notes]);

  return (
    <div className="nb-card overflow-hidden">
      {/* ═══════════════════════════════
          HEADER
          ═══════════════════════════════ */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-base truncate">
                {application.companyName}
              </h3>
              <span className="nb-tag bg-accent/15 text-accent border-accent/30 text-[10px] gap-1 shrink-0">
                <Award className="h-3 w-3" />
                {application.totalRounds} rounds
              </span>
              {finalStatus === "offered" && (
                <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  Offer
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-muted-foreground truncate">
              {application.roleTitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Applied {application.appliedAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {application.updatedAt}
              </span>
              {application.currentRound && (
                <span className="flex items-center gap-1 font-bold text-primary">
                  <ArrowRight className="h-3 w-3" />
                  {application.currentRound}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <span
              className={`nb-badge text-[10px] ${STATUS_CHIP[myState]}`}
            >
              {STATUS_LABEL[myState]}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
          STEPPER PIPELINE
          ═══════════════════════════════ */}

      {/* Desktop: full horizontal stepper */}
      <div className="hidden sm:block px-5 pb-4">
        <StepperDesktop
          visibleIndices={visibleIndices}
          activeIdx={activeIdx}
          finalStatus={finalStatus}
        />
      </div>

      {/* Mobile: compact horizontal strip */}
      <div className="sm:hidden px-4 pb-3">
        <StepperMobile
          visibleIndices={visibleIndices}
          activeIdx={activeIdx}
          finalStatus={finalStatus}
        />
      </div>

      {/* ═══════════════════════════════
          EXPANDABLE DETAILS
          ═══════════════════════════════ */}
      {(application.notes || application.currentRound) && (
        <>
          <button
            type="button"
            className="w-full border-t-2 border-border px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs font-bold text-muted-foreground hover:bg-secondary/50 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Details & Notes
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {expanded && (
            <div className="border-t-2 border-border px-4 sm:px-5 py-4 bg-secondary/30 space-y-4">
              {/* Active round — scheduled interview with Meet link */}
              {activeInterview && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Video className="h-3 w-3" />
                      Active Round — {activeInterview.roundName}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500">
                      R{activeInterview.roundNumber}/{activeInterview.totalRounds}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-bold mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(activeInterview.scheduledAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activeInterview.durationMinutes} min
                    </span>
                  </div>
                  <a
                    href={activeInterview.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => toast.success("Opening Google Meet")}
                    className="w-full text-[10px] font-black px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
                  >
                    <Video className="h-3 w-3 text-amber-400" />
                    Join Google Meet
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                </div>
              )}

              {/* Round history with feedback */}
              {roundHistory.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <StickyNote className="h-3 w-3" />
                    Round History & Feedback
                  </p>
                  <div className="space-y-1.5">
                    {roundHistory.map((r) => (
                      <div
                        key={r.round}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-background"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-black text-slate-200">{r.round}</p>
                            <span className="text-[9px] text-slate-600 font-mono shrink-0">{r.date}</span>
                          </div>
                          {r.feedback && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{r.feedback}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.currentRound && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Current Stage
                  </p>
                  <p className="text-sm font-bold">{application.currentRound}</p>
                </div>
              )}
              {application.notes && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Evaluation Notes
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-background border-2 border-border p-3">
                    {application.notes}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Timeline
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Applied: {application.appliedAt}
                  </span>
                  <span className="text-border">→</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last update: {application.updatedAt}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DESKTOP STEPPER (hidden on mobile)
// ─────────────────────────────────────────────

function StepperDesktop({
  visibleIndices,
  activeIdx,
  finalStatus,
}: {
  visibleIndices: number[];
  activeIdx: number;
  finalStatus: string;
}) {
  return (
    <div className="flex items-start">
      {visibleIndices.map((idx, pos) => {
        const step = PIPELINE[idx];
        const state = getStageState(idx, activeIdx, finalStatus);
        const StepIcon = step.icon;
        const isLastTerminal =
          (finalStatus === "rejected" && idx === HAPPY_PATH_LEN) ||
          (finalStatus === "offered" && idx === PIPELINE_KEYS.indexOf("offered"));

        return (
          <div key={step.key} className="flex items-start">
            {/* Node */}
            <div className="flex flex-col items-center w-16">
              <div
                className={`w-10 h-10 border-2 flex items-center justify-center transition-all ${NODE_STYLES[state]}`}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] mt-1 text-center leading-tight ${LABEL_STYLES[state]}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line — skip after the last visible node */}
            {pos < visibleIndices.length - 1 && (
              <div className="flex items-center pt-5 px-0.5">
                <div
                  className={`w-8 h-0.5 ${LINE_STYLES[state]}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE STEPPER (compact strip, < sm)
// Uses short labels + smaller nodes for phone screens
// ─────────────────────────────────────────────

function StepperMobile({
  visibleIndices,
  activeIdx,
  finalStatus,
}: {
  visibleIndices: number[];
  activeIdx: number;
  finalStatus: string;
}) {
  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex items-start min-w-max">
        {visibleIndices.map((idx, pos) => {
          const step = PIPELINE[idx];
          const state = getStageState(idx, activeIdx, finalStatus);
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-start">
              {/* Compact node */}
              <div className="flex flex-col items-center w-12">
                <div
                  className={`w-8 h-8 border-2 flex items-center justify-center text-xs ${NODE_STYLES[state]}`}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <span
                  className={`text-[8px] mt-0.5 text-center leading-tight whitespace-nowrap ${LABEL_STYLES[state]}`}
                >
                  {step.short}
                </span>
              </div>

              {/* Short connector */}
              {pos < visibleIndices.length - 1 && (
                <div className="flex items-center pt-4 px-px">
                  <div
                    className={`w-3 h-0.5 ${LINE_STYLES[state]}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
