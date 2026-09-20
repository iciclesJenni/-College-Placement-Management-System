import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import { mockUpcomingInterviews } from "@/lib/interview-schedule";
import { track } from "@/services/analytics";
import { checkEligibility, daysUntilDeadline } from "@/lib/eligibility";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DriveCard } from "@/components/dashboard/DriveCard";
import { ApplicationCard } from "@/components/dashboard/ApplicationCard";
import { UpcomingInterviewCard } from "@/components/dashboard/UpcomingInterviewCard";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  Award,
  Video,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use first student as the "current user" for mock purposes
  const currentStudent = mockStudents[0];
  const [drives, setDrives] = useState(mockDrives);
  const studentApplications = mockApplications.filter(
    (app) => app.studentId === currentStudent.id
  );
  const upcomingInterviews = mockUpcomingInterviews.filter(
    (iv) => iv.studentId === currentStudent.id
  );

  const handleApply = (driveId: string) => {
    setDrives((prev) =>
      prev.map((d) => (d.id === driveId ? { ...d, applied: true } : d))
    );
    toast.success("Application submitted successfully");
    // Conversion event — 1-Click Apply
    track("Drive_Applied", {
      driveId,
      company: drives.find((d) => d.id === driveId)?.companyName,
    });
  };

  return (
    <div className="p-6 md:p-10">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome back, {user?.name ?? currentStudent.name}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentStudent.rollNumber} • {currentStudent.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            <Award className="w-3.5 h-3.5 mr-1" />
            Eligible for Drives
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Current CGPA"
          value={currentStudent.cgpa}
          subtitle="Scale of 10.0"
          icon={TrendingUp}
          color="text-primary"
        />
        <StatsCard
          label="Active Backlogs"
          value={currentStudent.activeBacklogs}
          subtitle="Clean record"
          icon={AlertCircle}
          color="text-emerald-400"
        />
        <StatsCard
          label="Applications"
          value={studentApplications.length}
          subtitle="Active pipelines"
          icon={Briefcase}
          color="text-accent"
        />
        <StatsCard
          label="Placement Status"
          value={
            currentStudent.placementStatus === "placed"
              ? "Placed"
              : "Not Placed"
          }
          subtitle="Drive-eligible"
          icon={CheckCircle2}
          color="text-yellow-400"
        />
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Upcoming Interviews
            </h2>
            <span className="nb-tag text-[10px] bg-primary/15 text-primary border-primary/30">
              {upcomingInterviews.filter((iv) => iv.status !== "completed").length} active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcomingInterviews.map((interview) => (
              <UpcomingInterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Drives & Application Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Campus Drives (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Active Placement Drives
            </h2>
            <button
              className="text-xs font-bold text-primary hover:underline flex items-center"
              onClick={() => navigate("/student/drives")}
            >
              View all <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {drives.slice(0, 3).map((drive) => {
              const eligibility = checkEligibility(currentStudent, drive);
              const applied = drive.applied === true;

              return (
                <DriveCard
                  key={drive.id}
                  drive={drive}
                  eligibility={eligibility}
                  applied={applied}
                  onApply={handleApply}
                  onViewStatus={() => navigate("/student/applications")}
                />
              );
            })}
          </div>
        </div>

        {/* Pipeline & Application Tracker (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your Applications
          </h2>

          <div className="nb-card p-5 space-y-4">
            {studentApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}

            <div className="pt-2">
              <button
                className="nb-btn-primary w-full py-2.5 text-xs inline-flex items-center justify-center gap-1.5"
                onClick={() => navigate("/student/applications")}
              >
                Track Full Pipeline
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
