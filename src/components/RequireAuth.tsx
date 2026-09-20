import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router";
import { SessionExpired } from "@/components/FallbackStates";

/**
 * Full-screen purple-glass loader — the unified waiting state for both
 * auth guards while session/role resolution is in flight.
 */
export function AuthLoader({ label = "Verifying session" }: { label?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
        <Loader2 className="size-6 animate-spin text-purple-400" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </main>
  );
}

/**
 * Obsidian/purple "access denied" card for wrong-role attempts.
 * Shows a friendly redirect notice instead of a bare bounce.
 */
export function AccessDenied({ homePath, homeLabel }: { homePath: string; homeLabel: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="nb-card p-8 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 mx-auto mb-4 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-purple-400" />
        </div>
        <h2 className="font-black text-lg tracking-tight mb-1 text-slate-100">
          Access restricted
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mb-5">
          Your account role doesn't have permission to view this area. Head back
          to your own dashboard to continue.
        </p>
        <Link
          to={homePath}
          className="nb-btn-primary text-xs font-bold px-4 py-2 inline-flex items-center justify-center"
        >
          Go to {homeLabel}
        </Link>
      </div>
    </main>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Session desync detection: the mock auth store recovers from the cookie,
  // so if BOTH stores are empty the session expired or was cleared. Show
  // the dedicated expiry fallback rather than a generic redirect when the
  // user *had* a session in this tab (stale sessionStorage entry).
  const hadStaleSession = (() => {
    try {
      return sessionStorage.getItem("placement_portal_auth") !== null;
    } catch {
      return false;
    }
  })();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    if (hadStaleSession) {
      try {
        sessionStorage.removeItem("placement_portal_auth");
      } catch {
        // ignore
      }
      return <SessionExpired />;
    }
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}
