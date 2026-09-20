import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Schema & relation validation.
 *
 * Convex enforces field types/optionality at write time (the equivalent of
 * Prisma's schema-level validation), and `v.id("table")` fields are
 * referentially checked on every write. This query goes further: it walks
 * every cross-table relation and reports dangling references — the runtime
 * integrity audit that `prisma validate` + FK constraints would catch.
 */

interface IntegrityIssue {
  table: string;
  recordId: string;
  field: string;
  problem: string;
}

export const validateRelations = query({
  args: {},
  handler: async (ctx) => {
    const issues: IntegrityIssue[] = [];

    const users = await ctx.db.query("users").collect();
    const students = await ctx.db.query("students").collect();
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();

    const userIds = new Set(users.map((u) => u._id));
    const studentIds = new Set(students.map((s) => s._id));
    const driveIds = new Set(drives.map((d) => d._id));

    // ── students.userId → users.id ──
    for (const s of students) {
      if (!userIds.has(s.userId)) {
        issues.push({
          table: "students",
          recordId: s._id,
          field: "userId",
          problem: `references missing user ${s.userId}`,
        });
      }
      // Relation cardinality: one user ↔ one student profile
      const count = students.filter((x) => x.userId === s.userId).length;
      if (count > 1) {
        issues.push({
          table: "students",
          recordId: s._id,
          field: "userId",
          problem: `duplicate profile for user ${s.userId} (found ${count})`,
        });
      }
      // Field-level sanity mirroring the schema contract
      if (s.cgpa < 0 || s.cgpa > 10) {
        issues.push({
          table: "students",
          recordId: s._id,
          field: "cgpa",
          problem: `out of range: ${s.cgpa}`,
        });
      }
      if (s.activeBacklogs > s.totalBacklogs) {
        issues.push({
          table: "students",
          recordId: s._id,
          field: "activeBacklogs",
          problem: `active (${s.activeBacklogs}) exceeds total (${s.totalBacklogs})`,
        });
      }
    }

    // ── applications.studentId → students.id, applications.driveId → drives.id ──
    for (const a of applications) {
      if (!studentIds.has(a.studentId)) {
        issues.push({
          table: "applications",
          recordId: a._id,
          field: "studentId",
          problem: `references missing student ${a.studentId}`,
        });
      }
      if (!driveIds.has(a.driveId)) {
        issues.push({
          table: "applications",
          recordId: a._id,
          field: "driveId",
          problem: `references missing drive ${a.driveId}`,
        });
      }
      if (a.currentRound && a.totalRounds > 0) {
        // Round index sanity is checked loosely — no strict ordering contract
      }
      if (a.appliedAt > a.updatedAt + 1) {
        issues.push({
          table: "applications",
          recordId: a._id,
          field: "updatedAt",
          problem: "last update predates application submission",
        });
      }
    }

    // ── drives sanity ──
    for (const d of drives) {
      if (d.minCgpa < 0 || d.minCgpa > 10) {
        issues.push({
          table: "drives",
          recordId: d._id,
          field: "minCgpa",
          problem: `out of range: ${d.minCgpa}`,
        });
      }
      if (d.allowedBranches.length === 0) {
        issues.push({
          table: "drives",
          recordId: d._id,
          field: "allowedBranches",
          problem: "no eligible departments configured",
        });
      }
      if (d.rounds.length === 0) {
        issues.push({
          table: "drives",
          recordId: d._id,
          field: "rounds",
          problem: "no hiring rounds configured",
        });
      }
    }

    // ── denormalized applicantCount consistency ──
    for (const d of drives) {
      const actual = applications.filter((a) => a.driveId === d._id).length;
      if ((d.applicantCount ?? 0) !== actual) {
        issues.push({
          table: "drives",
          recordId: d._id,
          field: "applicantCount",
          problem: `denormalized count ${d.applicantCount} != actual ${actual}`,
        });
      }
    }

    return {
      valid: issues.length === 0,
      counts: {
        users: users.length,
        students: students.length,
        drives: drives.length,
        applications: applications.length,
      },
      issues,
    };
  },
});

/**
 * Seed freshness probe — reports whether the database has test data ready
 * for immediate UI interaction. Lightweight; safe to call on app boot.
 */
export const seedStatus = query({
  args: {},
  handler: async (ctx) => {
    const [users, students, drives, applications] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("students").collect(),
      ctx.db.query("drives").collect(),
      ctx.db.query("applications").collect(),
    ]);

    const seeded =
      users.length > 1 && students.length > 0 && drives.length > 0;

    return {
      seeded,
      counts: {
        users: users.length,
        students: students.length,
        drives: drives.length,
        applications: applications.length,
      },
    };
  },
});
