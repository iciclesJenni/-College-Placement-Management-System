import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCheck,
  Video,
  Star,
  Trophy,
  UserX,
  RefreshCcw,
  Clock,
  Megaphone,
  Search,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToNotifications,
  getNotifications,
  markAllRead,
  markRead,
  markUnread,
  clearNotifications,
  seedDeadlineAlerts,
  type NotificationPayload,
} from "@/services/notifications";
import { mockStudents, mockDrives } from "@/lib/mock-data";

type Filter = "all" | "unread" | "stage_change" | "interview_slot" | "deadline";

const KIND_UI: Record<
  NotificationPayload["kind"],
  { icon: typeof Bell; tile: string; label: string }
> = {
  offer: { icon: Trophy, tile: "border-amber-500/30 bg-amber-500/10", label: "Offer" },
  shortlist: { icon: Star, tile: "border-amber-500/30 bg-amber-500/10", label: "Shortlist" },
  interview_slot: { icon: Video, tile: "border-purple-500/30 bg-purple-600/10", label: "Interview" },
  deadline: { icon: Clock, tile: "border-amber-500/30 bg-amber-500/10", label: "Deadline" },
  announcement: { icon: Megaphone, tile: "border-purple-950/40 bg-purple-600/10", label: "Announcement" },
  rejection: { icon: UserX, tile: "border-rose-500/30 bg-rose-500/10", label: "Closed" },
  stage_change: { icon: RefreshCcw, tile: "border-purple-950/40 bg-purple-600/10", label: "Stage Update" },
};

export default function NotificationCenter() {
  const navigate = useNavigate();
  const currentStudent = useMemo(
    () => mockStudents.find((s) => s.id === "stu-1") ?? mockStudents[0],
    [],
  );

  const [items, setItems] = useState<NotificationPayload[]>(() =>
    getNotifications(currentStudent.id),
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = () => setItems(getNotifications(currentStudent.id));

  useEffect(() => {
    // Seed deadline alerts from active drives (idempotent per day)
    const today = new Date();
    const deadlines = mockDrives
      .filter((d) => d.status === "ongoing")
      .map((d) => ({
        companyName: d.companyName,
        roleTitle: d.roleTitle,
        deadlineLabel: d.deadline,
        daysLeft: Math.max(0, Math.ceil((d.deadlineTimestamp - today.getTime()) / 86400000)),
        driveId: d.id,
      }))
      .filter((d) => d.daysLeft <= 7);
    seedDeadlineAlerts(
      currentStudent.id,
      currentStudent.name,
      currentStudent.email,
      deadlines,
    );
    refresh();

    const unsubscribe = subscribeToNotifications(() => refresh());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const filtered = items.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (
      filter === "stage_change" &&
      !["stage_change", "shortlist", "offer", "rejection"].includes(n.kind)
    )
      return false;
    if (filter === "interview_slot" && n.kind !== "interview_slot") return false;
    if (filter === "deadline" && n.kind !== "deadline") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleRead = (n: NotificationPayload) => {
    if (n.read) {
      markUnread(n.id);
      toast.success("Marked as unread");
    } else {
      markRead(n.id);
    }
    refresh();
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <Bell className="w-4 h-4" />
          Real-time Dispatch Center
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Notifications
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Instant alerts for drive deadlines, assessment windows, stage changes,
          and interview slot assignments.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{items.length}</p>
        </div>
        <div className="nb-card p-3.5 border-amber-500/30 bg-amber-500/5 nb-sheen">
          <span className="text-[10px] font-bold text-amber-400/80 uppercase">Unread</span>
          <p className="text-xl font-black text-amber-400 mt-0.5">{unread}</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Interviews</span>
          <p className="text-xl font-black text-purple-300 mt-0.5">
            {items.filter((n) => n.kind === "interview_slot").length}
          </p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Deadlines</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">
            {items.filter((n) => n.kind === "deadline").length}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nb-input w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              ["all", "All"],
              ["unread", `Unread${unread > 0 ? ` (${unread})` : ""}`],
              ["stage_change", "Stages"],
              ["interview_slot", "Interviews"],
              ["deadline", "Deadlines"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-[0.98] ${
                filter === key
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40 shadow-sm shadow-purple-950/30"
                  : "border-border bg-secondary text-slate-400 hover:text-slate-100 hover:border-purple-800/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              markAllRead(currentStudent.id);
              refresh();
              toast.success("All notifications marked as read");
            }}
            className="nb-btn-secondary text-[10px] font-black px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
          <button
            onClick={() => {
              clearNotifications();
              refresh();
              toast.success("Notification history cleared");
            }}
            title="Clear all"
            className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-border bg-secondary text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <Inbox className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-300">
            {items.length === 0 ? "No notifications yet" : "Nothing matches this filter"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Deadline alerts, stage updates, and interview invitations will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const ui = KIND_UI[n.kind];
            const Icon = ui.icon;
            return (
              <div
                key={n.id}
                className={`nb-card nb-card-hover p-4 flex gap-3 cursor-pointer ${
                  n.read ? "opacity-60" : "border-l-2 border-l-amber-500/60"
                }`}
                onClick={() => {
                  if (!n.read) {
                    markRead(n.id);
                    refresh();
                  }
                  if (n.actionUrl) navigate(n.actionUrl);
                }}
              >
                <div className={`w-10 h-10 rounded-xl border shrink-0 flex items-center justify-center ${ui.tile}`}>
                  <Icon className="h-4 w-4 text-current text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black text-slate-100">{n.title}</p>
                    <span className="nb-tag text-[8px] uppercase tracking-wider">
                      {ui.label}
                    </span>
                    {!n.read && (
                      <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">
                        new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-mono">
                    {new Date(n.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(n);
                  }}
                  className="self-center text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-slate-400 hover:text-slate-100 hover:border-purple-800/50 transition-all duration-200 active:scale-[0.98] shrink-0"
                >
                  {n.read ? "Unread" : "Read"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
