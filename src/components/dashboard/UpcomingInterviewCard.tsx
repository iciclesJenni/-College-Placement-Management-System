import { useState, useEffect } from "react";
import {
  Video,
  Clock,
  Calendar,
  Code,
  ClipboardList,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ListChecks,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadIcsFile,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/services/calendar";
import {
  ROUND_TYPE_CONFIG,
  INTERVIEW_STATUS_CONFIG,
  formatCountdown,
  formatSlotTime,
  type UpcomingInterview,
} from "@/lib/interview-schedule";
import { CalendarDays } from "lucide-react";

function RoundTypeIcon({ type }: { type: UpcomingInterview["roundType"] }) {
  if (type === "technical") return <Code className="h-3.5 w-3.5" />;
  if (type === "hr") return <User className="h-3.5 w-3.5" />;
  return <ClipboardList className="h-3.5 w-3.5" />;
}

export function UpcomingInterviewCard({ interview }: { interview: UpcomingInterview }) {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Re-render every 30s so countdowns stay live
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const typeCfg = ROUND_TYPE_CONFIG[interview.roundType];

  /** Build the calendar event payload for ICS / deep-link sync. */
  const calendarEvent = () => ({
    uid: `${interview.id}@placement-portal`,
    title: `${interview.companyName} — ${interview.roundName}`,
    description: `${interview.roleTitle} interview (${interview.ctc}). Join: ${interview.meetLink}`,
    location: interview.meetLink,
    startIso: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
  });

  /** Download the .ics invitation for Google Calendar / Outlook import. */
  const handleAddToCalendar = () => {
    const ok = downloadIcsFile(
      [calendarEvent()],
      `${interview.companyName.replace(/\s+/g, "_")}_${interview.roundName.replace(/\s+/g, "_")}`,
    );
    if (ok) {
      toast.success("Calendar invite downloaded", {
        description: "Open the .ics file to add it to Google Calendar or Outlook.",
      });
    } else {
      toast.error("Could not generate the calendar invite. Please try again.");
    }
  };
  const statusCfg = INTERVIEW_STATUS_CONFIG[interview.status];
  const countdown = formatCountdown(interview.scheduledAt);
  const isLive = countdown === "Now" && interview.status !== "completed";
  const isSoon =
    !isLive &&
    interview.status !== "completed" &&
    new Date(interview.scheduledAt).getTime() - Date.now() < 60 * 60 * 1000;

  const joinMeet = () => {
    toast.success("Opening Google Meet…", {
      description: `${interview.companyName} — ${interview.roundName}`,
      icon: <Video className="h-4 w-4 text-primary" />,
    });
    window.open(interview.meetLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`nb-card p-4 transition-all ${
        interview.status === "completed"
          ? "opacity-75"
          : isLive
            ? "border-emerald-500/60 shadow-[4px_4px_0px_#10b981]"
            : isSoon
              ? "border-primary/50 shadow-[3px_3px_0px_var(--primary)]"
              : ""
      }`}
    >
      {/* Header row: company + round type + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm tracking-tight truncate">{interview.companyName}</h3>
            <span className={`nb-tag text-[9px] border ${typeCfg.color}`}>
              <RoundTypeIcon type={interview.roundType} />
              <span className="ml-1">{typeCfg.label}</span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-bold mt-0.5 truncate">
            {interview.roleTitle} • {interview.ctc}
          </p>
        </div>
        <span className={`nb-tag text-[9px] border flex-shrink-0 ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Round progress */}
      <div className="flex items-center gap-1.5 mb-3">
        {Array.from({ length: interview.totalRounds }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full border border-border ${
              i < interview.roundNumber - 1
                ? "bg-emerald-500/60"
                : i === interview.roundNumber - 1
                  ? "bg-primary"
                  : "bg-secondary"
            }`}
          />
        ))}
        <span className="text-[9px] font-black text-muted-foreground ml-1.5 flex-shrink-0">
          R{interview.roundNumber}/{interview.totalRounds}
        </span>
      </div>

      {/* Time + countdown strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold">{formatSlotTime(interview.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold">{interview.durationMinutes} min</span>
        </div>
        {interview.status !== "completed" && (
          <span
            className={`nb-tag text-[10px] font-black border ml-auto ${
              isLive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 animate-pulse"
                : isSoon
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {isLive ? "LIVE NOW" : `in ${countdown}`}
          </span>
        )}
      </div>

      {/* One-click Meet access */}
      {interview.status !== "completed" && (
        <button
          onClick={joinMeet}
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-black border-2 transition-all active:translate-y-0.5 ${
            isLive || isSoon
              ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-400 shadow-[3px_3px_0px_#065f46]"
              : "nb-btn-primary"
          }`}
        >
          <Video className="h-4 w-4" aria-hidden="true" />
          {isLive ? "Join Interview Now" : "Open Google Meet"}
          <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
        </button>
      )}

      {/* Expandable details */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1 mt-2.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? "Hide" : "View"} round details
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Round identity */}
          <div className="p-2.5 rounded-lg border border-border bg-secondary/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">
              {interview.roundName}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold">
              {interview.companyName} • Slot: {formatSlotTime(interview.scheduledAt)} (
              {interview.durationMinutes} min)
            </p>
          </div>

          {/* Prerequisites */}
          {interview.prerequisites.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                Prerequisites
              </p>
              <ul className="space-y-1">
                {interview.prerequisites.map((p, i) => (
                  <li key={i} className="text-[11px] font-semibold flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">▸</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interview topics */}
          {interview.topics.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                Interview Topics
              </p>
              <div className="space-y-1.5">
                {interview.topics.map((t, i) => (
                  <div key={i} className="p-2 rounded border border-border bg-background">
                    <p className="text-[11px] font-black">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{t.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interviewer notes */}
          {interview.interviewerNotes && (
            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                <StickyNote className="h-3 w-3" />
                Interviewer Notes
              </p>
              <p className="text-[11px] font-semibold">{interview.interviewerNotes}</p>
            </div>
          )}

          {/* Meet link footer */}
          <div className="flex items-center gap-1.5 p-2 rounded border border-border bg-secondary/30">
            <Video className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[9px] font-bold text-muted-foreground truncate flex-1">
              {interview.meetLink}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(interview.meetLink);
                toast.success("Meet link copied");
              }}
              className="text-[9px] font-black text-primary hover:underline flex-shrink-0"
            >
              Copy
            </button>
          </div>

          {/* Calendar sync — .ics download + Google / Outlook deep links */}
          <div className="flex items-center gap-1.5 p-2 rounded border border-amber-500/30 bg-amber-500/5">
            <CalendarDays className="h-3 w-3 text-amber-400 flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex-shrink-0">
              Sync
            </span>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <button
                onClick={handleAddToCalendar}
                className="text-[9px] font-black px-2 py-1 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
              >
                .ics
              </button>
              <a
                href={googleCalendarUrl(calendarEvent())}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-black px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all duration-200"
              >
                Google
              </a>
              <a
                href={outlookCalendarUrl(calendarEvent())}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-black px-2 py-1 rounded-md border border-purple-950/40 bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 active:scale-[0.98] transition-all duration-200"
              >
                Outlook
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
