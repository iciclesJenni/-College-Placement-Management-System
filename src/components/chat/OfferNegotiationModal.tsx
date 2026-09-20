import { useEffect, useState } from "react";
import {
  X,
  FileSignature,
  Award,
  CalendarClock,
  ShieldCheck,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  acceptOffer,
  declineOffer,
  requestExtension,
  OFFER_STATUS_META,
  type OfferNegotiation,
} from "@/services/offers";

interface Props {
  offer: OfferNegotiation;
  currentUserName: string;
  onUpdate: (o: OfferNegotiation) => void;
  onClose: () => void;
}

/**
 * Offer Negotiation & Response Workflow modal — formal offer terms,
 * joining-date extension requests, and digitally-signed accept/decline
 * with hash verification. Obsidian glass with gold acceptance accents.
 */
export function OfferNegotiationModal({ offer, currentUserName, onUpdate, onClose }: Props) {
  const [mode, setMode] = useState<"view" | "extend" | "sign">("view");
  const [extDate, setExtDate] = useState(
    new Date(Date.now() + 75 * 86_400_000).toISOString().split("T")[0],
  );
  const [extReason, setExtReason] = useState("");
  const [signature, setSignature] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);

  const studentCtx = {
    studentId: offer.studentId,
    studentName: offer.studentName,
    studentEmail: `${offer.studentId}@college.edu.in`,
    driveId: offer.driveId,
    companyName: offer.companyName,
    roleTitle: offer.roleTitle,
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const statusMeta = OFFER_STATUS_META[offer.status];
  const isResolved = offer.status === "accepted" || offer.status === "declined";

  const handleAccept = async () => {
    if (signature.trim().length < 3) {
      toast.error("Type your full name to digitally sign the acceptance");
      return;
    }
    setBusy(true);
    const updated = await acceptOffer(offer.id, signature.trim(), studentCtx);
    setBusy(false);
    if (updated) onUpdate(updated);
    onClose();
  };

  const handleDecline = async () => {
    if (declineReason.trim().length < 5) {
      toast.error("Please provide a brief reason for declining");
      return;
    }
    setBusy(true);
    const updated = await declineOffer(offer.id, currentUserName, declineReason.trim(), studentCtx);
    setBusy(false);
    if (updated) onUpdate(updated);
    onClose();
  };

  const handleExtension = () => {
    if (extReason.trim().length < 5) {
      toast.error("Add a short reason for the extension request");
      return;
    }
    const updated = requestExtension(offer.id, extDate, extReason.trim());
    if (updated) {
      onUpdate(updated);
      toast.success("Extension request sent", {
        description: "The recruiter and TPO will review your requested date.",
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-purple-950/40 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-purple-950/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-purple-950/40 bg-slate-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0">
              <FileSignature className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-100 truncate">Offer Negotiation</p>
              <p className="text-[9px] text-slate-500 font-mono truncate">{offer.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${statusMeta.chip}`}>
              {statusMeta.label}
            </span>
            <button
              onClick={onClose}
              aria-label="Close offer negotiation dialog"
              className="w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Terms */}
          <div className="rounded-xl border border-purple-950/40 bg-secondary/20 p-4">
            <p className="text-sm font-black text-slate-100">{offer.companyName}</p>
            <p className="text-[11px] text-slate-400 font-semibold">{offer.roleTitle}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 nb-sheen">
                <p className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider">Package</p>
                <p className="text-lg font-black text-amber-400 mt-0.5">{offer.ctc}</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-secondary/30">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <CalendarClock className="h-2.5 w-2.5" /> Joining Date
                </p>
                <p className="text-sm font-black text-slate-100 mt-1">
                  {new Date(offer.joiningDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            {offer.note && (
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed border-t border-purple-950/40 pt-3">
                {offer.note}
              </p>
            )}
          </div>

          {/* Extension request status */}
          {offer.extensionRequest && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black text-amber-400">
                  Extension requested for{" "}
                  {new Date(offer.extensionRequest.requestedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{offer.extensionRequest.reason}</p>
              </div>
            </div>
          )}

          {/* Signature block (resolved offers) */}
          {offer.signature && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                {offer.status === "accepted" ? "Digitally Signed Acceptance" : "Signed Decision Record"}
              </p>
              <p className="text-[11px] text-slate-300 font-bold">{offer.signature.signedBy}</p>
              <p className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1 break-all">
                <Hash className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                {offer.signature.hash.slice(0, 40)}…
              </p>
              <p className="text-[9px] text-slate-500 mt-1">
                Signed {new Date(offer.signature.signedAt).toLocaleString("en-US")}
              </p>
            </div>
          )}

          {/* ── Action modes (hidden once resolved) ── */}
          {!isResolved && mode === "view" && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode("sign")}
                className="text-[11px] font-black px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                Accept
              </button>
              <button
                onClick={() => setMode("extend")}
                className="text-[11px] font-black px-3 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Extend
              </button>
              <button
                onClick={() => setMode("extend")}
                className="text-[11px] font-black px-3 py-2.5 rounded-xl border border-border bg-secondary text-slate-400 hover:text-rose-400 hover:border-rose-500/30 active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-1.5"
                title="Decline offer"
              >
                <XCircle className="h-3.5 w-3.5" />
                Decline
              </button>
            </div>
          )}

          {/* Signature mode */}
          {!isResolved && mode === "sign" && (
            <div className="rounded-xl border border-purple-500/40 bg-purple-600/5 p-4 space-y-3">
              <p className="text-[11px] font-black text-slate-200 flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5 text-purple-300" />
                Digital Signature
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Type your full legal name to accept this offer. A SHA-256 signature
                hash will be recorded and the TPO admin notified instantly.
              </p>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={currentUserName}
                className="nb-input w-full px-3 py-2.5 text-xs font-black text-amber-400 placeholder:text-slate-600 tracking-wide"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={busy}
                  className="flex-1 text-[11px] font-black px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  {busy ? "Signing…" : "Sign & Accept Offer"}
                </button>
                <button
                  onClick={() => setMode("view")}
                  className="text-[11px] font-black px-3 py-2.5 rounded-xl border border-border bg-secondary text-slate-400 hover:text-slate-100 active:scale-[0.98] transition-all duration-200"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Extend / decline mode */}
          {!isResolved && mode === "extend" && (
            <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
              <div>
                <p className="text-[11px] font-black text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-amber-400" />
                  Request joining date extension
                </p>
                <input
                  type="date"
                  value={extDate}
                  onChange={(e) => setExtDate(e.target.value)}
                  className="nb-input w-full px-3 py-2 text-xs font-bold text-slate-100"
                />
              </div>
              <textarea
                value={extReason}
                onChange={(e) => setExtReason(e.target.value)}
                placeholder="Reason for the request (e.g. awaiting another offer decision)…"
                rows={2}
                className="nb-input w-full px-3 py-2 text-xs font-semibold text-slate-100 placeholder:text-slate-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExtension}
                  className="text-[11px] font-black px-3 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all duration-200"
                >
                  Send Extension Request
                </button>
                <button
                  onClick={handleDecline}
                  disabled={busy}
                  className="text-[11px] font-black px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                >
                  {busy ? "Recording…" : "Decline Offer Instead"}
                </button>
              </div>
              <button
                onClick={() => setMode("view")}
                className="w-full text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
