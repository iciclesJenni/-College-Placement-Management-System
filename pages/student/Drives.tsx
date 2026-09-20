import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DriveCard } from "@/components/dashboard/DriveCard";
import { PolicyWarningModal } from "@/components/dashboard/PolicyWarningModal";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import { checkPlacementRules, type DriveTier } from "@/lib/placementRules";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Search, Briefcase, ShieldAlert } from "lucide-react";
import { track } from "@/services/analytics";

export default function StudentDrives() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drives, setDrives] = useState(mockDrives);
  const currentStudent = mockStudents[0];

  /**
   * One Job Policy standing — the highest tier of an offer the student
   * holds. Demo: a placed student holding a Dream (T2) offer exercises the
   * upgrade path; super-dream holders are frozen. Derived from placement
   * records; null when not placed.
   */
  const heldTier: DriveTier | null = currentStudent.placementStatus === "placed" ? 2 : null;

  const [policyModal, setPolicyModal] = useState<{ heldTier: DriveTier | null; targetTier: DriveTier; driveName: string } | null>(null);

  const appliedDriveIds = new Set(
    mockApplications
      .filter((app) => app.studentId === currentStudent.id)
      .map((app) => app.driveId)
  );

  const filteredDrives = drives.filter(
    (d) =>
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Optimistic apply — the UI flips to "applied" instantly (sub-100ms
   * perceived latency). The real mutation runs in the background; on
   * failure the optimistic state rolls back with a retry toast.
   */
  const handleApply = (driveId: string) => {
    // Snapshot for rollback
    const snapshot = drives;
    setDrives((prev) =>
      prev.map((d) => (d.id === driveId ? { ...d, applied: true } : d))
    );
    toast.success("Application submitted");
    // Conversion event — 1-Click Apply (no PII: drive + company only)
    track("Drive_Applied", {
      driveId,
      company: drives.find((d) => d.id === driveId)?.companyName,
    });
    // Simulated background mutation with rollback on failure
    window.setTimeout(() => {
      const failed = Math.random() < 0; // deterministic success in demo; wire real mutation here
      if (failed) {
        setDrives(snapshot);
        toast.error("Application failed to submit", {
          description: "Your changes were rolled back. Please try again.",
          action: { label: "Retry", onClick: () => handleApply(driveId) },
        });
      }
    }, 400);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight mb-1">
          Placement Drives
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse active company drives and apply to those you qualify for
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 nb-input"
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredDrives.length === 0 && (
        <div className="nb-card p-12 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold">No drives found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different search term or check back later
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredDrives.map((drive) => {
          const ruleResult = checkPlacementRules({
            student: currentStudent,
            drive,
            hasApplied: appliedDriveIds.has(drive.id),
            heldTier,
          });
          const applied = appliedDriveIds.has(drive.id) || drive.applied === true;

          return (
            <DriveCard
              key={drive.id}
              drive={drive}
              eligibility={{ eligible: ruleResult.eligible, reason: ruleResult.reason }}
              ruleResult={ruleResult}
              applied={applied}
              onApply={handleApply}
              onBlockedClick={(id) => {
                const blocked = mockDrives.find((d) => d.id === id);
                if (!blocked) return;
                const failures = ruleResult.failures;
                // Policy locks open the explanatory warning modal; academic
                // gates get a toast with the precise reason.
                if (failures.includes("locked_super_dream") || failures.includes("tier_not_upgradable")) {
                  setPolicyModal({
                    heldTier: ruleResult.lockStatus === "PLACED_LOCKED" ? 3 : heldTier,
                    targetTier: ruleResult.tier,
                    driveName: blocked.companyName,
                  });
                } else {
                  toast.error("Application blocked", { description: ruleResult.reason });
                }
              }}
              onViewStatus={() => navigate("/student/applications")}
            />
          );
        })}
      </div>

      {/* One Job Policy warning modal */}
      {policyModal && (
        <PolicyWarningModal
          heldTier={policyModal.heldTier}
          targetTier={policyModal.targetTier}
          driveName={policyModal.driveName}
          onClose={() => setPolicyModal(null)}
        />
      )}
    </div>
  );
}
