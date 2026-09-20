/**
 * Direct Messaging & Offer Negotiation — data layer.
 *
 * Threads connect recruiters, TPOs, and shortlisted students per company
 * drive. Messages carry read receipts and secure timestamps; presence is
 * simulated with a heartbeat. Live updates flow through a window event bus
 * (the WebSocket/SSE stub — swap `emitChange` for a socket push in
 * production without touching callers).
 */

import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ParticipantRole = "recruiter" | "tpo" | "student";

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  /** ISO timestamp of last activity — powers the online indicator */
  lastSeenAt: number;
}

export type MessageType = "text" | "offer" | "system";

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  type: MessageType;
  body: string;
  sentAt: number;
  /** ISO timestamp when each participant read the message */
  readBy: Record<string, number>;
  /** Attached offer negotiation reference */
  offerId?: string;
}

export interface Thread {
  id: string;
  /** Linked company drive */
  driveId: string;
  driveName: string;
  roleTitle: string;
  subject: string;
  participants: Participant[];
  createdAt: number;
  updatedAt: number;
}

const THREADS_KEY = "placement_portal_threads";
const MESSAGES_KEY = "placement_portal_messages";
const EVENT_NAME = "placement-messages-change";

// ─── Store ───────────────────────────────────────────────────────────────────

export function loadThreads(): Thread[] {
  try {
    return JSON.parse(localStorage.getItem(THREADS_KEY) || "[]") as Thread[];
  } catch {
    return [];
  }
}

export function loadMessages(threadId?: string): Message[] {
  try {
    const all = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]") as Message[];
    return threadId ? all.filter((m) => m.threadId === threadId) : all;
  } catch {
    return [];
  }
}

function saveThreads(items: Thread[]): void {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(items.slice(0, 50)));
    emitChange();
  } catch {
    // storage unavailable
  }
}

function saveMessages(items: Message[]): void {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(items.slice(-500)));
    emitChange();
  } catch {
    // storage unavailable
  }
}

/** Event bus emit — the live-update seam (WebSocket/SSE stub). */
function emitChange(): void {
  try {
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // non-browser
  }
}

export function subscribeToMessages(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  // Presence heartbeat — the "polling" fallback keeps online states fresh
  const heartbeat = window.setInterval(listener, 15_000);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
    window.clearInterval(heartbeat);
  };
}

// ─── Presence ────────────────────────────────────────────────────────────────

const ONLINE_WINDOW_MS = 60_000;

export function isOnline(p: Participant): boolean {
  return Date.now() - p.lastSeenAt < ONLINE_WINDOW_MS;
}

export function presenceLabel(p: Participant): string {
  const delta = Date.now() - p.lastSeenAt;
  if (delta < ONLINE_WINDOW_MS) return "Online";
  if (delta < 3_600_000) return `Active ${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `Active ${Math.floor(delta / 3_600_000)}h ago`;
  return `Active ${Math.floor(delta / 86_400_000)}d ago`;
}

export function touchPresence(threadId: string, participantId: string): void {
  saveThreads(
    loadThreads().map((t) =>
      t.id === threadId
        ? {
            ...t,
            updatedAt: Date.now(),
            participants: t.participants.map((p) =>
              p.id === participantId ? { ...p, lastSeenAt: Date.now() } : p,
            ),
          }
        : t,
    ),
  );
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export function sendMessage(input: {
  threadId: string;
  sender: Participant;
  body: string;
  type?: MessageType;
  offerId?: string;
}): Message {
  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    threadId: input.threadId,
    senderId: input.sender.id,
    senderName: input.sender.name,
    senderRole: input.sender.role,
    type: input.type ?? "text",
    body: input.body,
    sentAt: Date.now(),
    readBy: { [input.sender.id]: Date.now() },
    offerId: input.offerId,
  };
  saveMessages([...loadMessages(), message]);
  touchPresence(input.threadId, input.sender.id);
  return message;
}

/** Mark every unread message in a thread as read for a participant. */
export function markThreadRead(threadId: string, participantId: string): void {
  const updated = loadMessages().map((m) =>
    m.threadId === threadId && !m.readBy[participantId]
      ? { ...m, readBy: { ...m.readBy, [participantId]: Date.now() } }
      : m,
  );
  saveMessages(updated);
  touchPresence(threadId, participantId);
}

export function unreadCount(threadId: string, participantId: string): number {
  return loadMessages(threadId).filter(
    (m) => m.senderId !== participantId && !m.readBy[participantId],
  ).length;
}

// ─── Demo seed (idempotent) ──────────────────────────────────────────────────

export function seedDemoThreads(currentUserId: string, currentUserName: string): void {
  if (loadThreads().length > 0) return;

  const now = Date.now();
  const threads: Thread[] = [
    {
      id: "thr-1",
      driveId: "drv-1",
      driveName: "Google Cloud",
      roleTitle: "Cloud Solutions Associate",
      subject: "Interview follow-up & document verification",
      participants: [
        { id: "rec-1", name: "Sarah Chen — Google Recruiter", role: "recruiter", lastSeenAt: now - 2 * 60_000 },
        { id: "tpo-1", name: "Dr. K. Srinivas Rao — TPO", role: "tpo", lastSeenAt: now - 25 * 60_000 },
        { id: "stu-1", name: currentUserName, role: "student", lastSeenAt: now },
      ],
      createdAt: now - 3 * 86_400_000,
      updatedAt: now - 2 * 60_000,
    },
    {
      id: "thr-2",
      driveId: "drv-2",
      driveName: "Deloitte USI",
      roleTitle: "Analyst — Technology Consulting",
      subject: "Offer discussion",
      participants: [
        { id: "rec-2", name: "James Whitfield — Deloitte HR", role: "recruiter", lastSeenAt: now - 40 * 60_000 },
        { id: "tpo-1", name: "Dr. K. Srinivas Rao — TPO", role: "tpo", lastSeenAt: now - 3 * 3_600_000 },
        { id: "stu-1", name: currentUserName, role: "student", lastSeenAt: now - 10 * 60_000 },
      ],
      createdAt: now - 5 * 86_400_000,
      updatedAt: now - 40 * 60_000,
    },
  ];
  saveThreads(threads);

  saveMessages([
    {
      id: "msg-s1",
      threadId: "thr-1",
      senderId: "rec-1",
      senderName: "Sarah Chen — Google Recruiter",
      senderRole: "recruiter",
      type: "text",
      body: "Hi Aditya — strong performance in Technical Interview 2. The panel was impressed with your system design approach.",
      sentAt: now - 26 * 3_600_000,
      readBy: { "rec-1": now - 26 * 3_600_000, "stu-1": now - 25 * 3_600_000, "tpo-1": now - 24 * 3_600_000 },
    },
    {
      id: "msg-s2",
      threadId: "thr-1",
      senderId: "stu-1",
      senderName: currentUserName,
      senderRole: "student",
      type: "text",
      body: "Thank you! I really enjoyed the design discussion. Is there anything else you need from my side?",
      sentAt: now - 25 * 3_600_000,
      readBy: { "stu-1": now - 25 * 3_600_000, "rec-1": now - 24 * 3_600_000 },
    },
    {
      id: "msg-s3",
      threadId: "thr-1",
      senderId: "rec-1",
      senderName: "Sarah Chen — Google Recruiter",
      senderRole: "recruiter",
      type: "text",
      body: "Just the final transcript upload — the TPO has flagged your vault document for verification. Should be quick.",
      sentAt: now - 2 * 60_000,
      readBy: { "rec-1": now - 2 * 60_000 },
    },
    {
      id: "msg-s4",
      threadId: "thr-2",
      senderId: "rec-2",
      senderName: "James Whitfield — Deloitte HR",
      senderRole: "recruiter",
      type: "offer",
      body: "We're pleased to extend a formal offer — details attached in the negotiation card.",
      sentAt: now - 40 * 60_000,
      readBy: { "rec-2": now - 40 * 60_000 },
      offerId: "ofr-1",
    },
  ]);
}

// ─── Current user helpers ────────────────────────────────────────────────────

export function meAsParticipant(
  userId: string,
  name: string,
  role: ParticipantRole,
): Participant {
  return { id: userId, name, role, lastSeenAt: Date.now() };
}

/** Resolve a readable display name for a message sender. */
export function senderShortName(m: Message): string {
  const [namePart] = m.senderName.split(" — ");
  return namePart;
}

export function notifyMessage(message: Message, isOwn: boolean): void {
  if (isOwn) return;
  toast.info(`${senderShortName(message)} sent a message`, {
    description: message.body.slice(0, 80) + (message.body.length > 80 ? "…" : ""),
  });
}
