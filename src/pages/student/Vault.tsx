import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Vault as VaultIcon,
  Upload,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
  Download,
  FileBadge,
  Sparkles,
  X,
  Hash,
  Search,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadVault,
  addToVault,
  updateVaultAudit,
  removeFromVault,
  hashFile,
  downloadOfferLetterPdf,
  renderOfferLetterHtml,
  type VaultDocument,
  type OfferLetterDocument,
} from "@/services/offer-generator";
import { mockStudents, mockDrives, mockApplications } from "@/lib/mock-data";
import { generateOfferLetter } from "@/services/offer-generator";

const KIND_META: Record<
  VaultDocument["kind"],
  { label: string; icon: typeof FileText; tint: string }
> = {
  offer_letter: { label: "Offer Letter", icon: FileBadge, tint: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  transcript: { label: "Transcript", icon: FileSpreadsheet, tint: "text-purple-300 border-purple-500/30 bg-purple-600/10" },
  marksheet: { label: "Mark Sheet", icon: FileText, tint: "text-purple-300 border-purple-950/40 bg-purple-600/10" },
  certificate: { label: "Certificate", icon: Award, tint: "text-purple-300 border-purple-950/40 bg-purple-600/10" },
  resume: { label: "Resume", icon: FileText, tint: "text-slate-300 border-border bg-secondary" },
};

const AUDIT_META: Record<
  VaultDocument["auditStatus"],
  { label: string; style: string; icon: typeof Clock }
> = {
  pending: { label: "Awaiting TPO Audit", style: "text-slate-400 bg-secondary border-border", icon: Clock },
  approved: { label: "TPO Verified", style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: ShieldCheck },
  flagged: { label: "Flagged for Review", style: "text-rose-400 bg-rose-500/10 border-rose-500/30", icon: ShieldAlert },
};

export default function StudentVault() {
  const navigate = useNavigate();
  const currentStudent = useMemo(
    () => mockStudents.find((s) => s.id === "stu-1") ?? mockStudents[0],
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<VaultDocument[]>(() => loadVault(currentStudent.id));
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<VaultDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => setDocs(loadVault(currentStudent.id));

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("placement-vault-change", handler);
    return () => window.removeEventListener("placement-vault-change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate the signed offer letter for the student's accepted offer
  useEffect(() => {
    const offerApp = mockApplications.find(
      (a) => a.studentId === currentStudent.id && a.status === "offered",
    );
    if (!offerApp) return;
    const existingOffer = loadVault(currentStudent.id).find(
      (d) => d.kind === "offer_letter" && d.offer?.offerId === offerApp.id,
    );
    if (existingOffer) return;
    const drive = mockDrives.find((d) => d.id === offerApp.driveId);
    if (!drive) return;

    generateOfferLetter({
      student: currentStudent,
      drive,
      ctc: drive.ctc,
      joiningDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      offerId: offerApp.id,
    }).then((doc) => {
      addToVault({
        id: `offer-${doc.offerId}`,
        kind: "offer_letter",
        title: `${doc.companyName} — ${doc.roleTitle}`,
        studentId: doc.studentId,
        uploadedAt: Date.now(),
        hash: doc.verificationHash,
        auditStatus: "approved",
        auditNote: "Digitally generated and hash-verified at offer release.",
        offer: doc,
        fileSizeKb: 148,
      });
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const hash = await hashFile(file);
      addToVault({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: file.name.toLowerCase().includes("mark")
          ? "marksheet"
          : file.name.toLowerCase().includes("transcript")
            ? "transcript"
            : "certificate",
        title: file.name.replace(/\.[^.]+$/, ""),
        studentId: currentStudent.id,
        uploadedAt: Date.now(),
        hash,
        auditStatus: "pending",
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
      });
    }
    setUploading(false);
    refresh();
    toast.success(`${files.length} document${files.length > 1 ? "s" : ""} uploaded`, {
      description: "SHA-256 integrity hashes computed — pending TPO audit.",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stats = {
    total: docs.length,
    verified: docs.filter((d) => d.auditStatus === "approved").length,
    pending: docs.filter((d) => d.auditStatus === "pending").length,
    flagged: docs.filter((d) => d.auditStatus === "flagged").length,
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <VaultIcon className="w-4 h-4" />
          Digital Verification Vault
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Document Vault
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Encrypted academic records, mark sheets, and signed offer letters —
          hash-verified and audited by the TPO.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Documents</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{stats.total}</p>
        </div>
        <div className="nb-card p-3.5 border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-bold text-emerald-400/80 uppercase">Verified</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.verified}</p>
        </div>
        <div className="nb-card p-3.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Audit</span>
          <p className="text-xl font-black text-slate-400 mt-0.5">{stats.pending}</p>
        </div>
        <div className="nb-card p-3.5 border-rose-500/30 bg-rose-500/5">
          <span className="text-[10px] font-bold text-rose-400/80 uppercase">Flagged</span>
          <p className="text-xl font-black text-rose-400 mt-0.5">{stats.flagged}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nb-input w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="nb-btn-primary text-xs font-bold px-4 py-2.5 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Hashing…" : "Upload Documents"}
        </button>
      </div>

      {/* Document cards */}
      {filtered.length === 0 ? (
        <div className="nb-card p-12 text-center">
          <VaultIcon className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-300">
            {docs.length === 0 ? "Your vault is empty" : "No documents match your search"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Upload transcripts and mark sheets, or they'll appear here automatically when offers are released.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const kindMeta = KIND_META[doc.kind];
            const auditMeta = AUDIT_META[doc.auditStatus];
            const AuditIcon = auditMeta.icon;
            const KindIcon = kindMeta.icon;
            return (
              <div
                key={doc.id}
                className="nb-card nb-card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${kindMeta.tint}`}>
                  <KindIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm text-slate-100 truncate">{doc.title}</h3>
                    <span className={`nb-tag text-[9px] ${kindMeta.tint}`}>{kindMeta.label}</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${auditMeta.style}`}>
                      <AuditIcon className="h-2.5 w-2.5" />
                      {auditMeta.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1 truncate">
                    <Hash className="h-2.5 w-2.5 shrink-0 text-purple-400" />
                    sha256: {doc.hash.slice(0, 24)}…
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    • {doc.fileSizeKb} KB
                    {doc.auditNote ? ` • ${doc.auditNote}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreview(doc)}
                    className="nb-btn-secondary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <FileText className="h-3 w-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      removeFromVault(doc.id);
                      refresh();
                      toast.success("Document removed from vault");
                    }}
                    title="Remove"
                    className="w-8 h-8 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF preview modal */}
      {preview && (
        <DocPreviewModal doc={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

// ─── Preview modal (obsidian glass with embedded letter render) ─────────────

function DocPreviewModal({ doc, onClose }: { doc: VaultDocument; onClose: () => void }) {
  const navigate = useNavigate();
  const isOffer = doc.kind === "offer_letter" && doc.offer;
  const offer: OfferLetterDocument | null = doc.offer ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-950/40">
          <div className="flex items-center gap-2 min-w-0">
            <FileBadge className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-100 truncate">{doc.title}</p>
              <p className="text-[9px] font-mono text-slate-500 truncate">
                sha256: {doc.hash.slice(0, 32)}…
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOffer && offer && (
              <button
                onClick={() => {
                  const ok = downloadOfferLetterPdf(offer);
                  if (ok) toast.success("Offer letter opened — use Save as PDF to download");
                  else toast.error("Popup blocked — allow popups and try again");
                }}
                className="nb-btn-primary text-[10px] font-bold px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close document preview"
              className="w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">
          {isOffer && offer ? (
            <>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 mb-4 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-amber-400">
                    Digitally signed offer — verification code {offer.verificationCode}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    The SHA-256 hash binds the candidate identity, compensation, and joining
                    date. Any alteration to the document invalidates the hash.
                  </p>
                </div>
              </div>
              {/* Letter render */}
              <div
                className="rounded-xl overflow-hidden border border-border bg-white [&_body]:!p-6"
                style={{ minHeight: 300 }}
              >
                <iframe
                  title="Offer letter preview"
                  srcDoc={renderOfferLetterHtml(offer)}
                  className="w-full h-[420px] bg-white"
                  sandbox=""
                />
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-300">{doc.title}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Document stored with integrity hash. TPO audit status:{" "}
                <span className={AUDIT_META[doc.auditStatus].label === "TPO Verified" ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {AUDIT_META[doc.auditStatus].label}
                </span>
                .
              </p>
              {doc.auditNote && (
                <p className="text-[10px] text-slate-600 mt-2 italic">{doc.auditNote}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-purple-950/40 flex items-center justify-between">
          <p className="text-[9px] text-slate-600 font-semibold">
            Vault documents are private to you and the TPO audit team.
          </p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="text-[10px] font-bold text-purple-300 hover:text-purple-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
