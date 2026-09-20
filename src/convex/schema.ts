import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  STUDENT: "student",
  TPO: "tpo",
  RECRUITER: "recruiter",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.TPO),
  v.literal(ROLES.RECRUITER),
);
export type Role = Infer<typeof roleValidator>;

export const APPLICATION_STATUS = {
  APPLIED: "applied",
  SHORTLISTED: "shortlisted",
  ONLINE_ASSESSMENT: "online_assessment",
  TECHNICAL_INTERVIEW: "technical_interview",
  HR_INTERVIEW: "hr_interview",
  OFFERED: "offered",
  REJECTED: "rejected",
} as const;

export const applicationStatusValidator = v.union(
  v.literal(APPLICATION_STATUS.APPLIED),
  v.literal(APPLICATION_STATUS.SHORTLISTED),
  v.literal(APPLICATION_STATUS.ONLINE_ASSESSMENT),
  v.literal(APPLICATION_STATUS.TECHNICAL_INTERVIEW),
  v.literal(APPLICATION_STATUS.HR_INTERVIEW),
  v.literal(APPLICATION_STATUS.OFFERED),
  v.literal(APPLICATION_STATUS.REJECTED),
);

export const DRIVE_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const driveStatusValidator = v.union(
  v.literal(DRIVE_STATUS.UPCOMING),
  v.literal(DRIVE_STATUS.ONGOING),
  v.literal(DRIVE_STATUS.COMPLETED),
  v.literal(DRIVE_STATUS.CANCELLED),
);

export const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"] as const;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    students: defineTable({
      userId: v.id("users"),
      rollNumber: v.string(),
      department: v.string(),
      graduationYear: v.number(),
      cgpa: v.number(),
      activeBacklogs: v.number(),
      totalBacklogs: v.number(),
      phone: v.optional(v.string()),
      skills: v.array(v.string()),
      resumeUrl: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      isVerified: v.boolean(),
      placementStatus: v.union(
        v.literal("not_placed"),
        v.literal("placed"),
        v.literal("opted_out"),
      ),
    }).index("by_userId", ["userId"])
      .index("by_department", ["department"])
      .index("by_cgpa", ["cgpa"]),

    drives: defineTable({
      companyName: v.string(),
      roleTitle: v.string(),
      description: v.string(),
      jobDescription: v.string(),
      ctcLpa: v.number(),
      ctc: v.string(),
      driveDate: v.string(),
      deadline: v.string(),
      deadlineTimestamp: v.number(),
      status: driveStatusValidator,
      minCgpa: v.number(),
      maxActiveBacklogs: v.number(),
      allowedBranches: v.array(v.string()),
      rounds: v.array(v.string()),
      website: v.optional(v.string()),
      applicantCount: v.number(),
    }).index("by_status", ["status"])
      .index("by_deadline", ["deadlineTimestamp"]),

    applications: defineTable({
      studentId: v.id("students"),
      driveId: v.id("drives"),
      status: applicationStatusValidator,
      currentRound: v.string(),
      totalRounds: v.number(),
      appliedAt: v.number(),
      updatedAt: v.number(),
      notes: v.optional(v.string()),
    })
      .index("by_student", ["studentId"])
      .index("by_drive", ["driveId"])
      .index("by_student_drive", ["studentId", "driveId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
