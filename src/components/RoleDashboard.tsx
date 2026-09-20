import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { AccessDenied } from "@/components/RequireAuth";

/** Default dashboard destination per role. */
export const ROLE_DASHBOARDS: Record<string, string> = {
  student: "/student/dashboard",
  tpo: "/tpo/dashboard",
  recruiter: "/company/dashboard",
};

/**
 * Route guard for role-specific sections. A user hitting a route that does
 * not belong to their role is redirected to their own dashboard — so a TPO
 * can never render the student experience (and vice versa), even via
 * deep links or stale history entries.
 */
export function RequireRole({
  role,
  children,
}: {
  role: "student" | "tpo" | "recruiter";
  children: ReactNode;
}) {
  const { isLoading, user } = useAuth();

  if (isLoading) return null; // RequireAuth already shows the loader

  const activeRole = user?.role ?? "student";
  if (activeRole !== role) {
    return <Navigate to={ROLE_DASHBOARDS[activeRole] ?? "/"} replace />;
  }

  return <>{children}</>;
}

/**
 * Role-switch dashboard — renders the correct dashboard component INLINE
 * based on the active user's role. Used for the legacy /dashboard route so
 * the TPO account never sees student metrics (CGPA, backlogs, Apply Now).
 */
export function RoleSwitchDashboard({
  student,
  tpo,
  recruiter,
}: {
  student: ReactNode;
  tpo: ReactNode;
  recruiter: ReactNode;
}) {
  const { isLoading, user } = useAuth();

  if (isLoading) return null; // RequireAuth already shows the loader

  const activeRole = user?.role ?? "student";
  return <>{activeRole === "tpo" ? tpo : activeRole === "recruiter" ? recruiter : student}</>;
}

export { AccessDenied };
