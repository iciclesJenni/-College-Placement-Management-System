import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Radio,
  Megaphone,
  Bell,
  CheckCheck,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { mockStudents } from "@/lib/mock-data";
import {
  subscribeToBroadcasts,
  getStudentFeed,
  getUnreadBroadcastCount,
  markBroadcastRead,
  markAllBroadcastsRead,
} from "@/services/broadcasts";
import type { Broadcast } from "@/services/broadcasts";
import { AnnouncementCard } from "@/pages/tpo/Broadcasts";

export default function StudentAnnouncements() {
  const navigate = useNavigate();
  const student = useMemo(
    () => mockStudents.find((s) => s.id === "stu-1") ?? mockStudents[0],
    [],
  );

  const [feed, setFeed] = useState<Broadcast[]>(() => getStudentFeed(student));
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const refresh = () => setFeed(getStudentFeed(student));

  useEffect(() => {
    const unsubscribe = subscribeToBroadcasts(refresh);
    refresh();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = useMemo(
    () => feed.filter((b) => !b.readBy[student.id]).length,
    [feed, student.id],
  );

  const visible = showUnreadOnly
    ? feed.filter((b) => !b.readBy[student.id])
    : feed;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <Radio className="w-4 h-4" />
          Placement Cell Broadcasts
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Announcements
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Official updates from the Training & Placement Cell — deadlines, slot
          windows, and schedule changes in real time.
        </p>
      </div>

      {/* Unread banner + actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Bell className="h-4 w-4 text-amber-400" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[8px] font-black text-white flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
          <p className="text-[11px] font-black text-slate-200">
            {unread > 0
              ? `${unread} unread announcement${unread > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-[0.98] ${
              showUnreadOnly
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40"
                : "border-border bg-secondary text-slate-400 hover:text-slate-100"
            }`}
          >
            Unread only
          </button>
          <button
            onClick={() => markAllBroadcastsRead(student)}
            disabled={unread === 0}
            className="nb-btn-secondary text-[10px] font-black px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCheck className="h-3 w-3" />
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-slate-900/80 border border-purple-950/40 shadow-lg shadow-purple-950/30">
            <Inbox className="h-7 w-7 text-purple-400 animate-pulse" />
          </div>
          <p className="text-sm font-black text-slate-300">
            {feed.length === 0
              ? "No announcements yet"
              : showUnreadOnly
                ? "All caught up — nothing unread"
                : "Nothing here"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {feed.length === 0
              ? "Official placement cell broadcasts will appear here the moment they're published."
              : "Every broadcast has been read. New alerts will light this feed up instantly."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const isUnread = !b.readBy[student.id];
            return (
              <div
                key={b.id}
                onClick={() => {
                  if (isUnread) {
                    markBroadcastRead(b.id, student.id);
                    refresh();
                  }
                }}
                className={`cursor-pointer ${isUnread ? "relative" : "opacity-70 hover:opacity-100"} transition-all duration-200`}
              >
                {isUnread && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-gradient-to-b from-amber-400 to-purple-500 shadow-sm shadow-purple-950/30" />
                )}
                <div className="pl-2">
                  <AnnouncementCard
                    broadcast={b}
                    onCta={() => {
                      if (isUnread) {
                        markBroadcastRead(b.id, student.id);
                      }
                      navigate(b.ctaUrl ?? "/student/drives");
                      toast.success(`Navigating — ${b.ctaLabel ?? "Open Drive"}`);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div className="nb-card p-4 mt-8 flex items-start gap-3">
        <Megaphone className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
          <span className="text-slate-300 font-black">Delivery channels:</span> broadcasts
          arrive in-app instantly and are mirrored to your college email. Critical drive
          alerts may also trigger SMS/WhatsApp notifications — keep your phone number
          current on your profile.
        </p>
      </div>

      {/* Back to dashboard quick-link */}
      <button
        onClick={() => navigate("/student/dashboard")}
        className="mt-4 text-[10px] font-black text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 transition-colors"
      >
        Back to Dashboard
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
