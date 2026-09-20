import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  FlaskConical,
  GraduationCap,
  BarChart3,
  Building2,
  ChevronRight,
  X,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { mockLoginAs } from "@/lib/mock-auth";
import { seedDemoData } from "@/lib/demo-hydration";
import { track } from "@/services/analytics";

/**
 * 1-Click Demo Sandbox Switcher — a floating pill for project
 * presentations. Each button swaps the auth session (cookie +
 * localStorage) instantly and redirects to that role's dashboard,
 * with a full dataset hydration pass so every dashboard, chart, feed,
 * and thread is populated on arrival.
 */

const DEMO_ROLES = [
  {
    role: "student" as const,
    label: "Student",
    name: "Aditya Verma",
    icon: GraduationCap,
    destination: "/student/dashboard",
    accent: "from-purple-600 to-indigo-600",
  },
  {
    role: "tpo" as const,
    label: "TPO",
    name: "Dr. K. Srinivas Rao",
    icon: BarChart3,
    destination: "/tpo/dashboard",
    accent: "from-amber-500 to-amber-600",
  },
  {
    role: "recruiter" as const,
    label: "Recruiter",
    name: "Google Cloud",
    icon: Building2,
    destination: "/company/dashboard",
    accent: "from-emerald-500 to-teal-600",
  },
];

export function DemoRoleSwitcher() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  // Hydrate the demo dataset once on mount so every view has rich data
  useEffect(() => {
    seedDemoData();
  }, []);

  if (!visible) return null;

  const switchTo = (roleIdx: number) => {
    const demo = DEMO_ROLES[roleIdx];
    // Instant session swap — writes both cookie and localStorage stores
    mockLoginAs(demo.role);
    toast.success(`Switched to ${demo.name}`, {
      description: `Signed in as ${demo.label} — hydrating demo dataset.`,
    });
    // Full hydration pass keyed to the new role
    seedDemoData(demo.role);
    // Conversion event — demo sandbox engagement
    track("Demo_Role_Switched", {
      role: demo.role,
      destination: demo.destination,
    });
    navigate(demo.destination);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60] print:hidden">
      {expanded ? (
        <div className="rounded-2xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 w-72">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-950/40 bg-gradient-to-r from-purple-600/15 to-transparent">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Demo Sandbox
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  seedDemoData(undefined, true);
                  toast.success("Demo data re-hydrated", {
                    description: "All feeds, threads, and offers repopulated.",
                  });
                }}
                title="Re-hydrate demo dataset"
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                onClick={() => setVisible(false)}
                title="Hide switcher"
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-100 transition-colors"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Role buttons */}
          <div className="p-2 space-y-1.5">
            {DEMO_ROLES.map((demo, idx) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  onClick={() => switchTo(idx)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border bg-secondary/40 hover:border-purple-500/40 hover:bg-purple-600/10 transition-all duration-200 active:scale-[0.98] group text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${demo.accent} flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-slate-100 truncate">
                      {demo.name}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      Switch to {demo.label}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-purple-300 transition-colors shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-purple-950/40">
            <p className="text-[8px] text-slate-600 font-semibold">
              Sessions swap instantly — no manual login. Data auto-hydrates per role.
            </p>
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-full border border-purple-950/40 bg-slate-950/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-purple-950/40 hover:border-purple-500/40 transition-all duration-200 active:scale-[0.98]"
        >
          <FlaskConical className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
            Demo Switcher
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}
    </div>
  );
}
