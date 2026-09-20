export type Department = "CSE" | "IT" | "ECE" | "EEE" | "MECH" | "CIVIL";

export type PlacementStatus = "not_placed" | "placed" | "opted_out";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "online_assessment"
  | "technical_interview"
  | "hr_interview"
  | "offered"
  | "rejected";

export type DriveStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type UserRole = "student" | "tpo" | "recruiter";

export interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: Department;
  graduationYear: number;
  cgpa: number;
  activeBacklogs: number;
  totalBacklogs: number;
  phone?: string;
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  isVerified: boolean;
  placementStatus: PlacementStatus;
}

export interface TpoProfile {
  id: string;
  name: string;
  email: string;
  designation: string;
  department?: string;
}

export interface Drive {
  id: string;
  companyName: string;
  roleTitle: string;
  description: string;
  jobDescription: string;
  ctcLpa: number;
  ctc: string;
  driveDate: string;
  deadline: string;
  deadlineTimestamp: number;
  status: DriveStatus;
  minCgpa: number;
  maxActiveBacklogs: number;
  allowedBranches: Department[];
  rounds: string[];
  applicantCount: number;
  website?: string;
  /** Client-side optimistic apply flag — set instantly on 1-click apply, reconciled with the server */
  applied?: boolean;
}

export interface Application {
  id: string;
  studentId: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  currentRound: string;
  totalRounds: number;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  /** Client-side optimistic flag — set instantly on stage moves, reconciled with the server */
  pendingStatusChange?: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

export interface DashboardStats {
  totalStudents: number;
  placedStudents: number;
  placementPercentage: number;
  totalOffers: number;
  highestCtc: number;
  averageCtc: number;
  totalApplications: number;
  activeDrives: number;
  departmentStats: {
    department: string;
    total: number;
    placed: number;
    percentage: number;
  }[];
  ctcDistribution: Record<string, number>;
  recentDrives: {
    companyName: string;
    roleTitle: string;
    shortlisted: number;
    rejected: number;
    total: number;
  }[];
}
