
"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  MessagesSquare,
  Send,
  ArrowLeft,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  Sparkles,
  Settings,
  Archive,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useUser,
  useSupabase,
  useCollection,
  useStableMemo
} from "@/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { bellasBot } from "@/ai/flows/bellas-bot-flow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

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
  recipientId: string;
  content: string;
  createdAt: string;
}

function formatMessageTime(timestamp: string | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function MessagesContent() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeConversationId = searchParams.get('id');
  const [messageInput, setMessageInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const conversationsQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "conversations",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
      order: { column: "updatedAt", ascending: false }
    };
  }, [user]);

  const { data: userConversations } = useCollection<Conversation>(conversationsQuery);

  const conversations = useMemo(() => {
    const list = userConversations ? [...userConversations] : [];
    if (!list.find(c => c.id === 'bella-bot')) {
      list.unshift({
        id: 'bella-bot',
        name: "E-Moorm Bot",
        lastMessage: "Hi! I'm your shopping assistant. How can I help?",
        updatedAt: new Date().toISOString(),
      });
    }
    return list;
  }, [userConversations]);

  const messagesQuery = useStableMemo(() => {
    if (!user || !activeConversationId) return null;
    return {
      table: "messages",
      filters: [{ column: "conversationId", op: "eq" as const, value: activeConversationId }],
      order: { column: "createdAt", ascending: true }
    };
  }, [user, activeConversationId]);

  const { data: messages } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user || !activeConversationId) return;

    const content = messageInput.trim();
    setMessageInput("");

    const now = new Date().toISOString();

    await supabase.from("messages").insert({
      conversationId: activeConversationId,
      senderId: user.uid,
      recipientId: activeConversationId === 'bella-bot' ? 'bella-bot' : 'admin',
      content,
      createdAt: now
    });

    await supabase.from("conversations").upsert({
      id: activeConversationId,
      userId: user.uid,
      lastMessage: content,
      updatedAt: now,
      name: activeConversationId === 'bella-bot' ? "E-Moorm Bot" : "Customer Support"
    }, { onConflict: 'id' });

    if (activeConversationId === 'bella-bot') {
      setIsBotTyping(true);
      try {
        const history = messages?.slice(-5).map(m => ({
          role: m.senderId === user.uid ? 'user' as const : 'model' as const,
          content: m.content
        })) || [];

        const aiResponse = await bellasBot({ message: content, history });

        const replyTime = new Date().toISOString();

        await supabase.from("messages").insert({
          conversationId: activeConversationId,
          senderId: 'bella-bot',
          recipientId: user.uid,
          content: aiResponse.reply,
          createdAt: replyTime
        });

        await supabase.from("conversations").upsert({
          id: activeConversationId,
          lastMessage: aiResponse.reply,
          updatedAt: replyTime,
        }, { onConflict: 'id' });
      } catch (error) {
        console.error("AI Error:", error);
      } finally {
        setIsBotTyping(false);
      }
    }
  };

  const activeConversation = conversations?.find(c => c.id === activeConversationId);

  const showList = !isMobileView || !activeConversationId;
  const showChat = !isMobileView || activeConversationId;

  if (isUserLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto p-0 md:p-8 pt-0 md:pt-32 pb-0 max-w-7xl">
        <div className="flex flex-col lg:flex-row md:h-[80vh] md:rounded-[25px] border border-black/[0.05] overflow-hidden bg-white shadow-2xl">
          <div className="w-full lg:w-80 border-r border-black/[0.05] p-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-full mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-5 w-48 rounded-full mb-2" />
            <Skeleton className="h-4 w-64 rounded-full" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-grow container mx-auto p-0 md:p-8 pt-0 md:pt-32 pb-0 max-w-7xl">
        <div className={cn(
          "flex flex-col lg:flex-row md:h-[80vh] md:rounded-[25px] border border-black/[0.05] overflow-hidden bg-white shadow-2xl transition-all",
          isMobileView && activeConversationId ? "h-[100dvh] border-none rounded-none fixed inset-0 z-[1001]" : "h-screen"
        )}>

          {showList && (
            <aside className="w-full lg:w-[380px] flex flex-col border-r border-black/[0.05] bg-white animate-in fade-in duration-300 h-full">
              <div className="p-6 md:p-8 flex items-center justify-between">
                <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">Messages</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/30 backdrop-blur-xl">
                    <DropdownMenuLabel className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Inbox Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-black/5" />
                    <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                      <Search className="h-4 w-4" />
                      <span className="text-sm font-medium">Search chats</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                      <Archive className="h-4 w-4" />
                      <span className="text-sm font-medium">Archived</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Account Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full bg-[#f2f2f2] rounded-[10px] py-2.5 px-4 text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {conversations?.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => router.push(`/messages?id=${convo.id}`)}
                      className={cn(
                        "px-6 py-4 flex items-center gap-4 cursor-pointer transition-all",
                        activeConversationId === convo.id ? "bg-[#f2f2f2]" : "hover:bg-[#fafafa]"
                      )}
                    >
                      <div className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden relative",
                        convo.id === 'bella-bot' ? "bg-black" : "bg-primary"
                      )}>
                        {convo.id === 'bella-bot' ? <Sparkles className="h-6 w-6" /> : (convo.name?.[0] || 'B')}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-medium truncate text-[15px] flex items-center gap-1.5">
                            {convo.name}
                            {convo.id === 'bella-bot' && <span className="bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">AI</span>}
                          </h4>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatMessageTime(convo.updatedAt || null)}
                          </span>
                        </div>
                        <p className="text-[13px] truncate text-muted-foreground opacity-80">
                          {convo.lastMessage || "Start a chat"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {showChat && (
            <section className="flex-1 flex flex-col bg-white animate-in slide-in-from-right-4 duration-300 h-full relative">
              {activeConversationId ? (
                <>
                  <div className="h-[70px] px-6 md:px-8 border-b border-black/[0.05] flex items-center justify-between bg-white shrink-0 z-10">
                    <div className="flex items-center gap-4">
                      {isMobileView && (
                        <button onClick={() => router.push('/messages')} className="mr-2 p-1 hover:bg-muted rounded-full">
                          <ArrowLeft className="h-6 w-6" />
                        </button>
                      )}
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                        activeConversationId === 'bella-bot' ? "bg-black" : "bg-primary"
                      )}>
                        {activeConversationId === 'bella-bot' ? <Sparkles className="h-4 w-4" /> : (activeConversation?.name?.[0] || 'B')}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold tracking-tight leading-tight">{activeConversation?.name}</h3>
                        <p className="text-[11px] text-green-500 font-medium">
                          {activeConversationId === 'bella-bot' ? "Shopping Assistant Active" : "Support online"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white flex flex-col gap-4">
                    {messages?.length === 0 && !isBotTyping ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                        {activeConversationId === 'bella-bot' ? <Sparkles className="h-12 w-12 mb-4 text-black" /> : <MessagesSquare className="h-12 w-12 mb-4 text-primary" />}
                        <p className="text-sm font-headline italic">How can we help you today?</p>
                      </div>
                    ) : (
                      <>
                        {messages?.map((msg) => {
                          const isMe = msg.senderId === user?.uid;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "max-w-[80%] md:max-w-[70%] flex flex-col group relative",
                                isMe ? "self-end items-end" : "self-start items-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "px-4 py-2.5 text-sm transition-all relative",
                                  isMe
                                    ? "bg-primary text-white rounded-[22px] rounded-br-[4px]"
                                    : "bg-[#f2f2f2] text-black rounded-[22px] rounded-bl-[4px]"
                                )}
                              >
                                {msg.content.split('\n').map((line: string, i: number) => {
                                  // Render image URLs as inline images
                                  if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i.test(line.trim()) || /supabase\.co\/storage/.test(line.trim())) {
                                    return <img key={i} src={line.trim()} alt="Shared image" className="max-w-[240px] rounded-xl mt-1 mb-1 border border-white/20" />;
                                  }
                                  return <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>;
                                })}
                              </div>
                              <div className="px-2 mt-1">
                                <span className="text-[9px] text-muted-foreground opacity-50 uppercase tracking-tighter">
                                  {formatMessageTime(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {isBotTyping && (
                          <div className="self-start max-w-[80%] md:max-w-[70%] flex flex-col">
                            <div className="bg-[#f2f2f2] text-black rounded-[22px] rounded-bl-[4px] px-4 py-2.5 text-sm flex gap-1 items-center">
                              <div className="h-1.5 w-1.5 bg-black/20 rounded-full animate-bounce" />
                              <div className="h-1.5 w-1.5 bg-black/20 rounded-full animate-bounce delay-100" />
                              <div className="h-1.5 w-1.5 bg-black/20 rounded-full animate-bounce delay-200" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>

                  <div className={cn(
                    "p-4 md:p-6 bg-white shrink-0",
                    isMobileView && "pb-[max(env(safe-area-inset-bottom),16px)] border-t border-black/[0.05]"
                  )}>
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                      <div className="flex-1 relative flex items-center">
                        <div className="absolute left-4 flex gap-2">
                          <button type="button" className="text-muted-foreground hover:text-black">
                            <Smile className="h-5 w-5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Message..."
                          className="w-full border border-black/[0.1] rounded-full pl-12 pr-12 h-[44px] outline-none focus:border-black/30 transition-all text-sm"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <div className="absolute right-4 flex gap-2">
                          <button type="button" className="text-muted-foreground hover:text-black">
                            <ImageIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isBotTyping}
                        className="text-primary font-bold text-[15px] px-3 disabled:opacity-30 hover:text-primary/80 transition-all shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#fafafa]">
                  <div className="h-24 w-24 rounded-full border-2 border-black/10 flex items-center justify-center mb-6">
                    <MessagesSquare className="h-12 w-12 text-black/20" />
                  </div>
                  <h2 className="text-xl font-normal font-headline tracking-tight mb-2">Direct Messages</h2>
                  <p className="text-sm text-muted-foreground max-w-[280px]">Connect with sellers or our shopping assistant for a great marketplace experience.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {!activeConversationId && <Footer />}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}
