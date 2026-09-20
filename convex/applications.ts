import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  bulkUpdateStatusSchema,
  updateApplicationStatusSchema,
} from "../lib/schemas";

/**
 * Student Applications — server-side mutations with automated eligibility
 * enforcement and referential integrity checks.
 *
 * Every mutation validates its input shape, re-checks authorization and
 * eligibility on the server (never trusting client state), and throws typed,
 * user-presentable errors. Convex mutations are atomic transactions: if any
 * step throws, all writes in the mutation roll back automatically.
 */

const statusValidator = v.union(
  v.literal("applied"),
  v.literal("shortlisted"),
  v.literal("online_assessment"),
  v.literal("technical_interview"),
  v.literal("hr_interview"),
  v.literal("offered"),
  v.literal("rejected")
);

/** Resolve the authenticated user's student profile, or throw. */
async function requireStudent(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("AUTH: You must be signed in to apply");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("AUTH: Signed-in user record not found");

  const student = await ctx.db
    .query("students")
    .withIndex("by_userId", (q) =>
      q.eq("userId", userId)
    )
    .unique();
  if (!student) throw new Error("PROFILE: No student profile found for your account");

  return { user, student };
}

/** Resolve an application and its drive, verifying referential integrity. */
async function requireApplication(ctx: QueryCtx, applicationId: Id<"applications">) {
  const app = await ctx.db.get(applicationId);
  if (!app) throw new Error("NOT_FOUND: Application no longer exists");

  const drive = await ctx.db.get(app.driveId);
  if (!drive) throw new Error("NOT_FOUND: The drive for this application no longer exists");

  return { app, drive };
}

// ─── 1-Click Apply (with server-side eligibility validation) ────────────────

export const applyToDrive = mutation({
  args: { driveId: v.id("drives") },
  handler: async (ctx, args) => {
    const { student } = await requireStudent(ctx);

    const drive = await ctx.db.get(args.driveId);
    if (!drive) throw new Error("NOT_FOUND: This drive no longer exists");

    // ── Automated eligibility engine (server-authoritative) ──
    // Mirrors checkEligibilityDetailed() from lib/eligibility.ts so the UI
    // and the database can never disagree.
    if (student.placementStatus === "placed") {
      throw new Error("ELIGIBILITY: You are already placed and cannot apply to additional drives");
    }
    if (student.placementStatus === "opted_out") {
      throw new Error("ELIGIBILITY: You have opted out of the placement process");
    }
    if (drive.status !== "ongoing") {
      throw new Error("ELIGIBILITY: This drive is no longer accepting applications");
    }
    if (student.cgpa < drive.minCgpa) {
      throw new Error(
        `ELIGIBILITY: CGPA ${student.cgpa.toFixed(2)} is below the cutoff of ${drive.minCgpa}`
      );
    }
    if (student.activeBacklogs > drive.maxActiveBacklogs) {
      throw new Error(
        `ELIGIBILITY: ${student.activeBacklogs} active backlog(s) exceed the limit of ${drive.maxActiveBacklogs}`
      );
    }
    if (!drive.allowedBranches.includes(student.department)) {
      throw new Error(
        `ELIGIBILITY: Department ${student.department} is not eligible for this drive`
      );
    }

    // Duplicate-application guard (indexed unique lookup)
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_student_drive", (q) =>
        q.eq("studentId", student._id).eq("driveId", args.driveId)
      )
      .unique();
    if (existing) {
      throw new Error("DUPLICATE: You have already applied to this drive");
    }

    // Atomic write — atomicity is guaranteed by Convex transactional mutations.
    const applicationId = await ctx.db.insert("applications", {
      studentId: student._id,
      driveId: args.driveId,
      status: "applied",
      appliedAt: Date.now(),
      updatedAt: Date.now(),
      currentRound: drive.rounds[0] ?? "Application Submitted",
      totalRounds: drive.rounds.length,
    });

    // Keep denormalized applicant count consistent within the same transaction
    await ctx.db.patch(drive._id, { applicantCount: (drive.applicantCount ?? 0) + 1 });

    return applicationId;
  },
});

// ─── Update application status (TPO) ────────────────────────────────────────

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: statusValidator,
    currentRound: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Zod schema validation (shared with frontend forms)
    const parsed = updateApplicationStatusSchema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`VALIDATION: ${parsed.error.issues[0]?.message ?? "Invalid input"}`);
    }

    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("AUTH: You must be signed in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "tpo") throw new Error("AUTH: Only the TPO can update application statuses");

    const { app, drive } = await requireApplication(ctx, args.applicationId);

    // Referential integrity: when an offer is made, mark the student placed
    // and (if configured) close the drive — all within this one transaction.
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.currentRound !== undefined) updates.currentRound = args.currentRound;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.applicationId, updates);

    if (args.status === "offered") {
      const student = await ctx.db.get(app.studentId);
      if (!student) throw new Error("NOT_FOUND: Student record for this application is missing");
      await ctx.db.patch(app.studentId, { placementStatus: "placed" });

      // Offer concludes the hiring pipeline for this drive
      if (drive.status === "ongoing") {
        await ctx.db.patch(drive._id, { status: "completed" });
      }
    }

    // Rejection from an offer state should restore the student's status
    if (args.status === "rejected" && app.status === "offered") {
      await ctx.db.patch(app.studentId, { placementStatus: "not_placed" });
    }

    return args.applicationId;
  },
});

// ─── Bulk status update (TPO / Recruiter shortlist-reject waves) ────────────

export const bulkUpdateStatus = mutation({
  args: {
    applicationIds: v.array(v.id("applications")),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    // Zod schema validation
    const parsed = bulkUpdateStatusSchema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`VALIDATION: ${parsed.error.issues[0]?.message ?? "Invalid input"}`);
    }

    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("AUTH: You must be signed in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "tpo") throw new Error("AUTH: Only the TPO can bulk-update statuses");

    // Verify every application exists before writing (fail-fast, all-or-nothing)
    const now = Date.now();
    const skipStatusRecompute =
      args.status !== "offered" && args.status !== "rejected";

    for (const appId of args.applicationIds) {
      const app = await ctx.db.get(appId);
      if (!app) {
        // Throwing here rolls back every patch already applied in this
        // transaction — the bulk operation stays all-or-nothing.
        throw new Error(
          `NOT_FOUND: One of the selected applications no longer exists. No changes were saved.`
        );
      }

      await ctx.db.patch(appId, { status: args.status, updatedAt: now });

      // Side-effects for offer/reject transitions
      if (!skipStatusRecompute) {
        if (args.status === "offered") {
          const student = await ctx.db.get(app.studentId);
          if (student) await ctx.db.patch(app.studentId, { placementStatus: "placed" });
        } else if (args.status === "rejected" && app.status === "offered") {
          await ctx.db.patch(app.studentId, { placementStatus: "not_placed" });
        }
      }
    }

    return args.applicationIds.length;
  },
});

// ─── Queries ────────────────────────────────────────────────────────────────

// Get applications for current student
export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!student) return [];

    const apps = await ctx.db
      .query("applications")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const results = [];
    for (const app of apps) {
      const drive = await ctx.db.get(app.driveId);
      results.push({ ...app, drive });
    }
    return results;
  },
});

// Get applications for a specific drive (TPO/Company)
export const getApplicationsByDrive = query({
  args: { driveId: v.id("drives") },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_drive", (q) => q.eq("driveId", args.driveId))
      .collect();

    const results = [];
    for (const app of apps) {
      const student = await ctx.db.get(app.studentId);
      const user = student ? await ctx.db.get(student.userId) : null;
      results.push({
        ...app,
        student,
        studentName: user?.name ?? "Unknown",
        studentEmail: user?.email ?? "",
      });
    }
    return results;
  },
});

// Dashboard stats (TPO)
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();

    const placedStudents = students.filter((s) => s.placementStatus === "placed");
    const activeDrives = drives.filter((d) => d.status === "ongoing");

    const offeredApps = applications.filter((a) => a.status === "offered");
    let totalCtc = 0;
    for (const app of offeredApps) {
      const drive = await ctx.db.get(app.driveId);
      if (drive) totalCtc += drive.ctcLpa;
    }

    const departments = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
    const deptStats = departments.map((dept) => {
      const deptStudents = students.filter((s) => s.department === dept);
      const deptPlaced = deptStudents.filter((s) => s.placementStatus === "placed");
      return {
        department: dept,
        total: deptStudents.length,
        placed: deptPlaced.length,
        percentage: deptStudents.length > 0
          ? Math.round((deptPlaced.length / deptStudents.length) * 100)
          : 0,
      };
    }).filter((d) => d.total > 0);

    const ctcTiers = {
      "Below 5 LPA": 0,
      "5-10 LPA": 0,
      "10+ LPA": 0,
    };
    for (const app of offeredApps) {
      const drive = await ctx.db.get(app.driveId);
      if (drive) {
        if (drive.ctcLpa < 5) ctcTiers["Below 5 LPA"]++;
        else if (drive.ctcLpa <= 10) ctcTiers["5-10 LPA"]++;
        else ctcTiers["10+ LPA"]++;
      }
    }

    return {
      totalStudents: students.length,
      placedStudents: placedStudents.length,
      placementPercentage: students.length > 0
        ? Math.round((placedStudents.length / students.length) * 100)
        : 0,
      highestCtc: offeredApps.length > 0
        ? Math.max(...(
            await Promise.all(
              offeredApps.map(async (a) => {
                const d = await ctx.db.get(a.driveId);
                return d?.ctcLpa ?? 0;
              })
            )
          ))
        : 0,
      averageCtc: offeredApps.length > 0
        ? Math.round((totalCtc / offeredApps.length) * 10) / 10
        : 0,
      totalApplications: applications.length,
      activeDrives: activeDrives.length,
      departmentStats: deptStats,
      ctcDistribution: ctcTiers,
    };
  },
});
