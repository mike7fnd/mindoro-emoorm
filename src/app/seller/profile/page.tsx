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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6">
        {/* Cover + Avatar */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
          {/* Cover Image */}
          <div
            className="h-32 md:h-44 bg-gradient-to-br from-black/5 via-black/[0.02] to-transparent relative group cursor-pointer"
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm font-medium">
                <Camera className="h-5 w-5" />
                {uploadingCover ? "Uploading..." : "Change Cover"}
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </div>

          {/* Shop Info */}
          <CardContent className="p-6 pt-0 relative">
            {/* Avatar */}
            <div className="-mt-12 md:-mt-14 mb-4 flex items-end justify-between">
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white dark:border-[#111] shadow-md overflow-hidden bg-white relative group cursor-pointer"
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
                  className="rounded-full gap-1.5 border-black/[0.06] dark:border-white/[0.06]"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Shop
                </Button>
              </Link>
            </div>

            {/* Name & Badge */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">
                  {s?.name || "My Shop"}
                </h1>
                {s?.status === "active" && (
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-0 rounded-full text-[10px]">
                    Active
                  </Badge>
                )}
              </div>
              {s?.category && (
                <p className="text-sm text-muted-foreground">{s.category}</p>
              )}
            </div>

            {/* Description */}
            {s?.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {s.description}
              </p>
            )}

            {/* Location & Join Date */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
              {(s?.city || s?.barangay) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[s.barangay, s.city, s.province].filter(Boolean).join(", ")}
                </span>
              )}
              {joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {joinDate}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Products", value: productCount, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
            { label: "Orders", value: orderCount, icon: ShoppingCart, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400" },
            { label: "Followers", value: followerCount, icon: Users, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400" },
            { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-headline text-xl tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rating */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div>
                  <p className="font-headline text-2xl tracking-tight">{s?.rating || 5.0}</p>
                  <p className="text-xs text-muted-foreground">Shop Rating</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{s?.totalSales || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-4 space-y-1">
            <Link href="/seller/products">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">My Products</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/seller/orders">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Manage Orders</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/seller/analytics">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">View Analytics</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/seller/settings">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Shop Settings</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Separator className="my-2 bg-black/[0.04] dark:bg-white/[0.04]" />

            {/* Switch to Personal Account */}
            <div
              onClick={() => router.push("/profile")}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Switch to Personal Account</span>
                  <p className="text-[11px] text-muted-foreground">View your buyer profile</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
