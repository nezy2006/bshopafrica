"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Headset, LogOut } from "lucide-react";
import { isLoggedIn, authHeaders, AUTH_KEYS, validateEmail } from "@/lib/auth";

type Role = "client" | "ai" | "agent";
type ChatStatus = "active" | "escalated" | "closed" | "offline";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: string;
  agentName?: string;
}

const SESSION_KEY = "bshop_chat_session_id";
const STATE_KEY   = "bshop_chat_state";
const EMAIL_KEY   = "bshop_chat_guest_email";
const NAME_KEY    = "bshop_chat_guest_name";
const POLL_MS     = 10_000;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function loadState(sessionId: string): { messages: ChatMessage[]; status: ChatStatus } {
  if (typeof window === "undefined") return { messages: [], status: "active" };
  try {
    const raw = localStorage.getItem(`${STATE_KEY}_${sessionId}`);
    if (!raw) return { messages: [], status: "active" };
    const parsed = JSON.parse(raw) as { messages: ChatMessage[]; status: ChatStatus };
    return { messages: parsed.messages ?? [], status: parsed.status ?? "active" };
  } catch {
    return { messages: [], status: "active" };
  }
}

function saveState(sessionId: string, messages: ChatMessage[], status: ChatStatus) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STATE_KEY}_${sessionId}`, JSON.stringify({ messages, status }));
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function statusIndicator(status: ChatStatus, messages: ChatMessage[]): { emoji: string; label: string } {
  if (status === "offline") return { emoji: "🔴", label: "Offline" };
  if (status === "closed") return { emoji: "⚪", label: "Chat closed" };
  if (status === "escalated") {
    const agentReplied = messages.some(m => m.role === "agent");
    return agentReplied ? { emoji: "🟢", label: "Support Team" } : { emoji: "🟡", label: "Connecting to support…" };
  }
  return { emoji: "🤖", label: "AI Assistant" };
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "client") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%]">
          <div className="bg-[#6B21A8] text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-br-sm shadow-sm whitespace-pre-wrap break-words">
            {msg.content}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right pr-1">{formatTime(msg.ts)}</p>
        </div>
      </div>
    );
  }

  const isAgent = msg.role === "agent";
  return (
    <div className="flex justify-start mb-3 gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isAgent ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        {isAgent ? <Headset className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className="max-w-[75%]">
        {isAgent && msg.agentName && <p className="text-[11px] font-bold text-blue-600 mb-0.5 ml-1">{msg.agentName}</p>}
        <div
          className={`text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-sm whitespace-pre-wrap break-words ${
            isAgent ? "bg-blue-50 text-blue-900 border border-blue-100" : "bg-gray-100 text-gray-800"
          }`}
        >
          {msg.content}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-1">{formatTime(msg.ts)}</p>
      </div>
    </div>
  );
}

export default function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("active");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestKnown, setGuestKnown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loggedIn = typeof window !== "undefined" && isLoggedIn();

  const startNewConversation = useCallback(() => {
    if (typeof window === "undefined") return;
    const id = uuid();
    localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
    setMessages([]);
    setStatus("active");
    setUnread(0);
    saveState(id, [], "active");
  }, []);

  // Bootstrap session id + cached transcript
  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(SESSION_KEY, id);
    }
    const { messages: cached, status: cachedStatus } = loadState(id);

    if (cachedStatus === "closed") {
      // Don't resurrect a conversation the client or an agent already closed —
      // start fresh, exactly as if no session existed.
      id = uuid();
      localStorage.setItem(SESSION_KEY, id);
      setSessionId(id);
      setMessages([]);
      setStatus("active");
    } else {
      setSessionId(id);
      setMessages(cached);
      setStatus(cachedStatus);
    }

    const savedEmail = localStorage.getItem(EMAIL_KEY);
    if (savedEmail) {
      setGuestEmail(savedEmail);
      setGuestName(localStorage.getItem(NAME_KEY) ?? "");
      setGuestKnown(true);
    }
  }, []);

  // Always scroll to the bottom when a new message arrives (or the widget opens).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const persist = useCallback((next: ChatMessage[], nextStatus: ChatStatus) => {
    if (!sessionId) return;
    setMessages(next);
    setStatus(nextStatus);
    saveState(sessionId, next, nextStatus);
  }, [sessionId]);

  // Poll for support-team replies once escalated
  useEffect(() => {
    if (!sessionId || status !== "escalated") return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/support-chat/status?sessionId=${encodeURIComponent(sessionId)}`);
        const json = (await res.json()) as { status: ChatStatus; newMessages: ChatMessage[] };
        if (json.newMessages?.length) {
          setMessages(prev => {
            const next = [...prev, ...json.newMessages];
            saveState(sessionId, next, json.status ?? status);
            return next;
          });
          if (!open) setUnread(u => u + json.newMessages.length);
        }
        if (json.status && json.status !== status) setStatus(json.status);
      } catch {
        /* silent — retry next interval */
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [sessionId, status, open]);

  const toggleOpen = () => {
    setOpen(o => !o);
    if (!open) setUnread(0);
  };

  const endChat = async () => {
    if (!sessionId) return;
    if (typeof window !== "undefined" && !window.confirm("End this conversation? You can start a new one anytime.")) return;
    try {
      await fetch("/api/support-chat/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      /* best-effort — reset locally regardless */
    }
    startNewConversation();
  };

  const submitGuestInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(guestEmail)) return;
    localStorage.setItem(EMAIL_KEY, guestEmail);
    if (guestName) localStorage.setItem(NAME_KEY, guestName);
    setGuestKnown(true);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;
    setInput("");
    setSending(true);

    const clientMsg: ChatMessage = { id: uuid(), role: "client", content: text, ts: new Date().toISOString() };
    const withClient = [...messages, clientMsg];
    persist(withClient, status);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          message: text,
          sessionId,
          email: !loggedIn ? guestEmail || undefined : undefined,
          name: !loggedIn ? guestName || undefined : undefined,
        }),
      });
      if (!res.ok && res.status >= 500) throw new Error("server error");
      const json = (await res.json()) as { reply?: string; status?: ChatStatus; error?: string };
      if (json.error && !json.reply) {
        const errMsg: ChatMessage = { id: uuid(), role: "ai", content: json.error, ts: new Date().toISOString() };
        persist([...withClient, errMsg], status);
        return;
      }
      const replyMsg: ChatMessage = {
        id: uuid(),
        role: "ai",
        content: json.reply ?? "",
        ts: new Date().toISOString(),
      };
      persist([...withClient, replyMsg], (json.status as ChatStatus) ?? status);
    } catch {
      persist(withClient, "offline");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (pathname?.startsWith("/admin")) return null;

  const bottomOffset = pathname?.startsWith("/dashboard") ? "bottom-6" : "bottom-24";
  const { emoji: statusEmoji, label: statusLabel } = statusIndicator(status, messages);
  const inputPlaceholder = status === "escalated" ? "Message support team…" : "Type a message…";

  return (
    <div className={`fixed ${bottomOffset} right-6 z-50`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[72px] right-0 w-[350px] h-[500px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#6B21A8] px-4 py-3.5 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm leading-tight">BShop Support</p>
                <p className="text-white/70 text-xs flex items-center gap-1.5">
                  <span>{statusEmoji}</span>
                  {statusLabel}
                </p>
              </div>
              <button onClick={endChat} aria-label="End chat" title="End chat" className="text-white/80 hover:text-white p-1">
                <LogOut className="w-4 h-4" />
              </button>
              <button onClick={toggleOpen} aria-label="Close chat" className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {!loggedIn && !guestKnown ? (
              <div className="flex-1 flex flex-col justify-center px-6 py-8">
                <p className="text-sm font-semibold text-black mb-1">Let&apos;s get started</p>
                <p className="text-xs text-gray-500 mb-4">What&apos;s your email so we can help you better?</p>
                <form onSubmit={submitGuestInfo} className="space-y-2.5">
                  <input
                    type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#6B21A8]"
                  />
                  <input
                    type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#6B21A8]"
                  />
                  <button type="submit" className="w-full py-2.5 bg-[#6B21A8] text-white text-sm font-bold rounded-xl hover:bg-[#581c87]">
                    Start chat
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
                  {messages.length === 0 && (
                    <div className="flex justify-start mb-3 gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-gray-100 text-gray-800 text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm max-w-[75%]">
                        Hi{loggedIn && typeof window !== "undefined" && localStorage.getItem(AUTH_KEYS.clientFirst) ? `, ${localStorage.getItem(AUTH_KEYS.clientFirst)}` : ""}! How can I help you today?
                      </div>
                    </div>
                  )}
                  {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                  {sending && (
                    <div className="flex items-center gap-1.5 ml-9 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  )}
                  {/* Scroll anchor — always keep this in view so new messages read from the top down. */}
                  <div ref={messagesEndRef} />
                </div>

                {status === "offline" ? (
                  <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                    We&apos;re having trouble connecting. Leave a message and we&apos;ll get back to you by email.
                  </div>
                ) : status === "closed" ? (
                  <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 text-center space-y-2">
                    <p>This conversation has been closed by our support team. Start a new chat if you need more help.</p>
                    <button
                      onClick={startNewConversation}
                      className="px-4 py-1.5 bg-[#6B21A8] text-white text-xs font-bold rounded-lg hover:bg-[#581c87]"
                    >
                      Start New Chat
                    </button>
                  </div>
                ) : null}

                {status !== "closed" && (
                  <div className="border-t border-gray-100 px-3 py-3 flex items-end gap-2 shrink-0">
                    <textarea
                      value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
                      rows={1} placeholder={inputPlaceholder}
                      className="flex-1 resize-none px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#6B21A8] max-h-24"
                    />
                    <button
                      onClick={send} disabled={!input.trim() || sending}
                      aria-label="Send message"
                      className="w-10 h-10 shrink-0 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center hover:bg-[#581c87] disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-center text-[10px] text-gray-300 pb-2">Powered by AI</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        aria-label={open ? "Close support chat" : "Open support chat"}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-[#6B21A8] hover:bg-[#581c87] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(107,33,168,0.45)] transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
