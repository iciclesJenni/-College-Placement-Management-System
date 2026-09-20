/**
 * Session cookie layer — the SPA equivalent of server middleware cookie
 * checks. The active session is mirrored into a real browser cookie
 * (`placement_portal_session`) so role state survives full page reloads
 * even if sessionStorage is cleared by a sandbox restart.
 *
 * Cookies carry the same strict role contract the router guards enforce:
 *   student → /student/*   tpo → /tpo/*   recruiter → /company/*
 */

export const SESSION_COOKIE_NAME = "placement_portal_session";

export interface SessionCookiePayload {
  userId: string;
  name: string;
  email: string;
  role: "student" | "tpo" | "recruiter";
  /** Epoch ms — stamped on write; used to detect and drop stale sessions */
  issuedAt?: number;
}

/** Sessions older than 12 hours are treated as expired. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch {
    // Cookie writes can fail in restrictive sandboxed iframes — non-fatal,
    // sessionStorage remains the primary store.
  }
}

function readCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

/** Persist the session to both the cookie and the mock sessionStorage store. */
export function setSessionCookie(user: SessionCookiePayload): void {
  const payload = { ...user, issuedAt: Date.now() };
  writeCookie(SESSION_COOKIE_NAME, JSON.stringify(payload), Math.floor(MAX_AGE_MS / 1000));
  try {
    sessionStorage.setItem("placement_portal_auth", JSON.stringify(payload));
    window.dispatchEvent(new Event("mock-auth-change"));
  } catch {
    // silent
  }
}

/**
 * Read the cookie session. Returns null when absent, malformed, or expired.
 * Expired cookies are actively deleted so they can't shadow a fresh login.
 */
export function getSessionCookie(): SessionCookiePayload | null {
  const raw = readCookie(SESSION_COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionCookiePayload;
    if (
      !parsed.role ||
      !["student", "tpo", "recruiter"].includes(parsed.role) ||
      typeof parsed.issuedAt !== "number" ||
      Date.now() - parsed.issuedAt > MAX_AGE_MS
    ) {
      deleteSessionCookie();
      return null;
    }
    return parsed;
  } catch {
    deleteSessionCookie();
    return null;
  }
}

export function deleteSessionCookie(): void {
  writeCookie(SESSION_COOKIE_NAME, "", 0);
}

/**
 * Strict route-contract check — the SPA middleware rule.
 * Returns the redirect target when the path is protected and the cookie
 * role doesn't own it, or null when access is permitted.
 */
export function checkRouteAccess(
  pathname: string,
): { allowed: false; redirectTo: string; reason: "unauthenticated" | "wrong_role" } | { allowed: true } {
  const isStudentArea = pathname.startsWith("/student");
  const isTpoArea = pathname.startsWith("/tpo");
  const isCompanyArea = pathname.startsWith("/company");
  const isProtected = isStudentArea || isTpoArea || isCompanyArea;

  if (!isProtected) return { allowed: true };

  const session = getSessionCookie();
  if (!session) {
    return { allowed: false, redirectTo: "/auth", reason: "unauthenticated" };
  }

  const ownsPath =
    (isStudentArea && session.role === "student") ||
    (isTpoArea && session.role === "tpo") ||
    (isCompanyArea && session.role === "recruiter");

  if (!ownsPath) {
    const home =
      session.role === "tpo"
        ? "/tpo/dashboard"
        : session.role === "recruiter"
          ? "/company/dashboard"
          : "/student/dashboard";
    return { allowed: false, redirectTo: home, reason: "wrong_role" };
  }

  return { allowed: true };
}
