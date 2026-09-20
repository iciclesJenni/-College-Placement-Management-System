/**
 * Demo Dataset Hydration — populates every localStorage-backed feature
 * store with rich, realistic data so presentations show fully-populated
 * dashboards, feeds, chats, and offers immediately after a role switch.
 *
 * Idempotent per dataset: seeding only fills gaps, never duplicates.
 * The `force` flag clears and re-seeds (the switcher's re-hydrate button).
 */

import { loadBroadcasts } from "@/services/broadcasts";
import { getNotifications } from "@/services/notifications";
import { loadOffers, seedDemoOffer } from "@/services/offers";
import { loadThreads, seedDemoThreads } from "@/services/messages";
import { loadVault } from "@/services/offer-generator";
import { addToVault } from "@/services/offer-generator";
import { mockStudents } from "@/lib/mock-data";

export const DEMO_STUDENT = mockStudents[0];

export function seedDemoData(role?: "student" | "tpo" | "recruiter", force = false): void {
  if (force) {
    localStorage.removeItem("placement_portal_broadcasts");
    localStorage.removeItem("placement_portal_notifications");
    localStorage.removeItem("placement_portal_offers");
    localStorage.removeItem("placement_portal_threads");
    localStorage.removeItem("placement_portal_messages");
    localStorage.removeItem("placement_portal_vault");
  }

  seedBroadcasts();
  seedNotifications();
  seedOffersAndThreads();
  if (role === "student" || role === undefined) seedVault();
}

// ─── Broadcasts ──────────────────────────────────────────────────────────────

function seedBroadcasts(): void {
  if (loadBroadcasts().length > 0) return;

  const seed = [
    {
      id: "bct-seed-1",
      title: "Google Cloud — Slot booking closes tomorrow 5 PM",
      body: "Technical Interview 2 slot booking for shortlisted candidates closes tomorrow at 5:00 PM sharp. Book your slot from the dashboard before the window shuts — late requests will not be entertained.",
      priority: "urgent" as const,
      target: { kind: "branches" as const, branches: ["CSE", "IT"] },
      channels: ["in_app", "email", "webhook_sms"],
      driveId: "drv-1",
      driveName: "Google Cloud",
      ctaLabel: "Open Drive",
      ctaUrl: "/student/drives",
      authorName: "Dr. K. Srinivas Rao — TPO",
      publishedAt: Date.now() - 2 * 3_600_000,
      readBy: {},
      delivery: [
        { channel: "in_app" as const, recipients: 84, status: "dispatched" as const },
        { channel: "email" as const, recipients: 84, status: "dispatched" as const },
        { channel: "webhook_sms" as const, recipients: 41, status: "dispatched" as const },
      ],
    },
    {
      id: "bct-seed-2",
      title: "Deloitte USI consent form — sign by Friday",
      body: "All shortlisted candidates must submit the signed consent form before Friday 4:00 PM. Upload the signed copy to your Document Vault; unverified submissions will be flagged in the TPO audit.",
      priority: "critical" as const,
      target: { kind: "unplaced" as const },
      channels: ["in_app", "email"],
      driveId: "drv-2",
      driveName: "Deloitte USI",
      ctaLabel: "Submit Consent",
      ctaUrl: "/student/vault",
      authorName: "Dr. K. Srinivas Rao — TPO",
      publishedAt: Date.now() - 8 * 3_600_000,
      readBy: {},
      delivery: [
        { channel: "in_app" as const, recipients: 132, status: "dispatched" as const },
        { channel: "email" as const, recipients: 132, status: "dispatched" as const },
      ],
    },
    {
      id: "bct-seed-3",
      title: "Placement week 2026 — orientation deck published",
      body: "The orientation deck covering the tier policy, One Job Policy, and resume standards is now available. All students are encouraged to review it before the mid-semester drive wave begins.",
      priority: "low" as const,
      target: { kind: "all" as const },
      channels: ["in_app"],
      ctaLabel: "Join Meeting",
      ctaUrl: "/student/announcements",
      authorName: "Dr. K. Srinivas Rao — TPO",
      publishedAt: Date.now() - 26 * 3_600_000,
      readBy: { [DEMO_STUDENT.id]: Date.now() - 20 * 3_600_000 },
      delivery: [{ channel: "in_app" as const, recipients: 216, status: "dispatched" as const }],
    },
  ];

  localStorage.setItem("placement_portal_broadcasts", JSON.stringify(seed));
}

// ─── Notifications ───────────────────────────────────────────────────────────

function seedNotifications(): void {
  if (getNotifications().length > 0) return;

  const seed = [
    {
      id: "ntf-seed-1",
      kind: "interview_slot",
      recipientId: DEMO_STUDENT.id,
      recipientName: DEMO_STUDENT.name,
      recipientEmail: DEMO_STUDENT.email,
      title: "Interview scheduled — Google Cloud",
      body: "Your Cloud Solutions Associate interview slot is booked for 6:15 PM. Join via Google Meet.",
      createdAt: Date.now() - 3 * 3_600_000,
      actionUrl: "/student/dashboard",
      emailQueued: true,
      read: false,
    },
    {
      id: "ntf-seed-2",
      kind: "offer",
      recipientId: "stu-6",
      recipientName: "Kavya Krishnamurthy",
      recipientEmail: "kavya@college.edu.in",
      title: "Google Cloud — Offer released 🏆",
      body: "Congratulations! An offer of ₹18 LPA has been released. Review and respond from your Messages inbox.",
      createdAt: Date.now() - 5 * 86_400_000,
      actionUrl: "/messages",
      emailQueued: true,
      read: true,
    },
    {
      id: "ntf-seed-3",
      kind: "shortlist",
      recipientId: DEMO_STUDENT.id,
      recipientName: DEMO_STUDENT.name,
      recipientEmail: DEMO_STUDENT.email,
      title: "Deloitte USI — You've been shortlisted 🎉",
      body: "Congratulations — you've cleared the initial screening. Cognitive assessment details to follow.",
      createdAt: Date.now() - 2 * 86_400_000,
      actionUrl: "/student/applications",
      emailQueued: true,
      read: false,
    },
    {
      id: "ntf-seed-4",
      kind: "deadline",
      recipientId: DEMO_STUDENT.id,
      recipientName: DEMO_STUDENT.name,
      recipientEmail: DEMO_STUDENT.email,
      title: "Deadline approaching — TCS (Digital / Ninja)",
      body: "Applications for System Engineer close in 5 days (Sep 20, 2026). Submit before the window closes.",
      createdAt: Date.now() - 12 * 3_600_000,
      actionUrl: "/student/drives",
      emailQueued: true,
      read: true,
    },
  ];

  localStorage.setItem("placement_portal_notifications", JSON.stringify(seed));
}

// ─── Offers + message threads ────────────────────────────────────────────────

function seedOffersAndThreads(): void {
  seedDemoOffer();
  if (loadOffers().length === 0) seedDemoOffer();
  if (loadThreads().length === 0) {
    seedDemoThreads(DEMO_STUDENT.id, DEMO_STUDENT.name);
  }
}

// ─── Vault documents ─────────────────────────────────────────────────────────

function seedVault(): void {
  if (loadVault(DEMO_STUDENT.id).length > 0) return;

  const docs = [
    {
      id: "doc-seed-transcript",
      kind: "transcript" as const,
      title: "Official Transcript — Semesters 1–6",
      studentId: DEMO_STUDENT.id,
      uploadedAt: Date.now() - 12 * 86_400_000,
      hash: "9f2c4a7e1b8d3f6a0c5e9b2d7f4a1c8e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a",
      auditStatus: "approved" as const,
      auditNote: "Verified against university records by the TPO cell.",
      fileSizeKb: 1240,
    },
    {
      id: "doc-seed-marksheet-s6",
      kind: "marksheet" as const,
      title: "Semester 6 Mark Sheet",
      studentId: DEMO_STUDENT.id,
      uploadedAt: Date.now() - 5 * 86_400_000,
      hash: "3b7e1c9f5a2d8e4b0f6c3a9d1e7b4f0c8a2d5e9b3f6c1a4d7e0b3f6c9a2d5e8",
      auditStatus: "approved" as const,
      auditNote: "Marks reconciled with the examination branch.",
      fileSizeKb: 380,
    },
    {
      id: "doc-seed-marksheet-s7",
      kind: "marksheet" as const,
      title: "Semester 7 Mark Sheet (Provisional)",
      studentId: DEMO_STUDENT.id,
      uploadedAt: Date.now() - 1 * 86_400_000,
      hash: "7d4a0e2b9f6c3a1d8e5b0f3c6a9d2e7b4f1c8a0d5e3b6f9c2a5d8e1b4f7c0a3",
      auditStatus: "pending" as const,
      fileSizeKb: 412,
    },
  ];

  docs.forEach(addToVault);
}
