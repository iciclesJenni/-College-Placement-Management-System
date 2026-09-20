/**
 * Automated Offer Letter Generation & Digital Verification Service.
 *
 * Generates PDF offer letters on offer extension using candidate details
 * (name, roll number, CTC, joining date), produces SHA-256 verification
 * hashes for tamper-evidence, and issues secure download links for
 * accepted offers.
 *
 * PDF generation is fully client-side (print-window pipeline — no
 * dependency, no network). The same document model a server-side
 * pdfkit/puppeteer renderer would expose, so it can be swapped for a
 * hosted generator later without touching callers.
 */

import type { StudentProfile, Drive } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OfferLetterInput {
  student: StudentProfile;
  drive: Drive;
  /** Formatted CTC string, e.g. "₹18 LPA" */
  ctc: string;
  /** ISO date of joining */
  joiningDate: string;
  /** Offer identifier */
  offerId: string;
}

export interface OfferLetterDocument {
  offerId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  companyName: string;
  roleTitle: string;
  ctc: string;
  joiningDate: string;
  /** ISO timestamp of generation */
  issuedAt: string;
  /** SHA-256 hex hash binding candidate + offer terms (tamper-evidence) */
  verificationHash: string;
  /** Human-verifiable short code printed on the letter */
  verificationCode: string;
  /** Secure (signed-in) download path */
  downloadUrl: string;
}

// ─── Hashing (Web Crypto — async SHA-256) ────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Short URL-safe verification code derived from the hash. */
function shortCode(hash: string): string {
  return hash.slice(0, 4).toUpperCase() + "-" + hash.slice(4, 8).toUpperCase();
}

// ─── Generation ──────────────────────────────────────────────────────────────

/**
 * Generate an offer letter document: computes the verification hash over
 * the canonical terms (candidate identity + company + CTC + joining date +
 * issue time) and returns the full document record.
 */
export async function generateOfferLetter(input: OfferLetterInput): Promise<OfferLetterDocument> {
  const { student, drive, ctc, joiningDate, offerId } = input;
  const issuedAt = new Date().toISOString();

  const canonical = [
    offerId,
    student.rollNumber,
    student.name,
    student.email,
    drive.companyName,
    drive.roleTitle,
    ctc,
    joiningDate,
    issuedAt,
  ].join("|");

  const verificationHash = await sha256Hex(canonical);

  return {
    offerId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    companyName: drive.companyName,
    roleTitle: drive.roleTitle,
    ctc,
    joiningDate,
    issuedAt,
    verificationHash,
    verificationCode: shortCode(verificationHash),
    downloadUrl: `/student/vault?doc=offer-${offerId}`,
  };
}

// ─── PDF rendering (print-window pipeline) ──────────────────────────────────

/** Format an ISO date as "18 September 2026". */
function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Render the offer letter HTML (used by the print pipeline and the
 * in-app PDF preview modal).
 */
export function renderOfferLetterHtml(doc: OfferLetterDocument): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Offer Letter — ${escape(doc.studentName)} — ${escape(doc.companyName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; background: #fff; padding: 48px 56px; max-width: 800px; margin: 0 auto; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 32px; }
  .company { font-size: 22px; font-weight: 700; color: #4c1d95; letter-spacing: 0.5px; }
  .company-sub { font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; }
  .ref { font-size: 11px; color: #6b7280; text-align: right; line-height: 1.6; }
  h1 { font-size: 18px; margin-bottom: 24px; color: #1a1a2e; }
  p { font-size: 13px; line-height: 1.75; margin-bottom: 14px; }
  .terms { width: 100%; border-collapse: collapse; margin: 20px 0 28px; }
  .terms td { border: 1px solid #e5e7eb; padding: 10px 14px; font-size: 12.5px; }
  .terms td:first-child { font-weight: 700; width: 38%; color: #4c1d95; background: #faf8ff; }
  .highlight { color: #b45309; font-weight: 700; }
  .verify { margin-top: 32px; border: 1px dashed #7c3aed; border-radius: 8px; padding: 14px 18px; font-family: monospace; font-size: 10.5px; color: #4b5563; line-height: 1.7; word-break: break-all; }
  .verify strong { color: #7c3aed; }
  .signature { margin-top: 48px; display: flex; justify-content: space-between; }
  .sig-line { border-top: 1px solid #1a1a2e; padding-top: 6px; font-size: 11.5px; width: 220px; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="letterhead">
    <div>
      <div class="company">${escape(doc.companyName)}</div>
      <div class="company-sub">Training &amp; Placement Division</div>
    </div>
    <div class="ref">
      Ref: ${escape(doc.offerId)}<br/>
      Date: ${formatLongDate(doc.issuedAt)}
    </div>
  </div>

  <h1>Letter of Offer</h1>

  <p>${escape(doc.studentName)} (${escape(doc.rollNumber)})</p>

  <p>Dear ${escape(doc.studentName.split(" ")[0])},</p>

  <p>
    We are pleased to extend an offer of employment for the position of
    <strong>${escape(doc.roleTitle)}</strong> with ${escape(doc.companyName)},
    extended through the campus placement program. Congratulations on your outstanding performance
    throughout our evaluation process.
  </p>

  <table class="terms">
    <tr><td>Position</td><td>${escape(doc.roleTitle)}</td></tr>
    <tr><td>Annual Compensation</td><td class="highlight">${escape(doc.ctc)}</td></tr>
    <tr><td>Date of Joining</td><td>${formatLongDate(doc.joiningDate)}</td></tr>
    <tr><td>Candidate Roll Number</td><td>${escape(doc.rollNumber)}</td></tr>
  </table>

  <p>
    This offer is contingent upon the successful completion of your current academic program and
    verification of your academic records by the institution's Training &amp; Placement Cell.
  </p>

  <div class="verify">
    <strong>DIGITAL VERIFICATION</strong><br/>
    Code: ${escape(doc.verificationCode)} &nbsp;•&nbsp; Issued: ${escape(doc.issuedAt)}<br/>
    SHA-256: ${escape(doc.verificationHash)}
  </div>

  <div class="signature">
    <div class="sig-line">Authorised Signatory<br/>${escape(doc.companyName)}</div>
    <div class="sig-line">Verified by<br/>Training &amp; Placement Cell</div>
  </div>
</body>
</html>`;
}

/**
 * Open the offer letter in a print window — the browser's native
 * "Save as PDF" produces the final document. Falls back to a new tab.
 */
export function downloadOfferLetterPdf(doc: OfferLetterDocument): boolean {
  try {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return false;
    win.document.write(renderOfferLetterHtml(doc));
    win.document.close();
    win.focus();
    // Give the window a beat to paint before the print dialog
    window.setTimeout(() => {
      try {
        win.print();
      } catch {
        /* user can print manually */
      }
    }, 400);
    return true;
  } catch {
    return false;
  }
}

// ─── Vault store (localStorage-backed document registry) ────────────────────

export interface VaultDocument {
  id: string;
  kind: "offer_letter" | "transcript" | "marksheet" | "certificate" | "resume";
  title: string;
  studentId: string;
  uploadedAt: number;
  /** SHA-256 integrity hash (offers) or simulated content hash (uploads) */
  hash: string;
  /** TPO audit pipeline */
  auditStatus: "pending" | "approved" | "flagged";
  auditNote?: string;
  /** For generated offers — full letter record for re-rendering */
  offer?: OfferLetterDocument;
  fileSizeKb: number;
}

const VAULT_KEY = "placement_portal_vault";

export function loadVault(studentId?: string): VaultDocument[] {
  try {
    const all = JSON.parse(localStorage.getItem(VAULT_KEY) || "[]") as VaultDocument[];
    return studentId ? all.filter((d) => d.studentId === studentId) : all;
  } catch {
    return [];
  }
}

function saveVault(docs: VaultDocument[]): void {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(docs.slice(0, 100)));
    window.dispatchEvent(new Event("placement-vault-change"));
  } catch {
    // storage unavailable
  }
}

export function addToVault(doc: VaultDocument): void {
  saveVault([doc, ...loadVault()]);
}

export function updateVaultAudit(docId: string, auditStatus: VaultDocument["auditStatus"], auditNote?: string): void {
  saveVault(
    loadVault().map((d) => (d.id === docId ? { ...d, auditStatus, auditNote } : d)),
  );
}

export function removeFromVault(docId: string): void {
  saveVault(loadVault().filter((d) => d.id !== docId));
}

/** Integrity hash for uploaded documents (content-based when available). */
export async function hashFile(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback: metadata hash
    return sha256Hex(`${file.name}:${file.size}:${file.lastModified}`);
  }
}
