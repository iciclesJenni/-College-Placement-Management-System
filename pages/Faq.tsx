import { HelpCircle, ArrowLeft } from "lucide-react";
import { FaqSection } from "@/components/landing/FaqSection";

/**
 * Public /faq page — the FAQ section rendered as its own crawlable route so
 * the sitemap entry resolves to real content rather than a 404. The landing
 * page embeds the same `FaqSection` component, so answers never diverge.
 */
export default function FaqPage() {
  return (
    <div className="nb-scene min-h-screen bg-background text-slate-100">
      <div className="nb-noise" aria-hidden="true" />

      <header className="border-b border-purple-950/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-purple-950/40 bg-slate-900/80 flex items-center justify-center shrink-0">
              <HelpCircle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight uppercase">
                Placement Portal
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Frequently Asked Questions
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-[10px] font-bold text-slate-400 hover:text-slate-100 border border-purple-950/40 bg-slate-900/60 rounded-full px-3 py-1 transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <FaqSection />

      <div className="mx-auto max-w-4xl px-4 pb-28">
        <button
          onClick={() => window.history.back()}
          className="text-xs font-bold text-slate-400 hover:text-slate-100 inline-flex items-center gap-1.5 transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </button>
      </div>
    </div>
  );
}
