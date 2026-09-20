import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  MessagesSquare,
  Send,
  Circle,
  Check,
  CheckCheck,
  FileSignature,
  ArrowLeft,
  ShieldCheck,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadThreads,
  loadMessages,
  sendMessage,
  markThreadRead,
  unreadCount,
  subscribeToMessages,
  isOnline,
  presenceLabel,
  seedDemoThreads,
  meAsParticipant,
  type Thread,
  type Message,
  type Participant,
  type ParticipantRole,
} from "@/services/messages";
import {
  loadOffers,
  seedDemoOffer,
  subscribeToOffers,
  OFFER_STATUS_META,
  type OfferNegotiation,
} from "@/services/offers";
import { OfferNegotiationModal } from "@/components/chat/OfferNegotiationModal";

export default function Messages() {
  const { user } = useAuth();
  const currentUserId = user?.role === "tpo" ? "tpo-1" : user?.role === "recruiter" ? "rec-1" : "stu-1";
  const currentRole: ParticipantRole = user?.role === "tpo" ? "tpo" : user?.role === "recruiter" ? "recruiter" : "student";
  const currentName = user?.name ?? "Aditya Verma";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerModal, setOfferModal] = useState<OfferNegotiation | null>(null);
  const [offers, setOffers] = useState<OfferNegotiation[]>(() => loadOffers());
  const scrollRef = useRef<HTMLDivElement>(null);

  const me: Participant = useMemo(
    () => meAsParticipant(currentUserId, currentName, currentRole),
    [currentUserId, currentName, currentRole],
  );

  // Seed demo data on first mount
  useEffect(() => {
    seedDemoThreads(currentUserId, currentName);
    seedDemoOffer();
    setThreads(loadThreads());
    setOffers(loadOffers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates — event bus + presence heartbeat
  useEffect(() => {
    const unsubMsgs = subscribeToMessages(() => {
      setThreads(loadThreads());
      setMessages(loadMessages(activeThreadId ?? undefined));
    });
    const unsubOffers = subscribeToOffers(() => setOffers(loadOffers()));
    return () => {
      unsubMsgs();
      unsubOffers();
    };
  }, [activeThreadId]);

  // Open first thread by default
  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      openThread(threads[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    markThreadRead(threadId, currentUserId);
    setMessages(loadMessages(threadId));
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const otherParticipants = activeThread
    ? activeThread.participants.filter((p) => p.id !== currentUserId)
    : [];

  const handleSend = () => {
    if (!activeThread || draft.trim().length === 0) return;
    sendMessage({
      threadId: activeThread.id,
      sender: me,
      body: draft.trim(),
    });
    setDraft("");
    setMessages(loadMessages(activeThread.id));
  };

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.driveName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.participants.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
          <MessagesSquare className="w-4 h-4" />
          Direct Communication Hub
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
          Messages
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">
          Secure channels with recruiters and the placement cell — interview
          follow-ups, document verification, and offer discussions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[520px]">
        {/* ── Thread list ── */}
        <div className={`nb-card overflow-hidden flex flex-col ${activeThread ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b border-purple-950/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="nb-input w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-slate-900/80 border border-purple-950/40">
                  <MessagesSquare className="h-5 w-5 text-purple-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">No conversations found</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const unread = unreadCount(t.id, currentUserId);
                const lastMsg = loadMessages(t.id).slice(-1)[0];
                const others = t.participants.filter((p) => p.id !== currentUserId);
                const anyOnline = others.some(isOnline);
                const isActive = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => openThread(t.id)}
                    className={`w-full text-left p-3.5 border-b border-purple-950/20 transition-all duration-200 active:scale-[0.99] ${
                      isActive ? "bg-purple-600/10 border-l-2 border-l-amber-500/60" : "hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-lg border border-purple-950/40 bg-purple-600/10 flex items-center justify-center text-[10px] font-black text-purple-300">
                          {t.driveName.slice(0, 2).toUpperCase()}
                        </div>
                        {anyOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-100 truncate">{t.driveName}</p>
                        <p className="text-[9px] text-slate-500 truncate">{t.subject}</p>
                      </div>
                      {unread > 0 && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[8px] font-black text-white flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-[9px] text-slate-600 truncate pl-10">
                        {lastMsg.senderId === currentUserId ? "You: " : ""}
                        {lastMsg.body}
                      </p>
                    )}
                    <p className="text-[8px] text-slate-700 pl-10 mt-0.5 font-mono">
                      {others.map((p) => presenceLabel(p)).join(" • ")}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`nb-card overflow-hidden flex flex-col lg:col-span-2 ${activeThread ? "flex" : "hidden lg:flex"}`}>
          {activeThread ? (
            <>
              {/* Chat header */}
              <div className="p-3.5 border-b border-purple-950/40 flex items-center gap-3">
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="lg:hidden w-7 h-7 rounded-lg border border-border bg-secondary flex items-center justify-center text-slate-400 active:scale-[0.98] transition-all duration-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-100 truncate">
                    {activeThread.driveName} — {activeThread.roleTitle}
                  </p>
                  <p className="text-[9px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                    Secure history • {activeThread.participants.length} participants
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isOwn = m.senderId === currentUserId;
                  const iRead = Boolean(m.readBy[currentUserId]);
                  const offer = m.offerId ? offers.find((o) => o.id === m.offerId) : undefined;
                  return (
                    <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && (
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                            {m.senderName}
                          </p>
                        )}
                        {offer ? (
                          /* Offer negotiation card inside chat */
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 shadow-sm shadow-purple-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <FileSignature className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                Formal Offer Extended
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-200 font-bold">{offer.companyName}</p>
                            <p className="text-[10px] text-slate-400">{offer.roleTitle}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-black text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-full px-2 py-0.5">
                                {offer.ctc}
                              </span>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${OFFER_STATUS_META[offer.status].chip}`}>
                                {OFFER_STATUS_META[offer.status].label}
                              </span>
                            </div>
                            <button
                              onClick={() => setOfferModal(offer)}
                              className="mt-3 w-full text-[10px] font-black px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                            >
                              View Offer & Respond
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed font-semibold ${
                              isOwn
                                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white rounded-br-md shadow-sm shadow-purple-950/30"
                                : "border border-purple-950/40 bg-slate-900/80 text-slate-200 rounded-bl-md"
                            }`}
                          >
                            {m.body}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "justify-end" : ""}`}>
                          <span className="text-[8px] text-slate-600 font-mono">
                            {new Date(m.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                          {isOwn && (
                            iRead ? (
                              <CheckCheck className="h-2.5 w-2.5 text-amber-400" />
                            ) : (
                              <Check className="h-2.5 w-2.5 text-slate-600" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-purple-950/40 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a secure message…"
                  className="nb-input flex-1 px-3.5 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500"
                />
                <button
                  onClick={handleSend}
                  disabled={draft.trim().length === 0}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-sm shadow-purple-950/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center shrink-0"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-slate-900/80 border border-purple-950/40 shadow-lg shadow-purple-950/30">
                  <MessagesSquare className="h-8 w-8 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-black text-slate-400">Select a conversation</p>
                <p className="text-xs text-slate-600 mt-1">
                  Choose a thread to view its secure message history.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Presence legend */}
      <div className="flex items-center gap-4 mt-4 px-1">
        <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" /> Online (active within 1 min)
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
          <CheckCheck className="h-3 w-3 text-amber-400" /> Read receipt confirmed
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
          <FileSignature className="h-3 w-3 text-amber-400" /> Formal offer card
        </span>
      </div>

      {/* Offer negotiation modal */}
      {offerModal && (
        <OfferNegotiationModal
          offer={offerModal}
          currentUserName={currentName}
          onUpdate={(updated) => {
            setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setMessages(loadMessages(activeThreadId ?? undefined));
          }}
          onClose={() => setOfferModal(null)}
        />
      )}
    </div>
  );
}
