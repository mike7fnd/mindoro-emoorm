"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout, ADMIN_EMAILS } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  TrendingUp,
  TrendingDown,
  Package,
  Star,
  BarChart3,
} from "lucide-react";
import {
  useUser,
  useStableMemo,
  useCollection,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(152, 60%, 40%)", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminAnalyticsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isUserLoading && (!user || !isAdmin)) {
      router.push("/admin");
    }
  }, [user, isUserLoading, router, isAdmin]);

  const ordersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "bookings" };
  }, [user, isAdmin]);
  const { data: allOrders, isLoading: ordersLoading } = useCollection(ordersConfig);

  const usersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "users" };
  }, [user, isAdmin]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersConfig);

  const productsConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "facilities" };
  }, [user, isAdmin]);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsConfig);

  const storesConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "stores" };
  }, [user, isAdmin]);
  const { data: allStores, isLoading: storesLoading } = useCollection(storesConfig);

  if (isUserLoading || !user || !isAdmin) return null;

  const isLoading = ordersLoading || usersLoading || productsLoading || storesLoading;

  // Revenue calculations
  const totalRevenue = allOrders?.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;
  const completedRevenue = allOrders
    ?.filter((o: any) => o.status === "Completed" || o.status === "completed")
    .reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;
  const avgOrderValue = allOrders?.length ? totalRevenue / allOrders.length : 0;

  // Monthly revenue chart
  const monthlyRevenue = React.useMemo(() => {
    if (!allOrders) return [];
    const months: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      const d = new Date(o.createdAt || o.bookingDate);
      const key = d.toLocaleString("default", { month: "short" });
      months[key] = (months[key] || 0) + (Number(o.totalPrice) || 0);
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return order
      .filter((m) => months[m] !== undefined)
      .map((m) => ({ name: m, revenue: months[m], orders: monthCounts[m] }));
  }, [allOrders]);

  // Category breakdown
  const categoryData = React.useMemo(() => {
    if (!allProducts) return [];
    const cats: Record<string, number> = {};
    allProducts.forEach((p: any) => {
      const cat = p.category || "Other";
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allProducts]);

  // Order status breakdown
  const statusData = React.useMemo(() => {
    if (!allOrders) return [];
    const statuses: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      const s = o.status || "Pending";
      statuses[s] = (statuses[s] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [allOrders]);

  // Top sellers
  const topSellers = React.useMemo(() => {
    if (!allStores || !allOrders) return [];
    return (allStores as any[])
      .map((store: any) => {
        const revenue = allOrders
          .filter((o: any) => o.storeId === store.id)
          .reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0);
        return { ...store, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [allStores, allOrders]);

  const chartFallback = [
    { name: "Jan", revenue: 45000, orders: 12 },
    { name: "Feb", revenue: 52000, orders: 15 },
    { name: "Mar", revenue: 48000, orders: 11 },
    { name: "Apr", revenue: 75000, orders: 20 },
    { name: "May", revenue: 82000, orders: 22 },
    { name: "Jun", revenue: 60000, orders: 16 },
  ];

  const chartData = monthlyRevenue.length > 0 ? monthlyRevenue : chartFallback;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground font-normal">
            Platform performance &amp; insights
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6 md:p-8">
                  <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
                  <Skeleton className="h-3 w-20 rounded-full mb-2" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              ))}
            </div>
            <div className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6">
              <Skeleton className="h-[350px] w-full rounded-2xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-500/10", trend: "+12.5%", positive: true },
                { label: "Avg Order Value", value: `₱${Math.round(avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", trend: "+5.1%", positive: true },
                { label: "Total Products", value: String(allProducts?.length ?? 0), icon: Package, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10", trend: "+8%", positive: true },
                { label: "Conversion Rate", value: allOrders?.length && allUsers?.length ? `${((allOrders.length / allUsers.length) * 100).toFixed(1)}%` : "0%", icon: BarChart3, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10", trend: "+2.3%", positive: true },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${stat.color}`}>
                          <Icon className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <Badge variant="outline" className={cn(
                          "font-bold rounded-full px-3 py-1 text-[10px] md:text-xs",
                          stat.positive ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                        )}>
                          {stat.trend}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1 tracking-tight">{stat.label}</p>
                      <p className="text-xl md:text-3xl font-normal font-headline tracking-[-0.05em]">{stat.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Revenue Chart */}
            <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-1">Revenue Trends</h2>
                <p className="text-xs text-muted-foreground mb-6">Monthly revenue &amp; order volume</p>
                <div className="h-[300px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                      <Tooltip contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 40%)" strokeWidth={3} fillOpacity={1} fill="url(#analyticsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category + Status Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Category Breakdown */}
              <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-1">Product Categories</h2>
                  <p className="text-xs text-muted-foreground mb-6">Distribution of products by category</p>
                  {categoryData.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
                          <Tooltip contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {categoryData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-sm text-muted-foreground">No category data available</div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-1">Order Status</h2>
                  <p className="text-xs text-muted-foreground mb-6">Current order status distribution</p>
                  {statusData.length > 0 ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {statusData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 justify-center">
                        {statusData.map((s, i) => (
                          <div key={s.name} className="flex items-center gap-1.5 text-xs">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{s.name}: {s.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-sm text-muted-foreground">No order data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Sellers */}
            <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-1">Top Sellers</h2>
                <p className="text-xs text-muted-foreground mb-6">Highest revenue generating sellers</p>
                {topSellers.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">No seller data available</div>
                ) : (
                  <div className="space-y-4">
                    {topSellers.map((seller: any, i: number) => (
                      <div key={seller.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{seller.name || "Unnamed Store"}</p>
                          <p className="text-xs text-muted-foreground">{seller.category || "General"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-headline tracking-[-0.03em]">₱{seller.revenue.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
