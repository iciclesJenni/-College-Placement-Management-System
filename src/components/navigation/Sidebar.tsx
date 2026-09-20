import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  getUnreadBroadcastCount,
  subscribeToBroadcasts,
} from "@/services/broadcasts";
import {
  loadThreads,
  unreadCount,
  subscribeToMessages,
} from "@/services/messages";
import { clearMockUser } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Users,
  BarChart3,
  GraduationCap,
  LogOut,
  Terminal,
  ChevronLeft,
  Building2,
  CalendarClock,
  Sparkles,
  Vault,
  FileBarChart,
  Bell,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

const studentNavItems = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/drives", icon: Briefcase, label: "Drives" },
  { to: "/student/applications", icon: FileText, label: "Applications" },
  { to: "/student/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/messages", icon: MessagesSquare, label: "Messages" },
  { to: "/student/notifications", icon: Bell, label: "Notifications" },
  { to: "/student/vault", icon: Vault, label: "Document Vault" },
  { to: "/student/profile", icon: User, label: "Profile" },
];

const tpoNavItems = [
  { to: "/tpo/dashboard", icon: BarChart3, label: "Overview" },
  { to: "/tpo/drives", icon: Briefcase, label: "Drives" },
  { to: "/tpo/students", icon: Users, label: "Students" },
  { to: "/tpo/drives/drv-1/schedule", icon: CalendarClock, label: "Scheduler" },
  { to: "/tpo/broadcasts", icon: Megaphone, label: "Broadcasts" },
  { to: "/messages", icon: MessagesSquare, label: "Messages" },
  { to: "/tpo/reports", icon: FileBarChart, label: "Reports" },
  { to: "/tpo/audit", icon: ShieldCheck, label: "Audit Trail" },
];

const recruiterNavItems = [
  { to: "/company/dashboard", icon: Building2, label: "Portal" },
  { to: "/company/drives/drv-1/matches", icon: Sparkles, label: "AI Matches" },
  { to: "/messages", icon: MessagesSquare, label: "Messages" },
];

interface SidebarProps {
  /** Drawer mode — true when the sidebar is rendered as a mobile slide-over */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { user, signOutAll } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Live broadcast unread badge (student announcements nav item).
  // The badge cohort test uses a maximally-permissive student record so it
  // counts every broadcast targeted at any student subset the user may
  // belong to; exact per-student filtering happens on the feed page.
  const [broadcastUnread, setBroadcastUnread] = useState(0);
  useEffect(() => {
    if (user?.role !== "student") return;
    const student = {
      id: "sidebar-badge",
      department: "CSE" as const,
      cgpa: 10,
      placementStatus: "not_placed" as const,
    };
    const update = () => setBroadcastUnread(getUnreadBroadcastCount(student));
    update();
    const unsubscribe = subscribeToBroadcasts(update);
    return unsubscribe;
  }, [user?.role]);

  // Live Messages unread badge — sums unread messages across every thread
  // for the signed-in persona. Clears reactively as threads are opened and
  // marked read inside /messages (event-bus driven, no polling).
  const role = user?.role;
  const navItems =
    role === "tpo"
      ? tpoNavItems
      : role === "recruiter"
      ? recruiterNavItems
      : studentNavItems;

  const currentUserId =
    role === "tpo" ? "tpo-1" : role === "recruiter" ? "rec-1" : "stu-1";
  const [messagesUnread, setMessagesUnread] = useState(0);
  useEffect(() => {
    const update = () => {
      const total = loadThreads().reduce(
        (sum, t) => sum + unreadCount(t.id, currentUserId),
        0,
      );
      setMessagesUnread(total);
    };
    update();
    const unsubscribe = subscribeToMessages(update);
    return unsubscribe;
  }, [currentUserId]);

  const handleSignOut = async () => {
    // Full teardown: mock store, mirrored session cookie, and any legacy
    // role keys — then land on the auth screen with confirmation feedback.
    await signOutAll();
    try {
      localStorage.removeItem("userRole");
      localStorage.removeItem("placement_portal_auth");
      sessionStorage.removeItem("placement_portal_auth");
    } catch {
      // storage unavailable — cookie teardown already ran
    }
    clearMockUser();
    onCloseMobile?.();
    toast.success("Signed out successfully.", {
      description: "Your session has been cleared.",
    });
    navigate("/auth");
  };

  return (
    <aside
      className={`h-screen border-r border-border bg-sidebar backdrop-blur-md flex flex-col transition-all duration-200 z-50
        ${collapsed ? "w-16" : "w-60"}
        /* <1024px: off-canvas slide-over drawer; ≥1024px: sticky rail */
        max-lg:fixed max-lg:top-0 max-lg:left-0
        ${
          mobileOpen
            ? "max-lg:translate-x-0 shadow-2xl shadow-purple-950/50"
            : "max-lg:-translate-x-full"
        }
        max-lg:transition-transform lg:sticky lg:top-0 lg:translate-x-0`
    }>
      {/* Header */}
      <div className="border-b-2 border-border p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border-2 border-border bg-primary/15 flex items-center justify-center shrink-0">
              <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-xs font-black tracking-tight uppercase whitespace-nowrap">
              Placement Portal
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 hidden lg:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </Button>
          {/* Close button — drawer mode only */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 lg:hidden"
            onClick={onCloseMobile}
            title="Close menu"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 pt-4">
          <span className="nb-tag bg-purple-600/15 text-purple-300 border-purple-500/30 text-[10px] w-full justify-center uppercase tracking-wider">
            {role === "tpo"
              ? "TPO"
              : role === "recruiter"
              ? "Recruiter"
              : "Student"}
          </span>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-[0.98] ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 text-white shadow-lg shadow-purple-950/40 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-100 hover:bg-secondary hover:border-purple-800/50 border border-transparent"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed &&
              item.to === "/student/announcements" &&
              broadcastUnread > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[9px] font-black text-white flex items-center justify-center shadow-sm shadow-purple-950/40">
                  {broadcastUnread > 9 ? "9+" : broadcastUnread}
                </span>
              )}
            {!collapsed &&
              item.to === "/messages" &&
              messagesUnread > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[9px] font-black text-white flex items-center justify-center shadow-sm shadow-purple-950/40">
                  {messagesUnread > 9 ? "9+" : messagesUnread}
                </span>
              )}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t-2 border-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-border bg-secondary flex items-center justify-center font-black text-xs shrink-0">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email ?? ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mx-auto flex text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </aside>
  );
}
