import { z } from "zod";

/** Department codes matching the Drive type's `allowedBranches` */
const DEPARTMENT_CODES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"] as const;

/**
 * Shared Zod validation schemas.
 *
 * These are the single source of truth for input validation — used by:
 * - Backend mutations (Convex handlers validate before writing)
 * - Frontend forms (CreateDrive, Profile) for identical rules client-side
 * - Inferred TypeScript types flow end-to-end (form state → API → DB)
 */

export const DEPARTMENTS = DEPARTMENT_CODES;
export const APPLICATION_STATUSES = [
  "applied",
  "shortlisted",
  "online_assessment",
  "technical_interview",
  "hr_interview",
  "offered",
  "rejected",
] as const;
export const DRIVE_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

// ─── Drive Management ────────────────────────────────────────────────────────

export const createDriveSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must be under 100 characters"),
    roleTitle: z
      .string()
      .min(2, "Role title must be at least 2 characters")
      .max(100, "Role title must be under 100 characters"),
    description: z.string().max(500, "Description must be under 500 characters").default(""),
    jobDescription: z.string().max(5000, "Job description must be under 5000 characters").default(""),
    ctcLpa: z
      .number({ message: "CTC must be a number" })
      .positive("CTC must be greater than 0")
      .max(200, "CTC must be under 200 LPA"),
    driveDate: z.string().min(1, "Drive date is required"),
    deadline: z.string().min(1, "Application deadline is required"),
    minCgpa: z
      .number({ message: "Minimum CGPA must be a number" })
      .min(0, "CGPA cannot be negative")
      .max(10, "CGPA cannot exceed 10.0"),
    maxActiveBacklogs: z
      .number({ message: "Backlog limit must be a number" })
      .int("Backlog limit must be a whole number")
      .min(0, "Backlog limit cannot be negative")
      .max(20, "Backlog limit seems too high"),
    allowedBranches: z
      .array(z.enum(DEPARTMENTS))
      .min(1, "Select at least one eligible department"),
    rounds: z
      .array(z.string().min(1, "Round names cannot be empty").max(60))
      .min(1, "Add at least one hiring round")
      .max(10, "Maximum 10 rounds allowed"),
    website: z.string().url("Enter a valid URL (including https://)").optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.driveDate) > new Date(data.deadline), {
    message: "Drive date must be after the application deadline",
    path: ["driveDate"],
  });

export type CreateDriveInput = z.infer<typeof createDriveSchema>;

// ─── Student Applications ────────────────────────────────────────────────────

export const applyToDriveSchema = z.object({
  driveId: z.string().min(1, "Drive ID is required"),
});

export type ApplyToDriveInput = z.infer<typeof applyToDriveSchema>;

// ─── Application Status Updates ──────────────────────────────────────────────

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatusValue = z.infer<typeof applicationStatusSchema>;

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  currentRound: z.string().max(120).optional(),
  notes: z.string().max(2000, "Notes must be under 2000 characters").optional(),
});

export const bulkUpdateStatusSchema = z.object({
  applicationIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one application")
    .max(500, "Cannot update more than 500 applications at once"),
  status: applicationStatusSchema,
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

// ─── Drive Close / Round Progression ────────────────────────────────────────

export const closeDriveSchema = z.object({
  driveId: z.string().min(1),
  /** "completed" = closed after running; "cancelled" = withdrawn */
  outcome: z.enum(["completed", "cancelled"]).default("completed"),
});

export const updateRoundProgressSchema = z.object({
  applicationId: z.string().min(1),
  roundIndex: z
    .number({ message: "Round index must be a number" })
    .int()
    .min(0)
    .max(9),
});

// ─── Eligibility Engine result ───────────────────────────────────────────────

export interface EligibilityCheckResult {
  eligible: boolean;
  /** Human-readable failure reason; "Eligible" on success */
  reason: string;
  /** Machine-readable failed criterion codes for programmatic handling */
  failures: Array<
    | "already_placed"
    | "opted_out"
    | "drive_inactive"
    | "cgpa_below_cutoff"
    | "backlogs_exceeded"
    | "department_not_allowed"
  >;
}
