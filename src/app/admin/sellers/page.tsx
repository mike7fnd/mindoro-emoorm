"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout, ADMIN_EMAILS } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Star,
  MapPin,
  Package,
  ShoppingCart,
  Ban,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  useUser,
  useSupabase,
  useStableMemo,
  useCollection,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

export default function AdminSellersPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isUserLoading && (!user || !isAdmin)) {
      router.push("/admin");
    }
  }, [user, isUserLoading, router, isAdmin]);

  const storesConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "stores" };
  }, [user, isAdmin]);
  const { data: allStores, isLoading } = useCollection(storesConfig);

  // Also fetch products and orders for stats
  const productsConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "facilities" };
  }, [user, isAdmin]);
  const { data: allProducts } = useCollection(productsConfig);

  const ordersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "bookings" };
  }, [user, isAdmin]);
  const { data: allOrders } = useCollection(ordersConfig);

  if (isUserLoading || !user || !isAdmin) return null;

  const filteredStores = (allStores ?? []).filter((s: any) => {
    const matchesSearch =
      !searchQuery ||
      (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.status !== "suspended") ||
      (statusFilter === "suspended" && s.status === "suspended");
    return matchesSearch && matchesStatus;
  });

  const getStoreProductCount = (storeId: string) =>
    allProducts?.filter((p: any) => p.sellerId === storeId).length ?? 0;

  const getStoreOrderCount = (storeId: string) =>
    allOrders?.filter((o: any) => o.storeId === storeId).length ?? 0;

  const getStoreRevenue = (storeId: string) =>
    allOrders
      ?.filter((o: any) => o.storeId === storeId)
      .reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;

  const handleSuspendStore = (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    updateDocumentNonBlocking(supabase, "stores", storeId, { status: newStatus });
    toast({
      title: newStatus === "suspended" ? "Store suspended" : "Store reactivated",
      description: newStatus === "suspended" ? "The store has been suspended." : "The store is now active.",
    });
  };

  const handleDeleteStore = (storeId: string) => {
    deleteDocumentNonBlocking(supabase, "stores", storeId);
    toast({ title: "Store deleted", description: "The store has been permanently deleted." });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
              Seller Management
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              {allStores?.length ?? 0} registered sellers
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Total Sellers", value: allStores?.length ?? 0, icon: Store, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
            { label: "Total Products", value: allProducts?.length ?? 0, icon: Package, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
            { label: "Total Orders", value: allOrders?.length ?? 0, icon: ShoppingCart, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
            { label: "Suspended", value: allStores?.filter((s: any) => s.status === "suspended").length ?? 0, icon: Ban, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                <CardContent className="p-5 md:p-8">
                  <div className={`p-3 rounded-2xl ${stat.color} w-fit mb-4`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                  <p className="text-xl md:text-3xl font-normal font-headline tracking-[-0.05em]">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sellers by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-full pl-11 pr-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "suspended", label: "Suspended" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full px-5 h-11 text-xs font-bold",
                  statusFilter === f.key ? "bg-black text-white hover:bg-primary" : "border-black/[0.06]"
                )}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sellers List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
            <CardContent className="py-20 text-center">
              <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sellers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStores.map((store: any) => {
              const logoUrl =
                store.logoUrl ||
                "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";
              const productCount = getStoreProductCount(store.id);
              const orderCount = getStoreOrderCount(store.id);
              const revenue = getStoreRevenue(store.id);

              return (
                <Card
                  key={store.id}
                  className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden"
                >
                  <CardContent className="p-5 md:p-8">
                    <div className="flex items-start gap-4 md:gap-6">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border border-black/[0.06] shrink-0">
                        <Image
                          src={logoUrl}
                          alt={store.name || "Store"}
                          width={80}
                          height={80}
                          className="object-cover h-full w-full"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium font-headline tracking-[-0.02em] truncate">
                            {store.name || "Unnamed Store"}
                          </h3>
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-0.5 text-[10px] font-bold shrink-0",
                              store.status === "suspended"
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                            )}
                          >
                            {store.status === "suspended" ? "Suspended" : "Active"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 truncate">
                          {store.category || "General"} · {store.description?.slice(0, 60) || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> {productCount} products
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3.5 w-3.5" /> {orderCount} orders
                          </span>
                          <span className="flex items-center gap-1 font-medium text-black dark:text-white">
                            ₱{revenue.toLocaleString()} revenue
                          </span>
                          {store.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {store.city}
                            </span>
                          )}
                          {store.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {store.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-xl border-none"
                        >
                          <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                            <Link href={`/stores/${store.id}`}>
                              <ExternalLink className="h-4 w-4" /> View Store
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer"
                            onClick={() => handleSuspendStore(store.id, store.status || "active")}
                          >
                            {store.status === "suspended" ? (
                              <><CheckCircle2 className="h-4 w-4" /> Reactivate</>
                            ) : (
                              <><Ban className="h-4 w-4" /> Suspend</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer text-red-600"
                            onClick={() => handleDeleteStore(store.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Store
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
