import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

const StudentDashboard = lazy(() => import("./StudentDashboard"));
const TPODashboard = lazy(() => import("./TPODashboard"));
const CompanyDashboard = lazy(() => import("./CompanyDashboard"));

function DashboardLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <DashboardLoader />;

  const role = user?.role;

  if (role === "tpo") {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <TPODashboard />
      </Suspense>
    );
  }

  if (role === "recruiter") {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <CompanyDashboard />
      </Suspense>
    );
  }

  // Default: Student view (also for null/unset roles)
  return (
    <Suspense fallback={<DashboardLoader />}>
      <StudentDashboard />
    </Suspense>
  );
}
