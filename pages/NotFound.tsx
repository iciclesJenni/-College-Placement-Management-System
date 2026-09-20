import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home, HelpCircle, ScrollText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

/**
 * Global 404 — "Signal Lost in the Grid".
 *
 * Role-aware: reads the session mirror so the primary CTA returns the user
 * to their own dashboard rather than dumping a TPO or recruiter on the
 * public landing page.
 *
 * NOTE — this real app is a Vite + React SPA, so the Next.js App Router
 * convention `src/app/not-found.tsx` does not apply. The catch-all route
 * `<Route path="*" element={<NotFound />} />` in src/main.tsx mounts this
 * component for every unresolved path, which is the framework-equivalent.
 */

interface ReturnTarget {
  path: string;
  label: string;
  role: "student" | "tpo" | "recruiter" | null;
}

/** Best-effort session read so we route home to the right workspace. */
function resolveReturnTarget(): ReturnTarget {
  const roleHome: Record<string, { path: string; label: string }> = {
    student: { path: "/student/dashboard", label: "Student Dashboard" },
    tpo: { path: "/tpo/dashboard", label: "TPO Console" },
    recruiter: { path: "/company/dashboard", label: "Recruiter Portal" },
  };

  try {
    // Primary: the session mirror written by setSessionCookie
    const raw =
      sessionStorage.getItem("placement_portal_auth") ??
      localStorage.getItem("placement_portal_auth");
    if (raw) {
      const role = (JSON.parse(raw) as { role?: string }).role;
      if (role && roleHome[role]) {
        return { ...roleHome[role], role: role as ReturnTarget["role"] };
      }
    }
    // Fallback: legacy role key
    const legacy = localStorage.getItem("userRole");
    if (legacy && roleHome[legacy]) {
      return { ...roleHome[legacy], role: legacy as ReturnTarget["role"] };
    }
  } catch {
    // unreadable session — fall through to the public landing page
  }

  return { path: "/", label: "Back to Home", role: null };
}

const QUICK_LINKS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/faq", label: "FAQ", icon: HelpCircle },
  { path: "/terms", label: "Terms", icon: ScrollText },
  { path: "/privacy", label: "Privacy", icon: ShieldCheck },
];

export default function NotFound() {
  const navigate = useNavigate();
  const target = resolveReturnTarget();
  const requestedPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="nb-scene min-h-screen bg-background text-slate-100 flex items-center justify-center p-6">
      <div className="nb-noise" aria-hidden="true" />

      {/* Center console */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-2xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md p-8 md:p-10 text-center shadow-lg shadow-purple-950/40 overflow-hidden">
          {/* Scanline sheen */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
            aria-hidden="true"
          />

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-950/40 bg-slate-950/80 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            err://404 · route_unresolved
          </div>

          {/* Neon glowing 404 */}
          <div className="relative mb-3 select-none">
            <p
              className="text-6xl md:text-7xl font-black tracking-tight text-purple-300"
              style={{
                textShadow:
                  "0 0 8px rgba(167,139,250,0.75), 0 0 24px rgba(124,58,237,0.6), 0 0 48px rgba(124,58,237,0.35)",
              }}
            >
              404
            </p>
            {/* Glitch echo */}
            <p
              aria-hidden="true"
              className="absolute inset-0 text-6xl md:text-7xl font-black tracking-tight text-indigo-500/25 blur-[1px] translate-x-[2px] translate-y-[1px]"
            >
              404
            </p>
          </div>

          {/* Grid divider */}
          <div
            className="mx-auto mb-5 h-px w-40 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"
            aria-hidden="true"
          />

          {/* Headline */}
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-100">
            Signal Lost in the{" "}
            <span
              className="text-amber-400"
              style={{ textShadow: "0 0 12px rgba(251,191,36,0.45)" }}
            >
              Grid
            </span>
          </h1>

          {/* Witty copy */}
          <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-3 max-w-sm mx-auto">
            This placement record doesn't exist — or it graduated without
            telling the placement cell. Either way, there's no drive, candidate,
            or report waiting at this address.
          </p>

          <p className="text-[10px] text-slate-500 font-semibold mt-3">
            The route may have been closed, renamed, or typed one character
            short of glory.
          </p>

          {/* Diagnostic line */}
          {requestedPath && (
            <p className="mt-5 text-[10px] font-mono text-slate-600 truncate border-t border-purple-950/40 pt-3">
              requested: {requestedPath}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <button
              onClick={() => navigate(target.path)}
              className="inline-flex items-center justify-center gap-2 text-xs font-black px-5 py-3 rounded-xl text-white border border-amber-500/40 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 shadow-lg shadow-purple-950/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
            >
              <Home className="h-3.5 w-3.5 text-amber-200" />
              {target.label}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="nb-btn-secondary text-xs font-bold px-5 py-3 inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go Back
            </button>
          </div>

          {/* Role context */}
          {target.role && (
            <p className="mt-4 text-[10px] text-slate-500 font-semibold inline-flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-purple-400" />
              Signed in as {target.role} — routing you to your workspace.
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-100 border border-purple-950/40 bg-slate-900/80 backdrop-blur-md rounded-full px-3 py-1.5 transition-all duration-200 hover:border-purple-500/40 active:scale-[0.98]"
              >
                <Icon className="h-3 w-3 text-amber-400" />
                {link.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
