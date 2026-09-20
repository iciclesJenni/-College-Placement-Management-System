import type { ApplicationStatus } from "@/types";

// ─── Interview Schedule Types ────────────────────────────────────────────────

export type InterviewRoundType = "technical" | "hr" | "assessment";

export interface InterviewTopic {
  title: string;
  detail: string;
}

export interface UpcomingInterview {
  id: string;
  studentId: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  ctc: string;
  roundType: InterviewRoundType;
  roundName: string;
  roundNumber: number;
  totalRounds: number;
  /** ISO datetime string of the scheduled slot */
  scheduledAt: string;
  durationMinutes: number;
  meetLink: string;
  status: "scheduled" | "rescheduled" | "completed";
  prerequisites: string[];
  topics: InterviewTopic[];
  interviewerNotes?: string;
}

// ─── Mock Scheduled Interviews ───────────────────────────────────────────────
// Anchored relative to "now" so countdowns always look live.

const now = Date.now();
const H = 3600_000;
const MIN = 60_000;

export const mockUpcomingInterviews: UpcomingInterview[] = [
  {
    id: "ivw-1",
    studentId: "stu-1",
    driveId: "drv-1",
    companyName: "Google Cloud",
    roleTitle: "Cloud Solutions Associate",
    ctc: "₹18 LPA",
    roundType: "technical",
    roundName: "Technical Interview 1",
    roundNumber: 2,
    totalRounds: 4,
    scheduledAt: new Date(now + 5 * H + 42 * MIN).toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.google.com/kvz-mhqp-sdn",
    status: "scheduled",
    prerequisites: [
      "Carry a printed copy of your updated resume",
      "Government-issued photo ID for verification",
      "Stable internet connection — join 10 minutes early",
    ],
    topics: [
      { title: "Data Structures & Algorithms", detail: "Arrays, trees, graph traversals — expect 2 live coding problems" },
      { title: "System Design Basics", detail: "Design a URL shortener; focus on scaling and caching layers" },
      { title: "GCP Fundamentals", detail: "Compute Engine vs Cloud Run, IAM roles, basic networking" },
    ],
    interviewerNotes:
      "Panel: 2 engineers from the Cloud infra team. Emphasis on problem-solving approach over perfect answers — narrate your thought process.",
  },
  {
    id: "ivw-2",
    studentId: "stu-1",
    driveId: "drv-2",
    companyName: "Deloitte USI",
    roleTitle: "Analyst — Technology Consulting",
    ctc: "₹7.6 LPA",
    roundType: "hr",
    roundName: "Technical & HR Interview",
    roundNumber: 3,
    totalRounds: 3,
    scheduledAt: new Date(now + 26 * H + 15 * MIN).toISOString(),
    durationMinutes: 30,
    meetLink: "https://meet.google.com/xbt-qrwn-jlf",
    status: "rescheduled",
    prerequisites: [
      "Review your submitted application notes",
      "Prepare 2–3 questions to ask the panel",
      "Business formal attire expected on camera",
    ],
    topics: [
      { title: "Behavioral / STAR Round", detail: "Teamwork, conflict resolution, and leadership scenarios" },
      { title: "Project Deep-Dive", detail: "Walk through your capstone project — architecture and trade-offs" },
      { title: "Consulting Fit", detail: "Client communication style, adaptability, why consulting" },
    ],
    interviewerNotes:
      "Final round. Combined tech + HR panel. The reschedule was requested by the company — original slot moved one day later.",
  },
  {
    id: "ivw-3",
    studentId: "stu-6",
    driveId: "drv-1",
    companyName: "Google Cloud",
    roleTitle: "Cloud Solutions Associate",
    ctc: "₹18 LPA",
    roundType: "assessment",
    roundName: "Googliness & HR",
    roundNumber: 4,
    totalRounds: 4,
    scheduledAt: new Date(now + 3 * 24 * H).toISOString(),
    durationMinutes: 40,
    meetLink: "https://meet.google.com/pwd-nskm-tvx",
    status: "scheduled",
    prerequisites: [
      "Complete the pre-read doc shared by the coordinator",
      "Reflect on past collaboration examples",
    ],
    topics: [
      { title: "Googliness Interview", detail: "Values alignment, ownership, and ambiguity handling" },
      { title: "HR Discussion", detail: "Compensation expectations, relocation willingness, start date" },
    ],
  },
  {
    id: "ivw-4",
    studentId: "stu-9",
    driveId: "drv-1",
    companyName: "Google Cloud",
    roleTitle: "Cloud Solutions Associate",
    ctc: "₹18 LPA",
    roundType: "technical",
    roundName: "Technical Interview 2",
    roundNumber: 3,
    totalRounds: 4,
    scheduledAt: new Date(now - 2 * H).toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.google.com/htr-jwyc-bqe",
    status: "completed",
    prerequisites: [],
    topics: [
      { title: "Distributed Systems", detail: "Consensus, sharding strategies, message queues" },
    ],
    interviewerNotes: "Round completed — awaiting panel feedback.",
  },
];

// ─── Round-type presentation config ─────────────────────────────────────────

export const ROUND_TYPE_CONFIG: Record<
  InterviewRoundType,
  { label: string; color: string; icon: string }
> = {
  technical: { label: "Technical", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "code" },
  hr: { label: "HR", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", icon: "user" },
  assessment: { label: "Assessment", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: "clipboard" },
};

export const INTERVIEW_STATUS_CONFIG: Record<
  UpcomingInterview["status"],
  { label: string; color: string }
> = {
  scheduled: { label: "Scheduled", color: "bg-primary/15 text-primary border-primary/30" },
  rescheduled: { label: "Rescheduled", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

/** Human-friendly countdown from an ISO datetime. */
export function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Now";

  const days = Math.floor(diff / (24 * H));
  const hours = Math.floor((diff % (24 * H)) / H);
  const minutes = Math.floor((diff % H) / MIN);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export function formatSlotTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export type { ApplicationStatus };
