import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { DashboardLayout } from "@/components/navigation/DashboardLayout";
import {
  RoleSwitchDashboard,
  RequireRole,
} from "@/components/RoleDashboard";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { RouteMiddleware } from "@/middleware";
import { OfflineBanner } from "@/components/FallbackStates";
import { DemoRoleSwitcher } from "@/components/dev/DemoRoleSwitcher";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { CookieConsent } from "@/components/common/CookieConsent";
import { SeoManager } from "@/components/SeoManager";

/**
 * Cookie middleware gate — the src/middleware.ts component mounted at the
 * router root. Enforces strict cookie-based role checking for /student/*,
 * /tpo/* and /company/* paths with seamless redirects for unauthorized
 * access attempts back to the login sandbox.
 */
function CookieGate({ children }: { children: React.ReactNode }) {
  return <RouteMiddleware>{children}</RouteMiddleware>;
}
import {
  DriveDetailSkeleton,
  ApplicantsSkeleton,
  DrivesSkeleton,
} from "@/components/RouteSkeletons";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/Privacy.tsx"));
const TermsOfService = lazy(() => import("./pages/Terms.tsx"));
const FaqPage = lazy(() => import("./pages/Faq.tsx"));

// Student pages
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentDrives = lazy(() => import("./pages/student/Drives"));
const DriveDetail = lazy(() => import("./pages/student/DriveDetail"));
const StudentApplications = lazy(() => import("./pages/student/Applications"));
const StudentProfile = lazy(() => import("./pages/student/Profile"));
const StudentVault = lazy(() => import("./pages/student/Vault"));
const NotificationCenter = lazy(() => import("./pages/student/NotificationCenter"));
const StudentAnnouncements = lazy(() => import("./pages/student/Announcements"));
const TPOBroadcasts = lazy(() => import("./pages/tpo/Broadcasts"));
const Messages = lazy(() => import("./pages/Messages"));

// TPO pages
const TPODashboard = lazy(() => import("./pages/tpo/Dashboard"));
const TPODrives = lazy(() => import("./pages/tpo/Drives"));
const CreateDrive = lazy(() => import("./pages/tpo/CreateDrive"));
const TPOApplicants = lazy(() => import("./pages/tpo/Applicants"));
const TPOStudents = lazy(() => import("./pages/tpo/Students"));
const TPOScheduler = lazy(() => import("./pages/tpo/Scheduler"));
const TPOReports = lazy(() => import("./pages/tpo/Reports"));
const TPOAudit = lazy(() => import("./pages/tpo/Audit"));

// Company pages (reuse student dashboard for now)
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const RecruiterSmartMatches = lazy(() => import("./pages/recruiter/SmartMatches"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground font-bold text-sm">
        Loading...
      </div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto border-2 border-border p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string
);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*"
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          {/* Analytics — production-only; must sit inside the router to
              consume useLocation() for SPA page views. */}
          <AnalyticsProvider />
          {/* Hierarchy-driven SEO metadata — applies the root title template
              and per-route descriptions on every navigation. */}
          <SeoManager />
          <Suspense fallback={<RouteLoading />}>
            <CookieGate>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />              <Route
                path="/auth"
                element={
                  <AuthPage redirectAfterAuth="/dashboard" />
                }
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/faq" element={<FaqPage />} />

              {/* Student routes — role-guarded so only students can render them */}
              <Route
                path="/student/dashboard"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <StudentDashboard />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/drives"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <Suspense fallback={<DrivesSkeleton />}>
                          <StudentDrives />
                        </Suspense>
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/drives/:id"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <RouteErrorBoundary section="drive details">
                        <DashboardLayout>
                          <Suspense fallback={<DriveDetailSkeleton />}>
                            <DriveDetail />
                          </Suspense>
                        </DashboardLayout>
                      </RouteErrorBoundary>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/applications"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <StudentApplications />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/notifications"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <NotificationCenter />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/announcements"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <StudentAnnouncements />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <StudentProfile />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/vault"
                element={
                  <RequireAuth>
                    <RequireRole role="student">
                      <DashboardLayout>
                        <StudentVault />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />

              {/* TPO routes — role-guarded so only TPOs can render them */}
              <Route
                path="/tpo/dashboard"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPODashboard />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/drives"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPODrives />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/drives/create"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <CreateDrive />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/drives/:id/applicants"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <RouteErrorBoundary section="applicant tracking">
                        <DashboardLayout>
                          <Suspense fallback={<ApplicantsSkeleton />}>
                            <TPOApplicants />
                          </Suspense>
                        </DashboardLayout>
                      </RouteErrorBoundary>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/drives/:id/schedule"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPOScheduler />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/broadcasts"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPOBroadcasts />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/reports"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPOReports />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/audit"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPOAudit />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/students"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPOStudents />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/tpo/applications"
                element={
                  <RequireAuth>
                    <RequireRole role="tpo">
                      <DashboardLayout>
                        <TPODashboard />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />

              {/* Company routes — role-guarded */}
              <Route
                path="/company/dashboard"
                element={
                  <RequireAuth>
                    <RequireRole role="recruiter">
                      <DashboardLayout>
                        <CompanyDashboard />
                      </DashboardLayout>
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route
                path="/company/drives/:id/matches"
                element={
                  <RequireAuth>
                    <RequireRole role="recruiter">
                      <RouteErrorBoundary section="AI candidate matching">
                        <DashboardLayout>
                          <Suspense fallback={<ApplicantsSkeleton />}>
                            <RecruiterSmartMatches />
                          </Suspense>
                        </DashboardLayout>
                      </RouteErrorBoundary>
                    </RequireRole>
                  </RequireAuth>
                }
              />

              {/* Legacy /dashboard — renders the correct dashboard component
                  INLINE based on the active user's role (student vs TPO vs
                  recruiter), rather than hardcoding the student view. */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardLayout>
                      <RoleSwitchDashboard
                        student={<StudentDashboard />}
                        tpo={<TPODashboard />}
                        recruiter={<CompanyDashboard />}
                      />
                    </DashboardLayout>
                  </RequireAuth>
                }
              />

              <Route
                path="/messages"
                element={
                  <RequireAuth>
                    <DashboardLayout>
                      <Messages />
                    </DashboardLayout>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </CookieGate>
          </Suspense>
          <Toaster />
          <OfflineBanner />
          {/* One-time cookie consent — persisted in localStorage. */}
          <CookieConsent />
          {/* Must live INSIDE <BrowserRouter>: it calls useNavigate() to
              redirect after swapping the demo session. */}
          <DemoRoleSwitcher />
        </BrowserRouter>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>
);
