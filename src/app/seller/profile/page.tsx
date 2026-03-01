"use client";

import React, { useRef, useState } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  MapPin,
  Star,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ArrowUpRight,
  Loader2,
  UserCircle,
  Edit2,
  TrendingUp,
  Calendar,
  Camera,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useSupabaseAuth,
  useSupabase,
  useStableMemo,
  useDoc,
  useCollection,
} from "@/supabase";
import { uploadImage } from "@/lib/upload-image";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerProfilePage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Fetch store data
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  // Fetch user profile
  const userRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);
  const { data: userProfile } = useDoc(userRef);

  // Fetch products
  const productsConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "facilities",
      filters: [{ column: "sellerId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: products } = useCollection(productsConfig);

  // Fetch orders
  const ordersConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "bookings",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: orders } = useCollection(ordersConfig);

  // Fetch followers
  const followersConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "store_followers",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: followers } = useCollection(followersConfig);

  const s = store as any;
  const productCount = products?.length ?? 0;
  const orderCount = orders?.length ?? 0;
  const followerCount = followers?.length ?? (s?.followerCount || 0);
  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.totalPrice || 0), 0) ?? 0;
  const storeImage = s?.imageUrl || "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";
  const storeCover = s?.coverUrl || "";
  const joinDate = s?.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(supabase, "stores", file, `logo/${user.uid}`);
      await supabase.from("stores").update({ imageUrl: url }).eq("id", user.uid);
      window.location.reload();
    } catch (err) {
      console.error("Logo upload error:", err);
      alert("Failed to upload shop logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(supabase, "stores", file, `cover/${user.uid}`);
      await supabase.from("stores").update({ coverUrl: url }).eq("id", user.uid);
      window.location.reload();
    } catch (err) {
      console.error("Cover upload error:", err);
      alert("Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
    }
  };

  if (storeLoading) {
    return (
      <SellerLayout>
        <div className="max-w-2xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6">
          <div className="rounded-[32px] border border-black/[0.02] bg-white overflow-hidden">
            <Skeleton className="h-36 md:h-48 w-full" />
            <div className="p-6 -mt-10 relative">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-48 rounded-full mb-2" />
              <Skeleton className="h-4 w-72 rounded-full mb-4" />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-black/[0.02] bg-white p-6 space-y-4">
            <Skeleton className="h-5 w-32 rounded-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6">
        {/* Cover + Avatar Card */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
          {/* Cover Image */}
          <div
            className="h-36 md:h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative group cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
            title="Change cover photo"
          >
            {storeCover && (
              <Image
                src={storeCover}
                alt="Cover"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <Camera className="h-4 w-4" />
                {uploadingCover ? "Uploading..." : "Change Cover"}
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </div>

          {/* Profile Info Section */}
          <CardContent className="px-6 pb-6 pt-0 relative">
            {/* Avatar + Edit button row */}
            <div className="-mt-14 md:-mt-16 mb-5 flex items-end justify-between">
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-full border-[5px] border-white dark:border-[#111] shadow-lg overflow-hidden bg-white relative group cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
                title="Change shop logo"
              >
                <Image
                  src={storeImage}
                  alt={s?.name || "Shop"}
                  width={112}
                  height={112}
                  className="object-cover h-full w-full"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center rounded-full">
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                    <Loader2 className="h-5 w-5 animate-spin text-black" />
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </div>
              <Link href="/seller/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] h-9 px-4 text-xs font-bold"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Shop
                </Button>
              </Link>
            </div>

            {/* Name, Badge & Category */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">
                  {s?.name || "My Shop"}
                </h1>
                {s?.status === "active" && (
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-0 rounded-full text-[10px] font-bold px-2.5">
                    Active
                  </Badge>
                )}
              </div>
              {s?.category && (
                <p className="text-sm text-muted-foreground font-medium">{s.category}</p>
              )}
            </div>

            {/* Description */}
            {s?.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {s.description}
              </p>
            )}

            {/* Location & Join Date */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-muted-foreground">
              {(s?.city || s?.barangay) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary/60" />
                  {[s.barangay, s.city, s.province].filter(Boolean).join(", ")}
                </span>
              )}
              {joinDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/60" />
                  Joined {joinDate}
                </span>
              )}
            </div>

            {/* Inline Stats */}
            <div className="grid grid-cols-4 gap-2 mt-6 pt-5 border-t border-black/[0.04] dark:border-white/[0.04]">
              {[
                { label: "Products", value: productCount },
                { label: "Orders", value: orderCount },
                { label: "Followers", value: followerCount },
                { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-headline text-lg md:text-xl tracking-tight">{stat.value}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rating & Sales Card */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[28px] bg-white dark:bg-white/[0.03]">
            <CardContent className="p-5 flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div>
                <p className="font-headline text-xl tracking-tight">{s?.rating || 5.0}</p>
                <p className="text-[11px] text-muted-foreground">Shop Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[28px] bg-white dark:bg-white/[0.03]">
            <CardContent className="p-5 flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-headline text-xl tracking-tight">{s?.totalSales || 0}</p>
                <p className="text-[11px] text-muted-foreground">Total Sales</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[28px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-3">
            {[
              { href: "/seller/products", icon: Package, label: "My Products", sub: `${productCount} listed` },
              { href: "/seller/orders", icon: ShoppingCart, label: "Manage Orders", sub: `${orderCount} total` },
              { href: "/seller/analytics", icon: TrendingUp, label: "View Analytics", sub: "Performance insights" },
              { href: "/seller/settings", icon: Settings, label: "Shop Settings", sub: "Preferences & info" },
            ].map((item, i) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center justify-between p-3.5 rounded-xl hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors cursor-pointer group ${i > 0 ? "" : ""}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium block">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </Link>
            ))}

            <Separator className="my-1.5 bg-black/[0.04] dark:bg-white/[0.04]" />

            {/* Switch to Personal Account */}
            <div
              onClick={() => router.push("/profile")}
              className="flex items-center justify-between p-3.5 rounded-xl hover:bg-blue-50/60 dark:hover:bg-blue-500/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <UserCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 block">Switch to Personal</span>
                  <span className="text-[11px] text-muted-foreground">View your buyer profile</span>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-600/50 dark:text-blue-400/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
