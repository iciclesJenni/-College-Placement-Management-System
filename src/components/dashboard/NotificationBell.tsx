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
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToNotifications,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  type NotificationPayload,
} from "@/services/notifications";

/**
 * Notification Bell — frosted-glass dropdown in the obsidian/purple/gold
 * identity. Subscribes to the automated dispatch service and shows a live
 * unread badge; gold accents highlight offers and shortlists.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationPayload[]>(() => getNotifications());

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((next) => setItems(next));
    // Sync immediately in case notifications arrived before mount
    setItems(getNotifications());
    return unsubscribe;
  }, []);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const kindIcon = (n: NotificationPayload) => {
    switch (n.kind) {
      case "offer":
        return <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
      case "shortlist":
        return <Star className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
      case "interview_slot":
        return <Video className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />;
      case "rejection":
        return <UserX className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />;
      default:
        return <RefreshCcw className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${unread} unread)`}
        className="relative w-9 h-9 rounded-xl border border-purple-950/40 bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-slate-100 hover:border-amber-500/40 transition-all duration-200 active:scale-[0.98]"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-purple-950/40">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-950/40">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Notifications
                </span>
                {unread > 0 && (
                  <span className="text-[9px] font-black text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-full px-1.5 py-0.5">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    markAllRead();
                    toast.success("All notifications marked as read");
                  }}
                  title="Mark all read"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-100 hover:bg-secondary transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-100 hover:bg-secondary transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-slate-900/80 border border-purple-950/40 shadow-lg shadow-purple-950/30">
                    <Bell className="h-5 w-5 text-purple-400 animate-pulse" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    {items.some((n) => !n.read)
                      ? "You're all caught up"
                      : "No notifications yet"}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Stage updates and interview invitations will appear here.
                  </p>
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                      if (n.actionUrl) navigate(n.actionUrl);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-purple-950/20 last:border-0 flex gap-3 hover:bg-secondary/50 transition-colors ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                        n.kind === "offer" || n.kind === "shortlist"
                          ? "border-amber-500/30 bg-amber-500/10"
                          : n.kind === "rejection"
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-purple-950/40 bg-purple-600/10"
                      }`}
                    >
                      {kindIcon(n)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-slate-100 truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[9px] text-slate-600 mt-1 font-mono">
                        {new Date(n.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {!n.read && (
                          <span className="ml-2 text-amber-400 font-black uppercase">new</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
