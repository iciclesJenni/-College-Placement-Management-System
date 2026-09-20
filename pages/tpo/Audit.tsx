import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  FileDown,
  FileJson,
  Filter,
  X,
  Gavel,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadAuditLog,
  filterAuditLog,
  subscribeToAudit,
  exportAuditCsv,
  exportAuditJson,
  type AuditEntry,
  type AuditActionCategory,
  type AuditSeverity,
} from "@/services/logger";

const CATEGORY_META: Record<AuditActionCategory, { chip: string }> = {
  VERIFICATION: { chip: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  PLACEMENT_OVERRIDE: { chip: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  CGPA_OVERRIDE: { chip: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  DRIVE_CREATED: { chip: "text-purple-300 bg-purple-600/10 border-purple-500/30" },
  DRIVE_MODIFIED: { chip: "text-purple-300 bg-purple-600/10 border-purple-500/30" },
  DRIVE_CLOSED: { chip: "text-purple-300 bg-purple-600/10 border-purple-500/30" },
  OFFER_RELEASED: { chip: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  BULK_OFFER_RELEASED: { chip: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  STAGE_CHANGE: { chip: "text-slate-300 bg-secondary border-border" },
  BROADCAST_PUBLISHED: { chip: "text-purple-300 bg-purple-600/10 border-purple-500/30" },
  VAULT_AUDIT: { chip: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  AUTH_EVENT: { chip: "text-slate-300 bg-secondary border-border" },
};

const SEVERITY_META: Record<AuditSeverity, { chip: string; icon: typeof Info; label: string }> = {
  critical: { chip: "text-rose-400 bg-rose-500/10 border-rose-500/30", icon: AlertTriangle, label: "Critical" },
  warning: { chip: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: Gavel, label: "Warning" },
  info: { chip: "text-slate-400 bg-secondary border-border", icon: Info, label: "Info" },
};

const CATEGORIES: (AuditActionCategory | "ALL")[] = [
  "ALL",
  "VERIFICATION",
  "PLACEMENT_OVERRIDE",
  "CGPA_OVERRIDE",
  "DRIVE_CREATED",
  "DRIVE_MODIFIED",
  "OFFER_RELEASED",
  "BULK_OFFER_RELEASED",
  "STAGE_CHANGE",
  "BROADCAST_PUBLISHED",
  "VAULT_AUDIT",
];

type DateRange = "all" | "today" | "7d" | "30d";

const RANGE_META: Record<DateRange, { label: string; ms?: number }> = {
  all: { label: "All Time" },
  today: { label: "Today", ms: 86_400_000 },
  "7d": { label: "Last 7 Days", ms: 7 * 86_400_000 },
  "30d": { label: "Last 30 Days", ms: 30 * 86_400_000 },
};

export default function TPOAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => loadAuditLog());
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<AuditActionCategory | "ALL">("ALL");
  const [severity, setSeverity] = useState<AuditSeverity | "ALL">("ALL");
  const [range, setRange] = useState<DateRange>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAudit(() => setEntries(loadAuditLog()));
    setEntries(loadAuditLog());
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const rangeMs = RANGE_META[range].ms;
    return filterAuditLog({
      searchQuery,
      category,
      severity,
      from: rangeMs ? Date.now() - rangeMs : undefined,
    });
  }, [searchQuery, category, severity, range]);

  const criticalCount = entries.filter((e) => e.severity === "critical").length;
  const todayCount = entries.filter(
    (e) => Date.now() - e.timestamp < 86_400_000,
  ).length;
  const actorCount = new Set(entries.map((e) => e.actor.id)).size;

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("ALL");
    setSeverity("ALL");
    setRange("all");
  };

  const hasFilters =
    searchQuery !== "" || category !== "ALL" || severity !== "ALL" || range !== "all";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          Compliance & Security Monitor
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Immutable ledger of administrative and recruiter actions — CGPA overrides,
          verification toggles, drive modifications, and offer releases.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Events</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{entries.length}</p>
        </div>
        <div className="nb-card p-3.5 border-amber-500/30 bg-amber-500/5 nb-sheen">
          <span className="text-[10px] font-bold text-amber-400/80 uppercase">Today</span>
          <p className="text-xl font-black text-amber-400 mt-0.5">{todayCount}</p>
        </div>
        <div className="nb-card p-3.5 border-rose-500/30 bg-rose-500/5">
          <span className="text-[10px] font-bold text-rose-400/80 uppercase">Critical</span>
          <p className="text-xl font-black text-rose-400 mt-0.5">{criticalCount}</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Actors</span>
          <p className="text-xl font-black text-purple-300 mt-0.5">{actorCount}</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="nb-card p-4 mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, target…"
              className="nb-input w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AuditActionCategory | "ALL")}
              className="nb-input px-2.5 py-2 text-[10px] font-black text-slate-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AuditSeverity | "ALL")}
              className="nb-input px-2.5 py-2 text-[10px] font-black text-slate-200"
            >
              <option value="ALL">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as DateRange)}
              className="nb-input px-2.5 py-2 text-[10px] font-black text-slate-200"
            >
              {(Object.keys(RANGE_META) as DateRange[]).map((r) => (
                <option key={r} value={r}>
                  {RANGE_META[r].label}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-black px-2.5 py-2 rounded-lg border border-border bg-secondary text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98] inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            {filtered.length} of {entries.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAuditCsv(filtered)}
              disabled={filtered.length === 0}
              className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <FileDown className="h-3 w-3" />
              Export CSV
            </button>
            <button
              onClick={() => exportAuditJson(filtered)}
              disabled={filtered.length === 0}
              className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <FileJson className="h-3 w-3" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Ledger */}
      {filtered.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <ShieldCheck className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-300">
            {entries.length === 0 ? "No audit events recorded yet" : "No entries match the filters"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Administrative actions — verification toggles, overrides, drive changes, and
            offer releases — are logged here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const catMeta = CATEGORY_META[e.category];
            const sevMeta = SEVERITY_META[e.severity];
            const SevIcon = sevMeta.icon;
            const expanded = expandedId === e.id;
            return (
              <div key={e.id} className="nb-card nb-card-hover overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : e.id)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  {/* Severity icon */}
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${sevMeta.chip}`}
                  >
                    <SevIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${catMeta.chip}`}>
                        {e.category.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs font-black text-slate-100">{e.action}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      <span className="text-purple-300">{e.actor.name}</span>
                      {" • "}
                      {e.targetLabel}
                      {" • "}
                      <span className="font-mono">{e.ipAddress}</span>
                    </p>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                      {new Date(e.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${sevMeta.chip}`}>
                      {sevMeta.label}
                    </span>
                    {expanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded diff detail */}
                {expanded && (
                  <div className="border-t border-purple-950/40 px-4 py-3.5 bg-slate-950/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid sm:grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <p className="text-slate-500 uppercase font-bold tracking-wider">Actor ID</p>
                        <p className="font-mono text-slate-300 mt-0.5">{e.actor.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold tracking-wider">Role</p>
                        <p className="font-mono text-slate-300 mt-0.5 uppercase">{e.actor.role}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold tracking-wider">Target</p>
                        <p className="font-mono text-slate-300 mt-0.5">
                          {e.targetType} / {e.targetId}
                        </p>
                      </div>
                    </div>

                    {e.diff.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                          Diff Changes
                        </p>
                        <div className="space-y-1">
                          {e.diff.map((d, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[10px] font-mono p-2 rounded-lg border border-border bg-secondary/30"
                            >
                              <span className="text-slate-400 font-bold">{d.field}:</span>
                              <span className="text-rose-400 line-through">{d.before}</span>
                              <span className="text-slate-600">→</span>
                              <span className="text-emerald-400 font-bold">{d.after}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {e.note && (
                      <p className="text-[10px] text-slate-500 italic">{e.note}</p>
                    )}

                    <p className="text-[9px] text-slate-600 font-mono">
                      Entry ID: {e.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-600 font-semibold mt-6 text-center">
        Ledger entries are append-only and retained for the compliance window. JSON
        exports include institutional metadata for direct NBA/NAAC submission.
      </p>
    </div>
  );
}
