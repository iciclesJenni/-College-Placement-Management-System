import { X, Lock, ArrowUpRight, ShieldAlert } from "lucide-react";
import {
  TIER_META,
  policyExplanation,
  type DriveTier,
} from "@/lib/placementRules";

interface Props {
  /** Tier of the highest offer the student holds (null when locked via T3) */
  heldTier: DriveTier | null;
  /** Tier of the blocked drive */
  targetTier: DriveTier;
  /** Extra context line, e.g. the failing drive name */
  driveName?: string;
  onClose: () => void;
}

/**
 * One Job Policy warning modal — explains exactly why the application was
 * blocked, shows the tier ladder, and the upgrade path available.
 */
export function PolicyWarningModal({ heldTier, targetTier, driveName, onClose }: Props) {
  const explanation = policyExplanation(heldTier, targetTier);
  const isFrozen = heldTier === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shadow-sm shadow-purple-950/30">
              {isFrozen ? (
                <Lock className="h-4 w-4 text-amber-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <p className="text-xs font-black text-slate-100 leading-tight">
              {explanation.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close policy notice"
            className="w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98] shrink-0"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Explanation */}
          <p className="text-[11px] text-slate-400 leading-relaxed">{explanation.body}</p>

          {driveName && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
              <p className="text-[10px] font-black text-rose-400">
                Blocked: {driveName} (Tier {targetTier})
              </p>
            </div>
          )}

          {/* Tier ladder */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Placement Tier Ladder
            </p>
            {([3, 2, 1] as DriveTier[]).map((t) => {
              const meta = TIER_META[t];
              const held = heldTier === t;
              const reachable = !isFrozen && (heldTier === null || t > heldTier);
              return (
                <div
                  key={t}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                    held
                      ? "border-amber-500/30 bg-amber-500/5"
                      : reachable
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-border bg-secondary/20 opacity-55"
                  }`}
                >
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${meta.chip}`}>
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-200">{meta.longLabel}</p>
                    <p className="text-[9px] text-slate-500">{meta.description}</p>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase tracking-wider shrink-0 ${
                      held ? "text-amber-400" : reachable ? "text-emerald-400" : "text-slate-600"
                    }`}
                  >
                    {held ? "Held" : reachable ? "Open" : "Blocked"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Upgrade path hint */}
          {!isFrozen && heldTier !== null && heldTier < 3 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-600/5 p-3 flex items-start gap-2.5">
              <ArrowUpRight className="h-4 w-4 text-purple-300 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-purple-300 font-black">Upgrade path:</span>{" "}
                You may apply to{" "}
                {heldTier < 2 ? "Dream (Tier 2) and Super Dream (Tier 3)" : "Super Dream (Tier 3)"}{" "}
                drives. Each accepted upgrade replaces your current offer per the One Job Policy.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-[11px] font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
