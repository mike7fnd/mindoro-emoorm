"use client";

import React, { useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc,
  useMemoFirebase,
  useFirebase
} from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { 
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
  BadgeCheck,
  Star,
  MoreVertical,
  Settings,
  ArrowLeft,
  User as UserIcon,
  QrCode,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ProfileSidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar className="hidden md:flex border-r border-black/[0.05] bg-white w-64">
      <SidebarHeader className="px-6 py-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-black/5" 
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-6 w-6 text-muted-foreground" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-4 gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={cn(
                "h-12 rounded-xl px-4 gap-3 transition-all",
                isActive('/profile') ? "bg-black/[0.15] text-black font-bold shadow-sm" : "hover:bg-black/5"
              )}
              onClick={() => router.push('/profile')}
            >
              <UserIcon className={cn("h-5 w-5", isActive('/profile') ? "text-black" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={cn(
                "h-12 rounded-xl px-4 gap-3 transition-all",
                isActive('/my-bookings') ? "bg-black/[0.15] text-black font-bold shadow-sm" : "hover:bg-black/5"
              )}
              onClick={() => router.push('/my-bookings')}
            >
              <Calendar className={cn("h-5 w-5", isActive('/my-bookings') ? "text-black" : "text-muted-foreground")} />
              <span className="text-sm font-medium">My Bookings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarSeparator className="my-2 bg-black/5" />
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={cn(
                "h-12 rounded-xl px-4 gap-3 transition-all",
                isActive('/settings') ? "bg-black/[0.15] text-black font-bold shadow-sm" : "hover:bg-black/5"
              )}
              onClick={() => router.push('/settings')}
            >
              <Settings className={cn("h-5 w-5", isActive('/settings') ? "text-black" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 rounded-xl px-4 gap-3 hover:bg-black/5 transition-all">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Privacy & Security</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 rounded-xl px-4 gap-3 hover:bg-black/5 transition-all">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Resort Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className="w-full justify-start h-12 rounded-xl px-4 gap-3 text-red-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-bold">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();

  const [showQR, setShowQR] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("All");
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: bookings } = useCollection(bookingsQuery);

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "facilities");
  }, [firestore]);

  const { data: facilities } = useCollection(facilitiesQuery);

  const enrichedBookings = bookings?.map(booking => {
    const facility = facilities?.find(f => f.id === booking.facilityId);
    return {
      ...booking,
      facilityName: facility?.name || "Resort Facility",
      facilityImage: facility?.imageUrl,
      statusLabel: booking.status
    };
  }).filter(bk => bookingFilter === "All" || bk.status === bookingFilter);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleQR = () => {
    const tl = gsap.timeline({
      defaults: { duration: 0.5, ease: "power4.inOut" }
    });

    if (!showQR) {
      tl.to(cardRef.current, {
        paddingTop: "70px",
        paddingBottom: "70px",
        scale: 1.03,
        duration: 0.6,
      })
      .to(mediaContainerRef.current, {
        scale: 0.4,
        opacity: 0,
        y: -30,
        duration: 0.25,
        onComplete: () => setShowQR(true)
      }, "<")
      .fromTo(mediaContainerRef.current, 
        { scale: 0.4, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "elastic.out(1, 0.75)" }
      );
    } else {
      tl.to(cardRef.current, {
        paddingTop: "40px",
        paddingBottom: "40px",
        scale: 1,
        duration: 0.5,
      })
      .to(mediaContainerRef.current, {
        scale: 0.7,
        opacity: 0,
        y: 20,
        duration: 0.2,
        onComplete: () => setShowQR(false)
      }, "<")
      .fromTo(mediaContainerRef.current,
        { scale: 0.7, opacity: 0, y: -20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  };

  if (isUserLoading) return null;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const displayName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : (user.displayName || "Resort Guest");
  const profilePic = userProfile?.profilePictureUrl || user.photoURL || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white dark:bg-[#050505] transition-colors">
        <ProfileSidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <div className="md:hidden">
            <Header />
          </div>

          <main className="flex-grow container mx-auto px-0 md:p-8 pt-0 md:pt-12 pb-24 max-w-2xl">
            <div className="p-6 md:p-8 flex items-center justify-between md:hidden">
              <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] dark:text-white">Profile</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-2xl border-none bg-white/80 backdrop-blur-xl dark:bg-black/80">
                  <DropdownMenuLabel className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Account Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
                  <DropdownMenuItem 
                    className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3"
                    onClick={() => router.push('/my-bookings')}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">My Bookings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Privacy & Security</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Resort Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="rounded-xl px-4 py-3 cursor-pointer focus:bg-red-50 focus:text-red-600 transition-colors gap-3 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-bold">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="px-6 space-y-8">
              <section 
                ref={cardRef}
                className="bg-white dark:bg-white/[0.03] rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.02] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={toggleQR}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary z-10"
                  title={showQR ? "Show Profile" : "Show Guest Pass"}
                >
                  {showQR ? <X className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
                </button>

                <div ref={mediaContainerRef} className="mb-6 flex items-center justify-center">
                  {showQR ? (
                    <div className="bg-white p-5 rounded-[30px] shadow-sm flex items-center justify-center">
                      <QRCodeSVG value={`resort://user/${user.uid}`} size={200} level="H" />
                    </div>
                  ) : (
                    <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-[#f9f9f9] dark:border-white/10 shadow-md overflow-hidden bg-muted relative transition-transform hover:scale-105 duration-300">
                      <Image src={profilePic} alt="Profile" fill className="object-cover" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-normal font-headline tracking-tight text-black dark:text-white">{displayName}</h2>
                <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">{user.email}</p>
                {showQR && <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mt-6 animate-pulse">GUEST PASS • READY</p>}
              </section>

              <Tabs defaultValue="stays" className="w-full">
                <TabsList className="w-full bg-[#f9f9f9] dark:bg-white/[0.03] p-1 h-14 rounded-full">
                  <TabsTrigger value="stays" className="flex-1 rounded-full h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">My Stays</TabsTrigger>
                  <TabsTrigger value="membership" className="flex-1 rounded-full h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">Membership</TabsTrigger>
                  <TabsTrigger value="rewards" className="flex-1 rounded-full h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="stays" className="mt-8 space-y-6">
                  <div className="flex justify-center gap-6 border-b border-black/[0.03] pb-1 overflow-x-auto scrollbar-hide">
                    {["All", "Pending", "Confirmed", "Completed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setBookingFilter(status)}
                        className={cn(
                          "pb-3 text-xs font-bold transition-all relative whitespace-nowrap",
                          bookingFilter === status ? "text-primary" : "text-muted-foreground hover:text-black"
                        )}
                      >
                        {status}
                        {bookingFilter === status && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {enrichedBookings && enrichedBookings.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {enrichedBookings.slice(0, 3).map((bk) => (
                          <div key={bk.id} className="bg-white dark:bg-white/[0.03] rounded-[24px] p-4 flex items-center gap-5 group cursor-pointer hover:shadow-xl hover:shadow-black/[0.03] transition-all border border-black/[0.03] dark:border-white/[0.05]">
                            <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-[18px] overflow-hidden shrink-0 bg-muted">
                              <Image src={bk.facilityImage || "https://picsum.photos/seed/resort/400/300"} alt={bk.facilityName} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute top-1.5 right-1.5">
                                 <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[8px] font-bold px-2 py-0.5 rounded-full">{bk.statusLabel}</Badge>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-headline text-lg tracking-tight text-black dark:text-white truncate pr-4">{bk.facilityName}</h4>
                                <span className="font-medium text-primary text-base">₱{(bk.totalPrice || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col gap-1 text-muted-foreground text-[12px] font-medium opacity-80">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-primary/40" />
                                  <span>
                                    {new Date(bk.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(bk.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <ChevronRight className="h-3.5 w-3.5 text-primary/40 rotate-90" />
                                  <span>{bk.numberOfGuests} Guests</span>
                                </div>
                              </div>
                            </div>
                            <div className="hidden md:flex items-center pr-2">
                              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-10 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 md:hidden">
                        <Button 
                          variant="ghost" 
                          className="w-full h-14 rounded-2xl text-primary font-bold hover:bg-primary/5 gap-2"
                          onClick={() => router.push('/my-bookings')}
                        >
                          View all bookings <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-16 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[40px] text-center bg-[#fcfcfc] dark:bg-transparent">
                      <p className="text-base text-muted-foreground italic mb-4">No bookings found yet.</p>
                      <Button asChild variant="outline" className="rounded-full px-8 h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                        <Link href="/">Explore escapes</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="membership" className="mt-8">
                  <div className="bg-[#f9f9f9] dark:bg-white/[0.03] rounded-[30px] p-8 text-center space-y-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <BadgeCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-headline dark:text-white">Gold Member</h4>
                      <p className="text-xs text-muted-foreground">Joined October 2024</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rewards" className="mt-8">
                  <div className="bg-black dark:bg-white/10 text-white rounded-[30px] p-8 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-headline tracking-tight">1,250 Points</h4>
                      <p className="text-xs opacity-60">Collect more points for free stays</p>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 font-bold mt-4 border-none">Redeem Bliss</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
          <div className="md:hidden">
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
