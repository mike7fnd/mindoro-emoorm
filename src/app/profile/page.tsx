"use client";

import React, { useState, useRef, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  useUser,
  useSupabase,
  useCollection,
  useDoc,
  useMemoFirebase,
  useFirebase
} from "@/supabase";
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
  X,
  Store,
  ArrowUpRight,
  Heart,
  Trash2,
  ShoppingCart
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SellerInfoStepper } from "@/components/ui/seller-info-stepper";
import { SellerRegistrationForm } from "@/components/ui/seller-registration-form";
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
              <span className="text-sm font-medium">My Orders</span>
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
              <span className="text-sm font-medium">Customer Support</span>
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
  const supabase = useSupabase();
  const router = useRouter();

  const [showQR, setShowQR] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("All");
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handler for avatar click
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handler for file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const filePath = `avatars/${user.uid}_${Date.now()}`;
      const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (error) throw error;
      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        // Update user profile
        await supabase.from("users").update({ profilePictureUrl: publicUrl }).eq("id", user.uid);
        // Optionally, update UI immediately
        window.location.reload();
      }
    } catch (err) {
      alert("Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);

  const { data: userProfile } = useDoc(userProfileRef);

  // Check if user has a registered store
  const storeRef = useMemoFirebase(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: userShop } = useDoc(storeRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return { table: "bookings", filters: [{ column: "userId", op: "eq" as const, value: user.uid }] };
  }, [user]);

  const { data: bookings } = useCollection(bookingsQuery);

  const facilitiesQuery = useMemoFirebase(() => {
    return { table: "facilities" };
  }, []);

  const { data: facilities } = useCollection(facilitiesQuery);

  const enrichedBookings = bookings?.map(booking => {
    const facility = facilities?.find(f => f.id === booking.facilityId);
    return {
      ...booking,
      facilityName: facility?.name || "Product",
      facilityImage: facility?.imageUrl,
      statusLabel: booking.status
    };
  }).filter(bk => bookingFilter === "All" || bk.status === bookingFilter);

  // Wishlist
  const wishlistQuery = useMemoFirebase(() => {
    if (!user) return null;
    return { table: "wishlist", filters: [{ column: "userId", op: "eq" as const, value: user.uid }] };
  }, [user]);
  const { data: wishlistData } = useCollection(wishlistQuery);

  const wishlistProducts = useMemo(() => {
    if (!wishlistData || !facilities) return [];
    return (wishlistData as any[]).map((w: any) => {
      const product = facilities.find((f: any) => f.id === w.productId);
      return product ? { ...product, wishlistId: w.id } : null;
    }).filter(Boolean);
  }, [wishlistData, facilities]);

  const removeFromWishlist = async (wishlistId: string) => {
    await supabase.from("wishlist").delete().eq("id", wishlistId);
    window.location.reload();
  };

  const addToCart = async (productId: string) => {
    if (!user) return;
    await supabase.from("cart_items").upsert({ userId: user.uid, productId, quantity: 1 }, { onConflict: "userId,productId" });
  };

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

  // removed duplicate uploading and fileInputRef

  if (isUserLoading) return null;

  // GUEST VIEW: Encourage login/signup
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-[#050505] transition-colors">
        <Header />
        <main className="flex-grow container mx-auto px-6 pt-0 md:pt-32 pb-24 max-w-2xl">
          <div className="px-0 md:px-6 mt-8 md:mt-0 space-y-8">
            <section className="bg-white dark:bg-white/[0.03] rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.02] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
              <div className="mb-6 flex items-center justify-center">
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-[#f9f9f9] dark:border-white/10 shadow-md bg-muted flex items-center justify-center">
                  <UserIcon className="h-12 w-12 md:h-14 md:w-14 text-muted-foreground/40" />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-normal font-headline tracking-tight text-black dark:text-white">Welcome to E-Moorm</h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium mt-2 max-w-sm leading-relaxed">
                Sign in or create an account to track your orders, save favorites, and enjoy the full marketplace experience.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-xs">
                <Button
                  onClick={() => router.push('/login')}
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold border-none"
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/signup')}
                  className="flex-1 h-12 rounded-full border-black/10 font-bold hover:bg-black/5"
                >
                  Sign Up
                </Button>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : (user.displayName || "Shopper");
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
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none"
                  title="Settings"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </button>
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
                      <span className="text-sm font-medium">My Orders</span>
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
                      <span className="text-sm font-medium">Customer Support</span>
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
            </div>
            <div className="px-6 space-y-8">
              <section
                ref={cardRef}
                className="bg-white dark:bg-white/[0.03] rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/[0.02] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={toggleQR}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary z-10"
                  title={showQR ? "Show Profile" : "Show Member Card"}
                >
                  {showQR ? <X className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
                </button>

                <div ref={mediaContainerRef} className="mb-6 flex items-center justify-center">
                  {showQR ? (
                    <div className="bg-white p-5 rounded-[30px] shadow-sm flex items-center justify-center">
                      <QRCodeSVG value={`ormind://user/${user.uid}`} size={200} level="H" />
                    </div>
                  ) : (
                    <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-[#f9f9f9] dark:border-white/10 shadow-md overflow-hidden bg-muted relative transition-transform hover:scale-105 duration-300 cursor-pointer group"
                      onClick={handleAvatarClick}
                      title="Change profile picture"
                    >
                      <Image src={profilePic} alt="Profile" fill className="object-cover" />
                      {uploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-primary text-xs font-bold">Uploading...</div>}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      {/* Removed pink circle from avatar */}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-normal font-headline tracking-tight text-black dark:text-white">{displayName}</h2>
                <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">{user.email}</p>
                {showQR && <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mt-6 animate-pulse">MEMBER PASS • READY</p>}
              </section>

              {/* Orders as cards with status icons and unread dot */}
              <section className="space-y-4">
                <h3 className="text-lg font-headline tracking-tight mb-2">My Orders</h3>
                {enrichedBookings && enrichedBookings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {enrichedBookings.slice(0, 3).map((bk) => (
                      <div key={bk.id} className="bg-white dark:bg-white/[0.03] rounded-[24px] p-4 flex items-center gap-5 group cursor-pointer hover:shadow-xl hover:shadow-black/[0.03] transition-all border border-black/[0.03] dark:border-white/[0.05] relative">
                        <div className="relative h-16 w-16 rounded-[18px] overflow-hidden shrink-0 bg-muted">
                          <Image src={bk.facilityImage || "https://picsum.photos/seed/product/400/300"} alt={bk.facilityName} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          {/* Status icon */}
                          <div className="absolute bottom-1 right-1">
                            {bk.statusLabel === "Pending" && <BadgeCheck className="h-5 w-5 text-yellow-400" />}
                            {bk.statusLabel === "Confirmed" && <BadgeCheck className="h-5 w-5 text-green-500" />}
                            {bk.statusLabel === "Completed" && <Star className="h-5 w-5 text-primary" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-headline text-base tracking-tight text-black dark:text-white truncate pr-4">{bk.facilityName}</h4>
                            <span className="font-medium text-primary text-base">₱{(bk.totalPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary/40" />
                            <span>{new Date(bk.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(bk.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        {/* Unread dot */}
                        <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[24px] text-center bg-[#fcfcfc] dark:bg-transparent">
                    <p className="text-base text-muted-foreground italic mb-4">No orders found yet.</p>
                    <Button asChild variant="outline" className="rounded-full px-8 h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                      <Link href="/">Browse products</Link>
                    </Button>
                  </div>
                )}
              </section>

              {/* Wishlist Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-headline tracking-tight mb-2">My Wishlist</h3>
                {wishlistProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {wishlistProducts.map((product: any) => (
                      <div key={product.id} className="bg-white dark:bg-white/[0.03] rounded-[24px] overflow-hidden border border-black/[0.03] dark:border-white/[0.05] group">
                        <Link href={`/book/${product.id}`}>
                          <div className="relative aspect-square overflow-hidden">
                            <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromWishlist(product.wishlistId); }}
                              className="absolute top-2 right-2 z-10 p-2 bg-white/40 backdrop-blur-xl rounded-full hover:bg-red-500/80 transition-all"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </Link>
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-0.5">
                            <h4 className="text-sm font-headline tracking-tight truncate pr-2">{product.name}</h4>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="text-[11px] font-bold">{product.rating || 5.0}</span>
                            </div>
                          </div>
                          <p className="text-primary font-bold text-sm mb-2">₱{(product.price || product.pricePerNight || 0).toLocaleString()}</p>
                          <Button
                            onClick={() => addToCart(product.id)}
                            className="w-full rounded-full py-2 bg-black text-white font-bold text-[11px] h-8 hover:bg-primary transition-all gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" /> Add to Cart
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[24px] text-center bg-[#fcfcfc] dark:bg-transparent">
                    <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground italic mb-4">Your wishlist is empty.</p>
                    <Button asChild variant="outline" className="rounded-full px-8 h-10 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                      <Link href="/">Browse Products</Link>
                    </Button>
                  </div>
                )}
              </section>

              {/* Two grid cards: My Shop / Become a Seller & Support */}
              <section className="grid grid-cols-2 gap-4 mt-8">
                {userShop ? (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                      <Store className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="font-headline text-base mb-0.5">{(userShop as any).name || 'My Shop'}</h4>
                    <p className="text-xs text-muted-foreground mb-3">Manage your products, orders, and analytics from your seller dashboard.</p>
                    <Button asChild className="rounded-full px-6 h-10 bg-primary text-white font-bold mt-2 gap-1.5">
                      <Link href="/seller/dashboard">Go to Dashboard <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-primary/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/20 transition-all">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-headline text-base mb-1">Become a Seller</h4>
                    <p className="text-xs text-muted-foreground mb-3">Open your own store and start selling to the E-Moorm community.</p>
                    <Button asChild className="rounded-full px-6 h-10 bg-primary text-white font-bold mt-2">
                      <Link href="/seller/register">Register as Seller</Link>
                    </Button>
                  </div>
                )}
                <div className="bg-[#f8f8f8] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/5 transition-all">
                  <HelpCircle className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-headline text-base mb-1">Support</h4>
                  <p className="text-xs text-muted-foreground mb-3">Need help or have a concern? Contact our support team for assistance.</p>
                  <Button asChild variant="outline" className="rounded-full px-6 h-10 border-primary/20 text-primary font-bold mt-2">
                    <Link href="mailto:support@emoorm.ph">Contact Support</Link>
                  </Button>
                </div>
              </section>
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


