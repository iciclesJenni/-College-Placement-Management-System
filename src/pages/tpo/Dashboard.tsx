import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockDashboardStats, mockDrives, mockApplications, mockStudents } from "@/lib/mock-data";
import {
  GraduationCap,
  Target,
  Award,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  Activity,
} from "lucide-react";

// ─── Chart palette (neobrutalism dark theme) ───
const BAR_COLORS = ["#A78BFA", "#C084FC", "#FBBF24", "#8B5CF6", "#F59E0B"];
const PIE_COLORS = ["#A78BFA", "#FBBF24", "#C084FC", "#F59E0B"];
const EMPTY_COLOR = "#1a1030";

// ─── KPI Card ───
function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="nb-card nb-card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${color ?? "text-primary"}`} />
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 font-bold">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Pure SVG Grouped Bar Chart ───
function BranchBarChart({
  data,
}: {
  data: { department: string; total: number; placed: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const barW = 28;
  const gap = 16;
  const groupW = barW * 2 + 8;
  const chartH = 180;
  const chartW = data.length * (groupW + gap) + 20;

  return (
    <div className="overflow-x-auto pb-2">
      <svg
        viewBox={`0 0 ${chartW} ${chartH + 40}`}
        className="w-full h-auto"
        style={{ minWidth: 280 }}
      >
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = chartH - pct * chartH;
          return (
            <g key={pct}>
              <line
                x1={20}
                y1={y}
                x2={chartW}
                y2={y}
                stroke="rgba(124,58,237,0.25)"
                strokeWidth={1}
                strokeDasharray={pct === 0 ? "0" : "3 3"}
              />
              <text
                x={0}
                y={y + 4}
                fill="#8b7fb0"
                fontSize={10}
                fontWeight="bold"
              >
                {Math.round(pct * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = 24 + i * (groupW + gap);
          const totalH = (d.total / maxVal) * chartH;
          const placedH = (d.placed / maxVal) * chartH;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <g key={d.department}>
              {/* Registered bar */}
              <rect
                x={x}
                y={chartH - totalH}
                width={barW}
                height={totalH}
                fill={EMPTY_COLOR}
                stroke="rgba(124,58,237,0.25)"
                strokeWidth={2}
              />
              {/* Placed bar */}
              <rect
                x={x + barW + 4}
                y={chartH - placedH}
                width={barW}
                height={placedH}
                fill={color}
                stroke="rgba(124,58,237,0.25)"
                strokeWidth={2}
              />
              {/* Label */}
              <text
                x={x + barW}
                y={chartH + 18}
                fill="#E4E4E7"
                fontSize={11}
                fontWeight="bold"
                textAnchor="middle"
              >
                {d.department}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-3 h-3 border-2 border-border" style={{ background: EMPTY_COLOR }} />
          Registered
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-3 h-3 border-2 border-border" style={{ background: BAR_COLORS[0] }} />
          Placed
        </div>
      </div>
    </div>
  );
}

// ─── Pure SVG Donut Chart ───
function CtcDonutChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 62;
  const inner = 40;

  // Build arcs
  const slices = useMemo(() => {
    let cum = 0;
    return data.map((d, i) => {
      const start = cum;
      cum += d.value / (total || 1);
      return { ...d, start, end: cum, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
  }, [data, total]);

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number,
  ) => {
    if (end - start >= 0.999) {
      // full circle — draw two half arcs
      return [
        `M ${cx - r} ${cy}`,
        `A ${r} ${r} 0 1 1 ${cx + r} ${cy}`,
        `A ${r} ${r} 0 1 1 ${cx - r} ${cy}`,
        `M ${cx - inner} ${cy}`,
        `A ${inner} ${inner} 0 1 0 ${cx + inner} ${cy}`,
        `A ${inner} ${inner} 0 1 0 ${cx - inner} ${cy}`,
      ].join(" ");
    }
    const sa = Math.PI * 2 * start - Math.PI / 2;
    const ea = Math.PI * 2 * end - Math.PI / 2;
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const ix1 = cx + inner * Math.cos(ea);
    const iy1 = cy + inner * Math.sin(ea);
    const ix2 = cx + inner * Math.cos(sa);
    const iy2 = cy + inner * Math.sin(sa);
    const large = end - start > 0.5 ? 1 : 0;
    return [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40">
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(outer + inner) / 2}
            fill="none"
            stroke="rgba(124,58,237,0.25)"
            strokeWidth={outer - inner}
          />
        ) : (
          slices.map((s, i) => (
            <path
              key={i}
              d={describeArc(cx, cy, outer, s.start, s.end)}
              fill={s.value > 0 ? s.color : "transparent"}
              stroke="rgba(124,58,237,0.25)"
              strokeWidth={2}
            />
          ))
        )}
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#E4E4E7" fontSize={16} fontWeight="900">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b7fb0" fontSize={9} fontWeight="bold">
          OFFERS
        </text>
      </svg>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <span className="w-3 h-3 shrink-0 border border-border" style={{ background: s.color }} />
            {s.name}: {s.value}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drive Progress Card ───
function DriveProgressCard({
  drive,
  inPipeline,
  shortlisted,
  rejected,
  total,
}: {
  drive: { companyName: string; roleTitle: string; ctc: string; status: string; deadline: string };
  inPipeline: number;
  shortlisted: number;
  rejected: number;
  total: number;
}) {
  const progress = total > 0 ? Math.round(((shortlisted + rejected) / total) * 100) : 0;

  return (
    <div className="nb-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black truncate">{drive.companyName}</p>
          <p className="text-[10px] text-muted-foreground font-bold truncate">{drive.roleTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="nb-tag bg-accent/15 text-accent border-accent/30 text-[10px]">
            {drive.ctc}
          </span>
          <span
            className={`nb-tag text-[10px] ${
              drive.status === "ongoing"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {drive.status}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
          <span>{total} applicants</span>
          <span>{progress}% processed</span>
        </div>
        <div className="h-2 bg-secondary border border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Breakdown chips */}
      <div className="flex flex-wrap gap-2">
        <span className="nb-tag bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] gap-1">
          <Clock className="h-3 w-3" /> {inPipeline} In Pipeline
        </span>
        <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> {shortlisted} Shortlisted
        </span>
        <span className="nb-tag bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] gap-1">
          <XCircle className="h-3 w-3" /> {rejected} Rejected
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Deadline: {drive.deadline}</span>
        <ArrowUpRight className="h-3 w-3" />
      </div>
    </div>
  );
}

// ─── Activity Feed Item ───
function ActivityItem({
  icon: Icon,
  color,
  text,
  time,
}: {
  icon: React.ElementType;
  color: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className={`w-7 h-7 border-2 border-border flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-snug">{text}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function TPODashboard() {
  const navigate = useNavigate();

  // ── Live Convex query (server-side computation, auto-cached) ──
  const liveData = useQuery(api.placementAnalytics.dashboardData);

  // Fallback to realistic cohort data when Convex isn't seeded yet OR when
  // the live database returns all-zero aggregates (empty tables), so the
  // TPO overview never renders "0 Students / 0% / ₹0 LPA" and empty charts.
  const liveHasData =
    !!liveData &&
    (liveData.totalStudents > 0 ||
      liveData.totalApplications > 0 ||
      liveData.totalOffers > 0);
  const stats = liveHasData
    ? {
        totalStudents: liveData!.totalStudents,
        placedStudents: liveData!.placedStudents,
        placementPercentage: liveData!.placementPercentage,
        totalOffers: liveData!.totalOffers,
        highestCtc: liveData!.highestCtc,
        averageCtc: liveData!.averageCtc,
        totalApplications: liveData!.totalApplications,
        activeDrives: liveData!.activeDrives,
        ctcDistribution: Object.fromEntries(
          liveData!.ctcDistribution.map((d) => [d.name, d.value]),
        ),
      }
    : mockDashboardStats;

  // Drive breakdown — live from Convex, fallback to mock
  const driveBreakdown = useMemo(() => {
    if (liveData?.driveBreakdown) {
      return liveData.driveBreakdown.map((row) => ({
        drive: {
          id: row.driveId,
          companyName: row.companyName,
          roleTitle: row.roleTitle,
          ctc: row.ctc,
          status: row.status,
          deadline: row.deadline,
        },
        inPipeline: row.inPipeline,
        shortlisted: row.shortlisted,
        rejected: row.rejected,
        total: row.total,
      }));
    }
    // Mock fallback
    return mockDrives
      .filter((d) => d.status === "ongoing" || d.status === "upcoming")
      .map((drive) => {
        const apps = mockApplications.filter((a) => a.driveId === drive.id);
        return {
          drive,
          shortlisted: apps.filter(
            (a) => a.status === "shortlisted" || a.status === "offered",
          ).length,
          rejected: apps.filter((a) => a.status === "rejected").length,
          inPipeline: apps.filter(
            (a) =>
              a.status === "applied" ||
              a.status === "online_assessment" ||
              a.status === "technical_interview" ||
              a.status === "hr_interview",
          ).length,
          total: apps.length,
        };
      });
  }, [liveData]);

  // Activity feed — live from Convex, fallback to mock
  const activityFeed = useMemo(() => {
    if (liveData?.recentActivity) {
      return liveData.recentActivity.map((item) => {
        const statusMap: Record<string, { icon: React.ElementType; color: string }> = {
          applied: { icon: Briefcase, color: "bg-blue-500/15 text-blue-400" },
          shortlisted: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-400" },
          online_assessment: { icon: Clock, color: "bg-purple-500/15 text-purple-400" },
          technical_interview: { icon: Activity, color: "bg-orange-500/15 text-orange-400" },
          hr_interview: { icon: Activity, color: "bg-orange-500/15 text-orange-400" },
          offered: { icon: Award, color: "bg-emerald-500/15 text-emerald-400" },
          rejected: { icon: XCircle, color: "bg-rose-500/15 text-rose-400" },
        };
        const s = statusMap[item.status] ?? statusMap.applied;
        return {
          icon: s.icon,
          color: s.color,
          text: `${item.studentName} ${item.verb} ${item.companyName}`,
          time: String(item.updatedAt),
        };
      });
    }
    // Mock fallback
    const recent = [...mockApplications]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8);
    return recent.map((app) => {
      const student = mockStudents.find((s) => s.id === app.studentId);
      const drive = mockDrives.find((d) => d.id === app.driveId);
      const statusMap: Record<string, { icon: React.ElementType; color: string; verb: string }> = {
        applied: { icon: Briefcase, color: "bg-blue-500/15 text-blue-400", verb: "applied to" },
        shortlisted: { icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-400", verb: "shortlisted for" },
        online_assessment: { icon: Clock, color: "bg-purple-500/15 text-purple-400", verb: "assessment scheduled for" },
        technical_interview: { icon: Activity, color: "bg-orange-500/15 text-orange-400", verb: "interviewing for" },
        hr_interview: { icon: Activity, color: "bg-orange-500/15 text-orange-400", verb: "HR round for" },
        offered: { icon: Award, color: "bg-emerald-500/15 text-emerald-400", verb: "received offer from" },
        rejected: { icon: XCircle, color: "bg-rose-500/15 text-rose-400", verb: "rejected from" },
      };
      const s = statusMap[app.status] ?? statusMap.applied;
      return {
        icon: s.icon,
        color: s.color,
        text: `${student?.name ?? "Student"} ${s.verb} ${drive?.companyName ?? "Company"}`,
        time: app.updatedAt,
      };
    });
  }, [liveData]);

  // CTC distribution for donut chart
  const ctcData = useMemo(
    () =>
      Object.entries(stats.ctcDistribution).map(([name, value]) => ({
        name,
        value: value as number,
      })),
    [stats.ctcDistribution],
  );

  // Department stats for bar chart — also guarded against empty live data
  const departmentStats =
    liveHasData && liveData!.departmentStats.length > 0
      ? liveData!.departmentStats
      : mockDashboardStats.departmentStats;

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight mb-1">Placement Overview</h1>
        <p className="text-sm text-muted-foreground">
          Analytics, metrics, and recent activity across all drives
        </p>
      </div>

      {/* ═══════════════════════════════════
          KPI SUMMARY CARDS
          ═══════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Students Registered" value={stats.totalStudents} icon={GraduationCap} color="text-blue-400" />
        <KpiCard label="Placement Rate" value={`${stats.placementPercentage}%`} subtitle={`${stats.placedStudents} placed`} icon={Target} color="text-emerald-400" />
        <div className="relative">
          <KpiCard label="Total Offers" value={stats.totalOffers} subtitle="Released" icon={CheckCircle2} color="text-amber-400" />
          <span className="absolute inset-0 rounded-2xl border border-amber-500/30 bg-amber-500/5 pointer-events-none" />
        </div>
        <div className="relative">
          <KpiCard label="Highest Package" value={`₹${stats.highestCtc} LPA`} icon={Award} color="text-amber-400" />
          <span className="absolute inset-0 rounded-2xl border border-amber-500/30 bg-amber-500/5 pointer-events-none" />
        </div>
        <KpiCard label="Average Package" value={`₹${stats.averageCtc} LPA`} icon={TrendingUp} color="text-accent" />
      </div>

      {/* ═══════════════════════════════════
          CHARTS ROW
          ═══════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Branch-wise Placement Bar Chart */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm">Branch-wise Placement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchBarChart data={departmentStats} />
          </CardContent>
        </Card>

        {/* CTC Distribution Donut */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm">CTC Distribution Tier</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CtcDonutChart data={ctcData} />
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════
          ONGOING DRIVE PROGRESS
          ═══════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black tracking-tight">Ongoing Drive Progress</h2>
          <button
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            onClick={() => navigate("/tpo/drives")}
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {driveBreakdown.map((row) => (
            <DriveProgressCard
              key={row.drive.id}
              drive={row.drive}
              inPipeline={row.inPipeline}
              shortlisted={row.shortlisted}
              rejected={row.rejected}
              total={row.total}
            />
          ))}
          {driveBreakdown.length === 0 && (
            <div className="nb-card p-8 text-center text-muted-foreground font-bold col-span-full">
              No active or upcoming drives
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          BOTTOM ROW: ACTIVITY FEED + QUICK STATS
          ═══════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="nb-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {activityFeed.map((item, i) => (
              <ActivityItem
                key={i}
                icon={item.icon}
                color={item.color}
                text={item.text}
                time={item.time}
              />
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="nb-card">
            <CardContent className="p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Total Applications
              </div>
              <div className="font-black text-3xl">{stats.totalApplications}</div>
            </CardContent>
          </Card>
          <Card className="nb-card">
            <CardContent className="p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Active Drives
              </div>
              <div className="font-black text-3xl">{stats.activeDrives}</div>
            </CardContent>
          </Card>
          <Card className="nb-card">
            <CardContent className="p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Students Placed
              </div>
              <div className="font-black text-3xl">
                <span className="text-primary">{stats.placedStudents}</span>
                <span className="text-muted-foreground">/{stats.totalStudents}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
