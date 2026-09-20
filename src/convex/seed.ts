import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const STUDENT_DATA = [
  { name: "Aditya Verma", rollNumber: "22B81A0501", department: "CSE", cgpa: 9.15, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Node.js", "Python", "DSA"] },
  { name: "Sneha Reddy", rollNumber: "22B81A0542", department: "CSE", cgpa: 8.65, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Java", "Spring Boot", "SQL", "AWS"] },
  { name: "Rahul Sharma", rollNumber: "22B81A0418", department: "ECE", cgpa: 7.82, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 1, skills: ["VLSI", "Embedded C", "Python"] },
  { name: "Pooja Hegde", rollNumber: "22B81A1205", department: "IT", cgpa: 8.24, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "TypeScript", "Docker"] },
  { name: "Venkatesh Naidu", rollNumber: "22B81A0310", department: "MECH", cgpa: 6.94, graduationYear: 2026, activeBacklogs: 1, totalBacklogs: 2, skills: ["AutoCAD", "SolidWorks"] },
  { name: "Kavya Krishnamurthy", rollNumber: "22B81A0502", department: "CSE", cgpa: 9.42, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Next.js", "GraphQL", "AWS"] },
  { name: "Arjun Patel", rollNumber: "22B81A1201", department: "IT", cgpa: 8.10, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Java", "Hibernate", "REST APIs"] },
  { name: "Meera Iyer", rollNumber: "22B81A0503", department: "CSE", cgpa: 7.80, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Python", "Django", "PostgreSQL"] },
  { name: "Nisha Agarwal", rollNumber: "22B81A1202", department: "IT", cgpa: 9.00, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Node.js", "MongoDB", "Docker"] },
  { name: "Siddharth Rao", rollNumber: "23B81A0504", department: "CSE", cgpa: 6.50, graduationYear: 2027, activeBacklogs: 3, totalBacklogs: 5, skills: ["Java", "Basic SQL"] },
  { name: "Pooja Desai", rollNumber: "22B81A0404", department: "ECE", cgpa: 8.00, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Embedded C", "RTOS", "PCB Design"] },
  { name: "Aditya Bose", rollNumber: "22B81A0505", department: "CSE", cgpa: 7.20, graduationYear: 2026, activeBacklogs: 1, totalBacklogs: 2, skills: ["Python", "Flask", "Redis"] },
  { name: "Lakshmi Prasad", rollNumber: "22B81A0601", department: "CIVIL", cgpa: 7.50, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["AutoCAD", "STAAD Pro"] },
  { name: "Vikram Singh", rollNumber: "22B81A1203", department: "IT", cgpa: 6.80, graduationYear: 2026, activeBacklogs: 2, totalBacklogs: 3, skills: ["PHP", "Laravel", "MySQL"] },
  { name: "Karthik Menon", rollNumber: "22B81A0402", department: "ECE", cgpa: 7.10, graduationYear: 2026, activeBacklogs: 1, totalBacklogs: 1, skills: ["IoT", "Arduino", "Python"] },
  // ── Extended cohort (25+ students) ──
  { name: "Ananya Sharma", rollNumber: "22B81A0506", department: "CSE", cgpa: 8.90, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Python", "TensorFlow", "Pandas", "Machine Learning"] },
  { name: "Rohit Choudhary", rollNumber: "22B81A1206", department: "IT", cgpa: 7.65, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 1, skills: ["Java", "SQL", "Git"] },
  { name: "Divya Nair", rollNumber: "22B81A0507", department: "CSE", cgpa: 9.30, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["C++", "DSA", "System Design", "Python"] },
  { name: "Farhan Ahmed", rollNumber: "22B81A0405", department: "ECE", cgpa: 8.40, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Embedded C", "IoT", "Python", "MATLAB"] },
  { name: "Priya Menon", rollNumber: "22B81A1207", department: "IT", cgpa: 8.75, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "TypeScript", "GraphQL", "AWS"] },
  { name: "Sandeep Yadav", rollNumber: "22B81A0508", department: "CSE", cgpa: 7.35, graduationYear: 2026, activeBacklogs: 1, totalBacklogs: 2, skills: ["PHP", "MySQL", "Laravel"] },
  { name: "Ishita Bansal", rollNumber: "22B81A0406", department: "ECE", cgpa: 9.10, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["VLSI", "Verilog", "Python"] },
  { name: "Manish Gupta", rollNumber: "22B81A1208", department: "IT", cgpa: 6.90, graduationYear: 2026, activeBacklogs: 2, totalBacklogs: 3, skills: ["HTML", "CSS", "JavaScript"] },
  { name: "Shreya Pillai", rollNumber: "22B81A0509", department: "CSE", cgpa: 8.55, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Java", "Spring Boot", "Docker", "Kubernetes"] },
  { name: "Tarun Vishwakarma", rollNumber: "22B81A0407", department: "ECE", cgpa: 7.95, graduationYear: 2026, activeBacklogs: 0, totalBacklogs: 0, skills: ["Embedded C", "RTOS", "Arduino"] },
];

const DRIVE_DATA = [
  {
    companyName: "Google Cloud",
    roleTitle: "Cloud Solutions Associate",
    description: "Analyze customer technical architectures and deploy resilient GCP infrastructure.",
    jobDescription: "Design, develop, test, deploy, maintain and improve software.",
    ctcLpa: 18.0,
    ctc: "₹18 LPA",
    driveDate: "Oct 10, 2026",
    deadline: "Sep 30, 2026",
    deadlineTimestamp: Date.now() + 15 * 24 * 60 * 60 * 1000,
    minCgpa: 8.5,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT"],
    rounds: ["Online Assessment", "Technical Interview 1", "Technical Interview 2", "Googliness & HR"],
    website: "https://careers.google.com",
    applicantCount: 6,
    status: "ongoing" as const,
  },
  {
    companyName: "Deloitte USI",
    roleTitle: "Analyst — Technology Consulting",
    description: "Develop full-stack web and enterprise cloud applications for global clientele.",
    jobDescription: "Help clients transform their technology landscape.",
    ctcLpa: 7.6,
    ctc: "₹7.6 LPA",
    driveDate: "Oct 05, 2026",
    deadline: "Sep 25, 2026",
    deadlineTimestamp: Date.now() + 10 * 24 * 60 * 60 * 1000,
    minCgpa: 7.0,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT", "ECE", "EEE"],
    rounds: ["Cognitive Assessment", "Coding Round", "Technical & HR Interview"],
    website: "https://www.deloitte.com",
    applicantCount: 4,
    status: "ongoing" as const,
  },
  {
    companyName: "TCS (Digital / Ninja)",
    roleTitle: "System Engineer",
    description: "Design, build, and support high-throughput financial and telecommunications software.",
    jobDescription: "Work on digital transformation projects using modern tech stacks.",
    ctcLpa: 7.2,
    ctc: "₹7.2 LPA",
    driveDate: "Sep 28, 2026",
    deadline: "Sep 20, 2026",
    deadlineTimestamp: Date.now() + 5 * 24 * 60 * 60 * 1000,
    minCgpa: 6.5,
    maxActiveBacklogs: 1,
    allowedBranches: ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
    rounds: ["NQT Online Test", "Technical Interview", "Managerial & HR"],
    website: "https://www.tcs.com",
    applicantCount: 5,
    status: "ongoing" as const,
  },
  {
    companyName: "ServiceNow",
    roleTitle: "Associate Software Engineer",
    description: "Contribute to enterprise workflows, API integrations, and scalable cloud microservices.",
    jobDescription: "Build and maintain enterprise cloud platform features.",
    ctcLpa: 14.5,
    ctc: "₹14.5 LPA",
    driveDate: "Oct 15, 2026",
    deadline: "Oct 02, 2026",
    deadlineTimestamp: Date.now() + 18 * 24 * 60 * 60 * 1000,
    minCgpa: 8.0,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT", "ECE"],
    rounds: ["HackerRank Coding Test", "System Design & DS Round", "Culture Fit"],
    website: "https://www.servicenow.com",
    applicantCount: 1,
    status: "upcoming" as const,
  },
  {
    companyName: "Infosys",
    roleTitle: "Systems Engineer",
    description: "Design and implement enterprise software solutions with global delivery teams.",
    jobDescription: "Work with cutting-edge technologies and global delivery teams.",
    ctcLpa: 6.5,
    ctc: "₹6.5 LPA",
    driveDate: "Sep 22, 2026",
    deadline: "Sep 18, 2026",
    deadlineTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    minCgpa: 6.5,
    maxActiveBacklogs: 1,
    allowedBranches: ["CSE", "IT", "ECE", "EEE"],
    rounds: ["Online Assessment", "Technical + HR Interview", "Offer"],
    website: "https://www.infosys.com",
    applicantCount: 0,
    status: "completed" as const,
  },
  // ── Additional active drives (6 total) ──
  {
    companyName: "Amazon",
    roleTitle: "SDE Intern → Full-time Pipeline",
    description: "Customer-obsessed software development across retail and AWS platforms.",
    jobDescription: "Work on high-scale distributed systems with bar-raiser evaluated interviews.",
    ctcLpa: 22.0,
    ctc: "₹22 LPA",
    driveDate: "Oct 20, 2026",
    deadline: "Oct 05, 2026",
    deadlineTimestamp: Date.now() + 20 * 24 * 60 * 60 * 1000,
    minCgpa: 8.0,
    maxActiveBacklogs: 0,
    allowedBranches: ["CSE", "IT"],
    rounds: ["Online Assessment", "Technical Interview 1", "Technical Interview 2", "Bar Raiser + HR"],
    website: "https://www.amazon.jobs",
    applicantCount: 0,
    status: "ongoing" as const,
  },
  {
    companyName: "Accenture",
    roleTitle: "Associate Software Engineer",
    description: "Technology consulting and digital transformation at global scale.",
    jobDescription: "Application development, testing and support across industry verticals.",
    ctcLpa: 5.5,
    ctc: "₹5.5 LPA",
    driveDate: "Oct 08, 2026",
    deadline: "Sep 28, 2026",
    deadlineTimestamp: Date.now() + 13 * 24 * 60 * 60 * 1000,
    minCgpa: 6.0,
    maxActiveBacklogs: 1,
    allowedBranches: ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
    rounds: ["Cognitive & Technical Assessment", "Technical Interview", "HR Discussion"],
    website: "https://www.accenture.com",
    applicantCount: 0,
    status: "ongoing" as const,
  },
];

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 1) {
      return { message: "Database already seeded" };
    }

    // Create TPO user
    await ctx.db.insert("users", {
      name: "Dr. K. Srinivas Rao",
      email: "tpo@college.edu.in",
      role: "tpo",
      isAnonymous: false,
    });

    // Create recruiter user (Google Cloud)
    await ctx.db.insert("users", {
      name: "Sarah Chen",
      email: "recruiter@google.com",
      role: "recruiter",
      isAnonymous: false,
    });

    // Create demo users for each student
    const studentUserIds = [];
    for (const student of STUDENT_DATA) {
      const userId = await ctx.db.insert("users", {
        name: student.name,
        email: `${student.rollNumber.toLowerCase()}@college.edu.in`,
        role: "student",
        isAnonymous: false,
      });
      studentUserIds.push({ userId, ...student });
    }

    // Create student profiles
    const studentIds = [];
    for (const s of studentUserIds) {
      const studentId = await ctx.db.insert("students", {
        userId: s.userId,
        rollNumber: s.rollNumber,
        department: s.department,
        cgpa: s.cgpa,
        graduationYear: s.graduationYear,
        activeBacklogs: s.activeBacklogs,
        totalBacklogs: s.totalBacklogs,
        skills: s.skills,
        isVerified: true,
        placementStatus: "not_placed",
      });
      studentIds.push(studentId);
    }

    // Create drives
    const driveIds = [];
    for (const drive of DRIVE_DATA) {
      const driveId = await ctx.db.insert("drives", { ...drive });
      driveIds.push(driveId);
    }

    // Mark Kavya (index 5) as placed
    await ctx.db.patch(studentIds[5], { placementStatus: "placed" });

    // Applications
    // Aditya → Google: technical_interview
    await ctx.db.insert("applications", {
      studentId: studentIds[0], driveId: driveIds[0],
      status: "technical_interview", currentRound: "Technical Interview 1",
      totalRounds: 4, appliedAt: Date.now() - 7 * 86400000, updatedAt: Date.now() - 2 * 86400000,
      notes: "Scored 94% on HackerRank OA.",
    });

    // Sneha → Google: online_assessment
    await ctx.db.insert("applications", {
      studentId: studentIds[1], driveId: driveIds[0],
      status: "online_assessment", currentRound: "Online Assessment",
      totalRounds: 4, appliedAt: Date.now() - 5 * 86400000, updatedAt: Date.now() - 3 * 86400000,
    });

    // Rahul → Deloitte: shortlisted
    await ctx.db.insert("applications", {
      studentId: studentIds[2], driveId: driveIds[1],
      status: "shortlisted", currentRound: "Cognitive Assessment Scheduled",
      totalRounds: 3, appliedAt: Date.now() - 8 * 86400000, updatedAt: Date.now() - 2 * 86400000,
    });

    // Rahul → TCS: online_assessment
    await ctx.db.insert("applications", {
      studentId: studentIds[2], driveId: driveIds[2],
      status: "online_assessment", currentRound: "NQT Scheduled",
      totalRounds: 3, appliedAt: Date.now() - 6 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Pooja H → Deloitte: hr_interview
    await ctx.db.insert("applications", {
      studentId: studentIds[3], driveId: driveIds[1],
      status: "hr_interview", currentRound: "Technical & HR Interview",
      totalRounds: 3, appliedAt: Date.now() - 10 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Venkatesh → TCS: applied
    await ctx.db.insert("applications", {
      studentId: studentIds[4], driveId: driveIds[2],
      status: "applied", currentRound: "Application Verified",
      totalRounds: 3, appliedAt: Date.now() - 3 * 86400000, updatedAt: Date.now() - 3 * 86400000,
    });

    // Kavya → Google: offered
    await ctx.db.insert("applications", {
      studentId: studentIds[5], driveId: driveIds[0],
      status: "offered", currentRound: "Offer Accepted",
      totalRounds: 4, appliedAt: Date.now() - 20 * 86400000, updatedAt: Date.now() - 5 * 86400000,
      notes: "Offer accepted. CTC: ₹18 LPA.",
    });

    // Arjun → Deloitte: technical_interview
    await ctx.db.insert("applications", {
      studentId: studentIds[6], driveId: driveIds[1],
      status: "technical_interview", currentRound: "Technical & HR Interview",
      totalRounds: 3, appliedAt: Date.now() - 9 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Meera → TCS: shortlisted
    await ctx.db.insert("applications", {
      studentId: studentIds[7], driveId: driveIds[2],
      status: "shortlisted", currentRound: "Technical Interview Scheduled",
      totalRounds: 3, appliedAt: Date.now() - 5 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Nisha → Google: technical_interview
    await ctx.db.insert("applications", {
      studentId: studentIds[8], driveId: driveIds[0],
      status: "technical_interview", currentRound: "Technical Interview 2",
      totalRounds: 4, appliedAt: Date.now() - 11 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Siddharth → TCS: rejected
    await ctx.db.insert("applications", {
      studentId: studentIds[9], driveId: driveIds[2],
      status: "rejected", currentRound: "Eligibility Check",
      totalRounds: 3, appliedAt: Date.now() - 4 * 86400000, updatedAt: Date.now() - 3 * 86400000,
      notes: "CGPA 6.50 below minimum 6.5 threshold.",
    });

    // Vikram → TCS: rejected
    await ctx.db.insert("applications", {
      studentId: studentIds[13], driveId: driveIds[2],
      status: "rejected", currentRound: "Eligibility Check",
      totalRounds: 3, appliedAt: Date.now() - 2 * 86400000, updatedAt: Date.now() - 1 * 86400000,
      notes: "2 active backlogs exceed allowed limit of 1.",
    });

    // Karthik → Deloitte: shortlisted
    await ctx.db.insert("applications", {
      studentId: studentIds[14], driveId: driveIds[1],
      status: "shortlisted", currentRound: "Coding Round Scheduled",
      totalRounds: 3, appliedAt: Date.now() - 6 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Pooja D → Deloitte: online_assessment
    await ctx.db.insert("applications", {
      studentId: studentIds[10], driveId: driveIds[1],
      status: "online_assessment", currentRound: "Cognitive Assessment",
      totalRounds: 3, appliedAt: Date.now() - 7 * 86400000, updatedAt: Date.now() - 2 * 86400000,
    });

    // Sneha → ServiceNow: applied
    await ctx.db.insert("applications", {
      studentId: studentIds[1], driveId: driveIds[3],
      status: "applied", currentRound: "Application Submitted",
      totalRounds: 3, appliedAt: Date.now() - 1 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // Aditya B → TCS: applied
    await ctx.db.insert("applications", {
      studentId: studentIds[11], driveId: driveIds[2],
      status: "applied", currentRound: "Application Submitted",
      totalRounds: 3, appliedAt: Date.now() - 1 * 86400000, updatedAt: Date.now() - 1 * 86400000,
    });

    // ── Extended cohort applications (richer pipelines) ──
    const DAY = 86400000;
    type AppStatus = "applied" | "shortlisted" | "online_assessment" | "technical_interview" | "hr_interview" | "offered" | "rejected";
    const extraApps: [number, number, AppStatus, string, number, string?][] = [
      // Ananya → Amazon: technical_interview (super-dream pipeline)
      [15, 5, "technical_interview", "Technical Interview 1", 4, "Cleared OA with 8/10 — strong DS fundamentals."],
      // Divya → Amazon: online_assessment
      [17, 5, "online_assessment", "Online Assessment", 4],
      // Divya → Google: shortlisted
      [17, 0, "shortlisted", "Resume Shortlisted", 4],
      // Priya → ServiceNow: technical_interview
      [19, 3, "technical_interview", "System Design & DS Round", 3, "Excellent API design discussion."],
      // Shreya → Amazon: applied
      [23, 5, "applied", "Application Submitted", 4],
      // Shreya → Google: online_assessment
      [23, 0, "online_assessment", "Online Assessment", 4],
      // Ishita → ServiceNow: shortlisted
      [21, 3, "shortlisted", "Resume Shortlisted", 3],
      // Farhan → Deloitte: applied
      [18, 1, "applied", "Application Verified", 3],
      // Nisha → Amazon: shortlisted
      [8, 5, "shortlisted", "Resume Shortlisted", 4],
      // Kavya → ServiceNow: offered (double offer — super dream)
      [5, 3, "offered", "Offer Accepted", 3, "Second offer accepted: ₹14.5 LPA. Student frozen (Super Dream)."],
      // Rohit → TCS: hr_interview
      [16, 2, "hr_interview", "Managerial & HR", 3],
      // Meera → Accenture: offered
      [7, 6, "offered", "Offer Released", 3, "Package: ₹5.5 LPA (Tier 1 Core)."],
      // Sandeep → Accenture: online_assessment
      [20, 6, "online_assessment", "Cognitive & Technical Assessment", 3],
      // Manish → Accenture: applied
      [22, 6, "applied", "Application Submitted", 3],
      // Ananya → Deloitte: rejected
      [15, 1, "rejected", "Cognitive Assessment", 3, "Did not clear the cognitive assessment cutoff."],
      // Tarun → Deloitte: technical_interview
      [24, 1, "technical_interview", "Technical & HR Interview", 3],
    ];
    for (const [sIdx, dIdx, status, round, totalRounds, notes] of extraApps) {
      await ctx.db.insert("applications", {
        studentId: studentIds[sIdx],
        driveId: driveIds[dIdx],
        status,
        currentRound: round,
        totalRounds,
        appliedAt: Date.now() - Math.floor(Math.random() * 10 + 2) * DAY,
        updatedAt: Date.now() - Math.floor(Math.random() * 2 + 1) * DAY,
        notes,
      });
    }

    // Additional placements for realistic stats: mark accepted-offer holders placed
    await ctx.db.patch(studentIds[7], { placementStatus: "placed" });   // Meera → Accenture (Tier 1)
    await ctx.db.patch(studentIds[5], { placementStatus: "placed" });   // Kavya → Super Dream (frozen)

    return {
      message: "Database seeded successfully",
      students: STUDENT_DATA.length,
      drives: DRIVE_DATA.length,
      applications: 16 + extraApps.length,
    };
  },
});

export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length > 0;
  },
});
