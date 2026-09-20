import { useState, useMemo } from "react";
import { ApplicationCard } from "@/components/dashboard/ApplicationCard";
import { mockStudents, mockApplications } from "@/lib/mock-data";
import { FileText, Filter, Search } from "lucide-react";
import type { ApplicationStatus } from "@/types";

// ─── Filter tabs — pipeline status taxonomy ───
type FilterKey = "all" | "in_progress" | "offered" | "rejected";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Applications" },
  { key: "in_progress", label: "In Progress" },
  { key: "offered", label: "Offered" },
  { key: "rejected", label: "Rejected" },
];

// Which statuses belong to each filter
const FILTER_MAP: Record<FilterKey, ApplicationStatus[]> = {
  all: [
    "applied",
    "shortlisted",
    "online_assessment",
    "technical_interview",
    "hr_interview",
    "offered",
    "rejected",
  ],
  in_progress: [
    "applied",
    "shortlisted",
    "online_assessment",
    "technical_interview",
    "hr_interview",
  ],
  offered: ["offered"],
  rejected: ["rejected"],
};

export default function StudentApplications() {
  const currentStudent = mockStudents[0];
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const studentApplications = useMemo(
    () =>
      mockApplications.filter((app) => app.studentId === currentStudent.id),
    [currentStudent.id],
  );

  const filtered = useMemo(() => {
    const allowed = FILTER_MAP[activeFilter];
    const q = searchQuery.toLowerCase();
    return studentApplications.filter(
      (app) =>
        allowed.includes(app.status as ApplicationStatus) &&
        (q === "" || app.companyName.toLowerCase().includes(q)),
    );
  }, [studentApplications, activeFilter, searchQuery]);

  // Counts for each tab
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, in_progress: 0, offered: 0, rejected: 0 };
    for (const app of studentApplications) {
      c.all += 1;
      const s = app.status as ApplicationStatus;
      if (FILTER_MAP.in_progress.includes(s)) c.in_progress += 1;
      if (FILTER_MAP.offered.includes(s)) c.offered += 1;
      if (FILTER_MAP.rejected.includes(s)) c.rejected += 1;
    }
    return c;
  }, [studentApplications]);

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight mb-1">
          My Applications
        </h1>
        <p className="text-sm text-muted-foreground">
          Track the status of all your placement applications
        </p>
      </div>

      {/* ═══════════════════════════════════
          Filter Tabs
          ═══════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`nb-tag cursor-pointer transition-all shrink-0 gap-1.5 ${
              activeFilter === tab.key
                ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 ${
                activeFilter === tab.key
                  ? "bg-primary/20 text-primary"
                  : "bg-border/50 text-muted-foreground"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}

        {/* Company search */}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nb-input w-full pl-8 pr-3 py-2 text-xs font-semibold"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════
          Application List
          ═══════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold">
            {searchQuery
              ? `No applications match "${searchQuery}"`
              : activeFilter === "all"
                ? "No applications yet"
                : `No ${FILTER_TABS.find((t) => t.key === activeFilter)?.label.toLowerCase()} applications`
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "Try a different company name or clear the search"
              : activeFilter === "all"
                ? "Browse the job board and apply to drives you qualify for"
                : "Applications will appear here once they reach this stage"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
