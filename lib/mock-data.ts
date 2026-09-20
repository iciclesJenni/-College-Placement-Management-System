import type { StudentProfile, Drive, Application, DashboardStats, TpoProfile } from "@/types";

export const mockTpo: TpoProfile = {
  id: "tpo-1", name: "Dr. K. Srinivas Rao", email: "tpo@college.edu.in",
  designation: "Head — Training & Placement Cell", department: "Placement Division",
};

export const mockStudents: StudentProfile[] = [
  { id: "stu-1", name: "Aditya Verma", rollNumber: "22B81A0501", email: "aditya@college.edu.in", department: "CSE", graduationYear: 2026, cgpa: 9.15, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Node.js", "Python", "DSA"], resumeUrl: "https://example.com/resumes/aditya.pdf", isVerified: true, placementStatus: "not_placed" },
  { id: "stu-2", name: "Sneha Reddy", rollNumber: "22B81A0542", email: "sneha@college.edu.in", department: "CSE", graduationYear: 2026, cgpa: 8.65, activeBacklogs: 0, totalBacklogs: 0, skills: ["Java", "Spring Boot", "SQL", "AWS"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-3", name: "Rahul Sharma", rollNumber: "22B81A0418", email: "rahul@college.edu.in", department: "ECE", graduationYear: 2026, cgpa: 7.82, activeBacklogs: 0, totalBacklogs: 1, skills: ["VLSI", "Embedded C", "Python"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-4", name: "Pooja Hegde", rollNumber: "22B81A1205", email: "pooja@college.edu.in", department: "IT", graduationYear: 2026, cgpa: 8.24, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "TypeScript", "Docker"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-5", name: "Venkatesh Naidu", rollNumber: "22B81A0310", email: "venkat@college.edu.in", department: "MECH", graduationYear: 2026, cgpa: 6.94, activeBacklogs: 1, totalBacklogs: 2, skills: ["AutoCAD", "SolidWorks"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-6", name: "Kavya Krishnamurthy", rollNumber: "22B81A0502", email: "kavya@college.edu.in", department: "CSE", graduationYear: 2026, cgpa: 9.42, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Next.js", "GraphQL", "AWS"], isVerified: true, placementStatus: "placed" },
  { id: "stu-7", name: "Arjun Patel", rollNumber: "22B81A1201", email: "arjun@college.edu.in", department: "IT", graduationYear: 2026, cgpa: 8.10, activeBacklogs: 0, totalBacklogs: 0, skills: ["Java", "Hibernate", "REST APIs"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-8", name: "Meera Iyer", rollNumber: "22B81A0503", email: "meera@college.edu.in", department: "CSE", graduationYear: 2026, cgpa: 7.80, activeBacklogs: 0, totalBacklogs: 0, skills: ["Python", "Django", "PostgreSQL"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-9", name: "Nisha Agarwal", rollNumber: "22B81A1202", email: "nisha@college.edu.in", department: "IT", graduationYear: 2026, cgpa: 9.00, activeBacklogs: 0, totalBacklogs: 0, skills: ["React", "Node.js", "MongoDB", "Docker"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-10", name: "Siddharth Rao", rollNumber: "23B81A0504", email: "siddharth@college.edu.in", department: "CSE", graduationYear: 2027, cgpa: 6.50, activeBacklogs: 3, totalBacklogs: 5, skills: ["Java", "Basic SQL"], isVerified: false, placementStatus: "not_placed" },
  { id: "stu-11", name: "Pooja Desai", rollNumber: "22B81A0404", email: "poojad@college.edu.in", department: "ECE", graduationYear: 2026, cgpa: 8.00, activeBacklogs: 0, totalBacklogs: 0, skills: ["Embedded C", "RTOS", "PCB Design"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-12", name: "Aditya Bose", rollNumber: "22B81A0505", email: "adityab@college.edu.in", department: "CSE", graduationYear: 2026, cgpa: 7.20, activeBacklogs: 1, totalBacklogs: 2, skills: ["Python", "Flask", "Redis"], isVerified: true, placementStatus: "not_placed" },
  { id: "stu-13", name: "Lakshmi Prasad", rollNumber: "22B81A0601", email: "lakshmi@college.edu.in", department: "CIVIL", graduationYear: 2026, cgpa: 7.50, activeBacklogs: 0, totalBacklogs: 0, skills: ["AutoCAD", "STAAD Pro"], isVerified: true, placementStatus: "opted_out" },
  { id: "stu-14", name: "Vikram Singh", rollNumber: "22B81A1203", email: "vikram@college.edu.in", department: "IT", graduationYear: 2026, cgpa: 6.80, activeBacklogs: 2, totalBacklogs: 3, skills: ["PHP", "Laravel", "MySQL"], isVerified: false, placementStatus: "not_placed" },
  { id: "stu-15", name: "Karthik Menon", rollNumber: "22B81A0402", email: "karthik@college.edu.in", department: "ECE", graduationYear: 2026, cgpa: 7.10, activeBacklogs: 1, totalBacklogs: 1, skills: ["IoT", "Arduino", "Python"], isVerified: true, placementStatus: "not_placed" },
];

export const mockDrives: Drive[] = [
  { id: "drv-1", companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", description: "Analyze customer technical architectures and deploy resilient GCP infrastructure.", jobDescription: "Design, develop, test, deploy, maintain and improve software.", ctcLpa: 18.0, ctc: "₹18 LPA", driveDate: "Oct 10, 2026", deadline: "Sep 30, 2026", deadlineTimestamp: Date.now() + 15 * 86400000, status: "ongoing", minCgpa: 8.5, maxActiveBacklogs: 0, allowedBranches: ["CSE", "IT"], rounds: ["Online Assessment", "Technical Interview 1", "Technical Interview 2", "Googliness & HR"], website: "https://careers.google.com", applicantCount: 6 },
  { id: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", description: "Develop full-stack web and enterprise cloud applications.", jobDescription: "Help clients transform their technology landscape.", ctcLpa: 7.6, ctc: "₹7.6 LPA", driveDate: "Oct 05, 2026", deadline: "Sep 25, 2026", deadlineTimestamp: Date.now() + 10 * 86400000, status: "ongoing", minCgpa: 7.0, maxActiveBacklogs: 0, allowedBranches: ["CSE", "IT", "ECE", "EEE"], rounds: ["Cognitive Assessment", "Coding Round", "Technical & HR Interview"], website: "https://www.deloitte.com", applicantCount: 4 },
  { id: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", description: "Design, build, and support high-throughput software.", jobDescription: "Work on digital transformation projects.", ctcLpa: 7.2, ctc: "₹7.2 LPA", driveDate: "Sep 28, 2026", deadline: "Sep 20, 2026", deadlineTimestamp: Date.now() + 5 * 86400000, status: "ongoing", minCgpa: 6.5, maxActiveBacklogs: 1, allowedBranches: ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"], rounds: ["NQT Online Test", "Technical Interview", "Managerial & HR"], website: "https://www.tcs.com", applicantCount: 5 },
  { id: "drv-4", companyName: "ServiceNow", roleTitle: "Associate Software Engineer", description: "Contribute to enterprise workflows and cloud microservices.", jobDescription: "Build enterprise cloud platform features.", ctcLpa: 14.5, ctc: "₹14.5 LPA", driveDate: "Oct 15, 2026", deadline: "Oct 02, 2026", deadlineTimestamp: Date.now() + 18 * 86400000, status: "upcoming", minCgpa: 8.0, maxActiveBacklogs: 0, allowedBranches: ["CSE", "IT", "ECE"], rounds: ["HackerRank Coding Test", "System Design & DS Round", "Culture Fit"], website: "https://www.servicenow.com", applicantCount: 1 },
  { id: "drv-5", companyName: "Infosys", roleTitle: "Systems Engineer", description: "Design and implement enterprise software solutions.", jobDescription: "Work with global delivery teams.", ctcLpa: 6.5, ctc: "₹6.5 LPA", driveDate: "Sep 22, 2026", deadline: "Sep 18, 2026", deadlineTimestamp: Date.now() - 2 * 86400000, status: "completed", minCgpa: 6.5, maxActiveBacklogs: 1, allowedBranches: ["CSE", "IT", "ECE", "EEE"], rounds: ["Online Assessment", "Technical + HR Interview", "Offer"], website: "https://www.infosys.com", applicantCount: 0 },
];

export const mockApplications: Application[] = [
  { id: "app-1", studentId: "stu-1", driveId: "drv-1", companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", status: "technical_interview", currentRound: "Technical Interview 1", totalRounds: 4, appliedAt: "Sep 08, 2026", updatedAt: "Sep 14, 2026", notes: "Scored 94% on HackerRank OA." },
  { id: "app-2", studentId: "stu-2", driveId: "drv-1", companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", status: "online_assessment", currentRound: "Online Assessment", totalRounds: 4, appliedAt: "Sep 10, 2026", updatedAt: "Sep 12, 2026" },
  { id: "app-3", studentId: "stu-2", driveId: "drv-4", companyName: "ServiceNow", roleTitle: "Associate Software Engineer", status: "applied", currentRound: "Application Submitted", totalRounds: 3, appliedAt: "Sep 15, 2026", updatedAt: "Sep 15, 2026" },
  { id: "app-4", studentId: "stu-3", driveId: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", status: "shortlisted", currentRound: "Cognitive Assessment Scheduled", totalRounds: 3, appliedAt: "Sep 07, 2026", updatedAt: "Sep 13, 2026" },
  { id: "app-5", studentId: "stu-3", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "online_assessment", currentRound: "NQT Scheduled", totalRounds: 3, appliedAt: "Sep 09, 2026", updatedAt: "Sep 14, 2026" },
  { id: "app-6", studentId: "stu-4", driveId: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", status: "hr_interview", currentRound: "Technical & HR Interview", totalRounds: 3, appliedAt: "Sep 05, 2026", updatedAt: "Sep 15, 2026" },
  { id: "app-7", studentId: "stu-5", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "applied", currentRound: "Application Verified", totalRounds: 3, appliedAt: "Sep 12, 2026", updatedAt: "Sep 12, 2026" },
  { id: "app-8", studentId: "stu-6", driveId: "drv-1", companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", status: "offered", currentRound: "Offer Accepted", totalRounds: 4, appliedAt: "Aug 25, 2026", updatedAt: "Sep 10, 2026", notes: "Offer accepted. CTC: ₹18 LPA." },
  { id: "app-9", studentId: "stu-7", driveId: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", status: "technical_interview", currentRound: "Technical & HR Interview", totalRounds: 3, appliedAt: "Sep 06, 2026", updatedAt: "Sep 14, 2026" },
  { id: "app-10", studentId: "stu-8", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "shortlisted", currentRound: "Technical Interview Scheduled", totalRounds: 3, appliedAt: "Sep 10, 2026", updatedAt: "Sep 14, 2026" },
  { id: "app-11", studentId: "stu-9", driveId: "drv-1", companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", status: "technical_interview", currentRound: "Technical Interview 2", totalRounds: 4, appliedAt: "Sep 04, 2026", updatedAt: "Sep 15, 2026" },
  { id: "app-12", studentId: "stu-10", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "rejected", currentRound: "Eligibility Check", totalRounds: 3, appliedAt: "Sep 11, 2026", updatedAt: "Sep 12, 2026", notes: "CGPA 6.50 below minimum threshold." },
  { id: "app-13", studentId: "stu-11", driveId: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", status: "online_assessment", currentRound: "Cognitive Assessment", totalRounds: 3, appliedAt: "Sep 08, 2026", updatedAt: "Sep 13, 2026" },
  { id: "app-14", studentId: "stu-12", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "applied", currentRound: "Application Submitted", totalRounds: 3, appliedAt: "Sep 14, 2026", updatedAt: "Sep 14, 2026" },
  { id: "app-15", studentId: "stu-14", driveId: "drv-3", companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", status: "rejected", currentRound: "Eligibility Check", totalRounds: 3, appliedAt: "Sep 13, 2026", updatedAt: "Sep 14, 2026", notes: "2 active backlogs exceed allowed limit." },
  { id: "app-16", studentId: "stu-15", driveId: "drv-2", companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", status: "shortlisted", currentRound: "Coding Round Scheduled", totalRounds: 3, appliedAt: "Sep 09, 2026", updatedAt: "Sep 14, 2026" },
];

export const mockDashboardStats: DashboardStats = {
  // Realistic institutional cohort — used when the live Convex database has
  // no seeded records yet, so the TPO overview never renders empty zeros.
  totalStudents: 480, placedStudents: 376, placementPercentage: 78.4, totalOffers: 412,
  highestCtc: 44.0, averageCtc: 11.8, totalApplications: 1240, activeDrives: 6,
  departmentStats: [
    { department: "CSE", total: 144, placed: 131, percentage: 91 },
    { department: "IT", total: 104, placed: 89, percentage: 86 },
    { department: "ECE", total: 100, placed: 74, percentage: 74 },
    { department: "MECH", total: 132, placed: 82, percentage: 62 },
  ],
  ctcDistribution: { "Below 5 LPA": 68, "5–10 LPA": 184, "10–15 LPA": 112, "15+ LPA": 48 },
  recentDrives: [
    { companyName: "Google Cloud", roleTitle: "Cloud Solutions Associate", shortlisted: 12, rejected: 4, total: 38 },
    { companyName: "Deloitte USI", roleTitle: "Analyst — Technology Consulting", shortlisted: 21, rejected: 6, total: 64 },
    { companyName: "TCS (Digital / Ninja)", roleTitle: "System Engineer", shortlisted: 34, rejected: 18, total: 112 },
  ],
};
