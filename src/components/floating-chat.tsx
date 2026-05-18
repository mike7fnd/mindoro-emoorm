"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, X, Send, ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import { useUser, useSupabase, useCollection, useStableMemo } from "@/supabase";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt?: string;
  userId?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  conversationId: string;
}

function isBotConvo(id: string | null | undefined): boolean {
  return !!id && (id === "bella-bot" || id.startsWith("bella-bot-"));
}

function formatTime(ts: string | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function FloatingChat() {
  const { user } = useUser();
  const supabase = useSupabase();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [chatCleared, setChatCleared] = useState(false);
  const [lastOpened, setLastOpened] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("emoorm_chat_last_opened");
    if (stored) setLastOpened(Number(stored));
  }, []);

  const conversationsQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "conversations",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
      order: { column: "updatedAt", ascending: false },
    };
  }, [user]);

  const { data: userConversations } =
    useCollection<Conversation>(conversationsQuery);

  const botConvoId = user ? `bella-bot-${user.uid}` : "bella-bot";

  const conversations = useMemo(() => {
    const list = userConversations ? [...userConversations] : [];
    if (!list.find((c) => isBotConvo(c.id))) {
      list.unshift({
        id: botConvoId,
        name: "Moormy Bot",
        lastMessage: "Hi! I'm your shopping assistant.",
        updatedAt: new Date().toISOString(),
      });
    }
    return list;
  }, [userConversations, botConvoId]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    if (!lastOpened) return Math.min(conversations.length, 9);
    return conversations.filter(
      (c) => c.updatedAt && new Date(c.updatedAt).getTime() > lastOpened,
    ).length;
  }, [conversations, lastOpened, user]);

  const messagesQuery = useStableMemo(() => {
    if (!user || !activeConvoId) return null;
    return {
      table: "messages",
      filters: [
        { column: "conversationId", op: "eq" as const, value: activeConvoId },
      ],
      order: { column: "createdAt", ascending: true },
    };
  }, [user, activeConvoId]);

  const { data: rawMessages } = useCollection<Message>(messagesQuery);
  const messages = chatCleared ? [] : rawMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const handleOpen = () => {
    setIsOpen(true);
    const now = Date.now();
    setLastOpened(now);
    localStorage.setItem("emoorm_chat_last_opened", String(now));
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveConvoId(null);
    setMessageInput("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user || !activeConvoId) return;

    const content = messageInput.trim();
    setMessageInput("");
    setChatCleared(false);
    const now = new Date().toISOString();

    await supabase.from("messages").insert({
      conversationId: activeConvoId,
      senderId: user.uid,
      recipientId: isBotConvo(activeConvoId) ? "bella-bot" : "admin",
      content,
      createdAt: now,
    });

    await supabase.from("conversations").upsert(
      {
        id: activeConvoId,
        userId: user.uid,
        lastMessage: content,
        updatedAt: now,
        name: isBotConvo(activeConvoId) ? "Moormy Bot" : "Customer Support",
      },
      { onConflict: "id" },
    );

    if (isBotConvo(activeConvoId)) {
      setIsBotTyping(true);
      const typingTimeout = setTimeout(() => setIsBotTyping(false), 30000);
      try {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 25000);

        const chatHistory = (messages ?? []).slice(-10).map((msg) => ({
          role: msg.senderId === user.uid ? "user" : "assistant",
          content: msg.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            language: "english",
            history: chatHistory,
            userName: user.displayName || undefined,
          }),
          signal: controller.signal,
        });
        clearTimeout(fetchTimeout);

        let replyText =
          "Sorry, I'm having trouble right now. Please try again.";
        if (res.ok) {
          const ai = await res.json();
          if (ai.reply) replyText = ai.reply;
        }

        const replyTime = new Date().toISOString();
        await supabase.from("messages").insert({
          conversationId: activeConvoId,
          senderId: "bella-bot",
          recipientId: user.uid,
          content: replyText,
          createdAt: replyTime,
        });
        await supabase.from("conversations").upsert(
          {
            id: activeConvoId,
            lastMessage: replyText,
            updatedAt: replyTime,
          },
          { onConflict: "id" },
        );
      } catch {
        // silent fail — no fallback insert to keep UX clean
      } finally {
        clearTimeout(typingTimeout);
        setIsBotTyping(false);
      }
    }
  };

  // Hide on the messages page and all seller center pages
  if (pathname?.startsWith("/messages") || pathname?.startsWith("/seller"))
    return null;

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? "Close chat" : "Open messages"}
        className="fixed bottom-6 right-6 z-[10001] h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: "#29a366" }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[10000] w-[calc(100vw-3rem)] max-w-[360px] bg-white rounded-[14px] shadow-2xl border border-black/[0.08] flex flex-col overflow-hidden"
          style={{ height: 500 }}
        >
          {/* Header */}
          <div
            className="h-14 px-4 flex items-center gap-3 shrink-0"
            style={{ background: "#29a366" }}
          >
            {activeConvoId ? (
              <>
                <button
                  onClick={() => {
                    setActiveConvoId(null);
                    setMessageInput("");
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 text-white" />
                </button>
                <div className="h-8 w-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                  {isBotConvo(activeConvoId) ? (
                    <Image
                      src="/icons/moormy-bot.jpg"
                      alt="Moormy Bot"
                      width={32}
                      height={32}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {activeConvo?.name?.[0] || "S"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {activeConvo?.name || "Chat"}
                  </p>
                  <p className="text-[10px] text-white/70">
                    {isBotConvo(activeConvoId)
                      ? "Shopping Assistant"
                      : "Support"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Messages</p>
                  <p className="text-[10px] text-white/70">
                    {user
                      ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
                      : "Sign in to chat"}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Body — unauthenticated */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
              <MessageSquare
                className="h-10 w-10 text-[#ddd]"
                strokeWidth={1.5}
              />
              <p className="text-sm text-[#888] leading-relaxed">
                Sign in to chat with sellers or our AI shopping assistant.
              </p>
              <a
                href="/login"
                className="text-sm font-semibold px-5 py-2.5 rounded-[8px] text-white transition-opacity hover:opacity-90"
                style={{ background: "#29a366" }}
              >
                Sign In
              </a>
            </div>
          ) : activeConvoId ? (
            /* ── Active chat ───────────────────────────────── */
            <>
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
                {(!messages || messages.length === 0) && !isBotTyping ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 opacity-30">
                    {isBotConvo(activeConvoId) ? (
                      <Sparkles className="h-8 w-8" />
                    ) : (
                      <MessageSquare className="h-8 w-8" />
                    )}
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages?.map((msg) => {
                      const isMe = msg.senderId === user.uid;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "max-w-[85%] flex flex-col",
                            isMe
                              ? "self-end items-end"
                              : "self-start items-start",
                          )}
                        >
                          <div
                            className={cn(
                              "px-3.5 py-2 text-[13px] leading-relaxed rounded-[16px]",
                              isMe
                                ? "text-white rounded-br-[4px]"
                                : "bg-[#f2f2f0] text-[#111] rounded-bl-[4px]",
                            )}
                            style={isMe ? { background: "#29a366" } : {}}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-[#bbb] mt-0.5 px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                    {isBotTyping && (
                      <div className="self-start flex gap-1 items-center bg-[#f2f2f0] rounded-[16px] rounded-bl-[4px] px-3.5 py-3">
                        {[0, 100, 200].map((d) => (
                          <div
                            key={d}
                            className="h-1.5 w-1.5 bg-[#aaa] rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-2.5 border-t border-black/[0.05] shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Message…"
                    autoFocus
                    className="flex-1 bg-[#f2f2f0] border border-black/[0.08] rounded-full px-3.5 h-9 text-sm outline-none focus:border-[#29a366] transition-all"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isBotTyping}
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                    style={{ background: "#29a366" }}
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* ── Conversations list ────────────────────────── */
            <div className="flex-1 overflow-y-auto">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvoId(convo.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-black/[0.04] hover:bg-[#fafafa] transition-colors text-left"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden",
                      isBotConvo(convo.id) ? "bg-black" : "bg-[#29a366]",
                    )}
                  >
                    {isBotConvo(convo.id) ? (
                      <Image
                        src="/icons/moormy-bot-v2.jpg"
                        alt="Moormy Bot"
                        width={40}
                        height={40}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      convo.name?.[0] || "S"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <p className="text-sm font-medium text-[#111] truncate flex items-center gap-1.5">
                        {convo.name}
                        {isBotConvo(convo.id) && (
                          <span className="text-[8px] font-bold text-[#29a366] border border-[#29a366]/30 rounded-full px-1.5 py-0.5 leading-none ">
                            AI
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-[#bbb] shrink-0">
                        {formatTime(convo.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#999] truncate">
                      {convo.lastMessage || "Start a chat"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
