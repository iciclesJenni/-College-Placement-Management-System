import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { mockDrives, mockApplications, mockStudents } from "@/lib/mock-data";
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  XCircle,
  Zap,
  Archive,
  Github,
  Linkedin,
  Mail,
  Phone,
  X,
  CheckSquare,
  Square,
  Package,
  XOctagon,
  Send,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { dispatchBulkStageChange } from "@/services/notifications";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { ApplicationStatus } from "@/types";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  applied: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Applied" },
  shortlisted: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Shortlisted" },
  online_assessment: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "Assessment" },
  technical_interview: { color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Technical" },
  hr_interview: { color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", label: "HR Interview" },
  offered: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Offered" },
  rejected: { color: "bg-rose-500/15 text-rose-400 border-rose-500/30", label: "Rejected" },
};

const STAGE_OPTIONS: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "online_assessment",
  "technical_interview",
  "hr_interview",
  "offered",
  "rejected",
];

// ─── Resume Preview Drawer ───────────────────────────────────────────────────

function ResumeDrawer({
  app,
  onClose,
}: {
  app: NonNullable<typeof mockApplications[0]>;
  onClose: () => void;
}) {
  const student = mockStudents.find((s) => s.id === app.studentId);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md bg-background border-l-2 border-border h-full overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 bg-background border-b-2 border-border p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                  Candidate Profile
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">{student.name}</h3>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">
                {student.rollNumber} • {student.department}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close applicant details panel"
              className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="nb-tag text-[10px] bg-primary/10 text-primary border-primary/30">
              CGPA {student.cgpa.toFixed(2)}
            </span>
            <span
              className={`nb-tag text-[10px] ${
                student.activeBacklogs > 0
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {student.activeBacklogs} Active Backlog{student.activeBacklogs !== 1 ? "s" : ""}
            </span>
            <span className="nb-tag text-[10px] bg-secondary text-muted-foreground border-border">
              Class of {student.graduationYear}
            </span>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-6">
          {/* Resume Preview */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Resume
            </h4>
            {student.resumeUrl ? (
              <div className="border-2 border-border rounded-lg overflow-hidden">
                {/* Simulated PDF preview header */}
                <div className="bg-secondary p-3 flex items-center justify-between border-b-2 border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-[10px] font-bold truncate">
                      {student.name.replace(/\s+/g, "_")}_Resume.pdf
                    </span>
                  </div>
                  <span className="nb-tag text-[8px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex-shrink-0">
                    PDF
                  </span>
                </div>
                {/* Simulated PDF body */}
                <div className="bg-white p-4 h-48 overflow-hidden">
                  <div className="space-y-2">
                    <div className="h-3 w-1/3 bg-slate-800 rounded" />
                    <div className="h-2 w-1/4 bg-slate-400 rounded" />
                    <div className="border-t border-slate-200 my-3" />
                    <div className="h-2 w-full bg-slate-200 rounded" />
                    <div className="h-2 w-5/6 bg-slate-200 rounded" />
                    <div className="h-2 w-4/6 bg-slate-200 rounded" />
                    <div className="mt-4 h-2 w-1/4 bg-slate-400 rounded" />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-100 rounded" />
                      <div className="h-1.5 w-11/12 bg-slate-100 rounded" />
                      <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="mt-4 h-2 w-1/4 bg-slate-400 rounded" />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1.5 w-5/6 bg-slate-100 rounded" />
                      <div className="h-1.5 w-2/3 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 p-3 bg-secondary/50 border-t-2 border-border">
                  <a
                    href={student.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nb-btn-primary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 flex-1 justify-center"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Full PDF
                  </a>
                  <a
                    href={student.resumeUrl}
                    download
                    className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No resume uploaded</p>
              </div>
            )}
          </div>

          {/* Technical Skills */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Technical Skills
            </h4>
            {student.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.skills.map((skill) => (
                  <span
                    key={skill}
                    className="nb-tag text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-semibold italic">No skills listed</p>
            )}
          </div>

          {/* Contact & Profiles */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Contact & Links
            </h4>
            <div className="space-y-2">
              <a
                href={`mailto:${student.email}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors group"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold truncate">{student.email}</span>
              </a>
              {student.phone && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">{student.phone}</span>
                </div>
              )}
              {student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors group"
                >
                  <Github className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold truncate flex-1">GitHub Profile</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors group"
                >
                  <Linkedin className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold truncate flex-1">LinkedIn Profile</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
              {student.resumeUrl && (
                <a
                  href={student.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors group"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold truncate flex-1">Resume PDF</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          {/* Application Context */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Application
            </h4>
            <div className="border-2 border-border rounded-lg p-3.5 space-y-2.5 bg-secondary/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">Drive</span>
                <span className="font-black">{app.companyName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">Role</span>
                <span className="font-black text-right">{app.roleTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">Stage</span>
                <span className={`nb-badge ${STATUS_CONFIG[app.status]?.color} text-[9px]`}>
                  {STATUS_CONFIG[app.status]?.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">Current Round</span>
                <span className="font-bold text-[10px] text-right">{app.currentRound}</span>
              </div>
              {app.notes && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Notes</span>
                  <p className="text-xs font-semibold mt-1">{app.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TPOApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const drive = mockDrives.find((d) => d.id === id);

  const [applications, setApplications] = useState(
    mockApplications.filter((a) => a.driveId === id)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewApp, setPreviewApp] = useState<(typeof mockApplications)[0] | null>(null);

  // Enrich applications with student data
  const enriched = useMemo(() => {
    return applications.map((app) => {
      const student = mockStudents.find((s) => s.id === app.studentId);
      return { ...app, student };
    });
  }, [applications]);

  // Live filtered applicants
  const filtered = useMemo(() => {
    return enriched.filter((app) => {
      if (!app.student) return false;
      const matchesSearch =
        app.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "ALL" || app.student.department === selectedDept;
      const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [enriched, searchQuery, selectedDept, selectedStatus]);

  // Selected rows that are currently visible (respecting filters)
  const selectedVisible = useMemo(
    () => filtered.filter((a) => selectedIds.has(a.id)),
    [filtered, selectedIds]
  );

  const allVisibleSelected = filtered.length > 0 && selectedVisible.length === filtered.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;

  // ─── Selection handlers ──────────────────────────────────────────────────
  const toggleSelect = useCallback((appId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        // Deselect all visible
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      }
      // Select all visible
      const next = new Set(prev);
      filtered.forEach((a) => next.add(a.id));
      return next;
    });
  }, [allVisibleSelected, filtered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ─── KPI counts ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = applications.length;
    const shortlistedOrTest = applications.filter((a) =>
      ["shortlisted", "online_assessment"].includes(a.status)
    ).length;
    const inInterviews = applications.filter((a) =>
      ["technical_interview", "hr_interview"].includes(a.status)
    ).length;
    const offers = applications.filter((a) => a.status === "offered").length;
    return { total, shortlistedOrTest, inInterviews, offers };
  }, [applications]);

  // ─── Inline stage update with toast ──────────────────────────────────────
  const updateStatus = useCallback(
    (ids: string[], newStatus: ApplicationStatus) => {
      const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      setApplications((prev) =>
        prev.map((a) =>
          ids.includes(a.id)
            ? {
                ...a,
                status: newStatus,
                currentRound: STATUS_CONFIG[newStatus]?.label ?? newStatus,
                updatedAt: today,
              }
            : a
        )
      );
      const targets = enriched.filter((a) => ids.includes(a.id));
      const names = targets.map((a) => a.student?.name ?? "candidate");
      const label = STATUS_CONFIG[newStatus]?.label ?? newStatus;
      if (ids.length === 1) {
        toast.success(`Updated ${names[0]} → ${label}`);
      } else {
        toast.success(`Bulk update: ${ids.length} candidates → ${label}`, {
          description: names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3} more` : ""),
        });
      }
      // ── Automated notification dispatch to each affected student ──
      dispatchBulkStageChange(
        targets.map((a) => ({
          studentId: a.studentId,
          studentName: a.student?.name ?? "Candidate",
          studentEmail: a.student?.email ?? "student@college.edu.in",
          companyName: a.companyName,
          roleTitle: a.roleTitle,
          newStatus,
          applicationId: a.id,
        })),
      );
    },
    [enriched]
  );

  const handleStageUpdate = useCallback(
    (appId: string, newStatus: ApplicationStatus) => updateStatus([appId], newStatus),
    [updateStatus]
  );

  // ─── Quick 1-click evaluation chips ──────────────────────────────────────
  const quickAction = useCallback(
    (appId: string, action: "shortlist" | "assessment" | "reject") => {
      const map: Record<string, ApplicationStatus> = {
        shortlist: "shortlisted",
        assessment: "online_assessment",
        reject: "rejected",
      };
      const labels: Record<string, string> = {
        shortlist: "Shortlisted for Tech Round",
        assessment: "Sent Online Assessment",
        reject: "Rejected",
      };
      updateStatus([appId], map[action]);
      // Use separate toasts for quick actions to differentiate from dropdown
      const target = enriched.find((a) => a.id === appId);
      const icon =
        action === "reject" ? (
          <XCircle className="h-4 w-4 text-rose-400" />
        ) : action === "assessment" ? (
          <Send className="h-4 w-4 text-amber-400" />
        ) : (
          <Star className="h-4 w-4 text-yellow-400" />
        );
      toast.success(`${target?.student?.name ?? "Candidate"} — ${labels[action]}`, { icon });
    },
    [updateStatus, enriched]
  );

  // ─── Bulk actions ────────────────────────────────────────────────────────
  const bulkAction = useCallback(
    (action: "shortlist" | "reject") => {
      const ids = selectedVisible.map((a) => a.id);
      if (ids.length === 0) {
        toast.error("No candidates selected");
        return;
      }
      updateStatus(ids, action === "shortlist" ? "shortlisted" : "rejected");
      clearSelection();
    },
    [selectedVisible, updateStatus, clearSelection]
  );

  // ─── Client-side ZIP bundle mock ────────────────────────────────────────
  const downloadResumeZip = useCallback(() => {
    const ids = selectedVisible.map((a) => a.id);
    if (ids.length === 0) {
      toast.error("No candidates selected", {
        description: "Select at least one candidate to bundle resumes.",
      });
      return;
    }

    // Mock ZIP generation: build a manifest of the selected resumes
    const manifest = selectedVisible
      .filter((a) => a.student?.resumeUrl)
      .map((a) => ({
        filename: `${a.student?.rollNumber}_${a.student?.name.replace(/\s+/g, "_")}.pdf`,
        url: a.student?.resumeUrl,
      }));

    if (manifest.length === 0) {
      toast.error("No resumes available", {
        description: "Selected candidates have not uploaded resumes.",
      });
      return;
    }

    // Create a manifest file (the "ZIP" mock) and trigger browser download
    const csvContent = [
      "Filename,Resume URL",
      ...manifest.map((m) => `"${m.filename}","${m.url}"`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(drive?.companyName ?? "drive").replace(/\s+/g, "_")}_Resumes_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Bundled ${manifest.length} resumes`, {
      description: `${(drive?.companyName ?? "Drive").replace(/\s+/g, "_")}_Resumes manifest downloaded. Resume URLs bundled for batch retrieval.`,
      icon: <Package className="h-4 w-4 text-primary" />,
    });
  }, [selectedVisible, drive]);

  // ─── CSV export for all filtered candidates (HR-ready format) ────────────
  const exportCSV = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("No applicants match the current filters");
      return;
    }
    const headers = [
      "Roll Number",
      "Name",
      "Department",
      "CGPA",
      "Active Backlogs",
      "Email",
      "Status",
      "Resume Link",
    ];
    const rows = filtered.map((a) => [
      a.student?.rollNumber ?? "",
      `"${a.student?.name ?? ""}"`,
      a.student?.department ?? "",
      a.student?.cgpa?.toString() ?? "",
      a.student?.activeBacklogs?.toString() ?? "0",
      a.student?.email ?? "",
      STATUS_CONFIG[a.status]?.label ?? a.status,
      a.student?.resumeUrl ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(drive?.companyName ?? "drive").replace(/\s+/g, "_")}_Applicants_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} candidates to CSV`);
  }, [filtered, drive]);

  if (!drive) {
    return (
      <div className="p-6 md:p-10 text-center">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold">Drive not found</p>
        <button className="nb-btn-primary mt-4" onClick={() => navigate("/tpo/drives")}>
          Back to Drives
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      {/* Resume Preview Drawer */}
      {previewApp && (
        <ResumeDrawer app={previewApp} onClose={() => setPreviewApp(null)} />
      )}

      <button
        className="nb-btn-secondary mb-6 inline-flex items-center gap-2"
        onClick={() => navigate("/tpo/drives")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Drives
      </button>

      {/* Header & Quick Stats */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              Drive Applicant Review
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {drive.companyName} — {drive.roleTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-bold">
              Package: <span className="text-foreground">{drive.ctc}</span> • Min CGPA:{" "}
              <span className="text-foreground">{drive.minCgpa}</span> • Allowed:{" "}
              <span className="text-foreground">{drive.allowedBranches.join(", ")}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="nb-btn-secondary inline-flex items-center gap-2 text-xs" onClick={downloadResumeZip}>
              <Package className="w-4 h-4" />
              Bundle Resumes ({selectedVisible.length})
            </button>
            <button className="nb-btn-secondary inline-flex items-center gap-2 text-xs" onClick={exportCSV}>
              <Download className="w-4 h-4" />
              Export to CSV ({filtered.length})
            </button>
          </div>
        </div>

        {/* KPI Count Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="nb-card p-3.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Applied</span>
            <p className="text-xl font-black mt-0.5">{kpis.total}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Shortlisted / Tests</span>
            <p className="text-xl font-black text-yellow-400 mt-0.5">{kpis.shortlistedOrTest}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">In Interviews</span>
            <p className="text-xl font-black text-purple-400 mt-0.5">{kpis.inInterviews}</p>
          </div>
          <div className="nb-card p-3.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Offers Released</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{kpis.offers}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="nb-card p-4 mb-0 rounded-b-none">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search candidate, roll no, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 nb-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
              <Filter className="w-3.5 h-3.5" />
              <span>Branch:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="nb-input bg-background text-xs px-2 py-1.5"
              >
                <option value="ALL">All</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
              <span>Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="nb-input bg-background text-xs px-2 py-1.5"
              >
                <option value="ALL">All Stages</option>
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (appears when selection active) */}
      {selectedVisible.length > 0 && (
        <div className="mx-2 mb-0 px-4 py-3 bg-primary/10 border-x-2 border-primary/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-black">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span>
              {selectedVisible.length} candidate{selectedVisible.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => bulkAction("shortlist")}
              className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/25"
            >
              <Star className="h-3 w-3" />
              Bulk Shortlist
            </button>
            <button
              onClick={() => bulkAction("reject")}
              className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25"
            >
              <XOctagon className="h-3 w-3" />
              Bulk Reject
            </button>
            <button
              onClick={downloadResumeZip}
              className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5 bg-primary/15 text-primary border-primary/40 hover:bg-primary/25"
            >
              <Archive className="h-3 w-3" />
              Download Resumes
            </button>
            <button
              onClick={clearSelection}
              className="text-[10px] font-bold px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Applicant Table */}
      <div className="nb-card overflow-hidden rounded-t-none border-t-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-secondary">
                <th className="w-10 py-3.5 px-3">
                  <button
                    onClick={toggleSelectAll}
                    className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                    aria-label="Select all visible candidates"
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : someVisibleSelected ? (
                      <div className="w-3.5 h-3.5 bg-primary/40 border-2 border-primary rounded-sm" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider">Student Details</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider hidden md:table-cell">Branch</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider">CGPA</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider hidden lg:table-cell">Backlogs</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider">Resume</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider">Current Stage</th>
                <th className="text-left py-3.5 px-4 font-black text-[11px] uppercase tracking-wider hidden xl:table-cell">Quick Actions</th>
                <th className="text-right py-3.5 px-4 font-black text-[11px] uppercase tracking-wider">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filtered.length > 0 ? (
                filtered.map((app) => {
                  const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                  const isSelected = selectedIds.has(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-secondary/50"
                      }`}
                      onClick={() => setPreviewApp(app)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(app.id)}
                          className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                          aria-label={`Select ${app.student?.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>

                      {/* Student Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-foreground">{app.student?.name ?? "Unknown"}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-muted-foreground font-bold">
                          {app.student?.rollNumber} • {app.student?.email}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="nb-tag bg-secondary text-[10px]">{app.student?.department}</span>
                      </td>

                      {/* CGPA */}
                      <td className="py-3.5 px-4 font-black">{app.student?.cgpa?.toFixed(2)}</td>

                      {/* Backlogs */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        {(app.student?.activeBacklogs ?? 0) === 0 ? (
                          <span className="text-emerald-400 font-bold">0</span>
                        ) : (
                          <span className="text-rose-400 font-bold">{app.student?.activeBacklogs} Active</span>
                        )}
                      </td>

                      {/* Resume — opens drawer */}
                      <td className="py-3.5 px-4">
                        {app.student?.resumeUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewApp(app);
                            }}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Preview
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>

                      {/* Current Stage Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`nb-badge ${statusCfg.color} text-[10px]`}>
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Quick 1-Click Chips */}
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAction(app.id, "shortlist");
                            }}
                            disabled={app.status === "shortlisted"}
                            title="Shortlist for Tech Round"
                            className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAction(app.id, "assessment");
                            }}
                            disabled={app.status === "online_assessment"}
                            title="Send Online Assessment"
                            className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAction(app.id, "reject");
                            }}
                            disabled={app.status === "rejected"}
                            title="Reject Candidate"
                            className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Action Selector */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-block relative">
                          <select
                            value={app.status}
                            onChange={(e) => handleStageUpdate(app.id, e.target.value as ApplicationStatus)}
                            aria-label={`Update stage for ${app.student?.name}`}
                            className="nb-input bg-background text-[10px] font-bold px-2 py-1.5 pr-7 appearance-none cursor-pointer"
                          >
                            {STAGE_OPTIONS.map((stage) => (
                              <option key={stage} value={stage}>
                                → {STATUS_CONFIG[stage]?.label ?? stage}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon="users"
                      title="No applicants found"
                      description="No candidates match the applied search and filters. Adjust the branch, stage, or search query to widen the results."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-3 text-[10px] text-muted-foreground font-bold">
        Click any row to open the candidate resume drawer • Use checkboxes for bulk actions
      </p>
    </div>
  );
}
