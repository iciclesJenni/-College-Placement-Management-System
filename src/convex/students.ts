import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const getStudentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return student;
  },
});

export const getStudentById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.studentId);
  },
});

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const results = [];
    for (const s of students) {
      const user = await ctx.db.get(s.userId);
      results.push({
        ...s,
        userName: user?.name ?? "Unknown",
        userEmail: user?.email ?? "",
      });
    }
    return results;
  },
});

export const createStudentProfile = mutation({
  args: {
    rollNumber: v.string(),
    department: v.string(),
    cgpa: v.number(),
    graduationYear: v.number(),
    activeBacklogs: v.number(),
    skills: v.array(v.string()),
    resumeUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) throw new Error("Profile already exists");

    const studentId = await ctx.db.insert("students", {
      userId,
      ...args,
      totalBacklogs: args.activeBacklogs,
      isVerified: false,
      placementStatus: "not_placed",
    });
    return studentId;
  },
});

export const updateStudentProfile = mutation({
  args: {
    studentId: v.id("students"),
    department: v.optional(v.string()),
    cgpa: v.optional(v.number()),
    graduationYear: v.optional(v.number()),
    activeBacklogs: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    resumeUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const { studentId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filteredUpdates[key] = value;
    }

    await ctx.db.patch(studentId, filteredUpdates);
    return studentId;
  },
});

export const linkDemoStudent = mutation({
  args: { rollNumber: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const students = await ctx.db.query("students").collect();
    const student = students.find((s) => s.rollNumber === args.rollNumber);
    if (!student) throw new Error("Student not found");

    await ctx.db.patch(student._id, { userId });
    await ctx.db.patch(userId, { role: "student" });

    return student._id;
  },
});

export const getStudentExportData = query({
  args: {
    department: v.optional(v.string()),
    minCgpa: v.optional(v.number()),
    maxBacklogs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let students = await ctx.db.query("students").collect();

    if (args.department) {
      students = students.filter((s) => s.department === args.department);
    }
    if (args.minCgpa !== undefined) {
      students = students.filter((s) => s.cgpa >= args.minCgpa!);
    }
    if (args.maxBacklogs !== undefined) {
      students = students.filter((s) => s.activeBacklogs <= args.maxBacklogs!);
    }

    const results = [];
    for (const s of students) {
      const user = await ctx.db.get(s.userId);
      results.push({
        name: user?.name ?? "Unknown",
        email: user?.email ?? "",
        rollNumber: s.rollNumber,
        department: s.department,
        cgpa: s.cgpa,
        graduationYear: s.graduationYear,
        activeBacklogs: s.activeBacklogs,
        skills: s.skills.join(", "),
        placementStatus: s.placementStatus,
      });
    }
    return results;
  },
});
