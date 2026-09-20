import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Cookie, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Cookie Consent Banner — bottom-anchored, non-intrusive, dismissed once.
 *
 * Storage: `nb_cookie_consent` in localStorage. When absent, the banner
 * slides in after a short delay; accepting records the decision (with a
 * timestamp) and the banner never shows again for that browser.
 *
 * The portal runs zero tracking/advertising cookies — sessions live in one
 * first-party cookie and analytics are cookie-free — so the only choice
 * offered is essential cookies, with a Privacy Policy link for the full
 * data-handling picture (see src/pages/Privacy.tsx, §4).
 */

const STORAGE_KEY = "nb_cookie_consent";
const SHOW_DELAY_MS = 1200;

interface ConsentRecord {
  accepted: "essential";
  acceptedAt: string;
}

function readConsent(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed?.accepted === "essential" ? parsed : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent()) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const acceptEssential = () => {
    try {
      const record: ConsentRecord = {
        accepted: "essential",
        acceptedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* storage unavailable — dismiss for this session only */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-t-purple-900/50 border-purple-900/50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl shadow-purple-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10"
            >
              <Cookie className="h-4 w-4 text-amber-400" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">
                Cookies on NexusPlacement
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                We only use essential cookies — one first-party session cookie
                keeps you signed in. No advertising or third-party trackers,
                ever.{" "}
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                  Read the Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:shrink-0">
            <button
              type="button"
              onClick={acceptEssential}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-950/40 transition-all duration-200 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] sm:w-auto"
            >
              Accept Essential Cookies
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
