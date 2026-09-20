import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import { checkEligibility, daysUntilDeadline } from "@/lib/eligibility";
import {
  ArrowLeft,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

export default function DriveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentStudent = mockStudents[0];

  const drive = mockDrives.find((d) => d.id === id);

  if (!drive) {
    return (
      <div className="p-6 md:p-10 text-center">
        <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold">Drive not found</p>
        <Button
          className="nb-btn-primary mt-4"
          onClick={() => navigate("/student/drives")}
        >
          Back to Drives
        </Button>
      </div>
    );
  }

  const eligibility = checkEligibility(currentStudent, drive);
  const applied = mockApplications.some(
    (app) => app.studentId === currentStudent.id && app.driveId === drive.id
  );
  const daysLeft = daysUntilDeadline(drive.deadlineTimestamp);

  const handleApply = () => {
    toast.success("Application submitted successfully");
    navigate("/student/applications");
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Button
        variant="outline"
        className="nb-btn-secondary mb-6"
        onClick={() => navigate("/student/drives")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drives
      </Button>

      <div className="nb-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black mb-1">{drive.companyName}</h1>
            <p className="text-lg font-bold text-muted-foreground">
              {drive.roleTitle}
            </p>
          </div>
          <div className="text-right">
            <div className="font-black text-3xl text-accent">{drive.ctc}</div>
            <div className="text-xs text-muted-foreground font-bold">CTC</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {drive.description}
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <span className="nb-tag bg-secondary">
            <MapPin className="h-3 w-3 mr-1" />
            {drive.driveDate}
          </span>
          <span className="nb-tag bg-secondary">
            <Clock className="h-3 w-3 mr-1" />
            {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
          </span>
          <span className="nb-tag bg-secondary">
            <FileText className="h-3 w-3 mr-1" />
            {drive.rounds.length} rounds
          </span>
        </div>

        {/* Eligibility Breakdown */}
        <div className="nb-card p-4 mb-6">
          <h3 className="font-black text-sm mb-3">Eligibility Criteria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {currentStudent.cgpa >= drive.minCgpa ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center text-rose-400 text-xs font-black">✕</span>
              )}
              <span className="text-sm font-bold">
                CGPA ≥ {drive.minCgpa}{" "}
                <span className="text-muted-foreground">({currentStudent.cgpa})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentStudent.activeBacklogs <= drive.maxActiveBacklogs ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center text-rose-400 text-xs font-black">✕</span>
              )}
              <span className="text-sm font-bold">
                Backlogs ≤ {drive.maxActiveBacklogs}{" "}
                <span className="text-muted-foreground">({currentStudent.activeBacklogs})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {drive.allowedBranches.includes(currentStudent.department) ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center text-rose-400 text-xs font-black">✕</span>
              )}
              <span className="text-sm font-bold">
                Dept: {drive.allowedBranches.join(", ")}{" "}
                <span className="text-muted-foreground">({currentStudent.department})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Rounds */}
        <div className="mb-6">
          <h3 className="font-black text-sm mb-3">Selection Rounds</h3>
          <div className="flex flex-wrap gap-2">
            {drive.rounds.map((round, i) => (
              <span key={i} className="nb-tag bg-secondary">
                {i + 1}. {round}
              </span>
            ))}
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-6">
          <h3 className="font-black text-sm mb-3">Job Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {drive.jobDescription}
          </p>
        </div>

        {/* Action */}
        <div className="flex gap-3">
          {applied ? (
            <Button
              className="nb-btn-secondary flex-1"
              onClick={() => navigate("/student/applications")}
            >
              View Application Status
            </Button>
          ) : eligibility.eligible ? (
            <Button className="nb-btn-primary flex-1" onClick={handleApply}>
              Apply Now
            </Button>
          ) : (
            <div className="nb-card p-4 flex-1 text-center border-rose-500/30 bg-rose-500/5">
              <p className="font-bold text-sm text-rose-400">
                Not Eligible — {eligibility.reason}
              </p>
            </div>
          )}
          {drive.website && (
            <a
              href={drive.website}
              target="_blank"
              rel="noopener noreferrer"
              className="nb-btn-secondary px-4 flex items-center"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
