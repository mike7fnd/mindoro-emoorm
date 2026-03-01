"use client";

import React from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Star,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Loader2,
  MoreVertical,
  BarChart3,
  Settings,
  User,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useSupabaseAuth, useStableMemo, useDoc, useCollection } from "@/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { icon: React.ElementType; className: string }> = {
  "To Pay": { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" },
  "To Ship": { icon: AlertCircle, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  "To Receive": { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
  "Completed": { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  "Cancelled": { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10" },
  pending: { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" },
  processing: { icon: AlertCircle, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  shipped: { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
  completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  cancelled: { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10" },
};

export default function SellerDashboardPage() {
  const { user } = useSupabaseAuth();

  // Fetch store data
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store } = useDoc(storeRef);

  // Fetch products (facilities) for this seller
  const productsConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "facilities",
      filters: [{ column: "sellerId", op: "eq" as const, value: user.uid }],
      order: { column: "createdAt", ascending: false },
    };
  }, [user]);
  const { data: products, isLoading: productsLoading } = useCollection(productsConfig);

  // Fetch orders (bookings) for this store
  const ordersConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "bookings",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
      order: { column: "createdAt", ascending: false },
    };
  }, [user]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersConfig);

  // Compute stats
  const totalSales = orders?.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;
  const totalOrders = orders?.length ?? 0;
  const totalProducts = products?.length ?? 0;
  const completedOrders = orders?.filter((o: any) => o.status === "Completed" || o.status === "completed").length ?? 0;

  const stats = [
    { label: "Total Sales", value: `₱${totalSales.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
    { label: "Orders", value: String(totalOrders), icon: ShoppingCart, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    { label: "Products", value: String(totalProducts), icon: Package, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
    { label: "Completed", value: String(completedOrders), icon: CheckCircle2, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
  ];

  // Recent orders (latest 5)
  const recentOrders = (orders ?? []).slice(0, 5);

  // Top products by rating
  const topProducts = (products ?? [])
    .sort((a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 3);

  const isLoading = productsLoading || ordersLoading;

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground font-normal">
              {store ? `Overview of ${(store as any).name}` : "Overview of your shop performance"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/seller/products/add">
              <Button size="icon" className="bg-black hover:bg-primary transition-colors rounded-full h-10 w-10 shadow-sm md:hidden">
                <Plus className="h-5 w-5" />
              </Button>
              <Button className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm gap-2 hidden md:inline-flex">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-xl border-none">
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/seller/products"><Package className="h-4 w-4" /> Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/seller/orders"><ClipboardList className="h-4 w-4" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/seller/analytics"><BarChart3 className="h-4 w-4" /> Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/seller/profile"><User className="h-4 w-4" /> Shop Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/seller/settings"><Settings className="h-4 w-4" /> Shop Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${stat.color}`}>
                          <Icon className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1 tracking-tight">{stat.label}</p>
                      <p className="text-xl md:text-3xl font-normal font-headline tracking-[-0.05em]">{stat.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Recent Orders */}
              <div className="lg:col-span-2">
                <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Recent Orders</h2>
                      <Link href="/seller/orders" className="text-sm text-primary hover:underline">View All</Link>
                    </div>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order: any) => {
                          const status = order.status || "pending";
                          const StatusIcon = statusConfig[status]?.icon || Clock;
                          const statusClass = statusConfig[status]?.className || "";
                          return (
                            <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-xl ${statusClass}`}>
                                  <StatusIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">Order #{order.id?.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {order.quantity || 1} · {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-medium">₱{Number(order.totalPrice || 0).toLocaleString()}</p>
                                <Badge variant="outline" className="text-[10px] capitalize rounded-full border-0 bg-black/[0.03] dark:bg-white/[0.03] mt-0.5">
                                  {status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <div>
                <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Top Products</h2>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {topProducts.length === 0 ? (
                      <div className="text-center py-10">
                        <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No products yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {topProducts.map((product: any, i: number) => (
                          <div key={product.id} className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">₱{Number(product.price || 0).toLocaleString()} · Stock: {product.stock || 0}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">{product.rating || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] mt-6">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                      <Link href="/seller/products">
                        <Button variant="outline" className="w-full justify-start rounded-xl gap-2 h-11 border-black/[0.06] dark:border-white/[0.06]">
                          <Package className="h-4 w-4" /> Manage Products
                        </Button>
                      </Link>
                      <Link href="/seller/orders">
                        <Button variant="outline" className="w-full justify-start rounded-xl gap-2 h-11 border-black/[0.06] dark:border-white/[0.06]">
                          <ShoppingCart className="h-4 w-4" /> View Orders
                        </Button>
                      </Link>
                      <Link href="/seller/analytics">
                        <Button variant="outline" className="w-full justify-start rounded-xl gap-2 h-11 border-black/[0.06] dark:border-white/[0.06]">
                          <TrendingUp className="h-4 w-4" /> Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
