"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  DollarSign,
  Package,
  Filter,
  Download,
} from "lucide-react";
import {
  useUser,
  useSupabase,
  useStableMemo,
  useCollection,
  updateDocumentNonBlocking,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { icon: React.ElementType; className: string; badge: string }> = {
  "To Pay": { icon: Clock, className: "text-yellow-600 bg-yellow-50", badge: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  "To Ship": { icon: AlertCircle, className: "text-blue-600 bg-blue-50", badge: "bg-blue-50 text-blue-600 border-blue-200" },
  "To Receive": { icon: Truck, className: "text-purple-600 bg-purple-50", badge: "bg-purple-50 text-purple-600 border-purple-200" },
  Completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50", badge: "bg-green-50 text-green-600 border-green-200" },
  Cancelled: { icon: XCircle, className: "text-red-600 bg-red-50", badge: "bg-red-50 text-red-600 border-red-200" },
  Pending: { icon: Clock, className: "text-orange-600 bg-orange-50", badge: "bg-orange-50 text-orange-600 border-orange-200" },
  Confirmed: { icon: CheckCircle2, className: "text-blue-600 bg-blue-50", badge: "bg-blue-50 text-blue-600 border-blue-200" },
  pending: { icon: Clock, className: "text-orange-600 bg-orange-50", badge: "bg-orange-50 text-orange-600 border-orange-200" },
  completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50", badge: "bg-green-50 text-green-600 border-green-200" },
  cancelled: { icon: XCircle, className: "text-red-600 bg-red-50", badge: "bg-red-50 text-red-600 border-red-200" },
};

const STATUS_OPTIONS = ["Pending", "Confirmed", "To Ship", "To Receive", "Completed", "Cancelled"];

export default function AdminOrdersPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAdminLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, isAdminLoading, router]);

  const ordersConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return {
      table: "bookings",
      order: { column: "createdAt", ascending: false },
    };
  }, [user, isAdmin]);
  const { data: allOrders, isLoading } = useCollection(ordersConfig);

  if (isAdminLoading || !isAdmin) return null;

  const filteredOrders = (allOrders ?? []).filter((o: any) => {
    const matchesSearch =
      !searchQuery ||
      (o.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.facilityName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = allOrders?.reduce((sum, o: any) => sum + (Number(o.totalPrice) || 0), 0) ?? 0;
  const pendingCount = allOrders?.filter((o: any) => o.status === "Pending" || o.status === "pending" || o.status === "To Pay").length ?? 0;
  const completedCount = allOrders?.filter((o: any) => o.status === "Completed" || o.status === "completed").length ?? 0;

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateDocumentNonBlocking(supabase, "bookings", orderId, { status: newStatus });
    toast({ title: "Order updated", description: `Status changed to ${newStatus}.` });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
              Order Management
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              {allOrders?.length ?? 0} total orders
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
            { label: "Total Orders", value: String(allOrders?.length ?? 0), icon: ShoppingCart, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
            { label: "Pending", value: String(pendingCount), icon: Clock, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
            { label: "Completed", value: String(completedCount), icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
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
              placeholder="Search orders by ID or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-full pl-11 pr-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full px-5 h-11 text-xs font-bold shrink-0",
                statusFilter === "all" ? "bg-black text-white hover:bg-primary" : "border-black/[0.06]"
              )}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full px-4 h-11 text-xs font-bold shrink-0",
                  statusFilter === s ? "bg-black text-white hover:bg-primary" : "border-black/[0.06]"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <Card className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </Card>
        ) : (
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
            <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b text-muted-foreground font-medium tracking-tight text-xs">
                        <th className="text-left py-5 px-6">Order ID</th>
                        <th className="text-left py-5 px-4">Product</th>
                        <th className="text-left py-5 px-4">Status</th>
                        <th className="text-left py-5 px-4">Qty</th>
                        <th className="text-left py-5 px-4">Date</th>
                        <th className="text-right py-5 px-4">Total</th>
                        <th className="text-right py-5 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order: any) => {
                        const status = order.status || "pending";
                        const config = statusConfig[status];
                        const StatusIcon = config?.icon || Clock;
                        return (
                          <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-5 px-6 font-mono font-bold text-xs">{order.id?.slice(0, 10)}</td>
                            <td className="py-5 px-4">
                              <p className="text-sm font-medium truncate max-w-[200px]">{order.facilityName || "Order"}</p>
                            </td>
                            <td className="py-5 px-4">
                              <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[10px] font-bold capitalize", config?.badge)}>
                                {status}
                              </Badge>
                            </td>
                            <td className="py-5 px-4 text-muted-foreground">
                              {order.quantity || order.numberOfGuests || 1}
                            </td>
                            <td className="py-5 px-4 text-muted-foreground text-xs">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-5 px-4 text-right font-bold">
                              ₱{Number(order.totalPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {status !== "Completed" && status !== "completed" && status !== "Cancelled" && status !== "cancelled" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full h-8 px-3 text-[10px] font-bold border-green-200 text-green-600 hover:bg-green-50"
                                      onClick={() => handleUpdateStatus(order.id, "Confirmed")}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full h-8 px-3 text-[10px] font-bold border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => handleUpdateStatus(order.id, "Cancelled")}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" /> Cancel
                                    </Button>
                                  </>
                                )}
                                {(status === "Confirmed" || status === "To Ship") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full h-8 px-3 text-[10px] font-bold border-purple-200 text-purple-600 hover:bg-purple-50"
                                    onClick={() => handleUpdateStatus(order.id, "Completed")}
                                  >
                                    <Truck className="h-3 w-3 mr-1" /> Complete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
