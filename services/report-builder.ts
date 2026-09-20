/**
 * Institutional Placement Report Builder — NAAC/NBA accreditation formats.
 *
 * Aggregates batch summaries, company-wise CTC distributions, and
 * departmental placement rates into audit-ready documents, then exports:
 *
 *   • PDF  — print-window pipeline (browser "Save as PDF"), styled to the
 *     institutional letterhead with gold verification footer.
 *   • Excel — multi-sheet .xls workbook via the HTML-table transport
 *     (opens natively in Excel / LibreOffice / Google Sheets, no deps).
 *
 * Pure client-side: no network, no API keys.
 */

import type { StudentProfile, Drive, Application } from "@/types";

// ─── Report data model ───────────────────────────────────────────────────────

export interface DepartmentRow {
  department: string;
  total: number;
  placed: number;
  percentage: number;
  highestCtc: number;
  averageCtc: number;
}

export interface CompanyRow {
  companyName: string;
  roleTitle: string;
  ctc: number;
  offers: number;
  studentsPlaced: number;
}

export interface BatchSummary {
  graduationYear: number;
  registered: number;
  placed: number;
  percentage: number;
  highestCtc: number;
  averageCtc: number;
  medianCtc: number;
}

export interface ReportData {
  batch: BatchSummary;
  departments: DepartmentRow[];
  companies: CompanyRow[];
  generatedAt: string;
}

export type ReportSection = "batch" | "departments" | "companies";

/** Aggregate the full report dataset from live/mock platform records. */
export function buildReportData(
  students: StudentProfile[],
  drives: Drive[],
  applications: Application[],
): ReportData {
  const placedStudents = students.filter((s) => s.placementStatus === "placed");

  // ── Batch summary (all reported students) ──
  const ctcs = placedStudents
    .map((s) => {
      const app = applications.find(
        (a) => a.studentId === s.id && a.status === "offered",
      );
      const drive = drives.find((d) => d.id === app?.driveId);
      return drive?.ctcLpa ?? 0;
    })
    .filter((c) => c > 0);

  const sorted = [...ctcs].sort((a, b) => a - b);
  const median = sorted.length > 0
    ? sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : 0;

  const batch: BatchSummary = {
    graduationYear: students[0]?.graduationYear ?? new Date().getFullYear(),
    registered: students.length,
    placed: placedStudents.length,
    percentage: students.length > 0
      ? Math.round((placedStudents.length / students.length) * 1000) / 10
      : 0,
    highestCtc: ctcs.length > 0 ? Math.max(...ctcs) : 0,
    averageCtc: ctcs.length > 0
      ? Math.round((ctcs.reduce((a, b) => a + b, 0) / ctcs.length) * 100) / 100
      : 0,
    medianCtc: median,
  };

  // ── Departmental rows ──
  const departmentsMap = new Map<string, StudentProfile[]>();
  for (const s of students) {
    const list = departmentsMap.get(s.department) ?? [];
    list.push(s);
    departmentsMap.set(s.department, list);
  }

  const departments: DepartmentRow[] = Array.from(departmentsMap.entries())
    .map(([department, list]) => {
      const placedList = list.filter((s) => s.placementStatus === "placed");
      const deptCtcs = placedList.map((s) => {
        const app = applications.find(
          (a) => a.studentId === s.id && a.status === "offered",
        );
        const drive = drives.find((d) => d.id === app?.driveId);
        return drive?.ctcLpa ?? 0;
      }).filter((c) => c > 0);
      return {
        department,
        total: list.length,
        placed: placedList.length,
        percentage: list.length > 0
          ? Math.round((placedList.length / list.length) * 1000) / 10
          : 0,
        highestCtc: deptCtcs.length > 0 ? Math.max(...deptCtcs) : 0,
        averageCtc: deptCtcs.length > 0
          ? Math.round((deptCtcs.reduce((a, b) => a + b, 0) / deptCtcs.length) * 100) / 100
          : 0,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // ── Company-wise rows (offers per drive) ──
  const companies: CompanyRow[] = drives
    .map((drive) => {
      const offers = applications.filter(
        (a) => a.driveId === drive.id && a.status === "offered",
      );
      const uniqueStudents = new Set(offers.map((o) => o.studentId));
      return {
        companyName: drive.companyName,
        roleTitle: drive.roleTitle,
        ctc: drive.ctcLpa,
        offers: offers.length,
        studentsPlaced: uniqueStudents.size,
      };
    })
    .filter((c) => c.offers > 0)
    .sort((a, b) => b.ctc - a.ctc);

  return {
    batch,
    departments,
    companies,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Shared HTML rendering ───────────────────────────────────────────────────

const INSTITUTION = "College of Engineering — Training & Placement Cell";

function reportCss(): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; background: #fff; padding: 44px 52px; max-width: 900px; margin: 0 auto; }
  .letterhead { border-bottom: 3px solid #7c3aed; padding-bottom: 14px; margin-bottom: 8px; }
  .inst { font-size: 20px; font-weight: 700; color: #4c1d95; letter-spacing: 0.4px; }
  .inst-sub { font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.6px; }
  h1 { font-size: 16px; margin: 22px 0 4px; color: #1a1a2e; }
  .meta { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
  h2 { font-size: 13px; margin: 26px 0 10px; color: #4c1d95; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #f5f1fe; color: #4c1d95; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px; text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; }
  td { font-size: 12px; padding: 7px 10px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #fafafe; }
  .gold { color: #b45309; font-weight: 700; }
  .summary-grid { width: 100%; border-collapse: collapse; margin: 6px 0 4px; }
  .summary-grid td { border: 1px solid #e5e7eb; padding: 10px 12px; font-size: 12px; }
  .summary-grid .k { font-weight: 700; color: #4c1d95; width: 45%; background: #faf8ff; }
  .verify { margin-top: 30px; border: 1px dashed #7c3aed; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 10px; color: #4b5563; line-height: 1.7; word-break: break-all; }
  .verify strong { color: #7c3aed; }
  .footer { margin-top: 26px; display: flex; justify-content: space-between; }
  .sig-line { border-top: 1px solid #1a1a2e; padding-top: 6px; font-size: 11px; width: 230px; }
  @media print { body { padding: 20px; } }
  `;
}

function reportSectionsHtml(data: ReportData, sections: ReportSection[]): string {
  const parts: string[] = [];

  if (sections.includes("batch")) {
    parts.push(`
      <h2>Batch Summary — Class of ${data.batch.graduationYear}</h2>
      <table class="summary-grid">
        <tr><td class="k">Students Registered</td><td>${data.batch.registered}</td></tr>
        <tr><td class="k">Students Placed</td><td>${data.batch.placed}</td></tr>
        <tr><td class="k">Placement Percentage</td><td class="gold">${data.batch.percentage}%</td></tr>
        <tr><td class="k">Highest Package (CTC)</td><td class="gold">₹${data.batch.highestCtc} LPA</td></tr>
        <tr><td class="k">Average Package</td><td>₹${data.batch.averageCtc} LPA</td></tr>
        <tr><td class="k">Median Package</td><td>₹${data.batch.medianCtc} LPA</td></tr>
      </table>`);
  }

  if (sections.includes("departments")) {
    parts.push(`
      <h2>Departmental Placement Rates</h2>
      <table>
        <tr><th>Department</th><th>Registered</th><th>Placed</th><th>Rate</th><th>Highest CTC</th><th>Avg CTC</th></tr>
        ${data.departments.map(
          (d) => `<tr><td>${d.department}</td><td>${d.total}</td><td>${d.placed}</td><td class="gold">${d.percentage}%</td><td>₹${d.highestCtc} LPA</td><td>₹${d.averageCtc} LPA</td></tr>`,
        ).join("")}
      </table>`);
  }

  if (sections.includes("companies")) {
    parts.push(`
      <h2>Company-wise CTC Distribution</h2>
      <table>
        <tr><th>Company</th><th>Role</th><th>CTC (LPA)</th><th>Offers</th><th>Students Placed</th></tr>
        ${data.companies.map(
          (c) => `<tr><td>${c.companyName}</td><td>${c.roleTitle}</td><td class="gold">${c.ctc}</td><td>${c.offers}</td><td>${c.studentsPlaced}</td></tr>`,
        ).join("")}
      </table>`);
  }

  return parts.join("\n");
}

// ─── PDF export ──────────────────────────────────────────────────────────────

export function exportReportPdf(data: ReportData, sections: ReportSection[]): boolean {
  try {
    const shortHash = data.generatedAt.slice(0, 10).replace(/-/g, "") +
      String(data.batch.placed).padStart(3, "0");
    const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>Placement Report ${data.batch.graduationYear}</title>
<style>${reportCss()}</style></head><body>
  <div class="letterhead">
    <div class="inst">${INSTITUTION}</div>
    <div class="inst-sub">Institutional Placement Audit Report</div>
  </div>
  <h1>Annual Placement Report — Class of ${data.batch.graduationYear}</h1>
  <div class="meta">Prepared for NAAC / NBA accreditation • Generated ${new Date(data.generatedAt).toLocaleString("en-IN")}</div>
  ${reportSectionsHtml(data, sections)}
  <div class="verify">
    <strong>DOCUMENT VERIFICATION</strong><br/>
    Report ID: PLR-${shortHash} • Generated: ${data.generatedAt}<br/>
    Figures compiled from the institutional placement management system and reflect all recorded offers as of the generation timestamp.
  </div>
  <div class="footer">
    <div class="sig-line">Training &amp; Placement Officer</div>
    <div class="sig-line">Head — Placements</div>
  </div>
</body></html>`;

    const win = window.open("", "_blank", "width=920,height=1000");
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      try {
        win.print();
      } catch {
        /* manual print */
      }
    }, 450);
    return true;
  } catch {
    return false;
  }
}

// ─── Excel export (multi-sheet .xls HTML workbook) ──────────────────────────

function sheetHtml(name: string, rows: string[][]): string {
  const body = rows
    .map(
      (row, i) =>
        `<tr>${row
          .map((cell) => `<td style="${i === 0 ? "background:#4c1d95;color:#fff;font-weight:700;" : ""}">${cell}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<h3>${name}</h3><table>${body}</table><br/>`;
}

/** Export a multi-sheet workbook (Excel-compatible .xls via HTML transport). */
export function exportReportExcel(data: ReportData, sections: ReportSection[]): boolean {
  try {
    const sheets: string[] = [];

    if (sections.includes("batch")) {
      sheets.push(
        sheetHtml(`Batch Summary ${data.batch.graduationYear}`, [
          ["Metric", "Value"],
          ["Students Registered", String(data.batch.registered)],
          ["Students Placed", String(data.batch.placed)],
          ["Placement %", `${data.batch.percentage}%`],
          ["Highest CTC (LPA)", String(data.batch.highestCtc)],
          ["Average CTC (LPA)", String(data.batch.averageCtc)],
          ["Median CTC (LPA)", String(data.batch.medianCtc)],
        ]),
      );
    }

    if (sections.includes("departments")) {
      sheets.push(
        sheetHtml("Departmental Rates", [
          ["Department", "Registered", "Placed", "Rate %", "Highest CTC", "Avg CTC"],
          ...data.departments.map((d) => [
            d.department,
            String(d.total),
            String(d.placed),
            String(d.percentage),
            String(d.highestCtc),
            String(d.averageCtc),
          ]),
        ]),
      );
    }

    if (sections.includes("companies")) {
      sheets.push(
        sheetHtml("Company CTC Distribution", [
          ["Company", "Role", "CTC (LPA)", "Offers", "Students Placed"],
          ...data.companies.map((c) => [
            c.companyName,
            c.roleTitle,
            String(c.ctc),
            String(c.offers),
            String(c.studentsPlaced),
          ]),
        ]),
      );
    }

    const workbook = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>${sheets
      .map(
        (_, i) =>
          `<x:ExcelWorksheet><x:Name>Sheet${i + 1}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`,
      )
      .join("")}</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>table{border-collapse:collapse;}td{border:1px solid #999;padding:4px 8px;font-family:Calibri,sans-serif;font-size:12px;}</style>
</head><body>${sheets.join("\n")}</body></html>`;

    const blob = new Blob(["\ufeff" + workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Placement_Report_${data.batch.graduationYear}_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
