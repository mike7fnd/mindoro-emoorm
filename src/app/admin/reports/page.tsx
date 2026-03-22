"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  Store,
  TrendingUp,
  Filter,
} from "lucide-react";
import {
  useUser,
  useStableMemo,
  useCollection,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function exportReportCSV(title: string, stats: { label: string; value: string }[]) {
  const headers = ["Metric", "Value"];
  const rows = stats.map((s) => [s.label, s.value]);
  const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAdminLoading } = useIsAdmin();
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, isAdminLoading, router]);

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

  if (isAdminLoading || !isAdmin) return null;

  const isLoading = ordersLoading || usersLoading || productsLoading || storesLoading;

  // Filter orders by time range
  const filteredOrders = (allOrders ?? []).filter((o: any) => {
    if (timeRange === "all") return true;
    const orderDate = new Date(o.createdAt || o.bookingDate);
    const now = new Date();
    if (timeRange === "today") {
      return orderDate.toDateString() === now.toDateString();
    }
    if (timeRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= weekAgo;
    }
    if (timeRange === "month") {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0);
  const completedOrders = filteredOrders.filter((o: any) => o.status === "Completed" || o.status === "completed");
  const cancelledOrders = filteredOrders.filter((o: any) => o.status === "Cancelled" || o.status === "cancelled");
  const pendingOrders = filteredOrders.filter((o: any) => o.status === "Pending" || o.status === "pending" || o.status === "To Pay");

  const reports = [
    {
      title: "Revenue Report",
      description: "Total revenue, average order value, and payment breakdown",
      icon: DollarSign,
      color: "text-green-600 bg-green-50 dark:bg-green-500/10",
      stats: [
        { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}` },
        { label: "Avg Order", value: `₱${filteredOrders.length ? Math.round(totalRevenue / filteredOrders.length).toLocaleString() : 0}` },
        { label: "Completed Revenue", value: `₱${completedOrders.reduce((s, o: any) => s + (Number(o.totalPrice) || 0), 0).toLocaleString()}` },
      ],
    },
    {
      title: "Orders Report",
      description: "Order volume, status breakdown, and fulfillment metrics",
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
      stats: [
        { label: "Total Orders", value: String(filteredOrders.length) },
        { label: "Completed", value: String(completedOrders.length) },
        { label: "Cancelled", value: String(cancelledOrders.length) },
        { label: "Pending", value: String(pendingOrders.length) },
      ],
    },
    {
      title: "Users Report",
      description: "User registrations, roles, and activity",
      icon: Users,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
      stats: [
        { label: "Total Users", value: String(allUsers?.length ?? 0) },
        { label: "Sellers", value: String(allUsers?.filter((u: any) => u.role === "seller").length ?? 0) },
        { label: "Buyers", value: String((allUsers?.length ?? 0) - (allUsers?.filter((u: any) => u.role === "seller" || u.role === "admin").length ?? 0)) },
        { label: "Admins", value: String(allUsers?.filter((u: any) => u.role === "admin").length ?? 0) },
      ],
    },
    {
      title: "Product Report",
      description: "Product listings, categories, and inventory status",
      icon: Store,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10",
      stats: [
        { label: "Total Products", value: String(allProducts?.length ?? 0) },
        { label: "Active Sellers", value: String(allStores?.length ?? 0) },
        { label: "Avg Price", value: `₱${allProducts?.length ? Math.round((allProducts as any[]).reduce((s, p) => s + (Number(p.price || p.pricePerNight) || 0), 0) / allProducts.length).toLocaleString() : 0}` },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
              Reports
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              Generate and view platform reports
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All Time" },
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
          ].map((t) => (
            <Button
              key={t.key}
              variant={timeRange === t.key ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-5 h-11 text-xs font-bold shrink-0",
                timeRange === t.key ? "bg-black text-white hover:bg-primary" : "border-black/[0.06]"
              )}
              onClick={() => setTimeRange(t.key)}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Reports */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6 md:p-8">
                <Skeleton className="h-6 w-48 rounded-full mb-4" />
                <Skeleton className="h-3 w-64 rounded-full mb-6" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-20 rounded-full mb-2" />
                      <Skeleton className="h-7 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.title} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${report.color} shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium font-headline tracking-[-0.02em]">{report.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 h-9 text-xs font-bold gap-1.5 border-black/[0.06] shrink-0"
                        onClick={() => {
                          exportReportCSV(report.title, report.stats);
                          toast({ title: "Exported", description: `${report.title} exported as CSV.` });
                        }}
                      >
                        <Download className="h-3.5 w-3.5" /> Export
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                      {report.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                          <p className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">{stat.value}</p>
                        </div>
                      ))}
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
