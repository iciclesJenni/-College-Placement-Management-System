/**
 * Centralized Audit Trail & Compliance Logger.
 *
 * Records every critical administrative and recruiter action with a full
 * compliance payload: actor identity, IP address (best-effort in the SPA
 * sandbox), timestamp, action category, target entity, and a structured
 * field-level diff.
 *
 * The ledger is localStorage-backed and event-reactive. `exportAuditCsv`
 * and `exportAuditJson` produce NBA/NAAC-ready compliance submissions.
 *
 * In production the `persist` seam becomes a server mutation writing to an
 * append-only table — the caller contract does not change.
 */

import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuditActionCategory =
  | "VERIFICATION"
  | "PLACEMENT_OVERRIDE"
  | "CGPA_OVERRIDE"
  | "DRIVE_CREATED"
  | "DRIVE_MODIFIED"
  | "DRIVE_CLOSED"
  | "OFFER_RELEASED"
  | "BULK_OFFER_RELEASED"
  | "STAGE_CHANGE"
  | "BROADCAST_PUBLISHED"
  | "VAULT_AUDIT"
  | "AUTH_EVENT";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditActor {
  id: string;
  name: string;
  role: "tpo" | "recruiter" | "student" | "system";
}

export interface AuditDiffEntry {
  field: string;
  before: string;
  after: string;
}

export interface AuditEntry {
  id: string;
  /** Actor — who performed the action */
  actor: AuditActor;
  /** Best-effort client IP (may be masked/absent in sandboxed browsers) */
  ipAddress: string;
  timestamp: number;
  category: AuditActionCategory;
  severity: AuditSeverity;
  /** Human summary of the action */
  action: string;
  /** Target entity */
  targetType: string;
  targetId: string;
  targetLabel: string;
  /** Field-level before/after diff */
  diff: AuditDiffEntry[];
  /** Free-form compliance note */
  note?: string;
}

type Listener = () => void;

const KEY = "placement_portal_audit";
const EVENT_NAME = "placement-audit-change";
const MAX_ENTRIES = 500;

// ─── Store ───────────────────────────────────────────────────────────────────

export function loadAuditLog(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as AuditEntry[];
  } catch {
    return [];
  }
}

function persist(items: AuditEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // storage unavailable — logging must never break the action itself
  }
}

export function subscribeToAudit(listener: Listener): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

// ─── Actor & IP resolution ───────────────────────────────────────────────────

let currentActor: AuditActor = { id: "system", name: "System", role: "system" };

/** Set the acting identity (called on auth state changes / role switches). */
export function setAuditActor(actor: AuditActor): void {
  currentActor = actor;
}

export function getAuditActor(): AuditActor {
  return currentActor;
}

/**
 * Best-effort client IP. Browsers don't expose the public IP directly;
 * this reads any deployment-injected value, falls back to a privacy-safe
 * placeholder. The production seam replaces this with a server-observed
 * `x-forwarded-for` captured in the audit mutation.
 */
export function resolveClientIp(): string {
  try {
    const injected = localStorage.getItem("placement_client_ip");
    if (injected) return injected;
  } catch {
    // ignore
  }
  return "10.0.0.x (client-observed)";
}

// ─── Logging API ─────────────────────────────────────────────────────────────

export interface LogInput {
  category: AuditActionCategory;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  severity?: AuditSeverity;
  diff?: AuditDiffEntry[];
  note?: string;
  /** Override the resolved actor (e.g. recruiter-attributed actions) */
  actor?: AuditActor;
}

/** Build a field-level diff from before/after record snapshots. */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields?: string[],
): AuditDiffEntry[] {
  const keys = fields ?? Object.keys(after);
  const diff: AuditDiffEntry[] = [];
  for (const field of keys) {
    const b = before[field];
    const a = after[field];
    if (String(b) !== String(a)) {
      diff.push({
        field,
        before: b === undefined ? "—" : String(b),
        after: a === undefined ? "—" : String(a),
      });
    }
  }
  return diff;
}

/**
 * Record an audit entry — fire-and-forget; logging failures never block
 * the underlying administrative action.
 */
export function logAudit(input: LogInput): AuditEntry {
  const entry: AuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: input.actor ?? currentActor,
    ipAddress: resolveClientIp(),
    timestamp: Date.now(),
    category: input.category,
    severity: input.severity ?? severityFor(input.category),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    diff: input.diff ?? [],
    note: input.note,
  };
  const items = loadAuditLog();
  items.unshift(entry);
  persist(items);
  return entry;
}

function severityFor(category: AuditActionCategory): AuditSeverity {
  switch (category) {
    case "CGPA_OVERRIDE":
    case "PLACEMENT_OVERRIDE":
    case "BULK_OFFER_RELEASED":
      return "critical";
    case "VERIFICATION":
    case "OFFER_RELEASED":
    case "DRIVE_CLOSED":
    case "VAULT_AUDIT":
      return "warning";
    default:
      return "info";
  }
}

// ─── Filtering ───────────────────────────────────────────────────────────────

export interface AuditFilter {
  searchQuery?: string;
  category?: AuditActionCategory | "ALL";
  severity?: AuditSeverity | "ALL";
  /** Epoch ms window */
  from?: number;
  to?: number;
}

export function filterAuditLog(filter: AuditFilter): AuditEntry[] {
  return loadAuditLog().filter((e) => {
    if (filter.category && filter.category !== "ALL" && e.category !== filter.category)
      return false;
    if (filter.severity && filter.severity !== "ALL" && e.severity !== filter.severity)
      return false;
    if (filter.from && e.timestamp < filter.from) return false;
    if (filter.to && e.timestamp > filter.to) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      return (
        e.actor.name.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.targetLabel.toLowerCase().includes(q) ||
        e.targetType.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

// ─── Compliance exports ──────────────────────────────────────────────────────

function download(content: string, mime: string, filename: string): boolean {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

const CSV_COLUMNS = [
  "Timestamp (ISO)",
  "Actor",
  "Actor Role",
  "IP Address",
  "Category",
  "Severity",
  "Action",
  "Target Type",
  "Target ID",
  "Target Label",
  "Diff",
  "Note",
];

function entryToRow(e: AuditEntry): string[] {
  const diffText =
    e.diff.length > 0
      ? e.diff.map((d) => `${d.field}: ${d.before} → ${d.after}`).join("; ")
      : "—";
  return [
    new Date(e.timestamp).toISOString(),
    e.actor.name,
    e.actor.role,
    e.ipAddress,
    e.category,
    e.severity,
    e.action,
    e.targetType,
    e.targetId,
    e.targetLabel,
    diffText,
    e.note ?? "",
  ];
}

/** Export the (filtered) ledger as a compliance CSV. */
export function exportAuditCsv(entries: AuditEntry[]): boolean {
  const escapeCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    CSV_COLUMNS.map(escapeCell).join(","),
    ...entries.map((e) => entryToRow(e).map(escapeCell).join(",")),
  ].join("\n");
  const ok = download(
    csv,
    "text/csv;charset=utf-8",
    `Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`,
  );
  if (ok) toast.success(`Exported ${entries.length} audit entries (CSV)`);
  return ok;
}

/** Export the (filtered) ledger as structured JSON for NBA/NAAC submissions. */
export function exportAuditJson(entries: AuditEntry[]): boolean {
  const payload = {
    metadata: {
      institution: "College of Engineering — Training & Placement Cell",
      exportPurpose: "NBA/NAAC compliance audit submission",
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      actorContext: currentActor,
    },
    entries: entries.map((e) => ({
      ...e,
      timestampIso: new Date(e.timestamp).toISOString(),
    })),
  };
  const ok = download(
    JSON.stringify(payload, null, 2),
    "application/json",
    `Audit_Trail_${new Date().toISOString().split("T")[0]}.json`,
  );
  if (ok) toast.success(`Exported ${entries.length} audit entries (JSON)`);
  return ok;
}
