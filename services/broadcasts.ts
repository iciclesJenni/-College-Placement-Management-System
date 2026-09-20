/**
 * Placement Drive Broadcast & Announcement Center — data layer.
 *
 * Stores official TPO broadcasts with cohort targeting, multi-channel
 * delivery simulation (In-App / Email / Webhook-SMS stubs), and priority
 * tiers. Provides a reactive feed for the student announcement page with
 * unread counting and 1-click mark-all-read.
 *
 * The store is localStorage-backed with a window event bus so every open
 * view (sidebar badge, feed, bell) updates instantly on publish.
 */

import { toast } from "sonner";
import type { Department } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BroadcastPriority = "low" | "urgent" | "critical";
export type DeliveryChannel = "in_app" | "email" | "webhook_sms";

export type CohortTarget =
  | { kind: "all" }
  | { kind: "unplaced" }
  | { kind: "branches"; branches: Department[] }
  | { kind: "cgpa"; minCgpa: number };

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  priority: BroadcastPriority;
  target: CohortTarget;
  channels: DeliveryChannel[];
  /** Linked drive id, when the broadcast concerns a specific company drive */
  driveId?: string;
  driveName?: string;
  /** Deep-link CTA shown on the announcement card */
  ctaLabel?: string;
  ctaUrl?: string;
  authorName: string;
  publishedAt: number;
  /** Per-student read tracking is handled by readAt map keyed by studentId */
  readBy: Record<string, number>;
  /** Delivery receipts per channel (simulated transport results) */
  delivery: {
    channel: DeliveryChannel;
    recipients: number;
    status: "dispatched" | "failed";
  }[];
}

type Listener = () => void;

const STORAGE_KEY = "placement_portal_broadcasts";
const EVENT_NAME = "placement-broadcast-change";

// ─── Store ───────────────────────────────────────────────────────────────────

export function loadBroadcasts(): Broadcast[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Broadcast[];
  } catch {
    return [];
  }
}

function save(items: Broadcast[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // storage unavailable
  }
}

export function subscribeToBroadcasts(listener: Listener): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Cohort match test — determines whether a student receives a broadcast. */
export function matchesCohort(
  target: CohortTarget,
  student: { department: string; cgpa: number; placementStatus: string },
): boolean {
  switch (target.kind) {
    case "all":
      return true;
    case "unplaced":
      return student.placementStatus !== "placed";
    case "branches":
      return target.branches.includes(student.department as Department);
    case "cgpa":
      return student.cgpa >= target.minCgpa;
  }
}

/** Count of students in the current cohort (composer preview). */
export function countCohort(
  target: CohortTarget,
  students: { department: string; cgpa: number; placementStatus: string }[],
): number {
  return students.filter((s) => matchesCohort(target, s)).length;
}

// ─── Multi-channel dispatch (transport stubs) ────────────────────────────────

function dispatchEmailStub(recipients: number, title: string): Broadcast["delivery"][number] {
  // Production: batch-send via Resend / SES action.
  console.info(
    `%c[EMAIL BROADCAST]%c "${title}" → ${recipients} recipients`,
    "background:#7c3aed;color:#fbbf24;font-weight:bold;padding:2px 6px;border-radius:4px",
    "color:inherit",
  );
  return { channel: "email" as const, recipients, status: "dispatched" as const };
}

function dispatchWebhookSmsStub(recipients: number, title: string): Broadcast["delivery"][number] {
  // Production: POST to Twilio / Gupshup webhook with templated SMS/WhatsApp payload.
  console.info(
    `%c[WEBHOOK/SMS DISPATCH]%c "${title}" → ${recipients} recipients (stub)`,
    "background:#f59e0b;color:#030307;font-weight:bold;padding:2px 6px;border-radius:4px",
    "color:inherit",
  );
  return { channel: "webhook_sms" as const, recipients, status: "dispatched" as const };
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export interface PublishInput {
  title: string;
  body: string;
  priority: BroadcastPriority;
  target: CohortTarget;
  channels: DeliveryChannel[];
  cohortCount: number;
  driveId?: string;
  driveName?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  authorName: string;
}

/** Publish a broadcast — persists instantly and simulates channel delivery. */
export function publishBroadcast(input: PublishInput): Broadcast {
  const delivery: Broadcast["delivery"] = [];

  for (const channel of input.channels) {
    if (channel === "in_app") {
      delivery.push({ channel, recipients: input.cohortCount, status: "dispatched" });
    } else if (channel === "email") {
      delivery.push(dispatchEmailStub(input.cohortCount, input.title));
    } else {
      delivery.push(dispatchWebhookSmsStub(input.cohortCount, input.title));
    }
  }

  const broadcast: Broadcast = {
    id: `bct-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    priority: input.priority,
    target: input.target,
    channels: input.channels,
    driveId: input.driveId,
    driveName: input.driveName,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    authorName: input.authorName,
    publishedAt: Date.now(),
    readBy: {},
    delivery,
  };

  save([broadcast, ...loadBroadcasts()]);

  const channelsLabel = input.channels
    .map((c) => (c === "in_app" ? "In-App" : c === "email" ? "Email" : "SMS/WhatsApp"))
    .join(" + ");
  toast.success("Broadcast published", {
    description: `${input.cohortCount} students • ${channelsLabel} dispatched`,
  });

  return broadcast;
}

export function deleteBroadcast(id: string): void {
  save(loadBroadcasts().filter((b) => b.id !== id));
}

// ─── Student-side reads ──────────────────────────────────────────────────────

export function getStudentFeed(
  student: { id: string; department: string; cgpa: number; placementStatus: string },
): Broadcast[] {
  return loadBroadcasts()
    .filter((b) => matchesCohort(b.target, student))
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

export function getUnreadBroadcastCount(student: { id: string; department: string; cgpa: number; placementStatus: string }): number {
  return getStudentFeed(student).filter((b) => !b.readBy[student.id]).length;
}

export function markBroadcastRead(broadcastId: string, studentId: string): void {
  save(
    loadBroadcasts().map((b) =>
      b.id === broadcastId ? { ...b, readBy: { ...b.readBy, [studentId]: Date.now() } } : b,
    ),
  );
}

export function markAllBroadcastsRead(student: { id: string; department: string; cgpa: number; placementStatus: string }): void {
  const stamp = Date.now();
  save(
    loadBroadcasts().map((b) =>
      matchesCohort(b.target, student) && !b.readBy[student.id]
        ? { ...b, readBy: { ...b.readBy, [student.id]: stamp } }
        : b,
    ),
  );
  toast.success("All announcements marked as read");
}
