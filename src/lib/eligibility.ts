import type { StudentProfile, Drive } from "@/types";
import type { EligibilityCheckResult } from "@/lib/schemas";

/**
 * Automated Eligibility Engine.
 *
 * A single pure function shared by:
 * - Server-side mutations (application submission is blocked unless eligible)
 * - Client-side rendering (DriveCard apply buttons, DriveDetail checklists)
 *
 * Evaluates a student record against a drive's constraints and returns a
 * structured result with machine-readable failure codes plus a human-readable
 * reason for display.
 */

interface EligibilitySubject {
  cgpa: number;
  activeBacklogs: number;
  department: string;
  placementStatus?: StudentProfile["placementStatus"] | null;
  hasApplied?: boolean;
  isDriveActive?: boolean;
}

interface EligibilityDrive {
  minCgpa: number;
  maxActiveBacklogs: number;
  allowedBranches: readonly string[];
}

/**
 * Evaluate a student against drive constraints.
 * Returns the first failure encountered (ordered by severity), or eligible.
 */
export function checkEligibilityDetailed(
  student: EligibilitySubject,
  drive: EligibilityDrive
): EligibilityCheckResult {
  const failures: EligibilityCheckResult["failures"] = [];

  if (student.placementStatus === "placed") {
    failures.push("already_placed");
  }
  if (student.placementStatus === "opted_out") {
    failures.push("opted_out");
  }
  if (student.isDriveActive === false) {
    failures.push("drive_inactive");
  }
  if (student.cgpa < drive.minCgpa) {
    failures.push("cgpa_below_cutoff");
  }
  if (student.activeBacklogs > drive.maxActiveBacklogs) {
    failures.push("backlogs_exceeded");
  }
  if (!drive.allowedBranches.includes(student.department)) {
    failures.push("department_not_allowed");
  }

  if (failures.length > 0) {
    return {
      eligible: false,
      reason: reasonFor(failures[0], student, drive),
      failures,
    };
  }

  return { eligible: true, reason: "Eligible", failures: [] };
}

function reasonFor(
  code: EligibilityCheckResult["failures"][number],
  student: EligibilitySubject,
  drive: EligibilityDrive
): string {
  switch (code) {
    case "already_placed":
      return "You are already placed and cannot apply to additional drives";
    case "opted_out":
      return "You have opted out of the placement process";
    case "drive_inactive":
      return "This drive is no longer accepting applications";
    case "cgpa_below_cutoff":
      return `CGPA ${student.cgpa.toFixed(2)} is below the cutoff of ${drive.minCgpa}`;
    case "backlogs_exceeded":
      return `${student.activeBacklogs} active backlog(s) exceed the limit of ${drive.maxActiveBacklogs}`;
    case "department_not_allowed":
      return `Department ${student.department} is not eligible for this drive`;
  }
}

// ─── Existing public API (preserved for current consumers) ──────────────────

/**
 * Determine whether a student is eligible to apply for a given drive.
 * Thin wrapper around checkEligibilityDetailed returning the simple shape.
 */
export function checkEligibility(
  student: StudentProfile,
  drive: Drive
): { eligible: boolean; reason: string } {
  const result = checkEligibilityDetailed(
    {
      cgpa: student.cgpa,
      activeBacklogs: student.activeBacklogs,
      department: student.department,
      placementStatus: student.placementStatus,
    },
    {
      minCgpa: drive.minCgpa,
      maxActiveBacklogs: drive.maxActiveBacklogs,
      allowedBranches: drive.allowedBranches,
    }
  );
  return { eligible: result.eligible, reason: result.reason };
}

/**
 * Return a human-readable summary of all eligibility criteria for a drive.
 */
export function getEligibilitySummary(drive: Drive): {
  cgpa: string;
  backlogs: string;
  departments: string;
} {
  return {
    cgpa: `Minimum CGPA: ${drive.minCgpa}`,
    backlogs: `Max active backlogs: ${drive.maxActiveBacklogs}`,
    departments: `Eligible departments: ${drive.allowedBranches.join(", ")}`,
  };
}

/**
 * Calculate days remaining until a deadline.
 */
export function daysUntilDeadline(deadlineTimestamp: number): number {
  const now = Date.now();
  const diff = deadlineTimestamp - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
