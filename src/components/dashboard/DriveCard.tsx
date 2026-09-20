import { Button } from "@/components/ui/button";
import type { Drive, EligibilityResult } from "@/types";
import {
  Clock,
  MapPin,
  ArrowRight,
  ExternalLink,
  FileText,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { daysUntilDeadline } from "@/lib/eligibility";
import { getDriveTier, TIER_META, type RuleCheckResult } from "@/lib/placementRules";

interface DriveCardProps {
  drive: Drive;
  eligibility: EligibilityResult;
  /** Full institutional rule result — enables lock tooltips + tier badges */
  ruleResult?: RuleCheckResult;
  applied?: boolean;
  onApply?: (driveId: string) => void;
  onBlockedClick?: (driveId: string) => void;
  onViewStatus?: () => void;
}

export function DriveCard({
  drive,
  eligibility,
  ruleResult,
  applied = false,
  onApply,
  onBlockedClick,
  onViewStatus,
}: DriveCardProps) {
  const daysLeft = daysUntilDeadline(drive.deadlineTimestamp);
  const tier = getDriveTier(drive);
  const tierMeta = TIER_META[tier];

  // Rule-engine state takes precedence over the legacy eligibility shape
  const locked = ruleResult ? !ruleResult.eligible : !eligibility.eligible;
  const reason = ruleResult?.reason ?? eligibility.reason;
  const tag = ruleResult?.tag ?? "Ineligible";
  const isLock = ruleResult?.failures.some(
    (f) => f === "locked_super_dream" || f === "tier_not_upgradable",
  );

  return (
    <div className="nb-card nb-card-hover overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-black text-lg">{drive.companyName}</h3>
                {/* Tier badge */}
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${tierMeta.chip}`}
                  title={`${tierMeta.longLabel} — ${tierMeta.description}`}
                >
                  {tierMeta.label} · {tierMeta.longLabel}
                </span>
                {applied && (
                  <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    Applied
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                {drive.roleTitle}
              </p>
            </div>
            <div className="text-right">
              <div className={`font-black text-xl ${tier === 3 ? "text-amber-400" : "text-accent"}`}>
                {drive.ctc}
              </div>
              <div className="text-xs text-muted-foreground font-bold">CTC</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {drive.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="nb-tag bg-secondary">
              <MapPin className="h-3 w-3 mr-1" />
              {drive.driveDate}
            </span>
            <span className="nb-tag bg-secondary">
              CGPA ≥ {drive.minCgpa}
            </span>
            <span className="nb-tag bg-secondary">
              Backlogs ≤ {drive.maxActiveBacklogs}
            </span>
            <span className="nb-tag bg-secondary">
              {drive.allowedBranches.join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-bold">
              <Clock className="h-3 w-3" />
              {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
            </span>
            <span className="flex items-center gap-1 font-bold">
              <FileText className="h-3 w-3" />
              {drive.rounds.length} rounds
            </span>
          </div>
        </div>

        <div className="sm:w-44 border-t-2 sm:border-t-0 sm:border-l-2 border-border p-4 flex flex-col items-center justify-center gap-3">
          {applied ? (
            <Button
              variant="outline"
              className="nb-btn-secondary w-full"
              onClick={onViewStatus}
            >
              View Status
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : !locked ? (
            <Button
              className="nb-btn-primary w-full"
              onClick={() => onApply?.(drive.id)}
            >
              1-Click Apply Now
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            /* Disabled status tag with explanatory tooltip */
            <div className="w-full group relative">
              <button
                onClick={() => onBlockedClick?.(drive.id)}
                className={`w-full text-[10px] font-black px-3 py-2.5 rounded-xl border cursor-not-allowed inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  isLock
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                {isLock ? <Lock className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                <span className="truncate">{tag}</span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block z-20">
                <div className="rounded-xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md p-3 shadow-lg shadow-purple-950/40">
                  <p className="text-[10px] font-black text-slate-100 flex items-center gap-1.5 mb-1">
                    {isLock ? (
                      <>
                        <Lock className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-400">Policy Restriction</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3 text-rose-400" />
                        <span className="text-rose-400">Eligibility Check Failed</span>
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{reason}</p>
                </div>
              </div>
            </div>
          )}
          {drive.website && (
            <a
              href={drive.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold"
            >
              <ExternalLink className="h-3 w-3" />
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
