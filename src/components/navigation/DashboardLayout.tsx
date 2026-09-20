import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard shell — mounts the ambient scene layers (vignette + noise
 * film) once around the sidebar and content so every dashboard view
 * inherits the cinematic depth without per-page markup.
 *
 * Responsive behavior:
 *  - ≥1024px (lg): sidebar is a permanent sticky rail with collapse toggle.
 *  - <1024px (max-lg): sidebar becomes an off-canvas slide-over drawer,
 *    toggled by the floating hamburger and dismissed via backdrop or the
 *    drawer's own close button. Metric grids, cards, and tables inside
 *    `children` keep their own `gap-4`/`p-4` spacing with `min-w-0` on the
 *    content column preventing horizontal overflow.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="nb-scene flex min-h-screen bg-background">
      {/* Ambient noise film — above glows, below content */}
      <div className="nb-noise" aria-hidden="true" />

      {/* Backdrop overlay — drawer mode only, click to dismiss */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0 relative">
        {/* Top control strip — hamburger (mobile only) + notification bell */}
        <div className="fixed top-4 right-6 z-30 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-9 w-9 p-0 rounded-xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-slate-100 hover:border-purple-500/40 transition-all duration-200 active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
