import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockDrives } from "@/lib/mock-data";
import {
  Plus,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { Drive, DriveStatus } from "@/types";

export default function TPODrives() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<Drive[]>(() => {
    // Merge mock data with any drives created in this session
    try {
      const sessionDrives: Drive[] = JSON.parse(sessionStorage.getItem("newDrives") || "[]");
      if (sessionDrives.length > 0) {
        const existingIds = new Set(mockDrives.map((d) => d.id));
        const unique = sessionDrives.filter((d) => !existingIds.has(d.id));
        return [...unique, ...mockDrives];
      }
    } catch { /* ignore */ }
    return mockDrives;
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "ongoing" | "completed" | "cancelled">("all");

  const filtered =
    statusFilter === "all"
      ? drives
      : drives.filter((d) => d.status === statusFilter);

  const handleCloseDrive = (driveId: string) => {
    setDrives((prev) =>
      prev.map((d) =>
        d.id === driveId ? { ...d, status: "completed" as const } : d
      )
    );
    toast.success("Drive closed successfully");
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">
            Drive Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, manage, and monitor all placement drives
          </p>
        </div>
        <Button
          className="nb-btn-primary"
          onClick={() => navigate("/tpo/drives/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Drive
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "ongoing", "completed"] as const).map((s) => (
          <button
            key={s}
            className={`nb-tag cursor-pointer transition-colors ${
              statusFilter === s
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}              {s !== "all" && (
                <span className="ml-1 text-[10px]">
                  ({drives.filter((d) => d.status === s).length})
                </span>
              )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="nb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-secondary">
                <th className="text-left p-3 font-black text-xs uppercase">
                  Company
                </th>
                <th className="text-left p-3 font-black text-xs uppercase">
                  Role
                </th>
                <th className="text-left p-3 font-black text-xs uppercase">
                  CTC
                </th>
                <th className="text-left p-3 font-black text-xs uppercase hidden lg:table-cell">
                  Drive Date
                </th>
                <th className="text-left p-3 font-black text-xs uppercase hidden lg:table-cell">
                  Deadline
                </th>
                <th className="text-center p-3 font-black text-xs uppercase">
                  Applicants
                </th>
                <th className="text-left p-3 font-black text-xs uppercase">
                  Status
                </th>
                <th className="text-right p-3 font-black text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((drive) => (
                <tr
                  key={drive.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="p-3 font-black">{drive.companyName}</td>
                  <td className="p-3 text-muted-foreground font-bold max-w-[200px] truncate">
                    {drive.roleTitle}
                  </td>
                  <td className="p-3 font-black text-accent">{drive.ctc}</td>
                  <td className="p-3 text-muted-foreground font-bold hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {drive.driveDate}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground font-bold hidden lg:table-cell">
                    {drive.deadline}
                  </td>
                  <td className="p-3 text-center">
                    <span className="nb-tag bg-secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {drive.applicantCount}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`nb-tag ${
                        drive.status === "ongoing"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {drive.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="nb-btn-secondary text-[10px] font-bold px-2 py-1 h-auto"
                        onClick={() =>
                          navigate(`/tpo/drives/${drive.id}/applicants`)
                        }
                      >
                        Applicants
                      </Button>
                      {drive.status === "ongoing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="nb-btn-secondary text-[10px] font-bold px-2 py-1 h-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleCloseDrive(drive.id)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground font-bold">
            No drives match the current filter
          </div>
        )}
      </Card>
    </div>
  );
}
