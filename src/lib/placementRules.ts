/**
 * Institutional Placement Rule & Eligibility Engine.
 *
 * Implements the college's tier-based placement policy on top of the
 * base eligibility checks:
 *
 *   ── Drive Tiers ──────────────────────────────────────────
 *   Tier 1 · Core/Regular  — CTC below 6 LPA
 *   Tier 2 · Dream         — CTC from 6 up to 10 LPA
 *   Tier 3 · Super Dream   — CTC above 10 LPA
 *
 *   ── One Job Policy ───────────────────────────────────────
 *   • A student placed in Tier 1 may upgrade: apply only to Tier 2/3 drives.
 *   • A student holding a Tier 2 (Dream) offer may try only Tier 3.
 *   • Once a Super Dream offer is accepted the student is frozen
 *     (PLACED_LOCKED) — no further applications anywhere.
 *
 *   ── Hard academic gates ──────────────────────────────────
 *   CGPA below the drive cutoff or active backlogs above the drive
 *   threshold block submission with clear real-time reasons.
 *
 * Pure functions, shared by the student dashboard guard and the server-side
 * application mutation.
 */

import type { StudentProfile, Drive } from "@/types";

// ─── Tiers ───────────────────────────────────────────────────────────────────

export type DriveTier = 1 | 2 | 3;

export interface TierMeta {
  tier: DriveTier;
  label: string;
  longLabel: string;
  /** Chip styling — gold for the top tier */
  chip: string;
  description: string;
}

export const TIER_META: Record<DriveTier, TierMeta> = {
  1: {
    tier: 1,
    label: "Tier 1",
    longLabel: "Core / Regular",
    chip: "text-slate-300 bg-secondary border-border",
    description: "CTC below ₹6 LPA",
  },
  2: {
    tier: 2,
    label: "Tier 2",
    longLabel: "Dream",
    chip: "text-purple-300 bg-purple-600/10 border-purple-500/30",
    description: "CTC ₹6 – ₹10 LPA",
  },
  3: {
    tier: 3,
    label: "Tier 3",
    longLabel: "Super Dream",
    chip: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    description: "CTC above ₹10 LPA",
  },
};

/** Classify a drive into its policy tier from the CTC (LPA). */
export function getDriveTier(drive: Pick<Drive, "ctcLpa">): DriveTier {
  if (drive.ctcLpa > 10) return 3;
  if (drive.ctcLpa >= 6) return 2;
  return 1;
}

/** Highest tier of an offer the student currently holds. */
export type PlacementLockStatus = "none" | "PLACED_UPGRADABLE" | "PLACED_LOCKED";

/**
 * Resolve the student's policy standing:
 *  - none              → free to apply anywhere eligible
 *  - PLACED_UPGRADABLE → holds a T1/T2 offer; may only apply up-tier
 *  - PLACED_LOCKED     → holds a Super Dream offer; frozen from applying
 *
 * `heldTier` comes from the highest accepted/current offer, or the
 * student's placement record when no explicit tier is known.
 */
export function getLockStatus(
  student: Pick<StudentProfile, "placementStatus">,
  heldTier?: DriveTier | null,
): PlacementLockStatus {
  if (student.placementStatus !== "placed") return "none";
  // Explicit held tier drives the decision; default assumes Tier 1 offer
  // (upgradable) unless the placement cell has recorded a Super Dream hit.
  if (heldTier === 3) return "PLACED_LOCKED";
  return "PLACED_UPGRADABLE";
}

// ─── Rule evaluation ─────────────────────────────────────────────────────────

export type RuleFailureCode =
  | "cgpa_below_cutoff"
  | "backlogs_exceeded"
  | "department_not_allowed"
  | "drive_closed"
  | "already_applied"
  | "locked_super_dream"
  | "tier_not_upgradable"
  | "opted_out";

export interface RuleCheckResult {
  eligible: boolean;
  /** Human-readable reason (shown on tooltips / rejection toasts) */
  reason: string;
  /** Short tag text for the disabled apply button */
  tag: string;
  failures: RuleFailureCode[];
  tier: DriveTier;
  lockStatus: PlacementLockStatus;
}

function reasonFor(
  code: RuleFailureCode,
  student: StudentProfile,
  drive: Drive,
  tier: DriveTier,
): { reason: string; tag: string } {
  switch (code) {
    case "locked_super_dream":
      return {
        reason: `Locked: You hold a Super Dream (Tier 3) offer — the placement policy freezes further applications once a Super Dream offer is accepted.`,
        tag: "Locked: Super Dream",
      };
    case "tier_not_upgradable": {
      const heldLabel = TIER_META[(Math.max(1, tier - 1)) as DriveTier].longLabel;
      return {
        reason: `Policy: You hold a ${heldLabel} offer — the One Job Policy allows applying only to higher tiers (this drive is Tier ${tier}).`,
        tag: `Locked: ${heldLabel} Tier`,
      };
    }
    case "cgpa_below_cutoff":
      return {
        reason: `Ineligible: Requires Min ${drive.minCgpa} CGPA — your CGPA is ${student.cgpa.toFixed(2)}.`,
        tag: `Requires Min ${drive.minCgpa} CGPA`,
      };
    case "backlogs_exceeded":
      return {
        reason: `Ineligible: ${student.activeBacklogs} active backlog${student.activeBacklogs !== 1 ? "s" : ""} exceed the drive limit of ${drive.maxActiveBacklogs}.`,
        tag: `Max ${drive.maxActiveBacklogs} Backlogs`,
      };
    case "department_not_allowed":
      return {
        reason: `Ineligible: ${student.department} branch is not in the allowed list (${drive.allowedBranches.join(", ")}).`,
        tag: `Branch restricted`,
      };
    case "drive_closed":
      return {
        reason: `Applications closed — the deadline for this drive has passed.`,
        tag: "Applications Closed",
      };
    case "already_applied":
      return {
        reason: `You have already applied to this drive.`,
        tag: "Applied",
      };
    case "opted_out":
      return {
        reason: `You have opted out of the placement process.`,
        tag: "Opted Out",
      };
  }
}

export interface RuleCheckInput {
  student: StudentProfile;
  drive: Drive;
  /** Student has already applied to this drive */
  hasApplied?: boolean;
  /** Tier of the highest offer the student currently holds (if placed) */
  heldTier?: DriveTier | null;
  /** Drive is accepting applications */
  isDriveActive?: boolean;
}

/**
 * Full institutional rule check — academic gates + One Job Policy.
 * Returns a structured result for tooltips, disabled tags, and server
 * validation. Failures are ordered: lock/policy reasons first, then
 * academic gates.
 */
export function checkPlacementRules(input: RuleCheckInput): RuleCheckResult {
  const { student, drive, hasApplied, heldTier, isDriveActive = true } = input;
  const tier = getDriveTier(drive);
  const lockStatus = getLockStatus(student, heldTier);

  const failures: RuleFailureCode[] = [];

  // ── One Job Policy (tier locks) ──
  if (lockStatus === "PLACED_LOCKED") {
    failures.push("locked_super_dream");
  } else if (lockStatus === "PLACED_UPGRADABLE") {
    // Upgradable students may only try higher tiers
    if (heldTier != null && tier <= heldTier) {
      failures.push("tier_not_upgradable");
    }
  }

  // ── Hard academic gates ──
  if (student.cgpa < drive.minCgpa) failures.push("cgpa_below_cutoff");
  if (student.activeBacklogs > drive.maxActiveBacklogs) failures.push("backlogs_exceeded");
  if (!drive.allowedBranches.includes(student.department)) failures.push("department_not_allowed");
  if (!isDriveActive || drive.status !== "ongoing") failures.push("drive_closed");
  if (hasApplied) failures.push("already_applied");
  if (student.placementStatus === "opted_out") failures.push("opted_out");

  if (failures.length === 0) {
    return {
      eligible: true,
      reason: `Eligible — ${TIER_META[tier].longLabel} (Tier ${tier})`,
      tag: "Apply Now",
      failures: [],
      tier,
      lockStatus,
    };
  }

  const { reason, tag } = reasonFor(failures[0], student, drive, tier);
  return { eligible: false, reason, tag, failures, tier, lockStatus };
}

/** Convenience wrapper — the plain eligible/reason shape. */
export function checkRules(
  student: StudentProfile,
  drive: Drive,
  hasApplied?: boolean,
  heldTier?: DriveTier | null,
): { eligible: boolean; reason: string } {
  const r = checkPlacementRules({ student, drive, hasApplied, heldTier });
  return { eligible: r.eligible, reason: r.reason };
}

// ─── Policy explanation (warning modal content) ──────────────────────────────

/** Structured explanation for the One Job Policy warning modal. */
export function policyExplanation(
  heldTier: DriveTier | null,
  targetTier: DriveTier,
): { title: string; body: string } {
  if (heldTier === 3) {
    return {
      title: "Placement Locked — Super Dream Offer Held",
      body: `You have accepted a Super Dream (Tier 3) offer. Under the institutional One Job Policy, students holding a Super Dream offer are frozen (PLACED_LOCKED) from all further applications. Contact the TPO office for exceptional circumstances.`,
    };
  }
  const heldLabel = heldTier ? TIER_META[heldTier].longLabel : "a lower";
  return {
    title: `One Job Policy — ${heldLabel} Offer Held`,
    body: `You currently hold a ${heldLabel} offer. The institutional policy permits applying only to higher tiers: you may target Dream (Tier 2) and Super Dream (Tier 3) drives. This drive is Tier ${targetTier} and does not represent an upgrade, so the application is blocked.`,
  };
}
