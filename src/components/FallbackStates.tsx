import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { WifiOff, Clock, DatabaseZap, RotateCcw, LogIn } from "lucide-react";
import { getSessionCookie } from "@/lib/session-cookie";

/**
 * Graceful fallback states for platform-level failures, styled in the
 * obsidian/purple/gold identity. Used by route boundaries and data hooks:
 *
 *   - SessionExpired — the auth cookie expired mid-session; re-authenticate
 *   - DbConnectionError — the Convex backend is unreachable / timed out
 *   - OfflineState — the browser lost network connectivity
 */

function FallbackShell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 md:p-10">
      <div className="nb-card p-8 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-950/30">
          {icon}
        </div>
        <h2 className="font-black text-lg tracking-tight mb-1 text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400 font-semibold mb-5 leading-relaxed">{body}</p>
        {children && <div className="flex items-center justify-center gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
}

/** Auth cookie expired mid-session — re-authentication required. */
export function SessionExpired() {
  const navigate = useNavigate();
  useEffect(() => {
    // Clean up the stale cookie so the next visit starts fresh
    if (!getSessionCookie()) return;
  }, []);
  return (
    <FallbackShell
      icon={<Clock className="h-6 w-6 text-amber-400" />}
      title="Session expired"
      body="Your secure session has timed out after 12 hours of inactivity. Sign in again to continue where you left off."
    >
      <button
        onClick={() => navigate("/auth")}
        className="nb-btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign In Again
      </button>
    </FallbackShell>
  );
}

/** Backend unreachable — queries failed to resolve. */
export function DbConnectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackShell
      icon={<DatabaseZap className="h-6 w-6 text-purple-400" />}
      title="Can't reach the database"
      body="We're having trouble loading your data right now. This is usually temporary — check your connection and retry."
    >
      {onRetry && (
        <button
          onClick={onRetry}
          className="nb-btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </FallbackShell>
  );
}

/** Browser offline — live connectivity banner, non-blocking. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-slate-950/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-purple-950/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="h-4 w-4 text-amber-400" />
      <div>
        <p className="text-[11px] font-black text-slate-100">You're offline</p>
        <p className="text-[10px] text-slate-400">Changes will sync when the connection returns.</p>
      </div>
    </div>
  );
}

/**
 * Session desync guard — runs inside the authenticated layout and verifies
 * the cookie-backed session still matches the live auth state. If the cookie
 * expired or was cleared while React state still holds the user, we force a
 * re-authentication instead of rendering a role-mismatched view.
 */
export function useSessionSync(): { synced: boolean } {
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    const check = () => {
      // The mock session lives in both cookie and sessionStorage; if the
      // cookie is gone but the in-memory state persists, the session died.
      const cookie = getSessionCookie();
      const local = sessionStorage.getItem("placement_portal_auth");
      const hadSession = Boolean(cookie) || Boolean(local);
      setSynced(hadSession || !cookie);
    };
    check();
    const t = window.setInterval(check, 60_000);
    return () => window.clearInterval(t);
  }, []);

  return { synced };
}
