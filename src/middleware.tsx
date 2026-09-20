/**
 * Authentication Middleware (SPA equivalent of src/middleware.ts).
 *
 * Strict role checking for /student/*, /tpo/* and /company/* paths.
 * Unauthorized access attempts are seamlessly redirected back to the
 * login sandbox (/auth) with a returnTo param, and wrong-role attempts
 * are bounced to the offender's own dashboard home.
 *
 * IMPORTANT: role resolution uses the live auth state (mock session AND
 * Convex auth) via useAuth() — never the cookie alone. The cookie is a
 * persistence mirror for mock sessions, but real Convex-authenticated
 * users have no mock cookie; gating on the cookie would bounce them to
 * /auth in a loop (the "can't open the sidebar" regression). RequireAuth
 * (placed inside this gate on every route) still handles the true
 * unauthenticated redirect.
 */

import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthLoader } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/use-auth";

/** Path-prefix → owning role contract (the middleware rule table). */
function pathOwner(pathname: string): "student" | "tpo" | "recruiter" | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/tpo")) return "tpo";
  if (pathname.startsWith("/company")) return "recruiter";
  return null; // public / shared path — no role contract
}

/**
 * Root-level middleware component. Renders children when the current path
 * passes the role contract; otherwise performs a seamless redirect:
 *
 *  - wrong role + protected path → that role's own dashboard home
 *  - unauthenticated paths are left to RequireAuth (which supports both
 *    mock and Convex sessions and carries the returnTo param)
 */
export function RouteMiddleware({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();

  const owner = pathOwner(location.pathname);
  const activeRole = user?.role;
  const wrongRole =
    !isLoading && owner !== null && activeRole !== undefined && activeRole !== owner;

  useEffect(() => {
    if (!wrongRole) return;
    const home =
      activeRole === "tpo"
        ? "/tpo/dashboard"
        : activeRole === "recruiter"
          ? "/company/dashboard"
          : "/student/dashboard";
    toast.error("Redirected to your dashboard", {
      description: `The ${String(activeRole).toUpperCase()} role doesn't have access to ${location.pathname}.`,
    });
    navigate(home, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongRole, location.pathname]);

  if (isLoading && owner !== null) {
    return <AuthLoader label="Verifying session" />;
  }

  if (wrongRole) {
    return <AuthLoader label="Redirecting" />;
  }

  return <>{children}</>;
}
