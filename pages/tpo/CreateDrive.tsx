import { useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  X,
  Briefcase,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  Globe,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import type { Drive, Department } from "@/types";
import { createDriveSchema } from "@/lib/schemas";

// ─── Constants ───
const DEPARTMENTS: { code: Department; label: string }[] = [
  { code: "CSE", label: "CSE" },
  { code: "IT", label: "IT" },
  { code: "ECE", label: "ECE" },
  { code: "EEE", label: "EEE" },
  { code: "MECH", label: "MECH" },
  { code: "CIVIL", label: "CIVIL" },
];

const DEFAULT_ROUNDS = [
  "Online Assessment",
  "Technical Interview",
  "HR Interview",
];

// ─── Validation ───
// All rules live in the shared `createDriveSchema` (src/lib/schemas.ts) — the
// same schema the Convex mutation validates against, so client and server
// agree on exactly one rule set. Zod issues are mapped back to form fields.
interface FormErrors {
  companyName?: string;
  role?: string;
  description?: string;
  jobDescription?: string;
  ctcLpa?: string;
  driveDate?: string;
  deadline?: string;
  allowedBranches?: string;
  minCgpa?: string;
  maxActiveBacklogs?: string;
  rounds?: string;
  website?: string;
}

function validate(form: ReturnType<typeof getDefaultForm>, rounds: string[]): FormErrors {
  const parsed = createDriveSchema.safeParse({
    companyName: form.companyName.trim(),
    roleTitle: form.role.trim(),
    description: form.description.trim(),
    jobDescription: form.jobDescription.trim(),
    ctcLpa: form.ctcLpa === "" ? NaN : parseFloat(form.ctcLpa),
    driveDate: form.driveDate,
    deadline: form.deadline,
    minCgpa: form.minCgpa === "" ? NaN : parseFloat(form.minCgpa),
    maxActiveBacklogs:
      form.maxActiveBacklogs === "" ? NaN : parseInt(form.maxActiveBacklogs, 10),
    allowedBranches: form.allowedBranches,
    rounds: rounds.map((r) => r.trim()).filter(Boolean),
    website: form.website.trim(),
  });

  if (parsed.success) return {};

  const errors: FormErrors = {};
  const ROLES: Record<string, keyof FormErrors> = {
    companyName: "companyName",
    roleTitle: "role",
    description: "description",
    jobDescription: "jobDescription",
    ctcLpa: "ctcLpa",
    driveDate: "driveDate",
    deadline: "deadline",
    minCgpa: "minCgpa",
    maxActiveBacklogs: "maxActiveBacklogs",
    allowedBranches: "allowedBranches",
    rounds: "rounds",
    website: "website",
  };

  for (const issue of parsed.error.issues) {
    const key = ROLES[issue.path[0] as string] ?? issue.path[0] as keyof FormErrors;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function getDefaultForm() {
  return {
    companyName: "",
    role: "",
    description: "",
    ctcLpa: "",
    driveDate: "",
    deadline: "",
    minCgpa: "7.0",
    maxActiveBacklogs: "0",
    allowedBranches: ["CSE", "IT"] as Department[],
    jobDescription: "",
    website: "",
  };
}

// ─── Component ───
export default function CreateDrive() {
  const navigate = useNavigate();
  const [form, setForm] = useState(getDefaultForm);
  const [rounds, setRounds] = useState<string[]>(DEFAULT_ROUNDS);
  const [newRound, setNewRound] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newRoundRef = useRef<HTMLInputElement>(null);

  // ─── Branch toggle chips ───
  const toggleBranch = useCallback((dept: Department) => {
    setForm((prev) => ({
      ...prev,
      allowedBranches: prev.allowedBranches.includes(dept)
        ? prev.allowedBranches.filter((d) => d !== dept)
        : [...prev.allowedBranches, dept],
    }));
    if (submitted) setErrors((prev) => ({ ...prev, allowedBranches: undefined }));
  }, [submitted]);

  // ─── Rounds manager ───
  const addRound = useCallback(() => {
    const trimmed = newRound.trim();
    if (!trimmed) return;
    if (rounds.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning(`"${trimmed}" is already in the round sequence.`);
      return;
    }
    setRounds((prev) => [...prev, trimmed]);
    setNewRound("");
    newRoundRef.current?.focus();
    if (submitted) setErrors((prev) => ({ ...prev, rounds: undefined }));
  }, [newRound, rounds, submitted]);

  const removeRound = useCallback((idx: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const moveRound = useCallback((idx: number, dir: "up" | "down") => {
    setRounds((prev) => {
      const next = [...prev];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  // ─── Submit ───
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);

      const errs = validate(form, rounds);
      setErrors(errs);

      if (Object.keys(errs).length > 0) {
        toast.error("Please fix the highlighted errors before submitting.");
        return;
      }

      // Build Drive object — optimistic UI
      const newDrive: Drive = {
        id: `drv-${Date.now()}`,
        companyName: form.companyName.trim(),
        roleTitle: form.role.trim(),
        // (roleTitle flows from `form.role` — form field names unchanged)
        description: form.description.trim(),
        jobDescription: form.jobDescription.trim(),
        ctcLpa: parseFloat(form.ctcLpa),
        ctc: `₹${form.ctcLpa} LPA`,
        driveDate: new Date(form.driveDate).toLocaleDateString("en-IN", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        deadline: new Date(form.deadline).toLocaleDateString("en-IN", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        deadlineTimestamp: new Date(form.deadline).getTime(),
        status: "upcoming",
        minCgpa: parseFloat(form.minCgpa),
        maxActiveBacklogs: parseInt(form.maxActiveBacklogs, 10),
        allowedBranches: form.allowedBranches,
        rounds: [...rounds],
        website: form.website.trim(),
        applicantCount: 0,
      };

      // Persist for the Drives list to pick up
      try {
        const existing = JSON.parse(sessionStorage.getItem("newDrives") || "[]");
        existing.push(newDrive);
        sessionStorage.setItem("newDrives", JSON.stringify(existing));
      } catch {
        // sessionStorage unavailable — silent fail
      }

      // Simulated mutation latency — mirrors real server-action round trips
      // and demonstrates the graceful latency handling end-to-end.
      setIsSubmitting(true);
      const toastId = toast.loading("Creating drive…", {
        description: "Validating eligibility criteria and saving.",
      });
      window.setTimeout(() => {
        try {
          toast.dismiss(toastId);
          toast.success(`Drive for "${newDrive.companyName}" created successfully.`);
          navigate("/tpo/drives");
        } catch (err) {
          toast.dismiss(toastId);
          toast.error("Failed to create drive.", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        } finally {
          setIsSubmitting(false);
        }
      }, 700);
    },
    [form, rounds, navigate],
  );

  // ─── Error display helper ───
  const FieldError = ({ field }: { field: keyof FormErrors }) =>
    errors[field] ? (
      <p className="text-[10px] text-destructive font-medium flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <Button
        variant="outline"
        className="nb-btn-secondary mb-6"
        onClick={() => navigate("/tpo/drives")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drives
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight mb-1">
          Create New Drive
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a company placement drive with eligibility criteria, hiring
          stages, and compensation details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ═══════════════════════════════════════════
            SECTION 1 — Company Details
            ═══════════════════════════════════════════ */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs uppercase">
                  Company Name *
                </Label>
                <Input
                  className={`nb-input ${errors.companyName ? "border-destructive" : ""}`}
                  placeholder="e.g. Google Cloud"
                  value={form.companyName}
                  onChange={(e) => {
                    setForm({ ...form, companyName: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, companyName: undefined }));
                  }}
                />
                <FieldError field="companyName" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs uppercase">Role *</Label>
                <Input
                  className={`nb-input ${errors.role ? "border-destructive" : ""}`}
                  placeholder="e.g. Cloud Solutions Associate"
                  value={form.role}
                  onChange={(e) => {
                    setForm({ ...form, role: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, role: undefined }));
                  }}
                />
                <FieldError field="role" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase">Description</Label>
              <textarea
                className="nb-input w-full bg-background px-3 py-2 text-sm min-h-[72px]"
                placeholder="One-line summary of the role and what the company is looking for…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase">Company Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className={`nb-input pl-9 ${errors.website ? "border-destructive" : ""}`}
                  placeholder="https://careers.google.com"
                  value={form.website}
                  onChange={(e) => {
                    setForm({ ...form, website: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, website: undefined }));
                  }}
                />
              </div>
              <FieldError field="website" />
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 2 — Compensation & Schedule
            ═══════════════════════════════════════════ */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Compensation & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CTC */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase">
                CTC (₹ in LPA) *
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  className={`nb-input w-32 ${errors.ctcLpa ? "border-destructive" : ""}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="14.5"
                  value={form.ctcLpa}
                  onChange={(e) => {
                    setForm({ ...form, ctcLpa: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, ctcLpa: undefined }));
                  }}
                />
                {form.ctcLpa && parseFloat(form.ctcLpa) > 0 && (
                  <Badge
                    variant="outline"
                    className="nb-tag bg-primary/15 text-primary border-primary/30 text-[10px]"
                  >
                    ₹{form.ctcLpa} LPA
                  </Badge>
                )}
              </div>
              <FieldError field="ctcLpa" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs uppercase">Drive Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className={`nb-input pl-9 ${errors.driveDate ? "border-destructive" : ""}`}
                    type="date"
                    value={form.driveDate}
                    onChange={(e) => {
                      setForm({ ...form, driveDate: e.target.value });
                      if (submitted) setErrors((p) => ({ ...p, driveDate: undefined }));
                    }}
                  />
                </div>
                <FieldError field="driveDate" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs uppercase">
                  Application Deadline *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className={`nb-input pl-9 ${errors.deadline ? "border-destructive" : ""}`}
                    type="date"
                    value={form.deadline}
                    onChange={(e) => {
                      setForm({ ...form, deadline: e.target.value });
                      if (submitted) setErrors((p) => ({ ...p, deadline: undefined }));
                    }}
                  />
                </div>
                <FieldError field="deadline" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 3 — Eligibility Constraints
            ═══════════════════════════════════════════ */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Eligibility Constraints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* CGPA slider + number */}
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase">
                Minimum CGPA Required
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.minCgpa}
                  onChange={(e) => {
                    setForm({ ...form, minCgpa: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, minCgpa: undefined }));
                  }}
                  className="flex-1 h-2 bg-secondary appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <Input
                  className={`nb-input w-20 text-center text-sm font-bold ${errors.minCgpa ? "border-destructive" : ""}`}
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.minCgpa}
                  onChange={(e) => {
                    const v = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                    setForm({ ...form, minCgpa: v.toString() });
                    if (submitted) setErrors((p) => ({ ...p, minCgpa: undefined }));
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                <span>0.0</span>
                <span>5.0</span>
                <span>10.0</span>
              </div>
              <FieldError field="minCgpa" />
            </div>

            {/* Max backlogs */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase">
                Maximum Allowed Active Backlogs
              </Label>
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`nb-tag cursor-pointer transition-colors ${
                      form.maxActiveBacklogs === n.toString()
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setForm({ ...form, maxActiveBacklogs: n.toString() });
                      if (submitted) setErrors((p) => ({ ...p, maxActiveBacklogs: undefined }));
                    }}
                  >
                    {n === 5 ? "5+" : n}
                  </button>
                ))}
                <Input
                  className={`nb-input w-20 text-center text-xs ${errors.maxActiveBacklogs ? "border-destructive" : ""}`}
                  type="number"
                  min="0"
                  placeholder="Custom"
                  value={
                    [0, 1, 2, 3, 5].includes(parseInt(form.maxActiveBacklogs, 10))
                      ? ""
                      : form.maxActiveBacklogs
                  }
                  onChange={(e) => {
                    setForm({ ...form, maxActiveBacklogs: e.target.value });
                    if (submitted) setErrors((p) => ({ ...p, maxActiveBacklogs: undefined }));
                  }}
                />
              </div>
              <FieldError field="maxActiveBacklogs" />
            </div>

            {/* Multi-select branch toggle chips */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase">
                Eligible Departments
              </Label>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => {
                  const selected = form.allowedBranches.includes(dept.code);
                  return (
                    <button
                      key={dept.code}
                      type="button"
                      className={`nb-tag cursor-pointer transition-all gap-1.5 ${
                        selected
                          ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => toggleBranch(dept.code)}
                    >
                      {selected && <CheckCircleMini />}
                      {dept.label}
                    </button>
                  );
                })}
              </div>
              {form.allowedBranches.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {form.allowedBranches.length} department{form.allowedBranches.length !== 1 ? "s" : ""} selected
                </p>
              )}
              <FieldError field="allowedBranches" />
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 4 — Hiring Rounds (Re-orderable)
            ═══════════════════════════════════════════ */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" />
              Hiring Rounds
              <Badge variant="outline" className="nb-tag bg-secondary text-[10px] ml-auto">
                {rounds.length} stage{rounds.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rounds.length === 0 ? (
              <div className="nb-card border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No rounds configured. Add at least one hiring stage below.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {rounds.map((round, i) => (
                  <div
                    key={`${round}-${i}`}
                    className="nb-card flex items-center gap-2 px-3 py-2 group"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-[10px] font-black text-primary w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold flex-1 truncate">{round}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => moveRound(i, "up")}
                        aria-label={`Move ${round} up`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                        disabled={i === rounds.length - 1}
                        onClick={() => moveRound(i, "down")}
                        aria-label={`Move ${round} down`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeRound(i)}
                        aria-label={`Remove ${round}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add round input */}
            <div className="flex gap-2">
              <Input
                ref={newRoundRef}
                className="nb-input flex-1"
                placeholder="Add a custom round…"
                value={newRound}
                onChange={(e) => setNewRound(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRound();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="nb-btn-secondary gap-1.5"
                onClick={addRound}
                disabled={!newRound.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <FieldError field="rounds" />
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 5 — Job Description (Rich Text Area)
            ═══════════════════════════════════════════ */}
        <Card className="nb-card">
          <CardHeader>
            <CardTitle className="font-black text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Provide a detailed description of the role, responsibilities,
              required skills, and any other information candidates should know.
            </p>
            <textarea
              className="nb-input w-full bg-background px-3 py-2 text-sm min-h-[140px] leading-relaxed"
              placeholder={`About the role:\n• Responsibilities\n• Required skills & qualifications\n• Perks & benefits\n• Interview process overview\n\nUse bullet points for clarity.`}
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />
            {form.jobDescription && (
              <p className="text-[10px] text-muted-foreground text-right">
                {form.jobDescription.length} characters
              </p>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            Submit Actions
            ═══════════════════════════════════════════ */}
        <div className="flex gap-3 pb-6">
          <Button type="submit" className="nb-btn-primary flex-1 gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Drive…
              </>
            ) : (
              <>
                <Briefcase className="h-4 w-4" />
                Create Drive
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="nb-btn-secondary"
            onClick={() => navigate("/tpo/drives")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Tiny checkmark icon for selected chips ───
function CheckCircleMini() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <polyline points="2 6 5 9 10 3" />
    </svg>
  );
}
