/**
 * Unit Tests — Eligibility & Institutional Placement Rules Engines.
 *
 * Covers the two pure policy layers that gate every application:
 *
 *   1. `checkEligibilityDetailed` (src/lib/eligibility.ts)
 *      Academic gates: CGPA cutoffs, backlog limits, branch filters,
 *      placement-status and drive-activity checks.
 *
 *   2. `checkPlacementRules` (src/lib/placementRules.ts)
 *      Tiered One Job Policy: upgrade-only applications, Super Dream
 *      freeze (PLACED_LOCKED), plus the same academic gates with
 *      human-readable rejection reasons.
 */

import { describe, it, expect } from "vitest";
import { checkEligibility, checkEligibilityDetailed } from "@/lib/eligibility";
import {
  checkPlacementRules,
  getDriveTier,
  getLockStatus,
  policyExplanation,
  type DriveTier,
} from "@/lib/placementRules";
import type { Drive, StudentProfile } from "@/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: "stu-1",
    name: "Aditya Verma",
    rollNumber: "22B81A0501",
    email: "aditya@college.edu.in",
    department: "CSE",
    graduationYear: 2026,
    cgpa: 8.5,
    activeBacklogs: 0,
    totalBacklogs: 0,
    skills: [],
    isVerified: true,
    placementStatus: "not_placed",
    ...overrides,
  };
}

function makeDrive(overrides: Partial<Drive> = {}): Drive {
  return {
    id: "drv-1",
    companyName: "Google Cloud",
    roleTitle: "Cloud Solutions Associate",
    description: "GCP infrastructure role.",
    jobDescription: "Deploy resilient GCP infrastructure.",
    ctcLpa: 18.0,
    ctc: "₹18 LPA",
    driveDate: "Oct 10, 2026",
    deadline: "Sep 30, 2026",
    deadlineTimestamp: Date.now() + 7 * 86_400_000,
    status: "ongoing",
    minCgpa: 8.0,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT"],
    rounds: ["Online Assessment", "Technical Interview", "HR Round"],
    applicantCount: 0,
    ...overrides,
  };
}

// ─── Academic gates (checkEligibilityDetailed) ──────────────────────────────

describe("checkEligibilityDetailed — CGPA cutoff adherence", () => {
  it("rejects when CGPA is below the drive cutoff", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 7.2, activeBacklogs: 0, department: "CSE" },
      { minCgpa: 8.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.eligible).toBe(false);
    expect(result.failures).toContain("cgpa_below_cutoff");
    expect(result.reason).toContain("below the cutoff of 8");
  });

  it("accepts when CGPA exactly equals the cutoff (boundary)", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 8.0, activeBacklogs: 0, department: "CSE" },
      { minCgpa: 8.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.eligible).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("accepts when CGPA is above the cutoff", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 9.15, activeBacklogs: 0, department: "CSE" },
      { minCgpa: 8.5, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe("Eligible");
  });
});

describe("checkEligibilityDetailed — backlog constraints", () => {
  it("rejects when active backlogs exceed the drive maximum", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 9.0, activeBacklogs: 2, department: "CSE" },
      { minCgpa: 6.0, maxActiveBacklogs: 1, allowedBranches: ["CSE"] },
    );
    expect(result.eligible).toBe(false);
    expect(result.failures).toContain("backlogs_exceeded");
    expect(result.reason).toContain("exceed the limit of 1");
  });

  it("accepts when active backlogs equal the drive maximum", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 9.0, activeBacklogs: 1, department: "CSE" },
      { minCgpa: 6.0, maxActiveBacklogs: 1, allowedBranches: ["CSE"] },
    );
    expect(result.eligible).toBe(true);
  });
});

describe("checkEligibilityDetailed — department filtering", () => {
  it("rejects students from non-eligible branches", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 9.5, activeBacklogs: 0, department: "MECH" },
      { minCgpa: 6.0, maxActiveBacklogs: 0, allowedBranches: ["CSE", "IT"] },
    );
    expect(result.eligible).toBe(false);
    expect(result.failures).toContain("department_not_allowed");
    expect(result.reason).toContain("MECH");
  });

  it("accepts students from any listed branch", () => {
    for (const dept of ["CSE", "IT", "ECE", "EEE"]) {
      const result = checkEligibilityDetailed(
        { cgpa: 8.0, activeBacklogs: 0, department: dept },
        { minCgpa: 6.0, maxActiveBacklogs: 0, allowedBranches: ["CSE", "IT", "ECE", "EEE"] },
      );
      expect(result.eligible).toBe(true);
    }
  });
});

describe("checkEligibilityDetailed — placement status & drive activity", () => {
  it("rejects already-placed students", () => {
    const result = checkEligibilityDetailed(
      {
        cgpa: 9.0,
        activeBacklogs: 0,
        department: "CSE",
        placementStatus: "placed",
      },
      { minCgpa: 6.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.failures).toContain("already_placed");
    expect(result.eligible).toBe(false);
  });

  it("rejects opted-out students", () => {
    const result = checkEligibilityDetailed(
      {
        cgpa: 9.0,
        activeBacklogs: 0,
        department: "CSE",
        placementStatus: "opted_out",
      },
      { minCgpa: 6.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.failures).toContain("opted_out");
  });

  it("rejects applications to inactive drives", () => {
    const result = checkEligibilityDetailed(
      {
        cgpa: 9.0,
        activeBacklogs: 0,
        department: "CSE",
        isDriveActive: false,
      },
      { minCgpa: 6.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.failures).toContain("drive_inactive");
  });

  it("aggregates multiple failures and reports the most severe first", () => {
    const result = checkEligibilityDetailed(
      { cgpa: 5.0, activeBacklogs: 3, department: "MECH", placementStatus: "placed" },
      { minCgpa: 8.0, maxActiveBacklogs: 0, allowedBranches: ["CSE"] },
    );
    expect(result.failures).toEqual([
      "already_placed",
      "cgpa_below_cutoff",
      "backlogs_exceeded",
      "department_not_allowed",
    ]);
  });
});

describe("checkEligibility (StudentProfile/Drive wrapper)", () => {
  it("passes full profiles through and returns the simple shape", () => {
    const eligible = checkEligibility(makeStudent(), makeDrive());
    expect(eligible.eligible).toBe(true);

    const blocked = checkEligibility(
      makeStudent({ cgpa: 6.0 }),
      makeDrive({ minCgpa: 8.0 }),
    );
    expect(blocked.eligible).toBe(false);
    expect(blocked.reason).toBeTruthy();
  });
});

// ─── Tiered One Job Policy (checkPlacementRules) ─────────────────────────────

describe("getDriveTier — CTC band classification", () => {
  it.each([
    [5.5, 1],
    [6.0, 2],
    [7.6, 2],
    [10.0, 2],
    [10.01, 3],
    [18.0, 3],
    [22.0, 3],
  ] as [number, DriveTier][])("classifies %f LPA as Tier %i", (ctc, expected) => {
    expect(getDriveTier({ ctcLpa: ctc })).toBe(expected);
  });
});

describe("getLockStatus — placement standing", () => {
  const student = (status: StudentProfile["placementStatus"]) =>
    makeStudent({ placementStatus: status });

  it("returns none for unplaced students", () => {
    expect(getLockStatus(student("not_placed"))).toBe("none");
  });

  it("returns PLACED_UPGRADABLE for Tier 1/2 offer holders", () => {
    expect(getLockStatus(student("placed"), 1)).toBe("PLACED_UPGRADABLE");
    expect(getLockStatus(student("placed"), 2)).toBe("PLACED_UPGRADABLE");
  });

  it("returns PLACED_LOCKED when a Super Dream offer is held", () => {
    expect(getLockStatus(student("placed"), 3)).toBe("PLACED_LOCKED");
  });

  it("defaults placed students without a recorded tier to upgradable", () => {
    expect(getLockStatus(student("placed"))).toBe("PLACED_UPGRADABLE");
  });
});

describe("checkPlacementRules — tiered policy locking", () => {
  it("blocks a Tier 1 offer holder from applying to another Tier 1 drive", () => {
    const result = checkPlacementRules({
      student: makeStudent({ placementStatus: "placed" }),
      drive: makeDrive({ ctcLpa: 5.5 }),
      heldTier: 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContain("tier_not_upgradable");
    expect(result.tag).toContain("Locked");
  });

  it("blocks a Dream (Tier 2) offer holder from lateral or lower-tier drives", () => {
    const result = checkPlacementRules({
      student: makeStudent({ placementStatus: "placed" }),
      drive: makeDrive({ ctcLpa: 7.0 }),
      heldTier: 2,
    });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContain("tier_not_upgradable");
  });

  it("allows a Tier 1 offer holder to upgrade into a Dream drive", () => {
    const result = checkPlacementRules({
      student: makeStudent({ placementStatus: "placed" }),
      drive: makeDrive({ ctcLpa: 7.6 }),
      heldTier: 1,
    });
    expect(result.eligible).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("freezes (PLACED_LOCKED) Super Dream holders from ALL further applications", () => {
    for (const ctc of [5.5, 7.6, 18.0]) {
      const result = checkPlacementRules({
        student: makeStudent({ placementStatus: "placed" }),
        drive: makeDrive({ ctcLpa: ctc }),
        heldTier: 3,
      });
      expect(result.eligible).toBe(false);
      expect(result.failures).toContain("locked_super_dream");
      expect(result.lockStatus).toBe("PLACED_LOCKED");
      expect(result.reason).toContain("Super Dream");
    }
  });

  it("never restricts unplaced students by policy", () => {
    const result = checkPlacementRules({
      student: makeStudent(),
      drive: makeDrive({ ctcLpa: 5.5 }),
    });
    expect(result.eligible).toBe(true);
    expect(result.lockStatus).toBe("none");
  });

  it("reports reason before academic gates so policy locks surface first", () => {
    const result = checkPlacementRules({
      student: makeStudent({ placementStatus: "placed", cgpa: 5.0 }),
      drive: makeDrive({ ctcLpa: 5.5, minCgpa: 8.0 }),
      heldTier: 3,
    });
    expect(result.failures[0]).toBe("locked_super_dream");
  });
});

describe("checkPlacementRules — combined academic + workflow gates", () => {
  it("still enforces CGPA and backlog gates inside the rules engine", () => {
    const cgpaBlock = checkPlacementRules({
      student: makeStudent({ cgpa: 7.9 }),
      drive: makeDrive({ minCgpa: 8.0 }),
    });
    expect(cgpaBlock.failures).toContain("cgpa_below_cutoff");

    const backlogBlock = checkPlacementRules({
      student: makeStudent({ activeBacklogs: 2 }),
      drive: makeDrive({ maxActiveBacklogs: 1 }),
    });
    expect(backlogBlock.failures).toContain("backlogs_exceeded");
  });

  it("rejects duplicate applications and closed drives", () => {
    const duplicate = checkPlacementRules({
      student: makeStudent(),
      drive: makeDrive(),
      hasApplied: true,
    });
    expect(duplicate.failures).toContain("already_applied");

    const closed = checkPlacementRules({
      student: makeStudent(),
      drive: makeDrive({ status: "completed" }),
    });
    expect(closed.failures).toContain("drive_closed");
  });

  it("returns a tiered success reason for eligible students", () => {
    const result = checkPlacementRules({
      student: makeStudent(),
      drive: makeDrive({ ctcLpa: 18.0 }),
    });
    expect(result.eligible).toBe(true);
    expect(result.tier).toBe(3);
    expect(result.reason).toContain("Super Dream");
  });
});

describe("policyExplanation — warning modal content", () => {
  it("explains the Super Dream freeze", () => {
    const { title, body } = policyExplanation(3, 2);
    expect(title).toContain("Super Dream");
    expect(body).toContain("PLACED_LOCKED");
  });

  it("explains the upgrade-only rule for lower-tier holders", () => {
    const { title, body } = policyExplanation(1, 1);
    expect(title).toContain("One Job Policy");
    expect(body).toContain("higher tiers");
  });
});
