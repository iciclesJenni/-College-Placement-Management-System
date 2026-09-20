import { useMemo, useState } from "react";
import {
  FileBarChart,
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Users,
  Trophy,
  Percent,
  Loader2,
  FileText,
  Download,
} from "lucide-react";import { toast } from "sonner";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import {
  buildReportData,
  exportReportPdf,
  exportReportExcel,
  type ReportSection,
} from "@/services/report-builder";

const SECTION_META: Record<
  ReportSection,
  { label: string; description: string; icon: typeof Users }
> = {
  batch: {
    label: "Batch Summary",
    description: "Passout-year totals: registered, placed, rates, CTC highs/averages/median",
    icon: Users,
  },
  departments: {
    label: "Departmental Rates",
    description: "Branch-wise placement percentage with CTC distribution",
    icon: Percent,
  },
  companies: {
    label: "Company CTC Distribution",
    description: "Offer counts and packages per recruiting company",
    icon: Building2,
  },
};

export default function TPOReports() {
  const data = useMemo(
    () => buildReportData(mockStudents, mockDrives, mockApplications),
    [],
  );
  const [sections, setSections] = useState<Set<ReportSection>>(
    new Set(["batch", "departments", "companies"]),
  );
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [previewTab, setPreviewTab] = useState<"departments" | "companies" | "batch">("departments");

  const toggleSection = (s: ReportSection) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  /**
   * Direct .csv download of the active departmental report table —
   * Department, Registered, Placed, Placement Rate, Highest CTC, Average CTC.
   * Complements the multi-sheet Excel workbook with a plain-CSV path.
   */
  const handleCsvDownload = () => {
    const headers = [
      "Department",
      "Registered",
      "Placed",
      "Placement Rate (%)",
      "Highest CTC (LPA)",
      "Average CTC (LPA)",
    ];
    const rows = data.departments.map((d) => [
      d.department,
      String(d.total),
      String(d.placed),
      String(d.percentage),
      String(d.highestCtc),
      String(d.averageCtc),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Placement_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded", {
      description: `${data.departments.length} departments • departmental placement summary`,
    });
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (sections.size === 0) {
      toast.error("Select at least one report section");
      return;
    }
    // The header "Export Excel / CSV" button doubles as the direct CSV
    // path: with the departments section active it downloads a clean CSV
    // of the departmental table first, then the full workbook.
    if (format === "excel" && sections.has("departments")) {
      handleCsvDownload();
    }
    setExporting(format);
    // Brief latency so the loading state renders — mirrors real doc generation
    await new Promise((r) => window.setTimeout(r, 600));
    const order: ReportSection[] = ["batch", "departments", "companies"];
    const ordered = order.filter((s) => sections.has(s));
    const ok =
      format === "pdf"
        ? exportReportPdf(data, ordered)
        : exportReportExcel(data, ordered);
    setExporting(null);
    if (ok) {
      toast.success(
        format === "pdf"
          ? "Report opened — use Save as PDF to archive"
          : "Excel workbook downloaded",
        {
          description: `${ordered.length} section${ordered.length > 1 ? "s" : ""} • NAAC/NBA format`,
        },
      );
    } else if (format === "pdf") {
      toast.error("Popup blocked — allow popups for this site and retry");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
            <FileBarChart className="w-4 h-4" />
            Institutional Reporting
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
            Placement Report Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Audit-ready summaries formatted for NAAC / NBA accreditation — export as
            formatted PDF or multi-sheet Excel.
          </p>
        </div>

        {/* Quick export actions — header-right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="text-xs font-black px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-800/50 text-purple-200 hover:bg-purple-900/30 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Export PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            className="text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-900/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {exporting === "excel" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export Excel / CSV
          </button>
        </div>
      </div>

      {/* KPI preview strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Registered</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{data.batch.registered}</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Placed</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{data.batch.placed}</p>
        </div>
        <div className="nb-card p-3.5 border-amber-500/30 bg-amber-500/5 nb-sheen">
          <span className="text-[10px] font-bold text-amber-400/80 uppercase flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Highest CTC
          </span>
          <p className="text-xl font-black text-amber-400 mt-0.5">₹{data.batch.highestCtc} LPA</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Average CTC</span>
          <p className="text-xl font-black text-purple-300 mt-0.5">₹{data.batch.averageCtc} LPA</p>
        </div>
      </div>

      {/* Section selector */}
      <div className="nb-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Report Sections
          </h2>
          <span className="nb-tag text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-400">
            {sections.size} of 3 selected
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {(Object.keys(SECTION_META) as ReportSection[]).map((key) => {
            const meta = SECTION_META[key];
            const Icon = meta.icon;
            const active = sections.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleSection(key)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "border-purple-500/40 bg-purple-600/10 shadow-sm shadow-purple-950/30"
                    : "border-border bg-secondary/30 hover:border-purple-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${active ? "text-purple-300" : "text-slate-500"}`} />
                  {active ? (
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-slate-600" />
                  )}
                </div>
                <p className={`text-xs font-black ${active ? "text-slate-100" : "text-slate-400"}`}>
                  {meta.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report preview */}
      <div className="nb-card overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-purple-950/40 flex-wrap">
          <Eye className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
            Report Preview
          </span>
          {/* Preview tabs */}
          <div className="flex items-center gap-1.5 ml-3">
            {(
              [
                ["batch", "Batch"],
                ["departments", "Departments"],
                ["companies", "Companies"],
              ] as ["batch" | "departments" | "companies", string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPreviewTab(key)}
                className={`text-[9px] font-black px-2.5 py-1 rounded-full border transition-all duration-200 active:scale-[0.98] ${
                  previewTab === key
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40"
                    : "border-border bg-secondary text-slate-400 hover:text-slate-100 hover:border-purple-800/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[9px] text-slate-600 ml-auto font-mono">
            Generated {new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div className="overflow-x-auto">
          {previewTab === "batch" ? (
            sections.has("batch") ? (
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ["Graduation Year", String(data.batch.graduationYear), false],
                    ["Registered", String(data.batch.registered), false],
                    ["Placed", String(data.batch.placed), false],
                    ["Placement Rate", `${data.batch.percentage}%`, true],
                    ["Highest CTC", `₹${data.batch.highestCtc} LPA`, true],
                    ["Average / Median", `₹${data.batch.averageCtc} / ₹${data.batch.medianCtc} LPA`, false],
                  ].map(([label, value, gold]) => (
                    <div
                      key={label as string}
                      className={`p-3.5 rounded-xl border ${gold ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-secondary/30"}`}
                    >
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className={`text-lg font-black mt-1 ${gold ? "text-amber-400" : "text-slate-100"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyPreview label="Enable the Batch Summary section to preview" />
            )
          ) : previewTab === "companies" ? (
            sections.has("companies") ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary/40 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-purple-950/40">
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">CTC</th>
                    <th className="py-3 px-4">Offers</th>
                    <th className="py-3 px-5">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/20 text-xs">
                  {data.companies.map((c) => (
                    <tr key={c.companyName} className="hover:bg-secondary/30 transition-colors duration-200">
                      <td className="py-3 px-5 font-black text-slate-100">{c.companyName}</td>
                      <td className="py-3 px-4 text-slate-400">{c.roleTitle}</td>
                      <td className="py-3 px-4 font-black text-amber-400">₹{c.ctc} LPA</td>
                      <td className="py-3 px-4 text-slate-300">{c.offers}</td>
                      <td className="py-3 px-5 text-slate-300">{c.studentsPlaced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyPreview label="Enable the Company CTC Distribution section to preview" />
            )
          ) : sections.has("departments") ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/40 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-purple-950/40">
                  <th className="py-3 px-5">Department</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Placed</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Highest</th>
                  <th className="py-3 px-5">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/20 text-xs">
                {data.departments.map((d) => (
                  <tr key={d.department} className="hover:bg-secondary/30 transition-colors duration-200">
                    <td className="py-3 px-5 font-black text-slate-100">{d.department}</td>
                    <td className="py-3 px-4 text-slate-300">{d.total}</td>
                    <td className="py-3 px-4 text-slate-300">{d.placed}</td>
                    <td className="py-3 px-4 font-black text-amber-400">{d.percentage}%</td>
                    <td className="py-3 px-4 text-purple-300 font-bold">₹{d.highestCtc}L</td>
                    <td className="py-3 px-5 text-slate-400">₹{d.averageCtc}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyPreview label="Enable the Departmental Rates section to preview" />
          )}
        </div>
      </div>

      {/* Export actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting !== null}
          className="nb-btn-primary flex-1 text-sm font-black px-6 py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {exporting === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 text-amber-400" />
          )}
          {exporting === "pdf" ? "Generating PDF…" : "Export Formatted PDF"}
        </button>
        <button
          onClick={() => handleExport("excel")}
          disabled={exporting !== null}
          className="nb-btn-secondary flex-1 text-sm font-black px-6 py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {exporting === "excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          )}
          {exporting === "excel" ? "Building Workbook…" : "Export Excel Workbook"}
        </button>
      </div>

      <p className="text-[10px] text-slate-600 font-semibold mt-4 text-center">
        PDF renders with the institutional letterhead and verification footer — use your
        browser's "Save as PDF" to archive. Excel exports open natively in Excel,
        LibreOffice, and Google Sheets.
      </p>
    </div>
  );
}

/** Empty-state hint when a preview tab's section is not selected. */
function EmptyPreview({ label }: { label: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <EyeOff className="h-6 w-6 text-slate-700 mx-auto mb-2" />
      <p className="text-xs text-slate-500 font-semibold">{label}</p>
    </div>
  );
}
