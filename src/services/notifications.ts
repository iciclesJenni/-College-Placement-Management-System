/**
 * Automated Notification Dispatch Service.
 *
 * A tiny event-driven dispatcher that fires whenever application stages
 * progress or recruiters assign Google Meet interview slots. Each dispatch:
 *
 *   1. Persists a notification to the shared in-app store (dashboard bell)
 *   2. Queues a simulated email alert (the background "transport")
 *   3. Raises a live toast for immediate feedback
 *
 * Dispatch is fire-and-forget: callers never await delivery, so UI mutations
 * stay optimistic and instant. The store is localStorage-backed so the
 * notification history survives reloads, and window-level listeners keep
 * the bell badge reactive across the entire SPA.
 */

import { toast } from "sonner";
import type { ApplicationStatus } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationKind =
  | "stage_change"
  | "interview_slot"
  | "shortlist"
  | "offer"
  | "rejection"
  | "deadline"
  | "announcement";

export interface NotificationPayload {
  id: string;
  kind: NotificationKind;
  /** Student-facing recipient */
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  title: string;
  body: string;
  createdAt: number;
  /** Deep link into the relevant module */
  actionUrl?: string;
  /** Set once the simulated email transport has "delivered" */
  emailQueued: boolean;
  read: boolean;
}

type Listener = (notifications: NotificationPayload[]) => void;

// ─── Store (localStorage-backed, event-reactive) ─────────────────────────────

const STORAGE_KEY = "placement_portal_notifications";
const MAX_NOTIFICATIONS = 50;
const EVENT_NAME = "placement-notify";

function load(): NotificationPayload[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as NotificationPayload[];
  } catch {
    return [];
  }
}

function persist(items: NotificationPayload[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // storage unavailable — toasts still fire
  }
}

/** Subscribe to notification changes (used by the bell component). */
export function subscribeToNotifications(listener: Listener): () => void {
  const handler = () => listener(load());
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getNotifications(recipientId?: string): NotificationPayload[] {
  const all = load();
  return recipientId ? all.filter((n) => n.recipientId === recipientId) : all;
}

export function getUnreadCount(recipientId?: string): number {
  return getNotifications(recipientId).filter((n) => !n.read).length;
}

export function markAllRead(recipientId?: string): void {
  persist(
    getNotifications().map((n) =>
      !recipientId || n.recipientId === recipientId ? { ...n, read: true } : n,
    ),
  );
}

export function markRead(id: string): void {
  persist(getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

/** Flip a read notification back to unread (Notification Center toggle). */
export function markUnread(id: string): void {
  persist(getNotifications().map((n) => (n.id === id ? { ...n, read: false } : n)));
}

export function clearNotifications(): void {
  persist([]);
}

// ─── Simulated email transport (background dispatcher) ──────────────────────

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  kind: NotificationKind;
}

/** Queued emails are logged to the console as the "background transport". */
function dispatchEmail(message: EmailMessage): void {
  // In production this is where a Resend / SES action would be invoked.
  // Kept console-side so the demo shows the dispatch trail.
  console.info(
    `%c[EMAIL DISPATCH]%c → ${message.to}\nSubject: ${message.subject}`,
    "background:#7c3aed;color:#fbbf24;font-weight:bold;padding:2px 6px;border-radius:4px",
    "color:inherit",
    { body: message.body, kind: message.kind },
  );
}

// ─── Stage-change copy ───────────────────────────────────────────────────────

const STAGE_COPY: Record<ApplicationStatus, { title: string; body: string; kind: NotificationKind }> = {
  applied: {
    title: "Application submitted",
    body: "Your application has been received and is awaiting shortlisting.",
    kind: "stage_change",
  },
  shortlisted: {
    title: "You've been shortlisted 🎉",
    body: "Congratulations — you've cleared the initial screening. Watch for assessment details.",
    kind: "shortlist",
  },
  online_assessment: {
    title: "Online assessment assigned",
    body: "Your online assessment has been scheduled. Check the application details for instructions.",
    kind: "stage_change",
  },
  technical_interview: {
    title: "Technical interview round",
    body: "You've advanced to the technical interview round. Review your fundamentals and past projects.",
    kind: "stage_change",
  },
  hr_interview: {
    title: "HR interview round",
    body: "You've reached the HR round — the final stretch. Prepare for culture-fit and compensation discussion.",
    kind: "stage_change",
  },
  offered: {
    title: "Offer released 🏆",
    body: "Congratulations! An offer has been released. Check the application details for package information.",
    kind: "offer",
  },
  rejected: {
    title: "Application outcome",
    body: "This application has closed. Every interview is practice for the next one — keep going.",
    kind: "rejection",
  },
};

export interface StageChangeContext {
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  roleTitle: string;
  newStatus: ApplicationStatus;
  applicationId: string;
  /** Suppress the live toast (e.g. bulk operations dispatch one summary toast instead) */
  silent?: boolean;
}

/** Compose a notification for a stage transition. */
export function composeStageChange(ctx: StageChangeContext): NotificationPayload {
  const copy = STAGE_COPY[ctx.newStatus] ?? STAGE_COPY.applied;
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: copy.kind,
    recipientId: ctx.studentId,
    recipientName: ctx.studentName,
    recipientEmail: ctx.studentEmail,
    title: `${ctx.companyName} — ${copy.title}`,
    body: `${copy.body} (Role: ${ctx.roleTitle})`,
    createdAt: Date.now(),
    actionUrl: "/student/applications",
    emailQueued: false,
    read: false,
  };
}

/**
 * Dispatch stage-change notifications — fires on every application status
 * progression (Assessment → Tech Interview, Shortlist, Offer, Rejection…).
 * Returns the persisted payload so bulk callers can aggregate.
 */
export function dispatchStageChange(ctx: StageChangeContext): NotificationPayload {
  const payload = composeStageChange(ctx);

  const items = load();
  items.unshift(payload);
  persist(items);

  dispatchEmail({
    to: ctx.studentEmail,
    subject: `[Placement Portal] ${payload.title}`,
    body: `Hi ${ctx.studentName},\n\n${payload.body}\n\nTrack your application: ${payload.actionUrl}`,
    kind: payload.kind,
  });

  if (!ctx.silent) {
    const goldKinds: NotificationKind[] = ["offer", "shortlist"];
    if (goldKinds.includes(payload.kind)) {
      toast.success(payload.title, { description: payload.body });
    } else if (payload.kind === "rejection") {
      toast(payload.title, { description: payload.body });
    } else {
      toast.info(payload.title, { description: payload.body });
    }
  }

  return payload;
}

// ─── Interview slot assignment ───────────────────────────────────────────────

export interface InterviewSlotContext {
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  roleTitle: string;
  /** Human-readable slot label, e.g. "10:30 AM – 11:00 AM" */
  slotLabel: string;
  /** ISO datetime of the slot start */
  slotStartIso: string;
  meetLink: string;
  /** Suppress the live toast */
  silent?: boolean;
}

/** Compose the notification for an assigned Google Meet slot. */
export function composeSlotAssignment(ctx: InterviewSlotContext): NotificationPayload {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "interview_slot",
    recipientId: ctx.studentId,
    recipientName: ctx.studentName,
    recipientEmail: ctx.studentEmail,
    title: `Interview scheduled — ${ctx.companyName}`,
    body: `Your ${ctx.roleTitle} interview slot is booked for ${ctx.slotLabel}. Join via Google Meet.`,
    createdAt: Date.now(),
    actionUrl: "/student/dashboard",
    emailQueued: false,
    read: false,
  };
}

/**
 * Dispatch automated notifications when a recruiter assigns a Google Meet
 * interview slot: in-app notification + email alert + live toast.
 */
export function dispatchSlotAssignment(ctx: InterviewSlotContext): NotificationPayload {
  const payload = composeSlotAssignment(ctx);

  const items = load();
  items.unshift(payload);
  persist(items);

  dispatchEmail({
    to: ctx.studentEmail,
    subject: `[Placement Portal] Interview scheduled — ${ctx.companyName}`,
    body: `Hi ${ctx.studentName},\n\nYour ${ctx.roleTitle} interview with ${ctx.companyName} is scheduled for ${ctx.slotLabel}.\n\nJoin: ${ctx.meetLink}\n\nAdd it to your calendar from the dashboard.`,
    kind: "interview_slot",
  });

  if (!ctx.silent) {
    toast.success("Interview invitation dispatched", {
      description: `${ctx.studentName} notified for ${ctx.slotLabel}. Meet link included.`,
    });
  }

  return payload;
}

/**
 * Announcement / deadline alert — broadcast from the TPO office. Used by the
 * Notification Center to seed drive-deadline and assessment-window alerts.
 */
export interface AnnouncementContext {
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  body: string;
  kind?: "deadline" | "announcement";
  actionUrl?: string;
}

export function dispatchAnnouncement(ctx: AnnouncementContext): NotificationPayload {
  const payload: NotificationPayload = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: ctx.kind ?? "announcement",
    recipientId: ctx.studentId,
    recipientName: ctx.studentName,
    recipientEmail: ctx.studentEmail,
    title: ctx.title,
    body: ctx.body,
    createdAt: Date.now(),
    actionUrl: ctx.actionUrl ?? "/student/drives",
    emailQueued: false,
    read: false,
  };
  const items = load();
  items.unshift(payload);
  persist(items);
  return payload;
}

/**
 * Seed deadline / assessment-window alerts for a student — derived from the
 * active drives they are eligible for. Idempotent: skips seeds already
 * present for the same day, so the notification center never duplicates.
 */
export function seedDeadlineAlerts(
  studentId: string,
  studentName: string,
  studentEmail: string,
  deadlines: { companyName: string; roleTitle: string; deadlineLabel: string; daysLeft: number; driveId: string }[],
): number {
  const existing = getNotifications(studentId);
  const today = new Date().toDateString();
  let seeded = 0;
  for (const d of deadlines) {
    const alreadySeeded = existing.some(
      (n) => n.kind === "deadline" && n.title.includes(d.companyName) &&
        new Date(n.createdAt).toDateString() === today,
    );
    if (alreadySeeded) continue;
    dispatchAnnouncement({
      studentId,
      studentName,
      studentEmail,
      kind: "deadline",
      title:
        d.daysLeft <= 1
          ? `Final deadline today — ${d.companyName}`
          : `Deadline approaching — ${d.companyName}`,
      body: `Applications for ${d.roleTitle} close in ${d.daysLeft <= 1 ? "less than a day" : `${d.daysLeft} days`} (${d.deadlineLabel}). Submit before the window closes.`,
      actionUrl: `/student/drives`,
    });
    seeded += 1;
  }
  return seeded;
}

/** Bulk helper — dispatches stage changes silently and shows one summary toast. */
export function dispatchBulkStageChange(contexts: StageChangeContext[]): number {
  contexts.forEach((ctx) => dispatchStageChange({ ...ctx, silent: true }));
  if (contexts.length > 0) {
    toast.success(`${contexts.length} notification${contexts.length > 1 ? "s" : ""} dispatched`, {
      description: `Students alerted: ${contexts.slice(0, 3).map((c) => c.studentName).join(", ")}${contexts.length > 3 ? "…" : ""}`,
    });
  }
  return contexts.length;
}
