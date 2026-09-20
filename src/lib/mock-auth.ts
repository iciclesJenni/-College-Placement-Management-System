// Mock authentication utilities — simulates a session via sessionStorage.
// This lets the demo logins persist across route reloads without Convex.
// Every write/delete is mirrored to a real cookie (see session-cookie.ts)
// so role state also survives full page reloads and sandbox restarts.

import type { UserRole } from "@/types";
import {
  setSessionCookie,
  deleteSessionCookie,
  getSessionCookie,
} from "@/lib/session-cookie";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "placement_portal_auth";

// ─── Demo user catalog ───
const DEMO_USERS: Record<UserRole, MockUser> = {
  student: {
    id: "mock-stu-1",
    name: "Aditya Verma",
    email: "aditya.verma@college.edu.in",
    role: "student",
  },
  tpo: {
    id: "mock-tpo-1",
    name: "Dr. K. Srinivas Rao",
    email: "tpo@college.edu.in",
    role: "tpo",
  },
  recruiter: {
    id: "mock-rec-1",
    name: "Recruiter Demo",
    email: "recruiter@company.com",
    role: "recruiter",
  },
};

// ─── Password list for standard credential login ───
const VALID_CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  "aditya.verma@college.edu.in": { password: "student123", role: "student" },
  "student@college.edu.in": { password: "student123", role: "student" },
  "tpo@college.edu.in": { password: "tpo123", role: "tpo" },
  "admin@college.edu.in": { password: "admin123", role: "tpo" },
  "recruiter@company.com": { password: "recruiter123", role: "recruiter" },
};

// ─── Session store helpers (sessionStorage + cookie mirror) ───
export function getMockUser(): MockUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockUser;
  } catch {
    // fall through to cookie
  }
  // sessionStorage empty (e.g. sandbox restart) — recover from the cookie
  const cookieSession = getSessionCookie();
  if (cookieSession) {
    const user: MockUser = {
      id: cookieSession.userId,
      name: cookieSession.name,
      email: cookieSession.email,
      role: cookieSession.role,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // silent
    }
    return user;
  }
  return null;
}

export function setMockUser(user: MockUser): void {
  // Mirror to both stores — cookie survives reloads, sessionStorage drives reactivity
  setSessionCookie({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Dispatch event so useAuth re-renders
    window.dispatchEvent(new Event("mock-auth-change"));
  } catch {
    // sessionStorage unavailable — cookie still set
  }
}

export function clearMockUser(): void {
  deleteSessionCookie();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("mock-auth-change"));
  } catch {
    // silent fail
  }
}

// ─── Login helpers ───

/** 1-click demo login by role */
export function mockLoginAs(role: UserRole): MockUser {
  const user = DEMO_USERS[role];
  setMockUser(user);
  return user;
}

/** Standard email/password credential login (simulated) */
export function mockLoginWithCredentials(
  email: string,
  password: string,
): { success: boolean; user?: MockUser; error?: string } {
  const entry = VALID_CREDENTIALS[email.toLowerCase().trim()];
  if (!entry) {
    return { success: false, error: "No account found with that email address." };
  }
  if (entry.password !== password) {
    return { success: false, error: "The password you entered is incorrect." };
  }
  const user = DEMO_USERS[entry.role];
  setMockUser(user);
  return { success: true, user };
}
