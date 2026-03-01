"use client";

import React, { useState, useMemo } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useSupabaseAuth, useStableMemo, useDoc, useCollection } from "@/supabase";

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState("week");
  const { user } = useSupabaseAuth();

  // Fetch store data
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store } = useDoc(storeRef);

  // Fetch products
  const productsConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "facilities",
      filters: [{ column: "sellerId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: products, isLoading: productsLoading } = useCollection(productsConfig);

  // Fetch orders
  const ordersConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "bookings",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
      order: { column: "createdAt", ascending: false },
    };
  }, [user]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersConfig);

  // Fetch reviews for this store
  const reviewsConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "reviews",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: reviews } = useCollection(reviewsConfig);

  const isLoading = productsLoading || ordersLoading;

  // Compute analytics
  const allOrders = orders ?? [];
  const allProducts = products ?? [];
  const allReviews = reviews ?? [];

  const totalRevenue = allOrders.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0);
  const totalOrders = allOrders.length;
  const totalProducts = allProducts.length;
  const uniqueCustomers = new Set(allOrders.map((o: any) => o.userId)).size;

  const overviewStats = [
    { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
    { label: "Orders", value: String(totalOrders), icon: ShoppingCart, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    { label: "Products", value: String(totalProducts), icon: Package, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
    { label: "Customers", value: String(uniqueCustomers), icon: Users, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
  ];

  // Weekly revenue breakdown (last 7 days)
  const weeklyRevenue = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayTotals: Record<number, number> = {};
    allOrders.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const day = d.getDay();
      dayTotals[day] = (dayTotals[day] || 0) + (Number(o.totalPrice) || 0);
    });
    const maxAmount = Math.max(...Object.values(dayTotals), 1);
    return days.map((name, i) => ({
      day: name,
      amount: dayTotals[i] || 0,
      pct: Math.round(((dayTotals[i] || 0) / maxAmount) * 100),
    }));
  }, [allOrders]);

  // Category breakdown from products
  const topCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    allProducts.forEach((p: any) => {
      const cat = p.category || p.type || "Other";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const total = allProducts.length || 1;
    const colors = ["bg-primary", "bg-blue-500", "bg-purple-500", "bg-gray-400", "bg-orange-500", "bg-green-500"];
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
        color: colors[i % colors.length],
      }));
  }, [allProducts]);

  // Recent activity from orders and reviews
  const recentActivity = useMemo(() => {
    const activities: { action: string; detail: string; time: string; date: Date }[] = [];

    allOrders.slice(0, 5).forEach((o: any) => {
      const status = o.status || "To Pay";
      const d = new Date(o.createdAt);
      if (status === "Completed" || status === "completed") {
        activities.push({ action: "Order completed", detail: `₱${Number(o.totalPrice || 0).toLocaleString()}`, time: d.toLocaleDateString(), date: d });
      } else {
        activities.push({ action: `New order (${status})`, detail: `₱${Number(o.totalPrice || 0).toLocaleString()}`, time: d.toLocaleDateString(), date: d });
      }
    });

    allReviews.slice(0, 3).forEach((r: any) => {
      const d = new Date(r.createdAt);
      activities.push({ action: "Product reviewed", detail: `⭐ ${r.rating || 5}`, time: d.toLocaleDateString(), date: d });
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  }, [allOrders, allReviews]);

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-8 w-full pt-4 md:pt-32 pb-24 space-y-6 md:space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em]">Shop <span className="text-primary">Analytics</span></h1>
            <p className="text-sm text-muted-foreground font-normal">Track your shop performance</p>
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
              {overviewStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03]">
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Revenue Chart */}
              <div className="lg:col-span-2">
                <Card className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Revenue by Day</h2>
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Revenue distribution by day of week</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">₱{totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                    {/* Simple bar chart */}
                    <div className="flex items-end gap-2 h-40">
                      {weeklyRevenue.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {d.amount > 0 ? `₱${(d.amount / 1000).toFixed(1)}K` : "₱0"}
                          </span>
                          <div className="w-full relative">
                            <div
                              className="w-full rounded-t-lg bg-primary/20 dark:bg-primary/10 transition-all"
                              style={{ height: `${Math.max(d.pct * 1.2, 4)}px` }}
                            >
                              <div
                                className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all"
                                style={{ height: `${Math.max(d.pct * 0.8, 2)}px` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Categories */}
              <div>
                <Card className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-5">Product Categories</h2>
                    {topCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No products yet</p>
                    ) : (
                      <div className="space-y-4">
                        {topCategories.map((cat) => (
                          <div key={cat.name}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm">{cat.name}</span>
                              <span className="text-xs text-muted-foreground">{cat.count} products</span>
                            </div>
                            <div className="h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cat.color} transition-all`} style={{ width: `${cat.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03]">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-5">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm">{item.action}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
