import { useMemo, useState } from "react";
import {
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Globe,
  Lock,
  ShieldCheck,
  Plus,
  X,
  FileText,
  FileDown,
  Loader2,
  Github,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { mockStudents } from "@/lib/mock-data";
import {
  downloadResumePdf,
  renderResumeHtml,
  type ResumeProject,
  type ResumeData,
} from "@/services/resume-generator";
import { track } from "@/services/analytics";

type Section = "academics" | "skills" | "projects" | "portfolios";

const SECTION_TABS: { key: Section; label: string; icon: typeof User }[] = [
  { key: "academics", label: "Academic Details", icon: GraduationCap },
  { key: "skills", label: "Technical Skills", icon: Code2 },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "portfolios", label: "Social Portfolios", icon: Globe },
];

export default function StudentProfile() {
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem("placement_profile_edits");
      return raw ? (JSON.parse(raw) as { projects?: ResumeProject[]; leetcodeUrl?: string; batch?: string }) : {};
    } catch {
      return {};
    }
  }, []);

  const currentStudent = mockStudents[0];
  const [section, setSection] = useState<Section>("academics");
  const [batch, setBatch] = useState(saved.batch ?? "2022 – 2026");
  const [skills, setSkills] = useState<string[]>([...currentStudent.skills]);
  const [skillInput, setSkillInput] = useState("");
  const [projects, setProjects] = useState<ResumeProject[]>(
    saved.projects ?? [
      {
        title: "CloudSync — File Pipeline Dashboard",
        techStack: ["React", "Node.js", "PostgreSQL"],
        description:
          "Built a resumable file upload pipeline with chunked transfers, presigned URLs, and a real-time progress dashboard.",
        githubUrl: "https://github.com/adityav/cloudsync",
      },
      {
        title: "AlgoViz — DSA Visualizer",
        techStack: ["TypeScript", "D3.js"],
        description:
          "Interactive visualizer for graph traversal and sorting algorithms with step-through animation and complexity annotations.",
        githubUrl: "https://github.com/adityav/algoviz",
      },
    ],
  );
  const [githubUrl, setGithubUrl] = useState(currentStudent.githubUrl ?? "github.com/adityav");
  const [linkedinUrl, setLinkedinUrl] = useState(currentStudent.linkedinUrl ?? "linkedin.com/in/adityav");
  const [leetcodeUrl, setLeetcodeUrl] = useState(saved.leetcodeUrl ?? "leetcode.com/adityav");
  const [resumeOpen, setResumeOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isVerified = currentStudent.isVerified;
  const verifiedBadge = (
    <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
      <ShieldCheck className="h-2.5 w-2.5" />
      TPO Verified
    </span>
  );
  const lockIcon = <Lock className="h-3 w-3 text-amber-400/70" aria-label="Verified by TPO — locked" />;

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`"${trimmed}" is already in your skills.`);
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
    toast.success(`Added "${trimmed}" to your skills.`);
  };

  const resumeData = (): ResumeData => ({
    student: { ...currentStudent, skills },
    batch,
    projects,
    leetcodeUrl: leetcodeUrl || undefined,
  });

  const handleExport = () => {
    setExporting(true);
    const ok = downloadResumePdf(resumeData());
    setExporting(false);
    if (ok) {
      // Conversion event — institutional resume generated
      track("Resume_Generated", { format: "pdf" });
      toast.success("Resume opened — use Save as PDF to export");
    } else {
      toast.error("Popup blocked — allow popups for this site and retry");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            Student Profile
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
            Profile & Resume Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Maintain your academic record, skills, and projects — then export a
            standardized institutional resume in one click.
          </p>
        </div>
        <button
          onClick={() => setResumeOpen(true)}
          className="text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2 shrink-0"
        >
          <FileText className="h-4 w-4 text-amber-400" />
          Generate Resume
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {SECTION_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              className={`text-[10px] font-black px-3.5 py-2 rounded-full border inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98] ${
                section === tab.key
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/40 shadow-sm shadow-purple-950/30"
                  : "border-border bg-secondary text-slate-400 hover:text-slate-100 hover:border-purple-800/50"
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Academic Details ── */}
      {section === "academics" && (
        <div className="nb-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-400" />
              Academic Details
            </h2>
            {isVerified && verifiedBadge}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                Roll Number {isVerified && lockIcon}
              </label>
              <input
                value={currentStudent.rollNumber}
                readOnly
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400/90 bg-slate-950/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                Department {isVerified && lockIcon}
              </label>
              <input
                value={currentStudent.department}
                readOnly
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400/90 bg-slate-950/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Batch
              </label>
              <input
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="nb-input w-full px-3 py-2.5 text-xs font-bold text-slate-100"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                Graduation Year {isVerified && lockIcon}
              </label>
              <input
                value={currentStudent.graduationYear}
                readOnly
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400/90 bg-slate-950/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                CGPA (Verified) {isVerified && lockIcon}
              </label>
              <input
                value={`${currentStudent.cgpa.toFixed(2)} / 10`}
                readOnly
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400/90 bg-slate-950/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
                Verified Backlog Count {isVerified && lockIcon}
              </label>
              <input
                value={`${currentStudent.activeBacklogs} active / ${currentStudent.totalBacklogs} total`}
                readOnly
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400/90 bg-slate-950/40 cursor-not-allowed"
              />
            </div>
          </div>

          {isVerified && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-amber-400 font-black">Academic lock active:</span>{" "}
                verified fields are read-only and certified by the Training &
                Placement Cell. Request a correction through the TPO office if any
                record is inaccurate.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Technical Skills ── */}
      {section === "skills" && (
        <div className="nb-card p-6">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-5">
            <Code2 className="h-4 w-4 text-purple-400" />
            Technical Skills
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill — e.g. Docker, GraphQL, System Design"
              className="nb-input flex-1 px-3 py-2.5 text-xs font-bold text-slate-100 placeholder:text-slate-500"
            />
            <button
              onClick={addSkill}
              className="px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-600/10 text-purple-300 group hover:border-purple-400/50 transition-all duration-200"
                >
                  {skill}
                  <button
                    onClick={() => {
                      setSkills((prev) => prev.filter((s) => s !== skill));
                      toast.info(`Removed "${skill}" from your skills.`);
                    }}
                    className="text-purple-400/60 hover:text-rose-400 transition-colors"
                    title={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-semibold py-4 text-center">
              No skills yet — add your first above to build your skill profile.
            </p>
          )}
        </div>
      )}

      {/* ── Projects ── */}
      {section === "projects" && (
        <div className="space-y-4">
          {projects.map((p, idx) => (
            <div key={idx} className="nb-card p-5 group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <input
                  value={p.title}
                  onChange={(e) =>
                    setProjects((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                    )
                  }
                  placeholder="Project title"
                  className="bg-transparent text-sm font-black text-slate-100 outline-none flex-1 focus:text-amber-400 transition-colors"
                />
                <button
                  onClick={() => {
                    setProjects((prev) => prev.filter((_, i) => i !== idx));
                    toast.info(`Removed "${p.title}"`);
                  }}
                  className="w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
                  title="Remove project"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={p.techStack.join(", ")}
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((x, i) =>
                      i === idx
                        ? { ...x, techStack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
                        : x,
                    ),
                  )
                }
                placeholder="Tech stack — comma separated (React, Node.js, PostgreSQL)"
                className="nb-input w-full px-3 py-2 text-[11px] font-bold text-amber-400/90 mb-2"
              />
              <textarea
                value={p.description}
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                  )
                }
                placeholder="What did you build and what impact did it have?"
                rows={2}
                className="nb-input w-full px-3 py-2 text-[11px] font-semibold text-slate-300 placeholder:text-slate-500 resize-none mb-2"
              />
              <div className="flex items-center gap-2">
                <Github className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <input
                  value={p.githubUrl ?? ""}
                  onChange={(e) =>
                    setProjects((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, githubUrl: e.target.value } : x)),
                    )
                  }
                  placeholder="https://github.com/you/project"
                  className="nb-input flex-1 px-3 py-1.5 text-[11px] font-mono text-purple-300"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setProjects((prev) => [
                ...prev,
                { title: "New Project", techStack: [], description: "", githubUrl: "" },
              ]);
            }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-border text-[11px] font-black text-slate-500 hover:text-purple-300 hover:border-purple-800/50 active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </button>
        </div>
      )}

      {/* ── Social Portfolios ── */}
      {section === "portfolios" && (
        <div className="nb-card p-6 space-y-4">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-400" />
            Social Portfolios
          </h2>
          {[
            { icon: Github, label: "GitHub", value: githubUrl, set: setGithubUrl, ph: "github.com/username" },
            { icon: Linkedin, label: "LinkedIn", value: linkedinUrl, set: setLinkedinUrl, ph: "linkedin.com/in/username" },
            { icon: Code2, label: "LeetCode", value: leetcodeUrl, set: setLeetcodeUrl, ph: "leetcode.com/username" },
          ].map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-purple-950/40 bg-purple-600/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-purple-300" />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    {field.label}
                  </label>
                  <input
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.ph}
                    className="nb-input w-full px-3 py-2 text-xs font-mono text-purple-300 placeholder:text-slate-600"
                  />
                </div>
                {field.value && (
                  <a
                    href={field.value.startsWith("http") ? field.value : `https://${field.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors shrink-0"
                    title={`Open ${field.label}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resume preview modal */}
      {resumeOpen && (
        <ResumePreviewModal data={resumeData()} onExport={handleExport} exporting={exporting} onClose={() => setResumeOpen(false)} />
      )}
    </div>
  );
}

// ─── Resume preview modal ────────────────────────────────────────────────────

function ResumePreviewModal({
  data,
  onExport,
  exporting,
  onClose,
}: {
  data: ResumeData;
  onExport: () => void;
  exporting: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-950/40">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-black text-slate-100">
              Institutional Resume — {data.student.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              disabled={exporting}
              className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3 text-amber-400" />}
              Download PDF / Print
            </button>
            <button
              onClick={onClose}
              aria-label="Close resume preview"
              className="w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          <div className="rounded-xl overflow-hidden border border-border bg-white">
            <iframe
              title="Resume preview"
              srcDoc={renderResumeHtml(data)}
              className="w-full h-[520px] bg-white"
              sandbox=""
            />
          </div>
          <p className="text-[9px] text-slate-600 font-semibold mt-3 text-center">
            Single-page institutional format with TPO verification seal — exported
            via your browser's print-to-PDF.
          </p>
        </div>
      </div>
    </div>
  );
}
