/**
 * Placement Analytics — Server-side computation.
 *
 * These Convex queries run on the server and are automatically cached by
 * the Convex client. No useEffect / fetch waterfalls needed — call them
 * directly from React components via useQuery().
 *
 * Convex handles the "singleton DB client" problem that Prisma has during
 * hot-reloading: all queries execute against the Convex backend, never
 * against a local connection. Each query gets a fresh, consistent snapshot.
 */

import { query } from "./_generated/server";

// ─── Helpers ───

const CTC_TIERS = [
  { label: "Below 5 LPA", min: 0, max: 5 },
  { label: "5–10 LPA", min: 5, max: 10 },
  { label: "10–15 LPA", min: 10, max: 15 },
  { label: "15+ LPA", min: 15, max: Infinity },
] as const;

function ctcTier(ctcLpa: number): string {
  for (const tier of CTC_TIERS) {
    if (ctcLpa >= tier.min && ctcLpa < tier.max) return tier.label;
  }
  return "15+ LPA";
}

// ═══════════════════════════════════════════════════
// 1. OVERALL PLACEMENT STATISTICS
// ═══════════════════════════════════════════════════

export const overallStats = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();

    const totalStudents = students.length;
    const placedStudents = students.filter((s) => s.placementStatus === "placed").length;
    const placementPercentage = totalStudents > 0
      ? Math.round((placedStudents / totalStudents) * 100)
      : 0;

    // CTC stats from offered applications
    const offeredApps = applications.filter((a) => a.status === "offered");
    const driveMap = new Map(drives.map((d) => [d._id, d]));
    const offeredCtcs = offeredApps
      .map((a) => driveMap.get(a.driveId)?.ctcLpa)
      .filter((c): c is number => c !== undefined);

    const highestCtc = offeredCtcs.length > 0 ? Math.max(...offeredCtcs) : 0;
    const averageCtc = offeredCtcs.length > 0
      ? Math.round((offeredCtcs.reduce((s, c) => s + c, 0) / offeredCtcs.length) * 10) / 10
      : 0;

    const activeDrives = drives.filter(
      (d) => d.status === "ongoing" || d.status === "upcoming",
    ).length;

    return {
      totalStudents,
      placedStudents,
      placementPercentage,
      totalOffers: offeredApps.length,
      highestCtc,
      averageCtc,
      totalApplications: applications.length,
      activeDrives,
    };
  },
});

// ═══════════════════════════════════════════════════
// 2. BRANCH-WISE PLACEMENT
// ═══════════════════════════════════════════════════

export const branchWisePlacement = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();

    // Group by department
    const deptMap = new Map<string, { total: number; placed: number }>();
    for (const s of students) {
      const entry = deptMap.get(s.department) ?? { total: 0, placed: 0 };
      entry.total += 1;
      if (s.placementStatus === "placed") entry.placed += 1;
      deptMap.set(s.department, entry);
    }

    // Also count opted_out for transparency
    return Array.from(deptMap.entries())
      .map(([department, { total, placed }]) => ({
        department,
        total,
        placed,
        percentage: total > 0 ? Math.round((placed / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },
});

// ═══════════════════════════════════════════════════
// 3. CTC DISTRIBUTION
// ═══════════════════════════════════════════════════

export const ctcDistribution = query({
  args: {},
  handler: async (ctx) => {
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();
    const driveMap = new Map(drives.map((d) => [d._id, d]));

    const offeredApps = applications.filter((a) => a.status === "offered");

    const tiers: Record<string, number> = {
      "Below 5 LPA": 0,
      "5–10 LPA": 0,
      "10–15 LPA": 0,
      "15+ LPA": 0,
    };

    for (const app of offeredApps) {
      const drive = driveMap.get(app.driveId);
      if (drive) {
        tiers[ctcTier(drive.ctcLpa)] += 1;
      }
    }

    return Object.entries(tiers).map(([name, value]) => ({ name, value }));
  },
});

// ═══════════════════════════════════════════════════
// 4. PER-DRIVE APPLICATION BREAKDOWN
// ═══════════════════════════════════════════════════

export const driveBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();

    // Index applications by drive
    const appsByDrive = new Map<string, typeof applications>();
    for (const app of applications) {
      const list = appsByDrive.get(app.driveId) ?? [];
      list.push(app);
      appsByDrive.set(app.driveId, list);
    }

    return drives
      .filter((d) => d.status === "ongoing" || d.status === "upcoming")
      .map((drive) => {
        const apps = appsByDrive.get(drive._id) ?? [];
        const shortlisted = apps.filter(
          (a) => a.status === "shortlisted" || a.status === "offered",
        ).length;
        const rejected = apps.filter((a) => a.status === "rejected").length;
        const inPipeline = apps.filter(
          (a) =>
            a.status === "applied" ||
            a.status === "online_assessment" ||
            a.status === "technical_interview" ||
            a.status === "hr_interview",
        ).length;

        return {
          driveId: drive._id,
          companyName: drive.companyName,
          roleTitle: drive.roleTitle,
          ctc: drive.ctc,
          ctcLpa: drive.ctcLpa,
          status: drive.status,
          deadline: drive.deadline,
          total: apps.length,
          shortlisted,
          rejected,
          inPipeline,
          progress:
            apps.length > 0
              ? Math.round(((shortlisted + rejected) / apps.length) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  },
});

// ═══════════════════════════════════════════════════
// 5. RECENT ACTIVITY FEED
// ═══════════════════════════════════════════════════

export const recentActivity = query({
  args: {},
  handler: async (ctx) => {
    const applications = await ctx.db.query("applications").collect();
    const students = await ctx.db.query("students").collect();
    const drives = await ctx.db.query("drives").collect();

    const studentMap = new Map(students.map((s) => [s._id, s]));
    const driveMap = new Map(drives.map((d) => [d._id, d]));

    // Sort by updatedAt descending, take top 10
    const recent = [...applications]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);

    return recent.map((app) => {
      const student = studentMap.get(app.studentId);
      const drive = driveMap.get(app.driveId);

      const statusVerb: Record<string, string> = {
        applied: "applied to",
        shortlisted: "shortlisted for",
        online_assessment: "assessment scheduled for",
        technical_interview: "interviewing for",
        hr_interview: "HR round for",
        offered: "received offer from",
        rejected: "rejected from",
      };

      return {
        applicationId: app._id,
        studentName: student?.rollNumber ?? "Unknown",
        companyName: drive?.companyName ?? "Unknown",
        status: app.status,
        verb: statusVerb[app.status] ?? "updated for",
        currentRound: app.currentRound,
        updatedAt: app.updatedAt,
      };
    });
  },
});

// ═══════════════════════════════════════════════════
// 6. COMPREHENSIVE DASHBOARD DATA (single call)
// ═══════════════════════════════════════════════════

export const dashboardData = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const drives = await ctx.db.query("drives").collect();
    const applications = await ctx.db.query("applications").collect();

    // ── KPI stats ──
    const totalStudents = students.length;
    const placedStudents = students.filter((s) => s.placementStatus === "placed").length;
    const placementPercentage =
      totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    const driveMap = new Map(drives.map((d) => [d._id, d]));
    const offeredApps = applications.filter((a) => a.status === "offered");
    const offeredCtcs = offeredApps
      .map((a) => driveMap.get(a.driveId)?.ctcLpa)
      .filter((c): c is number => c !== undefined);

    const highestCtc = offeredCtcs.length > 0 ? Math.max(...offeredCtcs) : 0;
    const averageCtc =
      offeredCtcs.length > 0
        ? Math.round((offeredCtcs.reduce((s, c) => s + c, 0) / offeredCtcs.length) * 10) / 10
        : 0;

    const activeDrives = drives.filter(
      (d) => d.status === "ongoing" || d.status === "upcoming",
    ).length;

    // ── Branch-wise ──
    const deptMap = new Map<string, { total: number; placed: number }>();
    for (const s of students) {
      const entry = deptMap.get(s.department) ?? { total: 0, placed: 0 };
      entry.total += 1;
      if (s.placementStatus === "placed") entry.placed += 1;
      deptMap.set(s.department, entry);
    }
    const departmentStats = Array.from(deptMap.entries())
      .map(([department, { total, placed }]) => ({
        department,
        total,
        placed,
        percentage: total > 0 ? Math.round((placed / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── CTC distribution ──
    const tierBuckets: Record<string, number> = { "Below 5 LPA": 0, "5–10 LPA": 0, "10–15 LPA": 0, "15+ LPA": 0 };
    for (const app of offeredApps) {
      const drive = driveMap.get(app.driveId);
      if (drive) tierBuckets[ctcTier(drive.ctcLpa)] += 1;
    }
    const ctcDistribution = Object.entries(tierBuckets).map(([name, value]) => ({
      name,
      value,
    }));

    // ── Drive breakdown ──
    const appsByDrive = new Map<string, typeof applications>();
    for (const app of applications) {
      const list = appsByDrive.get(app.driveId) ?? [];
      list.push(app);
      appsByDrive.set(app.driveId, list);
    }
    const driveBreakdownList = drives
      .filter((d) => d.status === "ongoing" || d.status === "upcoming")
      .map((drive) => {
        const apps = appsByDrive.get(drive._id) ?? [];
        return {
          driveId: drive._id,
          companyName: drive.companyName,
          roleTitle: drive.roleTitle,
          ctc: drive.ctc,
          status: drive.status,
          deadline: drive.deadline,
          total: apps.length,
          shortlisted: apps.filter((a) => a.status === "shortlisted" || a.status === "offered").length,
          rejected: apps.filter((a) => a.status === "rejected").length,
          inPipeline: apps.filter(
            (a) => a.status === "applied" || a.status === "online_assessment" || a.status === "technical_interview" || a.status === "hr_interview",
          ).length,
        };
      });

    // ── Recent activity ──
    const studentMap = new Map(students.map((s) => [s._id, s]));
    const recent = [...applications]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8)
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const drive = driveMap.get(app.driveId);
        const verb: Record<string, string> = {
          applied: "applied to", shortlisted: "shortlisted for",
          online_assessment: "assessment scheduled for",
          technical_interview: "interviewing for",
          hr_interview: "HR round for", offered: "received offer from",
          rejected: "rejected from",
        };
        return {
          studentName: student?.rollNumber ?? "Unknown",
          companyName: drive?.companyName ?? "Unknown",
          status: app.status,
          verb: verb[app.status] ?? "updated for",
          currentRound: app.currentRound,
          updatedAt: app.updatedAt,
        };
      });

    return {
      totalStudents,
      placedStudents,
      placementPercentage,
      totalOffers: offeredApps.length,
      highestCtc,
      averageCtc,
      totalApplications: applications.length,
      activeDrives,
      departmentStats,
      ctcDistribution,
      driveBreakdown: driveBreakdownList,
      recentActivity: recent,
    };
  },
});
