"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Store, Settings, Bell } from "lucide-react";
import { useSupabaseAuth, useStableMemo, useDoc } from "@/supabase";
import Image from "next/image";

const sellerNavItems = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
];

export function SellerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const isActive = (path: string) => {
    if (path === "/seller/dashboard" && pathname === "/seller/dashboard") return true;
    if (path !== "/seller/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const profilePic = (userProfile as any)?.profilePictureUrl || user?.photoURL || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

  return (
    <>
      {/* Desktop floating nav — matches buyer .site-nav style */}
      <div className="site-nav" style={{ display: undefined }}>
        <div className="nav-side left-side">
          <div className="brand">
            <Link href="/seller/dashboard" className="logo flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              My Shop
            </Link>
          </div>
        </div>

        <nav className="navlinks">
          {sellerNavItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(isActive(item.href) && "active")}>
              {item.label}
            </Link>
          ))}
          <Link href="/seller/settings" className={cn(pathname.startsWith("/seller/settings") && "active")}>
            Settings
          </Link>
        </nav>

        <div className="nav-side right-side">
          <div className="auth-actions">
            <div className="icon-btn" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
            </div>
            <div
              className="h-10 w-10 rounded-full border border-white/20 shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/seller/profile")}
            >
              <Image
                src={profilePic}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover h-full w-full"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: no top header — bottom nav handles it */}
    </>
  );
}

export function SellerBottomNav() {
  const pathname = usePathname();
  const { user } = useSupabaseAuth();
  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const profilePic = (userProfile as any)?.profilePictureUrl || user?.photoURL || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

  const isActive = (path: string) => {
    if (path === "/seller/dashboard" && pathname === "/seller/dashboard") return true;
    if (path !== "/seller/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {sellerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("mobile-nav-item", isActive(item.href) && "active")}
            >
              <div className="mobile-nav-icon">
                <Icon className="h-[30px] w-[30px]" strokeWidth={1.2} fill={isActive(item.href) ? "currentColor" : "none"} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link href="/seller/profile" className={cn("mobile-nav-item", pathname === "/seller/profile" && "active")}>
          <div className={cn(
            "h-8 w-8 rounded-full overflow-hidden border-2 transition-all",
            pathname === "/seller/profile" ? "border-primary scale-110 shadow-lg" : "border-muted"
          )}>
            <Image src={profilePic} alt="PFP" width={32} height={32} className="object-cover h-full w-full" unoptimized />
          </div>
          <span>Shop</span>
        </Link>
      </div>
    </div>
  );
}

export function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#050505]">
      <SellerHeader />
      <main className="flex-grow page-content">
        {children}
      </main>
      <SellerBottomNav />
    </div>
  );
}
