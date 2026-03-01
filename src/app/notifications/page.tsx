
"use client";

import React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  useUser, 
  useSupabase, 
  useCollection, 
  useStableMemo 
} from "@/supabase";
import { Bell, Calendar, Info, Sparkles, MoreVertical, Search, CheckCircle2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FirstTimeIntro } from "@/components/first-time-intro";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'order' | 'system' | 'promo';
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();

  const notificationsQuery = useStableMemo(() => {
    if (!user) return null;
    return { 
      table: "notifications", 
      filters: [{ column: "user_id", op: "eq" as const, value: user.uid }],
      order: { column: "timestamp", ascending: false }
    };
  }, [user]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  if (isUserLoading) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto pt-0 md:pt-32 pb-24">
        {/* Standardized Header Style with Dropdown */}
        <div className="p-6 md:p-8 flex items-center justify-between">
          <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">Notifications</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/30 backdrop-blur-xl">
              <DropdownMenuLabel className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Manage Alerts</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/5" />
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Search alerts</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Mark all read</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Alert settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                className={cn(
                  "p-5 rounded-[20px] transition-all flex gap-4 border border-black/[0.03]",
                  notif.isRead ? "bg-white opacity-60" : "bg-[#f9f9f9] shadow-sm"
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                  notif.type === 'order' ? "bg-blue-50 text-blue-500" :
                  notif.type === 'promo' ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {notif.type === 'order' ? <Calendar className="h-6 w-6" /> :
                   notif.type === 'promo' ? <Sparkles className="h-6 w-6" /> :
                   <Info className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-[15px]">{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notif.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
              <div className="h-20 w-20 rounded-full border-2 border-black/10 flex items-center justify-center mb-6">
                <Bell className="h-10 w-10 text-black/20" />
              </div>
              <p className="text-sm font-headline italic">You're all caught up!</p>
            </div>
          )}
        </div>
      </main>
      <FirstTimeIntro
        storageKey="notifications"
        title="Notifications"
        description="Stay updated with order confirmations, booking reminders, promotions, and important announcements."
        icon={<Bell className="h-7 w-7" />}
      />
      <Footer />
    </div>
  );
}
