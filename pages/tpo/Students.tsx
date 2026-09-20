import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  ChevronDown,
  Users,
  GraduationCap,
  Building2,
  BadgeCheck,
  AlertCircle,
  X,
  FileSpreadsheet,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { mockStudents } from "@/lib/mock-data";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { StudentProfile, PlacementStatus, Department } from "@/types";
import { logAudit } from "@/services/logger";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

const PLACEMENT_OPTIONS: { value: PlacementStatus; label: string; color: string }[] = [
  { value: "not_placed", label: "Not Placed", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "placed", label: "Placed", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { value: "opted_out", label: "Opted Out", color: "bg-amber-50 text-amber-700 border-amber-300" },
];

const VERIFICATION_OPTIONS = [
  { value: "" as const, label: "All Status" },
  { value: "verified" as const, label: "Verified" },
  { value: "unverified" as const, label: "Unverified" },
];

// ─── Placement Status Override Modal ─────────────────────────────────────────

function PlacementOverrideModal({
  student,
  onClose,
  onUpdate,
}: {
  student: StudentProfile;
  onClose: () => void;
  onUpdate: (id: string, status: PlacementStatus) => void;
}) {
  const [selected, setSelected] = useState<PlacementStatus>(student.placementStatus);

  const handleConfirm = () => {
    onUpdate(student.id, selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="nb-card w-full max-w-md p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <ArrowUpDown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Override Placement Status</h3>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                {student.name} — {student.rollNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close student details panel"
            className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Status Options */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Select new placement status
          </p>
          {PLACEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${
                selected === opt.value
                  ? "border-primary bg-primary/5 shadow-[2px_2px_0px_var(--primary)]"
                  : "border-border bg-background hover:border-muted-foreground/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              >
                {selected === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <span className="font-black text-sm">{opt.label}</span>
                <span className={`ml-2 nb-tag text-[9px] ${opt.color} border`}>
                  {opt.value === "not_placed" ? "DEFAULT" : opt.value === "placed" ? "HIRED" : "EXITED"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t-2 border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="nb-btn-secondary text-xs font-bold px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="nb-btn-primary text-xs font-bold px-4 py-2"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TPOStudents() {
  const [students, setStudents] = useState<StudentProfile[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    department: "",
    minCgpa: "",
    maxBacklogs: "",
    verification: "" as "" | "verified" | "unverified",
  });
  const [sortBy, setSortBy] = useState<"name" | "cgpa" | "rollNumber" | "department">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [placementModal, setPlacementModal] = useState<StudentProfile | null>(null);

  // ─── Live Search (name, roll number, email) ──────────────────────────────
  const filtered = useMemo(() => {
    let result = students;

    // Text search across name, roll number, and email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      );
    }

    // Department filter
    if (filter.department) {
      result = result.filter((s) => s.department === filter.department);
    }

    // Min CGPA filter
    if (filter.minCgpa) {
      const min = parseFloat(filter.minCgpa);
      if (!isNaN(min)) result = result.filter((s) => s.cgpa >= min);
    }

    // Max backlogs filter
    if (filter.maxBacklogs) {
      const max = parseInt(filter.maxBacklogs, 10);
      if (!isNaN(max)) result = result.filter((s) => s.activeBacklogs <= max);
    }

    // Verification filter
    if (filter.verification === "verified") result = result.filter((s) => s.isVerified);
    if (filter.verification === "unverified") result = result.filter((s) => !s.isVerified);

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "cgpa") cmp = a.cgpa - b.cgpa;
      else if (sortBy === "rollNumber") cmp = a.rollNumber.localeCompare(b.rollNumber);
      else if (sortBy === "department") cmp = a.department.localeCompare(b.department);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, searchQuery, filter, sortBy, sortDir]);

  // ─── Active filter count ────────────────────────────────────────────────
  const activeFilterCount = [
    filter.department,
    filter.minCgpa,
    filter.maxBacklogs,
    filter.verification,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilter({ department: "", minCgpa: "", maxBacklogs: "", verification: "" });
    setSearchQuery("");
  };

  // ─── Toggle sort column ────────────────────────────────────────────────
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  // ─── Verification Toggle ──────────────────────────────────────────────
  const toggleVerification = useCallback((studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newStatus = !s.isVerified;
        logAudit({
          category: "VERIFICATION",
          action: `${newStatus ? "Verified" : "Revoked verification for"} academic record`,
          targetType: "StudentProfile",
          targetId: s.id,
          targetLabel: `${s.name} (${s.rollNumber})`,
          diff: [{ field: "isVerified", before: String(s.isVerified), after: String(newStatus) }],
        });
        toast.success(`${s.name} marked as ${newStatus ? "verified" : "unverified"}`, {
          description: newStatus
            ? "Academic records confirmed by the institution."
            : "Verification revoked — records pending re-check.",
          icon: newStatus ? <BadgeCheck className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />,
        });
        return { ...s, isVerified: newStatus };
      }),
    );
  }, []);

  // ─── Placement Status Override ────────────────────────────────────────
  const handlePlacementUpdate = useCallback((studentId: string, status: PlacementStatus) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const label = status === "placed" ? "Placed" : status === "opted_out" ? "Opted Out" : "Not Placed";
        logAudit({
          category: "PLACEMENT_OVERRIDE",
          action: `Manual placement status override → ${label}`,
          targetType: "StudentProfile",
          targetId: s.id,
          targetLabel: `${s.name} (${s.rollNumber})`,
          diff: [{ field: "placementStatus", before: s.placementStatus, after: status }],
        });
        toast.success(`${s.name} → ${label}`, {
          description: `Placement status manually updated by TPO.`,
          icon: <ArrowUpDown className="h-4 w-4 text-primary" />,
        });
        return { ...s, placementStatus: status };
      }),
    );
  }, []);

  // ─── Backlog Adjustment (CGPA/backlog override audit) ─────────────────
  const adjustBacklogs = useCallback((studentId: string, delta: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newVal = Math.max(0, s.activeBacklogs + delta);
        logAudit({
          category: "CGPA_OVERRIDE",
          action: `Manual backlog adjustment (${delta > 0 ? "+" : ""}${delta})`,
          targetType: "StudentProfile",
          targetId: s.id,
          targetLabel: `${s.name} (${s.rollNumber})`,
          severity: "critical",
          diff: [{ field: "activeBacklogs", before: String(s.activeBacklogs), after: String(newVal) }],
        });
        return { ...s, activeBacklogs: newVal };
      }),
    );
  }, []);

  // ─── CSV Export (respects all active filters) ─────────────────────────
  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No students match the current filters", {
        description: "Adjust your search or filters and try again.",
      });
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Roll Number",
      "Department",
      "Graduation Year",
      "CGPA",
      "Active Backlogs",
      "Total Backlogs",
      "Skills",
      "Placement Status",
      "Verified",
      "Phone",
      "LinkedIn",
      "GitHub",
      "Resume URL",
    ];

    const rows = filtered.map((s) => [
      `"${s.name}"`,
      s.email,
      s.rollNumber,
      s.department,
      s.graduationYear.toString(),
      s.cgpa.toString(),
      s.activeBacklogs.toString(),
      s.totalBacklogs.toString(),
      `"${s.skills.join("; ")}"`,
      s.placementStatus === "placed"
        ? "Placed"
        : s.placementStatus === "opted_out"
          ? "Opted Out"
          : "Not Placed",
      s.isVerified ? "Yes" : "No",
      s.phone || "",
      s.linkedinUrl || "",
      s.githubUrl || "",
      s.resumeUrl || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    const dept = filter.department || "ALL";
    link.download = `Students_${dept}_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} students`, {
      description: `File: Students_${dept}_${date}.csv`,
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
    });
  };

  // ─── Summary stats ────────────────────────────────────────────────────
  const totalVerified = students.filter((s) => s.isVerified).length;
  const totalPlaced = students.filter((s) => s.placementStatus === "placed").length;
  const avgCgpa = students.length > 0 ? (students.reduce((sum, s) => sum + s.cgpa, 0) / students.length).toFixed(2) : "0.00";

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10">
      {/* Placement Override Modal */}
      {placementModal && (
        <PlacementOverrideModal
          student={placementModal}
          onClose={() => setPlacementModal(null)}
          onUpdate={handlePlacementUpdate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">Student Directory</h1>
          </div>
          <p className="text-sm text-muted-foreground font-semibold">
            {filtered.length} of {students.length} students
            {activeFilterCount > 0 && (
              <span className="nb-tag ml-2 text-[9px] bg-primary/10 text-primary border-primary/30">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="nb-btn-secondary inline-flex items-center gap-2 text-xs font-bold disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="nb-card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
            <p className="text-xl font-black">{students.length}</p>
          </div>
        </div>
        <div className="nb-card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Verified</p>
            <p className="text-xl font-black">{totalVerified}</p>
          </div>
        </div>
        <div className="nb-card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Placed</p>
            <p className="text-xl font-black">{totalPlaced}</p>
          </div>
        </div>
        <div className="nb-card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg CGPA</p>
            <p className="text-xl font-black">{avgCgpa}</p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="nb-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-black text-xs uppercase tracking-wider">Filters</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="nb-tag text-[9px] bg-destructive/10 text-destructive border-destructive/30 cursor-pointer hover:bg-destructive/20 transition-colors"
              >
                <X className="h-2.5 w-2.5 mr-0.5" />
                Clear all
              </button>
            )}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nb-input w-full pl-9 pr-3 py-2 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Department */}
          <select
            value={filter.department}
            onChange={(e) => setFilter({ ...filter, department: e.target.value })}
            className="nb-input bg-background px-3 py-2 text-xs"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Min CGPA */}
          <div className="relative">
            <input
              type="number"
              placeholder="Min CGPA"
              min="0"
              max="10"
              step="0.1"
              value={filter.minCgpa}
              onChange={(e) => setFilter({ ...filter, minCgpa: e.target.value })}
              className="nb-input w-full px-3 py-2 text-xs"
            />
            {filter.minCgpa && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">+</span>
            )}
          </div>

          {/* Max Backlogs */}
          <div className="relative">
            <input
              type="number"
              placeholder="Max Backlogs"
              min="0"
              max="20"
              value={filter.maxBacklogs}
              onChange={(e) => setFilter({ ...filter, maxBacklogs: e.target.value })}
              className="nb-input w-full px-3 py-2 text-xs"
            />
          </div>

          {/* Verification Status */}
          <select
            value={filter.verification}
            onChange={(e) =>
              setFilter({ ...filter, verification: e.target.value as "" | "verified" | "unverified" })
            }
            className="nb-input bg-background px-3 py-2 text-xs"
          >
            {VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="nb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-secondary">
                <th
                  className="text-left p-3 font-black text-[10px] uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="inline-flex items-center gap-1">
                    Student
                    {sortBy === "name" && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th
                  className="text-left p-3 font-black text-[10px] uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none hidden md:table-cell"
                  onClick={() => toggleSort("rollNumber")}
                >
                  <span className="inline-flex items-center gap-1">
                    Roll Number
                    {sortBy === "rollNumber" && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th
                  className="text-left p-3 font-black text-[10px] uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none hidden lg:table-cell"
                  onClick={() => toggleSort("department")}
                >
                  <span className="inline-flex items-center gap-1">
                    Dept
                    {sortBy === "department" && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th
                  className="text-left p-3 font-black text-[10px] uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => toggleSort("cgpa")}
                >
                  <span className="inline-flex items-center gap-1">
                    CGPA
                    {sortBy === "cgpa" && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th className="text-left p-3 font-black text-[10px] uppercase tracking-wider hidden md:table-cell">Backlogs</th>
                <th className="text-left p-3 font-black text-[10px] uppercase tracking-wider hidden lg:table-cell">Placement</th>
                <th className="text-left p-3 font-black text-[10px] uppercase tracking-wider">Verified</th>
                <th className="text-right p-3 font-black text-[10px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group"
                >
                  {/* Student Name + Email */}
                  <td className="p-3">
                    <div className="font-black text-sm leading-tight">{student.name}</div>
                    <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{student.email}</div>
                    {/* Mobile-only: show roll number inline */}
                    <div className="text-[10px] text-muted-foreground font-mono md:hidden mt-0.5">{student.rollNumber}</div>
                  </td>

                  {/* Roll Number (desktop) */}
                  <td className="p-3 hidden md:table-cell">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{student.rollNumber}</span>
                  </td>

                  {/* Department (desktop) */}
                  <td className="p-3 hidden lg:table-cell">
                    <span className="nb-tag text-[10px] bg-secondary">{student.department}</span>
                  </td>

                  {/* CGPA */}
                  <td className="p-3">
                    <span
                      className={`font-black text-sm ${
                        student.cgpa >= 8.5
                          ? "text-emerald-500"
                          : student.cgpa >= 7.0
                            ? "text-primary"
                            : student.cgpa >= 6.0
                              ? "text-amber-500"
                              : "text-destructive"
                      }`}
                    >
                      {student.cgpa.toFixed(2)}
                    </span>
                  </td>

                  {/* Backlogs */}
                  <td className="p-3 hidden md:table-cell">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => adjustBacklogs(student.id, -1)}
                        className="w-5 h-5 border border-border bg-secondary flex items-center justify-center text-[10px] font-black hover:bg-destructive/15 hover:text-destructive transition-colors"
                        title="Decrease backlogs"
                      >
                        −
                      </button>
                      <span
                        className={`font-black w-5 text-center text-xs ${
                          student.activeBacklogs > 0 ? "text-destructive" : "text-emerald-500"
                        }`}
                      >
                        {student.activeBacklogs}
                      </span>
                      <button
                        onClick={() => adjustBacklogs(student.id, 1)}
                        className="w-5 h-5 border border-border bg-secondary flex items-center justify-center text-[10px] font-black hover:bg-primary/15 hover:text-primary transition-colors"
                        title="Increase backlogs"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Placement Status (desktop) */}
                  <td className="p-3 hidden lg:table-cell">
                    <button
                      onClick={() => setPlacementModal(student)}
                      className={`nb-tag cursor-pointer text-[10px] font-bold border transition-all hover:shadow-[2px_2px_0px_var(--foreground)] ${
                        student.placementStatus === "placed"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                          : student.placementStatus === "opted_out"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                            : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                      }`}
                    >
                      <ArrowUpDown className="h-2.5 w-2.5 mr-1 inline" />
                      {student.placementStatus === "placed"
                        ? "Placed"
                        : student.placementStatus === "opted_out"
                          ? "Opted Out"
                          : "Not Placed"}
                    </button>
                  </td>

                  {/* Verification Toggle */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleVerification(student.id)}
                      className={`nb-tag cursor-pointer text-[10px] font-bold border transition-all hover:shadow-[2px_2px_0px_var(--foreground)] ${
                        student.isVerified
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25"
                      }`}
                    >
                      {student.isVerified ? (
                        <ShieldCheck className="h-3 w-3 mr-1 inline" />
                      ) : (
                        <ShieldOff className="h-3 w-3 mr-1 inline" />
                      )}
                      {student.isVerified ? "Verified" : "Unverified"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleVerification(student.id)}
                        className="nb-btn-secondary text-[9px] font-bold px-2 py-1 h-auto"
                        title={student.isVerified ? "Revoke verification" : "Verify student"}
                      >
                        {student.isVerified ? "Revoke" : "Verify"}
                      </button>
                      <button
                        onClick={() => setPlacementModal(student)}
                        className="nb-btn-secondary text-[9px] font-bold px-2 py-1 h-auto hidden lg:inline-flex"
                        title="Override placement status"
                      >
                        Override
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <EmptyState
            icon="users"
            title="No students match the current filters"
            description="Try adjusting your search terms or clearing a filter — the directory updates in real time as you refine criteria."
            actionLabel="Clear All Filters"
            onAction={clearFilters}
          />
        )}
      </div>

      {/* Bottom Summary */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground">
        <span>
          Showing {filtered.length} of {students.length} students
        </span>
        <span>•</span>
        <span>
          {totalVerified} verified
        </span>
        <span>•</span>
        <span>
          {students.length - totalVerified} pending verification
        </span>
        <span>•</span>
        <span>
          {totalPlaced} placed
        </span>
      </div>
    </div>
  );
}
