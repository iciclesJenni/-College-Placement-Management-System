import { useMemo, useState } from "react";
import {
  Megaphone,
  Send,
  Users,
  GraduationCap,
  Award,
  UserX,
  Bell,
  Mail,
  MessageSquare,
  Eye,
  Trash2,
  Loader2,
  Radio,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { mockStudents, mockDrives } from "@/lib/mock-data";
import {
  publishBroadcast,
  loadBroadcasts,
  deleteBroadcast,
  countCohort,
  subscribeToBroadcasts,
  type BroadcastPriority,
  type DeliveryChannel,
  type CohortTarget,
  type Broadcast,
} from "@/services/broadcasts";
import type { Department } from "@/types";
import { logAudit } from "@/services/logger";

const PRIORITY_META: Record<
  BroadcastPriority,
  { label: string; chip: string; glow: string; hint: string }
> = {
  low: {
    label: "Low",
    chip: "text-slate-300 bg-secondary border-border",
    glow: "",
    hint: "General updates — calendar additions, reminders",
  },
  urgent: {
    label: "Urgent",
    chip: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    glow: "",
    hint: "Deadlines approaching, slot booking windows",
  },
  critical: {
    label: "Critical Drive Alert",
    chip: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    glow: "shadow-lg shadow-rose-950/30",
    hint: "Same-day schedule changes, immediate action required",
  },
};

const CHANNELS: { key: DeliveryChannel; label: string; icon: typeof Bell; hint: string }[] = [
  { key: "in_app", label: "In-App Push Banner", icon: Bell, hint: "Dashboard banner + feed" },
  { key: "email", label: "Email Notification", icon: Mail, hint: "Batch email transport" },
  { key: "webhook_sms", label: "Webhook / SMS", icon: MessageSquare, hint: "WhatsApp/SMS gateway stub" },
];

const BRANCHES: Department[] = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

type CohortKind = "all" | "unplaced" | "branches" | "cgpa";

export default function TPOBroadcasts() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>("urgent");
  const [cohortKind, setCohortKind] = useState<CohortKind>("all");
  const [selectedBranches, setSelectedBranches] = useState<Set<Department>>(new Set(["CSE", "IT"]));
  const [minCgpa, setMinCgpa] = useState("8.0");
  const [driveId, setDriveId] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Open Drive");
  const [channels, setChannels] = useState<Set<DeliveryChannel>>(new Set(["in_app"]));
  const [publishing, setPublishing] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>(() => loadBroadcasts());

  const refreshHistory = () => setHistory(loadBroadcasts());
  useMemo(() => subscribeToBroadcasts(refreshHistory), []);

  const target: CohortTarget = useMemo(() => {
    switch (cohortKind) {
      case "all":
        return { kind: "all" };
      case "unplaced":
        return { kind: "unplaced" };
      case "branches":
        return { kind: "branches", branches: Array.from(selectedBranches) };
      case "cgpa":
        return { kind: "cgpa", minCgpa: parseFloat(minCgpa) || 0 };
    }
  }, [cohortKind, selectedBranches, minCgpa]);

  const cohortCount = useMemo(
    () => countCohort(target, mockStudents),
    [target],
  );

  const selectedDrive = mockDrives.find((d) => d.id === driveId);

  const canPublish = title.trim().length >= 4 && body.trim().length >= 10 && channels.size > 0;

  const handlePublish = async () => {
    if (!canPublish) {
      toast.error("Add a title, message body, and at least one delivery channel");
      return;
    }
    setPublishing(true);
    await new Promise((r) => window.setTimeout(r, 500));
    publishBroadcast({
      title: title.trim(),
      body: body.trim(),
      priority,
      target,
      channels: Array.from(channels),
      cohortCount,
      driveId: driveId || undefined,
      driveName: selectedDrive?.companyName,
      ctaLabel: ctaLabel.trim() || "Open Drive",
      ctaUrl: driveId ? "/student/drives" : "/student/announcements",
      authorName: "Dr. K. Srinivas Rao — TPO",
    });
    setPublishing(false);
    setTitle("");
    setBody("");
    logAudit({
      category: "BROADCAST_PUBLISHED",
      action: `Published ${priority} broadcast to ${cohortCount} students`,
      targetType: "Broadcast",
      targetId: title.trim().slice(0, 40),
      targetLabel: title.trim(),
      diff: [
        { field: "priority", before: "—", after: priority },
        { field: "channels", before: "—", after: Array.from(channels).join(", ") },
        { field: "recipients", before: "—", after: String(cohortCount) },
      ],
    });
    refreshHistory();
  };

  const toggleBranch = (b: Department) => {
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  const toggleChannel = (c: DeliveryChannel) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const COHORT_OPTIONS: { key: CohortKind; label: string; icon: typeof Users }[] = [
    { key: "all", label: "All Students", icon: Users },
    { key: "unplaced", label: "Unplaced Only", icon: UserX },
    { key: "branches", label: "Specific Branches", icon: GraduationCap },
    { key: "cgpa", label: "CGPA Cutoff Tier", icon: Award },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <Radio className="w-4 h-4" />
          Drive Broadcast Center
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Announcement Composer
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Multi-channel placement cell broadcasts — in-app, email, and SMS/WhatsApp
          webhook dispatch.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Composer ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Message */}
          <div className="nb-card p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5 text-amber-400" />
              Message
            </h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title — e.g. Google Cloud slot booking open"
              className="nb-input w-full px-3 py-2.5 text-xs font-bold text-slate-100 placeholder:text-slate-500 mb-3"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Full message. Include dates, instructions, and any required actions…"
              rows={4}
              className="nb-input w-full px-3 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 resize-none"
            />
            <p className="text-[9px] text-slate-600 mt-1 text-right font-mono">
              {body.length} chars
            </p>
          </div>

          {/* Target cohort */}
          <div className="nb-card p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-purple-400" />
              Target Cohort
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {COHORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setCohortKind(opt.key)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      cohortKind === opt.key
                        ? "border-purple-500/40 bg-purple-600/10"
                        : "border-border bg-secondary/30 hover:border-purple-800/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${cohortKind === opt.key ? "text-purple-300" : "text-slate-500"}`} />
                    <p className={`text-[10px] font-black ${cohortKind === opt.key ? "text-slate-100" : "text-slate-400"}`}>
                      {opt.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {cohortKind === "branches" && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBranch(b)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-[0.98] ${
                      selectedBranches.has(b)
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40"
                        : "border-border bg-secondary text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
            {cohortKind === "cgpa" && (
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Min CGPA</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="nb-input w-24 px-3 py-1.5 text-xs font-black text-amber-400"
                />
                <span className="text-[10px] text-slate-500">and above</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-950/40">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] font-black text-slate-200">
                {cohortCount} student{cohortCount !== 1 ? "s" : ""} will receive this broadcast
              </p>
            </div>
          </div>

          {/* Drive + CTA */}
          <div className="nb-card p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-purple-400" />
              Drive Association & Call-to-Action
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">
                  Linked Drive (optional)
                </label>
                <select
                  value={driveId}
                  onChange={(e) => setDriveId(e.target.value)}
                  className="nb-input w-full px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <option value="">— General placement cell update —</option>
                  {mockDrives.filter((d) => d.status !== "completed").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.companyName} — {d.roleTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">
                  CTA Button Label
                </label>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Open Drive"
                  className="nb-input w-full px-3 py-2 text-xs font-bold text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="nb-card p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">
              Priority Tier
            </h2>
            <div className="grid sm:grid-cols-3 gap-2">
              {(Object.keys(PRIORITY_META) as BroadcastPriority[]).map((p) => {
                const meta = PRIORITY_META[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${meta.glow} ${
                      priority === p ? meta.chip : "border-border bg-secondary/30 hover:border-purple-800/50"
                    }`}
                  >
                    <p className="text-[11px] font-black">{meta.label}</p>
                    <p className={`text-[9px] mt-1 leading-relaxed ${priority === p ? "text-current opacity-80" : "text-slate-500"}`}>
                      {meta.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels */}
          <div className="nb-card p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">
              Delivery Channels
            </h2>
            <div className="space-y-2">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const active = channels.has(ch.key);
                return (
                  <button
                    key={ch.key}
                    onClick={() => toggleChannel(ch.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      active
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-secondary/30 hover:border-purple-800/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-amber-400" : "text-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black ${active ? "text-slate-100" : "text-slate-400"}`}>
                        {ch.label}
                      </p>
                      <p className="text-[9px] text-slate-500">{ch.hint}</p>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full border flex items-center px-0.5 transition-all duration-200 ${
                        active ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/40" : "bg-secondary border-border"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                          active ? "translate-x-4" : ""
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dispatch */}
          <button
            onClick={handlePublish}
            disabled={publishing || !canPublish}
            className="w-full text-sm font-black px-6 py-3.5 rounded-xl text-white disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] hover:brightness-110"
            style={{ backgroundImage: "linear-gradient(90deg, #7c3aed 0%, #6366f1 50%, #6d28d9 100%)" }}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {publishing ? "Dispatching…" : `Dispatch to ${cohortCount} Students`}
          </button>
        </div>

        {/* ── Live preview + history ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="lg:sticky lg:top-6 space-y-5">
            <div className="nb-card p-5 nb-sheen">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                Student View Preview
              </h2>
              <AnnouncementCard
                broadcast={{
                  id: "preview",
                  title: title.trim() || "Your announcement title appears here",
                  body:
                    body.trim() ||
                    "The full message body renders here exactly as students will read it on their dashboard feed.",
                  priority,
                  target,
                  channels: Array.from(channels),
                  driveId: driveId || undefined,
                  driveName: selectedDrive?.companyName,
                  ctaLabel: ctaLabel.trim() || "Open Drive",
                  ctaUrl: "/student/drives",
                  authorName: "Dr. K. Srinivas Rao — TPO",
                  publishedAt: Date.now(),
                  readBy: {},
                  delivery: [],
                }}
                onCta={() => toast.info("CTA click — students navigate to the linked drive")}
              />
            </div>

            {/* Recent history */}
            <div className="nb-card p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                Published ({history.length})
              </h2>
              {history.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-semibold py-4 text-center">
                  No broadcasts yet — your published announcements appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {history.slice(0, 12).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-secondary/30 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[10px] font-black text-slate-200 truncate">{b.title}</p>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border uppercase ${PRIORITY_META[b.priority].chip}`}>
                            {PRIORITY_META[b.priority].label}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {new Date(b.publishedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {" • "}
                          {b.delivery.map((d) => d.recipients).join("/")} delivered
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          deleteBroadcast(b.id);
                          refreshHistory();
                          toast.success("Broadcast removed from the feed");
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        title="Delete broadcast"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared announcement card (composer preview + student feed) ─────────────

export function AnnouncementCard({
  broadcast,
  onCta,
}: {
  broadcast: Broadcast;
  onCta?: () => void;
}) {
  const meta = PRIORITY_META[broadcast.priority];
  return (
    <div
      className={`rounded-xl border p-4 bg-slate-950/60 transition-all duration-200 hover:border-purple-800/50 ${
        broadcast.priority === "critical"
          ? "border-rose-500/30"
          : broadcast.priority === "urgent"
            ? "border-amber-500/30"
            : "border-purple-950/40"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {broadcast.priority !== "low" && (
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${meta.chip} ${
              broadcast.priority === "urgent" ? "animate-pulse" : ""
            }`}
          >
            {broadcast.priority === "critical" ? "Critical" : "Urgent"}
          </span>
        )}
        {broadcast.driveName && (
          <span className="nb-tag text-[8px] border-purple-500/30 bg-purple-600/10 text-purple-300">
            {broadcast.driveName}
          </span>
        )}
      </div>
      <p className="text-xs font-black text-slate-100 leading-snug">{broadcast.title}</p>
      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{broadcast.body}</p>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-purple-950/40">
        <p className="text-[9px] text-slate-600 font-semibold">
          {broadcast.authorName} •{" "}
          {new Date(broadcast.publishedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        {onCta && (
          <button
            onClick={onCta}
            className="text-[9px] font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
          >
            {broadcast.ctaLabel ?? "Open Drive"}
          </button>
        )}
      </div>
    </div>
  );
}
