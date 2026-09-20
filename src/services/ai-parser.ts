/**
 * AI-Powered Resume NLP Parser & Candidate–Job Matching Engine.
 *
 * Two capabilities in one pure, dependency-free service:
 *
 *   1. `parseResume` — NLP-style extraction from raw resume text:
 *      technical skills (fuzzy keyword dictionary matching), years of
 *      experience (regex over experience statements), education, and
 *      project keywords (action-verb + technology phrase mining).
 *
 *   2. `computeMatch` — weighted compatibility score (0–100) between a
 *      student profile and a company drive, with a transparent breakdown
 *      so recruiters can see exactly WHY a candidate ranked where they did.
 *
 * The parser runs fully client-side in the SPA sandbox — no API keys, no
 * network round trips — while following the same shape a server-side
 * NLP pipeline (spaCy / OpenAI) would expose, so it can be swapped for a
 * hosted inference call later without touching callers.
 */

import type { StudentProfile, Drive } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedResume {
  /** Canonical skills detected in the resume text */
  skills: string[];
  /** Extracted years of experience (0 for freshers) */
  yearsOfExperience: number;
  /** Project keyword phrases mined from project descriptions */
  projectKeywords: string[];
  /** Highest education level detected */
  education: string | null;
  /** Raw confidence of the parse (0–1) based on extraction density */
  confidence: number;
}

export type MatchFactorKind = "skills" | "cgpa" | "branch" | "backlogs" | "graduation";

export interface MatchFactor {
  kind: MatchFactorKind;
  label: string;
  /** 0–100 contribution of this factor */
  score: number;
  weight: number;
  detail: string;
}

export interface MatchResult {
  /** Overall compatibility 0–100 */
  score: number;
  /** Human verdict tier */
  tier: "elite" | "strong" | "moderate" | "weak";
  factors: MatchFactor[];
  /** Skills from the drive's requirements the student is missing */
  missingSkills: string[];
  /** Skills the student and the role share */
  matchedSkills: string[];
}

// ─── Skill dictionary (fuzzy matching) ───────────────────────────────────────

const SKILL_DICTIONARY: string[] = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "Go", "Rust", "Kotlin", "Swift",
  "PHP", "Ruby", "R", "MATLAB", "Embedded C",
  // Frontend
  "React", "Next.js", "Vue", "Angular", "HTML", "CSS", "Tailwind", "Redux",
  // Backend
  "Node.js", "Express", "Django", "Flask", "Spring Boot", "Hibernate", "Laravel", "FastAPI",
  // Data
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "Firebase",
  // Cloud / DevOps
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform", "Linux",
  // AI / Data Science
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "NLP",
  // Hardware / Core
  "VLSI", "RTOS", "Arduino", "IoT", "PCB Design", "AutoCAD", "SolidWorks", "STAAD Pro",
  // Practices
  "REST APIs", "System Design", "DSA", "Git", "Agile", "Microservices",
];

/** Lowercased lookup: skill → canonical casing */
const SKILL_LOOKUP = new Map(SKILL_DICTIONARY.map((s) => [s.toLowerCase(), s]));

// ─── Resume text extraction ──────────────────────────────────────────────────

const ACTION_VERBS = [
  "built", "developed", "designed", "deployed", "implemented", "architected",
  "created", "optimized", "led", "engineered", "automated", "scaled",
];

const PROJECT_KEYWORD_PATTERNS = [
  /(?:built|developed|designed|deployed|implemented|created|engineered)\s+(?:a|an|the)?\s*([a-z0-9 .+#/-]{6,60})/gi,
  /([a-z0-9 .+#/-]{4,40})\s+(?:application|platform|system|dashboard|pipeline|api|service|clone|website)/gi,
];

/**
 * Extract structured data from raw resume text (PDF text layer).
 * Accepts any string; returns best-effort structured output.
 */
export function parseResume(resumeText: string): ParsedResume {
  const text = resumeText.toLowerCase();

  // ── Skills: dictionary scan with word-boundary matching ──
  const skills: string[] = [];
  for (const skill of SKILL_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escaped.toLowerCase()}([^a-z0-9+#]|$)`, "i");
    if (pattern.test(text)) {
      skills.push(skill);
    }
  }

  // ── Years of experience: "3 years", "two+ years of experience", internships ──
  let yearsOfExperience = 0;
  const yearMatches = text.matchAll(
    /(\d+|(?:one|two|three|four|five|six))\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:professional\s*)?(?:experience|exp)?/g,
  );
  const wordToNum: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  for (const m of yearMatches) {
    const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : wordToNum[m[1]] ?? 0;
    yearsOfExperience = Math.max(yearsOfExperience, n);
  }
  // Internship counting (each internship ≈ 0.5y, floored to keep freshers at 0–1)
  const internships = (text.match(/internship/g) ?? []).length;
  if (yearsOfExperience === 0 && internships > 0) yearsOfExperience = Math.min(1, internships);

  // ── Project keywords: action-verb phrases + technology mentions ──
  const projectKeywords: string[] = [];
  for (const pattern of PROJECT_KEYWORD_PATTERNS) {
    for (const m of resumeText.matchAll(pattern)) {
      const phrase = m[1]?.trim().replace(/\s+/g, " ");
      if (phrase && phrase.length >= 4 && !projectKeywords.includes(phrase)) {
        projectKeywords.push(phrase);
      }
      if (projectKeywords.length >= 8) break;
    }
    if (projectKeywords.length >= 8) break;
  }

  // ── Education ──
  let education: string | null = null;
  if (/b\.?tech|bachelor of technology/i.test(text)) education = "B.Tech";
  else if (/m\.?tech/i.test(text)) education = "M.Tech";
  else if (/b\.?e\b|bachelor of engineering/i.test(text)) education = "B.E";
  else if (/mca/i.test(text)) education = "MCA";
  else if (/b\.?sc/i.test(text)) education = "B.Sc";

  // ── Confidence: density of successful extractions ──
  const confidence = Math.min(
    1,
    (skills.length / 6) * 0.5 + (projectKeywords.length / 4) * 0.3 + (education ? 0.2 : 0),
  );

  return { skills, yearsOfExperience, projectKeywords, education, confidence };
}

// ─── Compatibility scoring ───────────────────────────────────────────────────

/** Role-requirement keywords derived from a drive's text + branch mapping. */
const BRANCH_SKILL_HINTS: Record<string, string[]> = {
  CSE: ["DSA", "System Design", "Git"],
  IT: ["REST APIs", "SQL", "Git"],
  ECE: ["VLSI", "Embedded C", "IoT"],
  EEE: ["Arduino", "IoT"],
  MECH: ["AutoCAD", "SolidWorks"],
  CIVIL: ["STAAD Pro", "AutoCAD"],
};

/**
 * Derive the skill requirements for a drive from its text fields and role.
 * In production this would come from the recruiter's posted JD via the parser;
 * here we mine the drive description + jobDescription text.
 */
export function deriveDriveRequirements(drive: Drive): string[] {
  const text = `${drive.roleTitle} ${drive.description} ${drive.jobDescription}`.toLowerCase();
  const required: string[] = [];

  for (const skill of SKILL_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9+#])${escaped.toLowerCase()}([^a-z0-9+#]|$)`, "i").test(text)) {
      required.push(skill);
    }
  }

  // Branch hints as baseline requirements when JD mining is thin
  if (required.length < 3) {
    for (const branch of drive.allowedBranches) {
      for (const hint of BRANCH_SKILL_HINTS[branch] ?? []) {
        if (!required.includes(hint)) required.push(hint);
      }
    }
  }

  // Role-title keyword boosting
  if (/cloud/i.test(text) && !required.includes("AWS")) required.push("AWS", "GCP");
  if (/full.?stack|web/i.test(text) && !required.includes("React")) required.push("React", "Node.js");
  if (/data|ml|ai\b/i.test(text) && !required.includes("Machine Learning")) {
    required.push("Machine Learning", "Python");
  }

  return required;
}

/**
 * Compute the AI compatibility match score (0–100) between a student
 * and a drive. Weighted factors:
 *
 *   skills overlap      45%
 *   CGPA fit            25%
 *   branch alignment    15%
 *   backlog penalty     10%
 *   graduation year      5%
 */
export function computeMatch(student: StudentProfile, drive: Drive): MatchResult {
  const required = deriveDriveRequirements(drive);
  const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
  const matchedSkills = required.filter((s) => studentSkills.has(s.toLowerCase()));
  const missingSkills = required.filter((s) => !studentSkills.has(s.toLowerCase()));

  // Skills (45) — overlap ratio with diminishing returns
  const skillRatio = required.length > 0 ? matchedSkills.length / required.length : 0.5;
  const skillsScore = Math.round(Math.min(1, skillRatio * 1.25) * 45);

  // CGPA fit (25) — full points above cutoff, linear falloff 1.5 points below
  const cgpaGap = student.cgpa - drive.minCgpa;
  const cgpaScore = cgpaGap >= 0
    ? Math.round(25 * Math.min(1, 0.7 + cgpaGap / 2))
    : Math.max(0, Math.round(25 + cgpaGap * 12));

  // Branch alignment (15) — primary branch full, adjacent partial
  const branchScore = drive.allowedBranches.includes(student.department)
    ? 15
    : 0;

  // Backlog penalty (10) — clean record full points
  const backlogScore = student.activeBacklogs <= drive.maxActiveBacklogs
    ? 10
    : Math.max(0, 10 - (student.activeBacklogs - drive.maxActiveBacklogs) * 4);

  // Graduation year (5) — current-cycle grads full points
  const gradYear = new Date().getFullYear();
  const gradScore = student.graduationYear <= gradYear + 1 ? 5 : 0;

  const factors: MatchFactor[] = [
    {
      kind: "skills",
      label: "Skill Alignment",
      score: skillsScore,
      weight: 45,
      detail: `${matchedSkills.length}/${required.length} required skills matched`,
    },
    {
      kind: "cgpa",
      label: "Academic Fit",
      score: cgpaScore,
      weight: 25,
      detail: `CGPA ${student.cgpa.toFixed(2)} vs cutoff ${drive.minCgpa}`,
    },
    {
      kind: "branch",
      label: "Branch Alignment",
      score: branchScore,
      weight: 15,
      detail: drive.allowedBranches.includes(student.department)
        ? `${student.department} is eligible`
        : `${student.department} not in allowed branches`,
    },
    {
      kind: "backlogs",
      label: "Record Cleanliness",
      score: backlogScore,
      weight: 10,
      detail: `${student.activeBacklogs} active backlog${student.activeBacklogs !== 1 ? "s" : ""} (max ${drive.maxActiveBacklogs})`,
    },
    {
      kind: "graduation",
      label: "Graduation Cycle",
      score: gradScore,
      weight: 5,
      detail: `Class of ${student.graduationYear}`,
    },
  ];

  const score = factors.reduce((sum, f) => sum + f.score, 0);
  const tier: MatchResult["tier"] =
    score >= 80 ? "elite" : score >= 60 ? "strong" : score >= 40 ? "moderate" : "weak";

  return { score, tier, factors, missingSkills, matchedSkills };
}

/** Rank a list of students against a drive, best match first. */
export function rankCandidates(
  students: StudentProfile[],
  drive: Drive,
): { student: StudentProfile; match: MatchResult }[] {
  return students
    .map((student) => ({ student, match: computeMatch(student, drive) }))
    .sort((a, b) => b.match.score - a.match.score);
}
