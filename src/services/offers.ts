/**
 * Offer Negotiation & Response Workflow — data layer.
 *
 * Tracks formal offers extended to students with full negotiation state:
 * viewed → extension requested → accepted (digitally signed) / declined.
 * Every accept/decline fires an instant alert to TPO admins through the
 * notification dispatch service.
 */

import { dispatchStageChange } from "@/services/notifications";
import { toast } from "sonner";

export type OfferStatus =
  | "extended"
  | "viewed"
  | "extension_requested"
  | "accepted"
  | "declined";

export interface OfferNegotiation {
  id: string;
  threadId: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  studentId: string;
  studentName: string;
  ctc: string;
  /** ISO date */
  joiningDate: string;
  status: OfferStatus;
  /** Student-facing note from the recruiter */
  note?: string;
  /** Extension request details */
  extensionRequest?: { requestedDate: string; reason: string; requestedAt: number };
  /** Digital signature capture on accept/decline */
  signature?: { signedBy: string; signedAt: number; hash: string };
  /** Response note on decline */
  declineReason?: string;
  timeline: { status: OfferStatus; at: number; by?: string }[];
}

const KEY = "placement_portal_offers";
const EVENT_NAME = "placement-offers-change";

export function loadOffers(): OfferNegotiation[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as OfferNegotiation[];
  } catch {
    return [];
  }
}

function save(items: OfferNegotiation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // storage unavailable
  }
}

export function subscribeToOffers(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getOffer(offerId: string): OfferNegotiation | undefined {
  return loadOffers().find((o) => o.id === offerId);
}

/** Digital signature hash over the acceptance terms. */
async function signHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Seed the demo offer referenced by the Deloitte thread (idempotent). */
export function seedDemoOffer(): void {
  if (loadOffers().some((o) => o.id === "ofr-1")) return;
  const offer: OfferNegotiation = {
    id: "ofr-1",
    threadId: "thr-2",
    driveId: "drv-2",
    companyName: "Deloitte USI",
    roleTitle: "Analyst — Technology Consulting",
    studentId: "stu-1",
    studentName: "Aditya Verma",
    ctc: "₹7.6 LPA",
    joiningDate: new Date(Date.now() + 45 * 86_400_000).toISOString().split("T")[0],
    status: "extended",
    note: "Based on your strong performance across all rounds, we're delighted to extend this offer. The package includes performance bonuses and full health coverage.",
    timeline: [{ status: "extended", at: Date.now() - 40 * 60_000 }],
  };
  save([offer]);
}

async function updateOffer(
  id: string,
  patch: (o: OfferNegotiation) => OfferNegotiation,
): Promise<OfferNegotiation | undefined> {
  const offers = loadOffers();
  const target = offers.find((o) => o.id === id);
  if (!target) return undefined;
  const updated = patch(target);
  save(offers.map((o) => (o.id === id ? updated : o)));
  return updated;
}

export function updateOfferSync(
  id: string,
  patch: (o: OfferNegotiation) => OfferNegotiation,
): OfferNegotiation | undefined {
  const offers = loadOffers();
  const target = offers.find((o) => o.id === id);
  if (!target) return undefined;
  const updated = patch(target);
  save(offers.map((o) => (o.id === id ? updated : o)));
  return updated;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export function markOfferViewed(id: string): void {
  void updateOffer(id, (o) =>
    o.status === "extended"
      ? { ...o, status: "viewed", timeline: [...o.timeline, { status: "viewed", at: Date.now() }] }
      : o,
  );
}

export async function acceptOffer(
  id: string,
  signedBy: string,
  ctx: { studentId: string; studentName: string; studentEmail: string; driveId: string; companyName: string; roleTitle: string },
): Promise<OfferNegotiation | undefined> {
  const offer = getOffer(id);
  if (!offer) return undefined;
  const signedAt = Date.now();
  const hash = await signHash(`${id}|${signedBy}|ACCEPT|${offer.ctc}|${offer.joiningDate}|${signedAt}`);

  const updated = await updateOffer(id, (o) => ({
    ...o,
    status: "accepted",
    signature: { signedBy, signedAt, hash },
    timeline: [...o.timeline, { status: "accepted", at: signedAt, by: signedBy }],
  }));

  // Instant TPO alert
  dispatchStageChange({
    studentId: ctx.studentId,
    studentName: ctx.studentName,
    studentEmail: ctx.studentEmail,
    companyName: ctx.companyName,
    roleTitle: ctx.roleTitle,
    newStatus: "offered",
    applicationId: `offer-${id}`,
  });
  toast.success("Offer accepted and digitally signed", {
    description: "TPO admin has been notified instantly.",
  });
  return updated;
}

export async function declineOffer(
  id: string,
  signedBy: string,
  reason: string,
  ctx: { studentId: string; studentName: string; studentEmail: string; driveId: string; companyName: string; roleTitle: string },
): Promise<OfferNegotiation | undefined> {
  const offer = getOffer(id);
  if (!offer) return undefined;
  const signedAt = Date.now();
  const hash = await signHash(`${id}|${signedBy}|DECLINE|${reason}|${signedAt}`);

  const updated = await updateOffer(id, (o) => ({
    ...o,
    status: "declined",
    declineReason: reason,
    signature: { signedBy, signedAt, hash },
    timeline: [...o.timeline, { status: "declined", at: signedAt, by: signedBy }],
  }));

  dispatchStageChange({
    studentId: ctx.studentId,
    studentName: ctx.studentName,
    studentEmail: ctx.studentEmail,
    companyName: ctx.companyName,
    roleTitle: ctx.roleTitle,
    newStatus: "rejected",
    applicationId: `offer-${id}`,
  });
  toast("Offer response recorded", {
    description: "The recruiter and TPO have been notified of your decision.",
  });
  return updated;
}

export function requestExtension(
  id: string,
  requestedDate: string,
  reason: string,
): OfferNegotiation | undefined {
  return updateOfferSync(id, (o) => ({
    ...o,
    status: "extension_requested",
    extensionRequest: { requestedDate, reason, requestedAt: Date.now() },
    timeline: [...o.timeline, { status: "extension_requested", at: Date.now() }],
  }));
}

export function approveExtension(id: string, newJoiningDate: string): OfferNegotiation | undefined {
  return updateOfferSync(id, (o) => ({
    ...o,
    status: "extended",
    joiningDate: newJoiningDate,
    extensionRequest: undefined,
    timeline: [...o.timeline, { status: "extended", at: Date.now(), by: "TPO approved extension" }],
  }));
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const OFFER_STATUS_META: Record<
  OfferStatus,
  { label: string; chip: string }
> = {
  extended: { label: "Offer Extended", chip: "text-purple-300 bg-purple-600/10 border-purple-500/30" },
  viewed: { label: "Under Review", chip: "text-slate-300 bg-secondary border-border" },
  extension_requested: { label: "Extension Requested", chip: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  accepted: { label: "Accepted", chip: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  declined: { label: "Declined", chip: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};
