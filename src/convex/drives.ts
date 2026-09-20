import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { createDriveSchema } from "../lib/schemas";

/**
 * Drive Management — transactional mutations.
 *
 * Convex mutations execute as atomic transactions: if any step throws,
 * all writes roll back. Referential integrity between drives, applications,
 * and student records is maintained inside single mutations.
 */

async function requireTpo(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("AUTH: You must be signed in");
  const user = await ctx.db.get(userId);
  if (user?.role !== "tpo") throw new Error("AUTH: Only the TPO can manage drives");
  return user;
}

// ─── Create drive (validated + atomic) ──────────────────────────────────────

export const createDrive = mutation({
  args: {
    companyName: v.string(),
    roleTitle: v.string(),
    description: v.string(),
    jobDescription: v.string(),
    ctcLpa: v.number(),
    ctc: v.string(),
    driveDate: v.string(),
    deadline: v.string(),
    deadlineTimestamp: v.number(),
    minCgpa: v.number(),
    maxActiveBacklogs: v.number(),
    allowedBranches: v.array(v.string()),
    rounds: v.array(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTpo(ctx);

    // Zod validation — shared schema with the CreateDrive form, so the exact
    // same rules run client-side (instant feedback) and server-side (safety).
    const parsed = createDriveSchema.safeParse(args);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(
        `VALIDATION: ${issue?.path.join(".") ?? "input"} — ${issue?.message ?? "Invalid drive data"}`
      );
    }

    // Cross-field guard already enforced by the schema's refine() (drive date
    // must be after deadline); belt-and-braces server check:
    if (new Date(parsed.data.driveDate) <= new Date(parsed.data.deadline)) {
      throw new Error("VALIDATION: Drive date must be after the application deadline");
    }

    return await ctx.db.insert("drives", {
      ...parsed.data,
      website: parsed.data.website || undefined,
      ctc: `₹${parsed.data.ctcLpa} LPA`,
      deadlineTimestamp: Number.isNaN(Date.parse(parsed.data.deadline))
        ? Date.now() + 7 * 86400000
        : Date.parse(parsed.data.deadline),
      status: "ongoing",
      applicantCount: 0,
    });
  },
});

// ─── Close drive (completed or cancelled) with referential guard ────────────

export const closeDrive = mutation({
  args: {
    driveId: v.id("drives"),
    outcome: v.union(v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    await requireTpo(ctx);

    const drive = await ctx.db.get(args.driveId);
    if (!drive) throw new Error("NOT_FOUND: This drive no longer exists");
    if (drive.status === "completed" || drive.status === "cancelled") {
      throw new Error(`CONFLICT: Drive is already ${drive.status}`);
    }

    // Referential integrity: cancelling a drive that already has applications
    // would orphan them, so block it — advise marking completed instead.
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_drive", (q) => q.eq("driveId", args.driveId))
      .collect();

    if (args.outcome === "cancelled" && apps.length > 0) {
      throw new Error(
        `CONFLICT: Cannot cancel a drive with ${apps.length} application(s). Close it as completed instead.`
      );
    }

    await ctx.db.patch(args.driveId, { status: args.outcome });

    // Cancelling with zero applicants is safe; completing with applicants
    // leaves their pipeline records intact for reporting.
    return { driveId: args.driveId, affectedApplications: apps.length };
  },
});

// ─── Update drive status (general) ──────────────────────────────────────────

export const updateDrive = mutation({
  args: {
    driveId: v.id("drives"),
    status: v.optional(v.union(
      v.literal("upcoming"),
      v.literal("ongoing"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    await requireTpo(ctx);

    const drive = await ctx.db.get(args.driveId);
    if (!drive) throw new Error("NOT_FOUND: This drive no longer exists");

    const { driveId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filteredUpdates[key] = value;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("VALIDATION: No updates provided");
    }

    await ctx.db.patch(driveId, filteredUpdates);
    return driveId;
  },
});

// ─── Update application round progression within a drive ────────────────────

export const advanceApplicationRound = mutation({
  args: {
    applicationId: v.id("applications"),
    roundIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("AUTH: You must be signed in");
    const user = await ctx.db.get(userId);
    if (user?.role !== "tpo") throw new Error("AUTH: Only the TPO can progress rounds");

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("NOT_FOUND: Application no longer exists");

    const drive = await ctx.db.get(app.driveId);
    if (!drive) throw new Error("NOT_FOUND: The drive for this application no longer exists");

    if (args.roundIndex < 0 || args.roundIndex >= drive.rounds.length) {
      throw new Error(
        `VALIDATION: Round index ${args.roundIndex} is out of range (drive has ${drive.rounds.length} rounds)`
      );
    }

    await ctx.db.patch(args.applicationId, {
      currentRound: drive.rounds[args.roundIndex],
      updatedAt: Date.now(),
    });

    return { applicationId: args.applicationId, currentRound: drive.rounds[args.roundIndex] };
  },
});

// ─── Queries (unchanged) ────────────────────────────────────────────────────

export const getActiveDrives = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("drives")
      .withIndex("by_status", (q) => q.eq("status", "ongoing"))
      .collect();
  },
});

export const getAllDrives = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("drives").collect();
  },
});

export const getDriveById = query({
  args: { driveId: v.id("drives") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.driveId);
  },
});

export const checkEligibility = query({
  args: { driveId: v.id("drives") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { eligible: false, reason: "Not authenticated" };

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!student) return { eligible: false, reason: "No student profile found" };
    if (student.placementStatus === "placed") return { eligible: false, reason: "Already placed" };

    const drive = await ctx.db.get(args.driveId);
    if (!drive) return { eligible: false, reason: "Drive not found" };
    if (drive.status !== "ongoing") return { eligible: false, reason: "Drive is not active" };

    if (student.cgpa < drive.minCgpa) {
      return { eligible: false, reason: `CGPA ${student.cgpa} is below cutoff ${drive.minCgpa}` };
    }

    if (student.activeBacklogs > drive.maxActiveBacklogs) {
      return { eligible: false, reason: `${student.activeBacklogs} active backlogs exceeds limit of ${drive.maxActiveBacklogs}` };
    }

    if (!drive.allowedBranches.includes(student.department)) {
      return { eligible: false, reason: `Department ${student.department} not in allowed list` };
    }

    const existingApp = await ctx.db
      .query("applications")
      .withIndex("by_student_drive", (q) =>
        q.eq("studentId", student._id).eq("driveId", args.driveId)
      )
      .unique();

    if (existingApp) {
      return { eligible: false, reason: "Already applied to this drive" };
    }

    return { eligible: true, reason: "Eligible", studentId: student._id };
  },
});

export const getDrivesWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const drives = await ctx.db.query("drives").collect();
    const results = [];
    for (const drive of drives) {
      const apps = await ctx.db
        .query("applications")
        .withIndex("by_drive", (q) => q.eq("driveId", drive._id))
        .collect();
      results.push({
        ...drive,
        applicantCount: apps.length,
        selectedCount: apps.filter((a) => a.status === "offered").length,
      });
    }
    return results;
  },
});
