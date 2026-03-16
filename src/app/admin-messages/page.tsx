
"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { Header } from "@/components/layout/header";
import {
  useUser,
  useSupabase,
  useCollection,
  useStableMemo
} from "@/supabase";
import {
  MessagesSquare,
  ArrowLeft,
  MoreVertical,
  Smile,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useIsAdmin } from "@/hooks/use-is-admin";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  email: string;
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

function AdminMessagesContent() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isAdminLoading } = useIsAdmin();

  const selectedUserId = searchParams.get('user');
  const [messageInput, setMessageInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isAdminLoading, router]);

  const usersQuery = useStableMemo(() => {
    return { table: "users" };
  }, []);
  const { data: profiles } = useCollection<UserProfile>(usersQuery);

  const allConversationsQuery = useStableMemo(() => {
    if (!isAdmin) return null;
    return {
      table: "conversations",
      order: { column: "updatedAt", ascending: false }
    };
  }, [isAdmin]);

  const { data: conversations } = useCollection(allConversationsQuery);

  const messagesQuery = useStableMemo(() => {
    if (!isAdmin || !selectedUserId) return null;
    return {
      table: "messages",
      filters: [{ column: "conversationId", op: "eq" as const, value: "support" }],
      order: { column: "createdAt", ascending: true }
    };
  }, [isAdmin, selectedUserId]);

  const { data: messages } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user || !selectedUserId) return;

    const content = messageInput.trim();
    setMessageInput("");

    const now = new Date().toISOString();

    supabase.from("messages").insert({
      conversationId: "support",
      senderId: user.uid,
      recipientId: selectedUserId,
      content,
      createdAt: now
    });

    supabase.from("conversations").upsert({
      id: "support",
      userId: selectedUserId,
      lastMessage: content,
      updatedAt: now,
      name: "Support"
    }, { onConflict: 'id' });
  };

  const getGuestProfile = (id: string) => {
    return profiles?.find(p => p.id === id);
  };

  if (isAdminLoading || !isAdmin) return null;

  const showList = !isMobileView || !selectedUserId;
  const showChat = !isMobileView || selectedUserId;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-0 md:p-8 pt-0 md:pt-32 pb-0">
        <div className={cn(
          "flex flex-col lg:flex-row md:h-[80vh] md:rounded-[25px] border border-black/[0.05] overflow-hidden bg-white shadow-2xl transition-all",
          isMobileView && selectedUserId ? "h-[100dvh] border-none rounded-none fixed inset-0 z-[1001]" : "h-screen"
        )}>

          {showList && (
            <aside className="w-full lg:w-[380px] flex flex-col border-r border-black/[0.05] bg-white animate-in fade-in duration-300 h-full">
              <div className="p-6 md:p-8 flex items-center justify-between">
                <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">Messages</h1>
                <button className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
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
                  {conversations?.map((convo) => {
                    const userId = convo.userId || convo.id;
                    const profile = getGuestProfile(userId);
                    const isActive = selectedUserId === userId;
                    const guestName = profile ? `${profile.firstName} ${profile.lastName}` : `Buyer ${userId.slice(0, 5).toUpperCase()}`;
                    const guestPic = profile?.profilePictureUrl || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

                    return (
                      <div
                        key={convo.id}
                        onClick={() => router.push(`/admin-messages?user=${userId}`)}
                        className={cn(
                          "px-6 py-4 flex items-center gap-4 cursor-pointer transition-all",
                          isActive ? "bg-[#f2f2f2]" : "hover:bg-[#fafafa]"
                        )}
                      >
                        <div className="relative h-14 w-14 rounded-full bg-muted flex items-center justify-center border-none shrink-0 overflow-hidden">
                          <Image src={guestPic} alt={guestName} fill className="object-cover" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-medium truncate text-[15px]">{guestName}</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatMessageTime(convo.updatedAt || null)}
                            </span>
                          </div>
                          <p className="text-[13px] truncate text-muted-foreground opacity-80">
                            {convo.lastMessage || "Sent a message"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {showChat && (
            <section className="flex-1 flex flex-col bg-white animate-in slide-in-from-right-4 duration-300 h-full relative">
              {selectedUserId ? (
                <>
                  <div className="h-[70px] px-6 md:px-8 border-b border-black/[0.05] flex items-center justify-between bg-white shrink-0 z-10">
                    <div className="flex items-center gap-4">
                      {isMobileView && (
                        <button onClick={() => router.push('/admin-messages')} className="mr-2 p-1 hover:bg-muted rounded-full">
                          <ArrowLeft className="h-6 w-6" />
                        </button>
                      )}
                      {(() => {
                        const profile = getGuestProfile(selectedUserId);
                        const guestName = profile ? `${profile.firstName} ${profile.lastName}` : `Buyer ${selectedUserId.slice(0, 8).toUpperCase()}`;
                        const guestPic = profile?.profilePictureUrl || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";
                        return (
                          <>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                              <Image src={guestPic} alt={guestName} fill className="object-cover" />
                            </div>
                            <div>
                              <h3 className="text-[15px] font-bold tracking-tight leading-tight">{guestName}</h3>
                              <p className="text-[11px] text-green-500 font-medium">Active now</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white flex flex-col gap-4">
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
                            {msg.content}
                          </div>
                          <div className="px-2 mt-1">
                            <span className="text-[9px] text-muted-foreground opacity-50 uppercase tracking-tighter">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
                        disabled={!messageInput.trim()}
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
                  <h2 className="text-xl font-normal font-headline tracking-tight mb-2">Buyer Messages</h2>
                  <p className="text-sm text-muted-foreground max-w-[280px]">Select a buyer conversation to manage inquiries and support.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense>
      <AdminMessagesContent />
    </Suspense>
  );
}
