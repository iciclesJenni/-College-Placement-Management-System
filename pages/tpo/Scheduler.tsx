import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  Circle,
  Copy,
  ChevronDown,
  Building2,
  Plus,
  Trash2,
  CalendarClock,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { mockDrives, mockApplications, mockStudents } from "@/lib/mock-data";
import { dispatchSlotAssignment } from "@/services/notifications";
import { downloadIcsFile } from "@/services/calendar";
import type { ApplicationStatus } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotStatus = "available" | "booked" | "completed";

interface InterviewSlot {
  id: string;
  startTime: string; // "10:00"
  endTime: string; // "10:30"
  label: string; // "10:00 AM – 10:30 AM"
  status: SlotStatus;
  candidateId: string | null; // studentId
  candidateName: string | null;
  meetLink: string | null;
}

interface DayWindow {
  id: string;
  date: string; // ISO date "2026-10-10"
  start: string; // "10:00"
  end: string; // "16:00"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function to24Hour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function format12Hour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Generate a deterministic mock Google Meet link for a slot. */
function generateMeetLink(slotKey: string): string {
  // Real Meet links look like https://meet.google.com/abc-defg-hij
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const pick = (n: number) =>
    Array.from({ length: n }, (_, i) => chars[(slotKey.charCodeAt(i % slotKey.length) * 31 + i * 7 + (i + 1) * 13) % 26]).join("");
  return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

const SLOT_DURATION_MIN = 30;

// ─── Slot Generator Logic ────────────────────────────────────────────────────

function generateSlots(
  windows: DayWindow[],
  existing: Record<string, InterviewSlot[]>
): Record<string, InterviewSlot[]> {
  const result: Record<string, InterviewSlot[]> = {};

  for (const w of windows) {
    const key = w.date;
    // Preserve existing bookings for this date if window unchanged
    const prev = existing[key] ?? [];
    const prevByKey = new Map(prev.map((s) => [s.startTime, s]));

    const slots: InterviewSlot[] = [];
    const start = to24Hour(w.start);
    const end = to24Hour(w.end);

    for (let t = start; t + SLOT_DURATION_MIN <= end; t += SLOT_DURATION_MIN) {
      const startTime = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      const endMin = t + SLOT_DURATION_MIN;
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
      const prevSlot = prevByKey.get(startTime);
      slots.push({
        id: `${key}_${startTime}`,
        startTime,
        endTime,
        label: `${format12Hour(t)} – ${format12Hour(endMin)}`,
        status: prevSlot?.status ?? "available",
        candidateId: prevSlot?.candidateId ?? null,
        candidateName: prevSlot?.candidateName ?? null,
        meetLink: prevSlot?.meetLink ?? generateMeetLink(`${key}${startTime}`),
      });
    }

    result[key] = slots;
  }

  return result;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TPOScheduler() {
  const { id } = useParams();
  const navigate = useNavigate();
  const drive = mockDrives.find((d) => d.id === id);

  // Shortlisted candidates for this drive (shortlisted → hr_interview, not rejected)
  const candidates = useMemo(() => {
    return mockApplications
      .filter((a) => a.driveId === id)
      .filter((a) => !["rejected", "applied"].includes(a.status))
      .map((a) => {
        const student = mockStudents.find((s) => s.id === a.studentId);
        return { appId: a.id, studentId: a.studentId, name: student?.name ?? "", rollNumber: student?.rollNumber ?? "", department: student?.department ?? "", status: a.status as ApplicationStatus };
      });
  }, [id]);

  // ─── Window configuration state ──────────────────────────────────────────
  const defaultDate = drive?.driveDate
    ? new Date(drive.driveDate + " " + (new Date().getFullYear())).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const [windows, setWindows] = useState<DayWindow[]>([
    { id: "w1", date: defaultDate, start: "10:00", end: "16:00" },
  ]);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, InterviewSlot[]>>(() =>
    generateSlots(
      [{ id: "w1", date: defaultDate, start: "10:00", end: "16:00" }],
      {}
    )
  );
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [newWindow, setNewWindow] = useState<DayWindow>({
    id: "",
    date: defaultDate,
    start: "10:00",
    end: "16:00",
  });

  // Regenerate slots when windows change (preserving bookings)
  const regenerateSlots = useCallback((updatedWindows: DayWindow[]) => {
    setSlotsByDate((prev) => generateSlots(updatedWindows, prev));
  }, []);

  const addWindow = useCallback(() => {
    if (!newWindow.date || !newWindow.start || !newWindow.end) {
      toast.error("Fill in date and both times");
      return;
    }
    if (to24Hour(newWindow.end) <= to24Hour(newWindow.start)) {
      toast.error("End time must be after start time");
      return;
    }
    const w = { ...newWindow, id: `w${Date.now()}` };
    setWindows((prev) => {
      const updated = [...prev, w];
      regenerateSlots(updated);
      return updated;
    });
    toast.success(`Window added: ${formatDateLabel(w.date)} ${format12Hour(to24Hour(w.start))} – ${format12Hour(to24Hour(w.end))}`);
    setShowWindowForm(false);
    setNewWindow({ id: "", date: defaultDate, start: "10:00", end: "16:00" });
  }, [newWindow, defaultDate, regenerateSlots]);

  const removeWindow = useCallback(
    (wid: string) => {
      setWindows((prev) => {
        const updated = prev.filter((w) => w.id !== wid);
        regenerateSlots(updated);
        return updated;
      });
      toast.success("Interview window removed");
    },
    [regenerateSlots]
  );

  // ─── Candidate assignment ────────────────────────────────────────────────
  const assignCandidate = useCallback(
    (dateKey: string, slotId: string, candidateId: string | null) => {
      setSlotsByDate((prev) => {
        const slots = prev[dateKey] ?? [];
        const candidate = candidates.find((c) => c.studentId === candidateId);

        // Conflict prevention: check if this candidate is already booked in another slot
        const alreadyBooked = slots.find(
          (s) => s.id !== slotId && s.candidateId === candidateId && s.status !== "completed"
        );
        if (candidate && alreadyBooked) {
          toast.error(`Conflict: ${candidate.name} is already booked in ${alreadyBooked.label}`, {
            description: "Remove them from the other slot first.",
          });
          return prev;
        }

        return {
          ...prev,
          [dateKey]: slots.map((s) => {
            if (s.id !== slotId) return s;
            return {
              ...s,
              candidateId: candidateId || null,
              candidateName: candidate?.name ?? null,
              status: candidateId ? "booked" : "available",
              meetLink: candidateId ? (s.meetLink ?? generateMeetLink(slotId)) : null,
            };
          }),
        };
      });
      if (candidateId) {
        const candidate = candidates.find((c) => c.studentId === candidateId);
        const student = mockStudents.find((s) => s.id === candidateId);
        const targetSlot = (slotsByDate[dateKey] ?? []).find((s) => s.id === slotId);
        // ── Automated notification dispatch (in-app + email transport) ──
        // meetLink fallback mirrors the slot updater (s.meetLink ?? generated)
        const meetLink = targetSlot?.meetLink ?? generateMeetLink(slotId);
        if (candidate && student && targetSlot) {
          dispatchSlotAssignment({
            studentId: candidate.studentId,
            studentName: student.name,
            studentEmail: student.email,
            companyName: drive?.companyName ?? "Interview Panel",
            roleTitle: drive?.roleTitle ?? "Interview",
            slotLabel: targetSlot.label,
            slotStartIso: new Date(`${dateKey}T${targetSlot.startTime}:00`).toISOString(),
            meetLink,
          });
        }
        toast.success(`${candidate?.name} assigned to slot`, {
          description: "Google Meet link generated automatically.",
          icon: <Video className="h-4 w-4 text-primary" />,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, slotsByDate, drive],
  );

  /** Export all booked slots as an .ics calendar file for the drive panel. */
  const handleExportIcs = useCallback(() => {
    const bookedEvents = Object.entries(slotsByDate).flatMap(([dateKey, slots]) =>
      slots
        .filter((s) => s.status === "booked" && s.candidateName && s.meetLink)
        .map((s) => ({
          dateKey,
          slot: s,
        })),
    );
    if (bookedEvents.length === 0) {
      toast.error("No booked slots to export", {
        description: "Assign candidates to slots first.",
      });
      return;
    }
    const ok = downloadIcsFile(
      bookedEvents.map(({ dateKey, slot }) => ({
        uid: `${slot.id}@placement-portal`,
        title: `${drive?.companyName ?? "Interview"} — ${slot.candidateName}`,
        description: `${drive?.roleTitle ?? "Interview"} interview. Join: ${slot.meetLink}`,
        location: slot.meetLink ?? "",
        startIso: new Date(`${dateKey}T${slot.startTime}:00`).toISOString(),
        durationMinutes: SLOT_DURATION_MIN,
      })),
      `${(drive?.companyName ?? "Interviews").replace(/\s+/g, "_")}_Schedule`,
    );
    if (ok) {
      toast.success(`Calendar exported (${bookedEvents.length} interviews)`, {
        description: "Import into Google Calendar or Outlook.",
      });
    }
  }, [slotsByDate, drive]);

  const markCompleted = useCallback((dateKey: string, slotId: string) => {
    setSlotsByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map((s) =>
        s.id === slotId ? { ...s, status: s.status === "completed" ? "booked" : "completed" } : s
      ),
    }));
  }, []);

  const clearSlot = useCallback((dateKey: string, slotId: string) => {
    setSlotsByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map((s) =>
        s.id === slotId
          ? { ...s, candidateId: null, candidateName: null, status: "available", meetLink: null }
          : s
      ),
    }));
    toast.success("Slot cleared");
  }, []);

  const copyMeetLink = useCallback((slot: InterviewSlot) => {
    navigator.clipboard.writeText(slot.meetLink ?? "");
    toast.success("Meet link copied", {
      description: slot.meetLink,
      icon: <Copy className="h-4 w-4 text-primary" />,
    });
  }, []);

  // ─── Stats ───────────────────────────────────────────────────────────────
  const allSlots = useMemo(() => Object.values(slotsByDate).flat(), [slotsByDate]);
  const stats = useMemo(() => {
    const total = allSlots.length;
    const booked = allSlots.filter((s) => s.status === "booked").length;
    const completed = allSlots.filter((s) => s.status === "completed").length;
    const available = allSlots.filter((s) => s.status === "available").length;
    return { total, booked, completed, available };
  }, [allSlots]);

  // Candidates not yet assigned to any slot
  const unassigned = useMemo(() => {
    const assignedIds = new Set(
      allSlots.filter((s) => s.candidateId).map((s) => s.candidateId)
    );
    return candidates.filter((c) => !assignedIds.has(c.studentId));
  }, [candidates, allSlots]);

  if (!drive) {
    return (
      <div className="p-6 md:p-10 text-center">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold">Drive not found</p>
        <button className="nb-btn-primary mt-4" onClick={() => navigate("/tpo/drives")}>
          Back to Drives
        </button>
      </div>
    );
  }

  const statusStyles: Record<SlotStatus, string> = {
    available: "bg-secondary text-muted-foreground border-border",
    booked: "bg-primary/15 text-primary border-primary/40",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  };

  const statusIcon: Record<SlotStatus, typeof Circle> = {
    available: Circle,
    booked: UserCheck,
    completed: CheckCircle2,
  };

  return (
    <div className="p-6 md:p-10">
      <button
        className="nb-btn-secondary mb-6 inline-flex items-center gap-2"
        onClick={() => navigate(`/tpo/drives/${id}/applicants`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applicants
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
              <CalendarClock className="w-4 h-4" />
              Interview Scheduler
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {drive.companyName} — {drive.roleTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-bold">
              {candidates.length} eligible candidates • {stats.total} slots generated
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportIcs}
              className="nb-btn-secondary text-xs font-bold px-4 py-2.5 inline-flex items-center gap-2 active:scale-[0.98] transition-all duration-200"
            >
              <CalendarClock className="w-4 h-4 text-amber-400" />
              Export .ics ({stats.booked})
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="nb-sheen grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 rounded-2xl p-1">
          <div className="nb-card p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Slots</span>
            <p className="text-xl font-black mt-0.5">{stats.total}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Available</span>
            <p className="text-xl font-black text-muted-foreground mt-0.5">{stats.available}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Booked</span>
            <p className="text-xl font-black text-primary mt-0.5">{stats.booked}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Completed</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Window Configuration */}
      <div className="nb-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-black text-xs uppercase tracking-wider">Daily Interview Windows</span>
          </div>
          <button
            onClick={() => setShowWindowForm((v) => !v)}
            className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Window
          </button>
        </div>

        {/* Existing windows */}
        <div className="space-y-2 mb-3">
          {windows.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/30"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-black">{formatDateLabel(w.date)}</span>
              <span className="nb-tag text-[10px] bg-primary/10 text-primary border-primary/30">
                {format12Hour(to24Hour(w.start))} – {format12Hour(to24Hour(w.end))}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground ml-auto">
                {Math.floor((to24Hour(w.end) - to24Hour(w.start)) / SLOT_DURATION_MIN)} × {SLOT_DURATION_MIN}-min slots
              </span>
              {windows.length > 1 && (
                <button
                  onClick={() => removeWindow(w.id)}
                  className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center hover:bg-destructive/15 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add window form */}
        {showWindowForm && (
          <div className="p-3 rounded-lg border-2 border-dashed border-border bg-secondary/20 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
              <div>
                <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Date</label>
                <input
                  type="date"
                  value={newWindow.date}
                  onChange={(e) => setNewWindow({ ...newWindow, date: e.target.value })}
                  className="nb-input w-full px-2 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Start</label>
                <input
                  type="time"
                  value={newWindow.start}
                  onChange={(e) => setNewWindow({ ...newWindow, start: e.target.value })}
                  className="nb-input w-full px-2 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">End</label>
                <input
                  type="time"
                  value={newWindow.end}
                  onChange={(e) => setNewWindow({ ...newWindow, end: e.target.value })}
                  className="nb-input w-full px-2 py-1.5 text-xs"
                />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addWindow} className="nb-btn-primary text-[10px] font-bold px-3 py-1.5 flex-1">
                  Add
                </button>
                <button
                  onClick={() => setShowWindowForm(false)}
                  className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground font-bold">
              → Will generate {Math.floor((to24Hour(newWindow.end) - to24Hour(newWindow.start)) / SLOT_DURATION_MIN)} slots of {SLOT_DURATION_MIN} minutes
            </p>
          </div>
        )}
      </div>

      {/* Unassigned candidates */}
      {unassigned.length > 0 && (
        <div className="nb-card p-4 mb-6 border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-black text-xs uppercase tracking-wider">
              Awaiting Assignment ({unassigned.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((c) => (
              <span key={c.studentId} className="nb-tag text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                {c.name} • {c.rollNumber}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold mt-2">
            Assign these candidates to open slots below using the dropdown in each Available slot.
          </p>
        </div>
      )}

      {/* Slot Grid by Date */}
      <div className="space-y-6">
        {windows.map((w) => {
          const slots = slotsByDate[w.date] ?? [];
          const dayBooked = slots.filter((s) => s.status !== "available").length;
          return (
            <div key={w.id}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDateLabel(w.date)}
                </h2>
                <span className="nb-tag text-[10px] bg-secondary text-muted-foreground">
                  {dayBooked}/{slots.length} scheduled
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {slots.map((slot) => {
                  const Icon = statusIcon[slot.status];
                  const candidate = candidates.find((c) => c.studentId === slot.candidateId);
                  return (
                    <div
                      key={slot.id}
                      className={`nb-card p-4 transition-all ${
                        slot.status === "booked"
                          ? "border-primary/40 shadow-[3px_3px_0px_var(--primary)]"
                          : slot.status === "completed"
                            ? "border-emerald-500/40 opacity-80"
                            : "opacity-90"
                      }`}
                    >
                      {/* Time + Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-black text-xs">{slot.label}</span>
                        </div>
                        <span className={`nb-tag text-[8px] ${statusStyles[slot.status]}`}>
                          <Icon className="h-2.5 w-2.5 mr-0.5 inline" />
                          {slot.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Candidate Assignment */}
                      {slot.status === "available" ? (
                        <div className="relative">
                          <select
                            value=""
                            onChange={(e) => assignCandidate(w.date, slot.id, e.target.value || null)}
                            className="nb-input bg-background w-full text-[10px] font-bold px-2 py-1.5 pr-7 appearance-none cursor-pointer"
                          >
                            <option value="">Assign candidate…</option>
                            {candidates.map((c) => (
                              <option key={c.studentId} value={c.studentId}>
                                {c.name} ({c.rollNumber})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs font-black truncate">{slot.candidateName}</span>
                          </div>
                          {candidate && (
                            <p className="text-[9px] text-muted-foreground font-bold">
                              {candidate.rollNumber} • {candidate.department}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Meet Link */}
                      {slot.meetLink && slot.status !== "available" && (
                        <div className="flex items-center gap-1.5 mt-2.5 p-2 rounded border border-border bg-secondary/30">
                          <Video className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <a
                            href={slot.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-primary hover:underline truncate flex-1"
                          >
                            {slot.meetLink.replace("https://meet.google.com/", "")}
                          </a>
                          <button
                            onClick={() => copyMeetLink(slot)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary/15 hover:text-primary transition-colors flex-shrink-0"
                            title="Copy Meet link"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}

                      {/* Slot actions */}
                      {slot.status !== "available" && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <button
                            onClick={() => markCompleted(w.date, slot.id)}
                            className={`nb-tag cursor-pointer text-[8px] flex-1 justify-center ${
                              slot.status === "completed"
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />
                            {slot.status === "completed" ? "Reopen" : "Mark Done"}
                          </button>
                          <button
                            onClick={() => clearSlot(w.date, slot.id)}
                            className="nb-tag cursor-pointer text-[8px] bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-2.5 w-2.5 mr-1 inline" />
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {slots.length === 0 && (
                <div className="nb-card p-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No slots for this window</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground font-bold">
        Slots auto-chunk each window into {SLOT_DURATION_MIN}-minute blocks • Meet links are generated per slot and copied with one click
      </p>
    </div>
  );
}
