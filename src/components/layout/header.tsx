"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  MessageSquare,
  User,
  Bell,
  LogOut,
  LayoutDashboard,
  Plus,
  Store,
} from "lucide-react";
import { useUser, useSupabase, useDoc, useStableMemo, useSupabaseAuth } from "@/supabase";
import Image from "next/image";

function HeaderContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading, auth } = useSupabaseAuth();
  const supabase = useSupabase();

  const isAdmin = user?.email === 'kioalaquer301@gmail.com';
  const isBookDetailPage = pathname?.startsWith('/book/') && pathname !== '/book';
  const isSeller = isAdmin; // Sellers use admin pages

  // Hide bottom nav when "inside" a chat on mobile
  const isMessagePage = pathname === '/messages' || pathname === '/admin-messages';
  const hasActiveChat = searchParams.get('id') || searchParams.get('user');

  // Pages that have a corresponding bottom nav item
  const bottomNavPages = ['/', '/cart', '/notifications', '/messages', '/profile', '/admin-dashboard', '/admin-bookings', '/admin-messages'];
  const isOnBottomNavPage = bottomNavPages.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));

  const shouldHideBottomNav = isBookDetailPage || (isMessagePage && hasActiveChat) || !isOnBottomNavPage;

  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const headerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const stickyAuthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const navLinks = document.querySelector('.navlinks');
    const navLinksWidth = navLinks ? (navLinks as HTMLElement).offsetWidth + 80 : 300;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top -50",
        end: "top -51",
        toggleActions: "play none none reverse",
      }
    });

    tl.set(".nav-side", { overflow: "hidden" })
      .to(".nav-side", {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(".nav-side", {
        width: 0,
        margin: 0,
        padding: 0,
        duration: 0.5,
        ease: "power4.inOut"
      }, "-=0.1")
      .to(".site-nav", {
        width: navLinksWidth + "px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        overflow: "hidden",
        duration: 0.5,
        ease: "power4.inOut"
      }, "<");

    if (stickyAuthRef.current && !user) {
      tl.to(stickyAuthRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
        pointerEvents: "auto"
      }, "<");
    }

    tl.set(".nav-side", { overflow: "visible" }, ">")
      .set(".site-nav", { overflow: "visible" }, "<");

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [user]);

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      gsap.to(mobileMenuRef.current, {
        right: -300,
        duration: 0.4,
        ease: "power2.inOut"
      });
      gsap.to(mobileOverlayRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => setIsMobileMenuOpen(false)
      });
    } else {
      setIsMobileMenuOpen(true);
      setTimeout(() => {
        gsap.to(mobileMenuRef.current, {
          right: 0,
          duration: 0.4,
          ease: "back.out(1.4)"
        });
        gsap.to(mobileOverlayRef.current, {
          opacity: 1,
          duration: 0.3
        });
      }, 10);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const profilePic = userProfile?.profilePictureUrl || user?.photoURL || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

  return (
    <>
      <div className="site-nav">
        <div className="nav-side left-side">
          <div className="brand">
            <Link href="/" className="logo">E-Moorm</Link>
          </div>
        </div>

        <nav className="navlinks">
          {isAdmin ? (
            <>
              <Link href="/admin-dashboard" className={cn(isLinkActive("/admin-dashboard") && "active")}>Dashboard</Link>
              <Link href="/admin-bookings" className={cn(isLinkActive("/admin-bookings") && "active")}>Orders</Link>
              <Link href="/admin-facilities" className={cn(isLinkActive("/admin-facilities") && "active")}>Products</Link>
              <Link href="/admin-messages" className={cn(isLinkActive("/admin-messages") && "active")}>Messages</Link>
            </>
          ) : (
            <>
              <Link href="/" className={cn(isLinkActive("/") && "active")}>Home</Link>
              <Link href="/cart" className={cn(isLinkActive("/cart") && "active")}>Cart</Link>
              {user && (
                <Link href="/messages" className={cn(isLinkActive("/messages") && "active")}>Messages</Link>
              )}
            </>
          )}
        </nav>

        <div className="nav-side right-side">
          <div className="auth-actions">
            {user ? (
              <>
                <div className="icon-btn" aria-label="Notifications">
                  <Bell className="h-[18px] w-[18px]" />
                </div>

                <div className="dropdown relative">
                  <div
                    className="h-10 w-10 rounded-full border border-white/20 shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    id="profileBtn"
                    aria-label="Profile"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Image
                      src={profilePic}
                      alt="User Profile"
                      width={40}
                      height={40}
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  </div>
                  {isDropdownOpen && (
                    <div className="dropdown-content block opacity-100 translate-y-0 absolute right-0 top-[55px] bg-white rounded-xl min-w-[180px] shadow-2xl border border-black/5 overflow-hidden z-[2000]">
                      <div className="px-5 py-3 border-b border-black/5">
                        <p className="text-xs font-bold text-muted-foreground tracking-tight">Account</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" className="block px-5 py-3 text-sm text-muted-foreground hover:bg-black/5 hover:text-primary transition-colors">Profile</Link>
                      {isAdmin && <Link href="/admin-dashboard" className="block px-5 py-3 text-sm font-bold text-primary hover:bg-black/5">Seller panel</Link>}
                      <button onClick={handleLogout} className="w-full text-left block px-5 py-3 text-sm text-muted-foreground hover:bg-black/5 hover:text-primary transition-colors">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="login-link">Login</Link>
                <button className="cta-res" onClick={() => router.push('/signup')}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </div>

      {!shouldHideBottomNav && (
        <div className="mobile-bottom-nav">
          <div className="mobile-nav-container">
            {isAdmin ? (
              <>
                <Link href="/admin-dashboard" className={cn("mobile-nav-item", isLinkActive("/admin-dashboard") && "active")}>
                  <div className="mobile-nav-icon">
                    <LayoutDashboard className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/admin-dashboard") ? "currentColor" : "none"} />
                  </div>
                  <span>Dashboard</span>
                </Link>
                <Link href="/admin-bookings" className={cn("mobile-nav-item", isLinkActive("/admin-bookings") && "active")}>
                  <div className="mobile-nav-icon">
                    <ShoppingCart className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/admin-bookings") ? "currentColor" : "none"} />
                  </div>
                  <span>Orders</span>
                </Link>
                <Link href="/admin-messages" className={cn("mobile-nav-item", isLinkActive("/admin-messages") && "active")}>
                  <div className="mobile-nav-icon">
                    <MessageSquare className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/admin-messages") ? "currentColor" : "none"} />
                  </div>
                  <span>Inbox</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className={cn("mobile-nav-item", isLinkActive("/") && "active")}>
                  <div className="mobile-nav-icon">
                    <Home className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/") ? "currentColor" : "none"} />
                  </div>
                  <span>Home</span>
                </Link>
                <Link href="/cart" className={cn("mobile-nav-item", isLinkActive("/cart") && "active")}>
                  <div className="mobile-nav-icon">
                    <ShoppingCart className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/cart") ? "currentColor" : "none"} />
                  </div>
                  <span>Cart</span>
                </Link>
                <Link href="/notifications" className={cn("mobile-nav-item", isLinkActive("/notifications") && "active")}>
                  <div className="mobile-nav-icon">
                    <Bell className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/notifications") ? "currentColor" : "none"} />
                  </div>
                  <span>Notifications</span>
                </Link>
                {user && (
                  <Link href="/messages" className={cn("mobile-nav-item", isLinkActive("/messages") && "active")}>
                    <div className="mobile-nav-icon">
                      <MessageSquare className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isLinkActive("/messages") ? "currentColor" : "none"} />
                    </div>
                    <span>Inbox</span>
                  </Link>
                )}
              </>
            )}
            {user ? (
              <Link href="/profile" className={cn("mobile-nav-item", isLinkActive("/profile") && "active")}>
                <div className={cn(
                  "h-8 w-8 rounded-full overflow-hidden border-2 transition-all",
                  isLinkActive("/profile") ? "border-primary scale-110 shadow-lg" : "border-muted"
                )}>
                  <Image src={profilePic} alt="PFP" width={32} height={32} className="object-cover h-full w-full" unoptimized />
                </div>
                <span>Profile</span>
              </Link>
            ) : (
              <Link href="/login" className={cn("mobile-nav-item", isLinkActive("/login") && "active")}>
                <div className="mobile-nav-icon">
                  <LogOut className="h-[30px] w-[30px] rotate-180" strokeWidth={1.2} fill={isLinkActive("/login") ? "currentColor" : "none"} />
                </div>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        ref={mobileOverlayRef}
        className={cn("mobile-menu-overlay", isMobileMenuOpen && "active")}
        style={{ visibility: isMobileMenuOpen ? 'visible' : 'hidden' }}
        onClick={toggleMobileMenu}
      />

      <div ref={mobileMenuRef} className={cn("mobile-menu", isMobileMenuOpen && "active")}>
        <h3 className="font-headline italic font-bold text-2xl mb-8 text-primary">E-Moorm</h3>
        <nav className="flex flex-col gap-3 mb-8">
          {isAdmin ? (
            <>
              <Link href="/admin-dashboard" className={cn("mobile-menu-link", isLinkActive("/admin-dashboard") && "active")}><LayoutDashboard className="h-5 w-5 mr-2" strokeWidth={1.5} /> Dashboard</Link>
              <Link href="/admin-bookings" className={cn("mobile-menu-link", isLinkActive("/admin-bookings") && "active")}><ShoppingCart className="h-5 w-5 mr-2" strokeWidth={1.5} /> Orders</Link>
              <Link href="/admin-facilities" className={cn("mobile-menu-link", isLinkActive("/admin-facilities") && "active")}><Plus className="h-5 w-5 mr-2" strokeWidth={1.5} /> Products</Link>
              <Link href="/admin-messages" className={cn("mobile-menu-link", isLinkActive("/admin-messages") && "active")}><MessageSquare className="h-5 w-5 mr-2" strokeWidth={1.5} /> Messages</Link>
            </>
          ) : (
            <>
              <Link href="/" className={cn("mobile-menu-link", isLinkActive("/") && "active")}><Home className="h-5 w-5 mr-2" strokeWidth={1.5} /> Home</Link>
              {!user && <Link href="/book" className={cn("mobile-menu-link", isLinkActive("/book") && "active")}><ShoppingCart className="h-5 w-5 mr-2" strokeWidth={1.5} /> Shop</Link>}
              {user && (
                <Link href="/messages" className={cn("mobile-menu-link", isLinkActive("/messages") && "active")}><MessageSquare className="h-5 w-5 mr-2" strokeWidth={1.5} /> Messages</Link>
              )}
            </>
          )}
        </nav>
        {user ? (
          <div className="pt-6 border-t border-black/10">
            <Link href="/profile" className="mobile-menu-link">
              <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                <Image src={profilePic} alt="PFP" width={24} height={24} className="object-cover h-full w-full" unoptimized />
              </div>
              Profile
            </Link>
            <button onClick={handleLogout} className="w-full text-left mobile-menu-link text-destructive"><LogOut className="h-5 w-5 mr-2" strokeWidth={1.5} /> Logout</button>
          </div>
        ) : (
          <div className="pt-6 border-t border-black/10">
            <Link href="/login" className="block w-full p-4 mb-3 text-center bg-black/5 rounded-xl font-bold">Login</Link>
            <Link href="/signup" className="block w-full p-4 mb-3 text-center bg-primary text-white rounded-xl font-bold shadow-lg">Sign up</Link>
          </div>
        )}
      </div>

      {!user && !isUserLoading && !isBookDetailPage && (
        <div ref={stickyAuthRef} className="sticky-auth-btn" onClick={() => router.push('/login')}>
          <User className="h-5 w-5" strokeWidth={1.5} />
        </div>
      )}
    </>
  );
}

export function Header() {
  return (
    <Suspense>
      <HeaderContent />
    </Suspense>
  );
}
