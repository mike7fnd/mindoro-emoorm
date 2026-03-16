"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  MoreVertical,
  BarChart3,
  Settings,
  Store,
  MessageCircle,
  FileText,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import {
  useUser,
  useStableMemo,
  useCollection,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: React.ElementType; className: string }> = {
  "To Pay": { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" },
  "To Ship": { icon: AlertCircle, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  "To Receive": { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
  Completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  Cancelled: { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10" },
  Pending: { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" },
  Confirmed: { icon: CheckCircle2, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  pending: { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" },
  processing: { icon: AlertCircle, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  shipped: { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
  completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  cancelled: { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10" },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, isAdminLoading, user } = useIsAdmin();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, isAdminLoading, router]);

  // Fetch all users
  const usersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "users" };
  }, [user, isAdmin]);
  const { data: allUsers, isLoading: usersLoading } = useCollection(usersConfig);

  // Fetch all orders (bookings)
  const ordersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return {
      table: "bookings",
      order: { column: "createdAt", ascending: false },
    };
  }, [user, isAdmin]);
  const { data: allOrders, isLoading: ordersLoading } = useCollection(ordersConfig);

  // Fetch all products (facilities)
  const productsConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "facilities" };
  }, [user, isAdmin]);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsConfig);

  // Fetch all stores
  const storesConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return { table: "stores" };
  }, [user, isAdmin]);
  const { data: allStores, isLoading: storesLoading } = useCollection(storesConfig);

  // Chart data — monthly aggregation
  const monthlyData = React.useMemo(() => {
    if (!allOrders) return [];
    const months: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      const d = new Date(o.createdAt || o.bookingDate);
      const key = d.toLocaleString("default", { month: "short" });
      months[key] = (months[key] || 0) + (Number(o.totalPrice) || 0);
    });
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthOrder
      .filter((m) => months[m] !== undefined)
      .map((m) => ({ name: m, revenue: months[m] }));
  }, [allOrders]);

  if (isAdminLoading || !user || !isAdmin) return null;

  const isLoading = usersLoading || ordersLoading || productsLoading || storesLoading;

  // Compute stats
  const totalRevenue =
    allOrders?.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;
  const totalOrders = allOrders?.length ?? 0;
  const totalProducts = allProducts?.length ?? 0;
  const totalUsers = allUsers?.length ?? 0;
  const totalSellers = allStores?.length ?? 0;
  const pendingOrders =
    allOrders?.filter(
      (o: any) =>
        o.status === "Pending" || o.status === "pending" || o.status === "To Pay"
    ).length ?? 0;

  const stats = [
    {
      label: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-50 dark:bg-green-500/10",
      trend: "+12.5%",
      positive: true,
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
      trend: "+8.2%",
      positive: true,
    },
    {
      label: "Total Users",
      value: String(totalUsers),
      icon: Users,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
      trend: "+18.2%",
      positive: true,
    },
    {
      label: "Active Sellers",
      value: String(totalSellers),
      icon: Store,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10",
      trend: "+4.3%",
      positive: true,
    },
  ];

  const chartData =
    monthlyData.length > 0
      ? monthlyData
      : [
          { name: "Jan", revenue: 45000 },
          { name: "Feb", revenue: 52000 },
          { name: "Mar", revenue: 48000 },
          { name: "Apr", revenue: 75000 },
          { name: "May", revenue: 82000 },
          { name: "Jun", revenue: 60000 },
          { name: "Jul", revenue: 95000 },
        ];

  const recentOrders = (allOrders ?? []).slice(0, 6);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              Platform overview &amp; management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/products">
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
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-xl border-none"
              >
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/users"><Users className="h-4 w-4" /> Users</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/orders"><ShoppingCart className="h-4 w-4" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/sellers"><Store className="h-4 w-4" /> Sellers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/analytics"><BarChart3 className="h-4 w-4" /> Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/messages"><MessageCircle className="h-4 w-4" /> Messages</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer">
                  <Link href="/admin/settings"><Settings className="h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6 md:p-8">
                  <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
                  <Skeleton className="h-3 w-20 rounded-full mb-2" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6">
                <Skeleton className="h-5 w-36 rounded-full mb-4" />
                <Skeleton className="h-[300px] w-full rounded-2xl" />
              </div>
              <div className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6">
                <Skeleton className="h-5 w-36 rounded-full mb-4" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-full mb-3" />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]"
                  >
                    <CardContent className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${stat.color}`}>
                          <Icon className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold rounded-full px-3 py-1 text-[10px] md:text-xs",
                            stat.positive
                              ? "text-green-600 border-green-200 bg-green-50"
                              : "text-red-600 border-red-200 bg-red-50"
                          )}
                        >
                          {stat.trend}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1 tracking-tight">
                        {stat.label}
                      </p>
                      <p className="text-xl md:text-3xl font-normal font-headline tracking-[-0.05em]">
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Chart + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="lg:col-span-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">
                      Revenue Overview
                    </h2>
                    <Link href="/admin/analytics" className="text-sm text-primary hover:underline">
                      View Details
                    </Link>
                  </div>
                  <div className="h-[280px] md:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="adminColorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
                        <Tooltip contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#adminColorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] mb-4">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Link href="/admin/orders">
                      <button className="w-full flex items-center gap-3 rounded-full h-12 shadow-sm text-sm border-none bg-[#f8f8f8] dark:bg-white/[0.05] hover:bg-muted px-5 transition-all">
                        <ShoppingCart className="h-5 w-5 text-primary" /> View All Orders
                      </button>
                    </Link>
                    <Link href="/admin/users">
                      <button className="w-full flex items-center gap-3 rounded-full h-12 shadow-sm text-sm border-none bg-[#f8f8f8] dark:bg-white/[0.05] hover:bg-muted px-5 transition-all">
                        <Users className="h-5 w-5 text-primary" /> Manage Users
                      </button>
                    </Link>
                    <Link href="/admin/sellers">
                      <button className="w-full flex items-center gap-3 rounded-full h-12 shadow-sm text-sm border-none bg-[#f8f8f8] dark:bg-white/[0.05] hover:bg-muted px-5 transition-all">
                        <Store className="h-5 w-5 text-primary" /> Manage Sellers
                      </button>
                    </Link>
                    <Link href="/admin/messages">
                      <button className="w-full flex items-center gap-3 rounded-full h-12 shadow-sm text-sm border-none bg-[#f8f8f8] dark:bg-white/[0.05] hover:bg-muted px-5 transition-all">
                        <MessageCircle className="h-5 w-5 text-primary" /> Messages
                      </button>
                    </Link>
                  </div>
                  <div className="pt-5 mt-4 border-t">
                    <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-2xl">
                      <TrendingUp className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold tracking-tight text-primary">
                          Platform Status
                        </p>
                        <p className="text-sm font-medium leading-tight">
                          {pendingOrders} pending orders need attention. {totalSellers} active sellers.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Table */}
            <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">
                    Recent Orders
                  </h2>
                  <Link href="/admin/orders">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-6 h-10 shadow-sm border-none bg-[#f8f8f8] dark:bg-white/[0.05] hover:bg-muted text-xs font-bold"
                    >
                      View all <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium tracking-tight text-xs">
                        <th className="text-left pb-5 px-2">Order ID</th>
                        <th className="text-left pb-5 px-2">Status</th>
                        <th className="text-left pb-5 px-2">Qty</th>
                        <th className="text-right pb-5 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((bk: any) => {
                        const status = bk.status || "pending";
                        return (
                          <tr key={bk.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-5 px-2 font-mono font-bold text-xs">
                              {bk.id?.slice(0, 10)}
                            </td>
                            <td className="py-5 px-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-4 py-1 text-[10px] font-bold capitalize",
                                  status === "Confirmed" && "bg-blue-50 text-blue-600 border-blue-200",
                                  status === "Pending" && "bg-orange-50 text-orange-600 border-orange-200",
                                  (status === "Completed" || status === "completed") &&
                                    "bg-green-50 text-green-600 border-green-200",
                                  (status === "Cancelled" || status === "cancelled") &&
                                    "bg-red-50 text-red-600 border-red-200"
                                )}
                              >
                                {status}
                              </Badge>
                            </td>
                            <td className="py-5 px-2 text-muted-foreground">
                              {bk.numberOfGuests || bk.quantity || 1}
                            </td>
                            <td className="py-5 px-2 text-right font-black text-lg">
                              ₱{Number(bk.totalPrice || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                            No recent orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
