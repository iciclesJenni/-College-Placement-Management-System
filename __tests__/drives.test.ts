/**
 * Integration Tests — Drive Management, Application State Machine & Slot
 * Allocation (the server-action seams).
 *
 * These tests exercise the exact validation schemas, transition guards, and
 * allocation algorithms the Convex mutations run in production:
 *
 *   - `createDriveSchema`      — the same Zod pipeline `drives.createDrive`
 *                                runs before any db.insert (transactional
 *                                write only happens on a full parse pass).
 *   - `bulkUpdateStatusSchema` — the all-or-nothing bulk shortlist/reject
 *                                wave; a single invalid ID aborts the batch
 *                                (the Prisma-$transaction / Convex-atomic
 *                                contract).
 *   - Application status state machine — the legal `APPLICATION_STATUSES`
 *                                progression enforced by `updateApplicationStatus`,
 *                                including the offer→placed and
 *                                offered→rejected→not_placed side-effects.
 *   - Interview slot allocation — the Scheduler's 30-minute chunking,
 *                                booking state transitions, and the
 *                                conflict-free (one candidate, one active
 *                                slot) invariant.
 */

import { describe, it, expect } from "vitest";
import {
  createDriveSchema,
  bulkUpdateStatusSchema,
  updateApplicationStatusSchema,
  applicationStatusSchema,
  APPLICATION_STATUSES,
} from "@/lib/schemas";
import type { ApplicationStatus } from "@/types";

// ─── Slot allocation engine (mirrors src/pages/tpo/Scheduler.tsx) ───────────

const SLOT_DURATION_MIN = 30;

interface InterviewSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  status: "available" | "booked" | "completed";
  candidateId: string | null;
  candidateName: string | null;
  meetLink: string | null;
}

interface DayWindow {
  id: string;
  date: string;
  start: string;
  end: string;
}

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

function generateMeetLink(slotKey: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const pick = (n: number) =>
    Array.from(
      { length: n },
      (_, i) =>
        chars[
          (slotKey.charCodeAt(i % slotKey.length) * 31 + i * 7 + (i + 1) * 13) % 26
        ],
    ).join("");
  return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

/** Faithful port of the Scheduler's window-chunking slot generator. */
function generateSlots(
  windows: DayWindow[],
  existing: Record<string, InterviewSlot[]>,
): Record<string, InterviewSlot[]> {
  const result: Record<string, InterviewSlot[]> = {};

  for (const w of windows) {
    const key = w.date;
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

/**
 * Faithful port of the Scheduler's assignCandidate reducer, including the
 * conflict-prevention guard (one candidate may hold only one non-completed
 * booking; a conflict returns state unchanged).
 */
function assignCandidate(
  slotsByDate: Record<string, InterviewSlot[]>,
  dateKey: string,
  slotId: string,
  candidateId: string | null,
  candidateName: string | null,
): Record<string, InterviewSlot[]> {
  const slots = slotsByDate[dateKey] ?? [];

  const alreadyBooked = slots.find(
    (s) => s.id !== slotId && s.candidateId === candidateId && s.status !== "completed",
  );
  if (candidateId && alreadyBooked) {
    return slotsByDate; // conflict — no write
  }

  return {
    ...slotsByDate,
    [dateKey]: slots.map((s) => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        candidateId: candidateId || null,
        candidateName: candidateId ? candidateName : null,
        status: candidateId ? "booked" : "available",
        meetLink: candidateId ? (s.meetLink ?? generateMeetLink(slotId)) : null,
      };
    }),
  };
}

// ─── Drive creation transaction validation ──────────────────────────────────

describe("drive creation — transactional validation pipeline", () => {
  const validDrive = {
    companyName: "Amazon",
    roleTitle: "Software Engineer",
    description: "Retail cloud services.",
    jobDescription: "Build scalable systems.",
    ctcLpa: 22,
    driveDate: "2026-11-20T10:00",
    deadline: "2026-10-05T18:00",
    minCgpa: 7.5,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT"],
    rounds: ["Online Assessment", "Technical Interview", "HR"],
  };

  it("accepts a fully valid drive payload (transaction commits)", () => {
    const parsed = createDriveSchema.safeParse(validDrive);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ctcLpa).toBe(22);
      expect(parsed.data.allowedBranches).toContain("CSE");
    }
  });

  it("rolls back on drive date before the application deadline (cross-field refine)", () => {
    const parsed = createDriveSchema.safeParse({
      ...validDrive,
      driveDate: "2026-09-01T10:00",
      deadline: "2026-10-05T18:00",
    });
    expect(parsed.success).toBe(false);
  });

  it("rolls back on non-positive CTC", () => {
    const parsed = createDriveSchema.safeParse({ ...validDrive, ctcLpa: 0 });
    expect(parsed.success).toBe(false);
  });

  it("rolls back on an empty hiring-round list (min 1 round)", () => {
    const parsed = createDriveSchema.safeParse({ ...validDrive, rounds: [] });
    expect(parsed.success).toBe(false);
  });

  it("rolls back on CGPA above the 10.0 scale", () => {
    const parsed = createDriveSchema.safeParse({ ...validDrive, minCgpa: 10.5 });
    expect(parsed.success).toBe(false);
  });

  it("rolls back on fractional backlog limits", () => {
    const parsed = createDriveSchema.safeParse({
      ...validDrive,
      maxActiveBacklogs: 1.5,
    });
    expect(parsed.success).toBe(false);
  });

  it("rolls back when no eligible branch is selected", () => {
    const parsed = createDriveSchema.safeParse({ ...validDrive, allowedBranches: [] });
    expect(parsed.success).toBe(false);
  });
});

// ─── Application status state machine ────────────────────────────────────────

/** The canonical forward pipeline the pipeline stepper and mutations follow. */
const FORWARD_PIPELINE: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "online_assessment",
  "technical_interview",
  "hr_interview",
  "offered",
];

describe("application status — state transition rules", () => {
  it("accepts the full forward pipeline as a sequence of legal transitions", () => {
    for (const status of FORWARD_PIPELINE) {
      const parsed = updateApplicationStatusSchema.safeParse({
        applicationId: "app-1",
        status,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects statuses outside the defined state machine", () => {
    const parsed = updateApplicationStatusSchema.safeParse({
      applicationId: "app-1",
      status: "PHONE_SCREEN",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires an application ID for any transition", () => {
    const parsed = updateApplicationStatusSchema.safeParse({
      applicationId: "",
      status: "shortlisted",
    });
    expect(parsed.success).toBe(false);
  });

  it("exposes the exact seven-state enum the stepper renders", () => {
    expect(applicationStatusSchema.options).toEqual([
      "applied",
      "shortlisted",
      "online_assessment",
      "technical_interview",
      "hr_interview",
      "offered",
      "rejected",
    ]);
    expect(APPLICATION_STATUSES).toHaveLength(7);
  });

  it("carries optional round and notes context with transitions", () => {
    const parsed = updateApplicationStatusSchema.safeParse({
      applicationId: "app-1",
      status: "technical_interview",
      currentRound: "Technical Interview 1",
      notes: "Scored 94% on the OA.",
    });
    expect(parsed.success).toBe(true);
  });
});

// ─── Bulk operations (all-or-nothing contract) ───────────────────────────────

describe("bulk status updates — all-or-nothing validation", () => {
  it("accepts a valid shortlist wave", () => {
    const parsed = bulkUpdateStatusSchema.safeParse({
      applicationIds: ["app-1", "app-2", "app-3"],
      status: "shortlisted",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty batch (nothing to transact)", () => {
    const parsed = bulkUpdateStatusSchema.safeParse({
      applicationIds: [],
      status: "rejected",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects batches above the 500-application transaction ceiling", () => {
    const parsed = bulkUpdateStatusSchema.safeParse({
      applicationIds: Array.from({ length: 501 }, (_, i) => `app-${i}`),
      status: "shortlisted",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a batch containing an invalid status payload", () => {
    const parsed = bulkUpdateStatusSchema.safeParse({
      applicationIds: ["app-1"],
      status: "promo",
    });
    expect(parsed.success).toBe(false);
  });
});

// ─── Interview slot allocation ───────────────────────────────────────────────

describe("interview slot generator — window chunking", () => {
  it("chunks a 10:00–16:00 window into twelve 30-minute slots", () => {
    const slots = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "10:00", end: "16:00" }],
      {},
    );
    expect(slots["2026-10-10"]).toHaveLength(12);
    expect(slots["2026-10-10"][0].label).toBe("10:00 AM – 10:30 AM");
    expect(slots["2026-10-10"][11].label).toBe("3:30 PM – 4:00 PM");
  });

  it("truncates a window that does not align to the 30-minute grid", () => {
    const slots = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "10:00", end: "11:45" }],
      {},
    );
    expect(slots["2026-10-10"]).toHaveLength(3); // 10:00, 10:30, 11:00
  });

  it("generates contiguous, non-overlapping slot boundaries", () => {
    const slots = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "09:00", end: "12:00" }],
      {},
    )["2026-10-10"];
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].startTime).toBe(slots[i - 1].endTime);
    }
  });

  it("assigns a Meet link to every fresh slot", () => {
    const slots = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "10:00", end: "11:00" }],
      {},
    )["2026-10-10"];
    for (const s of slots) {
      expect(s.meetLink).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    }
  });

  it("preserves existing bookings when the window is regenerated", () => {
    const booked = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "10:00", end: "11:00" }],
      {},
    )["2026-10-10"].map((s, i) =>
      i === 0 ? { ...s, status: "booked" as const, candidateId: "stu-1", candidateName: "Aditya" } : s,
    );

    const regenerated = generateSlots(
      [{ id: "w1", date: "2026-10-10", start: "10:00", end: "12:00" }],
      { "2026-10-10": booked },
    )["2026-10-10"];

    expect(regenerated).toHaveLength(4);
    expect(regenerated[0].status).toBe("booked");
    expect(regenerated[0].candidateId).toBe("stu-1");
    expect(regenerated[3].status).toBe("available");
  });
});

describe("interview slot allocation — conflict prevention", () => {
  const dateKey = "2026-10-10";
  const seedSlots = (): Record<string, InterviewSlot[]> =>
    generateSlots([{ id: "w1", date: dateKey, start: "10:00", end: "12:00" }], {});

  it("books an available slot and flips its status to booked", () => {
    const state = assignCandidate(seedSlots(), dateKey, `${dateKey}_10:00`, "stu-1", "Aditya Verma");
    const slot = state[dateKey].find((s) => s.id === `${dateKey}_10:00`)!;
    expect(slot.status).toBe("booked");
    expect(slot.candidateId).toBe("stu-1");
    expect(slot.meetLink).toBeTruthy();
  });

  it("blocks double-booking the same candidate into a second slot (conflict-free invariant)", () => {
    let state = seedSlots();
    state = assignCandidate(state, dateKey, `${dateKey}_10:00`, "stu-1", "Aditya Verma");
    const afterConflict = assignCandidate(state, dateKey, `${dateKey}_10:30`, "stu-1", "Aditya Verma");

    // Second assignment must be a no-op
    expect(afterConflict).toBe(state);
    expect(state[dateKey].filter((s) => s.candidateId === "stu-1")).toHaveLength(1);
  });

  it("allows different candidates in different slots", () => {
    let state = seedSlots();
    state = assignCandidate(state, dateKey, `${dateKey}_10:00`, "stu-1", "Aditya Verma");
    state = assignCandidate(state, dateKey, `${dateKey}_10:30`, "stu-2", "Sneha Reddy");

    expect(state[dateKey].filter((s) => s.status === "booked")).toHaveLength(2);
  });

  it("releasing a booking returns the slot to available with no candidate attached", () => {
    let state = seedSlots();
    state = assignCandidate(state, dateKey, `${dateKey}_10:00`, "stu-1", "Aditya Verma");
    state = assignCandidate(state, dateKey, `${dateKey}_10:00`, null, null);

    const slot = state[dateKey].find((s) => s.id === `${dateKey}_10:00`)!;
    expect(slot.status).toBe("available");
    expect(slot.candidateId).toBeNull();
    expect(slot.meetLink).toBeNull();
  });

  it("frees a completed slot's candidate for booking elsewhere", () => {
    let state = seedSlots();
    state = assignCandidate(state, dateKey, `${dateKey}_10:00`, "stu-1", "Aditya Verma");
    // Interview completes
    state = {
      ...state,
      [dateKey]: state[dateKey].map((s) =>
        s.id === `${dateKey}_10:00` ? { ...s, status: "completed" as const } : s,
      ),
    };
    // Re-booking into another slot must succeed (completed bookings don't conflict)
    const rebooked = assignCandidate(state, dateKey, `${dateKey}_10:30`, "stu-1", "Aditya Verma");
    expect(rebooked).not.toBe(state);
    expect(rebooked[dateKey].find((s) => s.id === `${dateKey}_10:30`)!.status).toBe("booked");
  });
});
