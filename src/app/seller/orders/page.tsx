"use client";

import React, { useState } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Package,
  ChevronRight,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useSupabaseAuth, useSupabase, useStableMemo, useCollection, updateDocumentNonBlocking } from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { icon: React.ElementType; className: string; label: string }> = {
  "To Pay": { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400", label: "To Pay" },
  "To Ship": { icon: Package, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400", label: "To Ship" },
  "To Receive": { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400", label: "To Receive" },
  "Completed": { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400", label: "Completed" },
  "Cancelled": { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400", label: "Cancelled" },
  pending: { icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400", label: "Pending" },
  processing: { icon: AlertCircle, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400", label: "Processing" },
  shipped: { icon: Truck, className: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400", label: "Shipped" },
  completed: { icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400", label: "Completed" },
  cancelled: { icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400", label: "Cancelled" },
};

export default function SellerOrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  // Fetch orders (bookings) for this store
  const ordersConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "bookings",
      filters: [{ column: "storeId", op: "eq" as const, value: user.uid }],
      order: { column: "createdAt", ascending: false },
    };
  }, [user]);
  const { data: orders, isLoading } = useCollection(ordersConfig);

  const allOrders = orders ?? [];

  const filteredOrders = allOrders.filter((o: any) => {
    const matchSearch =
      (o.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingAddress || "").toLowerCase().includes(search.toLowerCase());
    if (tab === "all") return matchSearch;
    return matchSearch && (o.status || "").toLowerCase() === tab.toLowerCase();
  });

  const getCount = (status: string) => allOrders.filter((o: any) => (o.status || "").toLowerCase() === status.toLowerCase()).length;

  const counts = {
    all: allOrders.length,
    "To Pay": getCount("To Pay"),
    "To Ship": getCount("To Ship"),
    "To Receive": getCount("To Receive"),
    Completed: getCount("Completed") + getCount("completed"),
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateDocumentNonBlocking(supabase, "bookings", orderId, { status: newStatus });
    window.location.reload();
  };

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">Shop Orders</h1>
          <p className="text-sm text-muted-foreground font-normal">{counts["To Pay"] + counts["To Ship"]} orders need attention</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            { label: "To Pay", count: counts["To Pay"], color: "text-yellow-600" },
            { label: "To Ship", count: counts["To Ship"], color: "text-blue-600" },
            { label: "To Receive", count: counts["To Receive"], color: "text-purple-600" },
            { label: "Completed", count: counts.Completed, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
              <CardContent className="p-5 md:p-6 text-center">
                <p className={`text-xl md:text-3xl font-normal font-headline tracking-[-0.05em] ${s.color}`}>{s.count}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 rounded-full bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/[0.06]"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full shrink-0 border-black/[0.06] dark:border-white/[0.06]">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 h-auto flex-wrap">
            <TabsTrigger value="all" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="To Pay" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-3">
              To Pay
            </TabsTrigger>
            <TabsTrigger value="To Ship" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-3">
              To Ship
            </TabsTrigger>
            <TabsTrigger value="To Receive" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-3">
              To Receive
            </TabsTrigger>
            <TabsTrigger value="Completed" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-3">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-3 w-28 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Order List */}
            <div className="space-y-3">
              {filteredOrders.map((order: any) => {
                const status = order.status || "To Pay";
                const config = statusConfig[status] || statusConfig["To Pay"];
                const StatusIcon = config.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <Card key={order.id} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
                    <CardContent className="p-0">
                      <button
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-2xl shrink-0 ${config.className}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">Order #{order.id?.slice(0, 8)}</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">×{order.quantity || 1}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {order.paymentMethod || "cod"} · {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium">₱{Number(order.totalPrice || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-black/[0.04] dark:border-white/[0.04]">
                          <div className="pt-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Status</span>
                              <Badge className={`rounded-full text-[10px] border-0 capitalize ${config.className}`}>
                                {config.label}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Delivery</span>
                              <span className="text-xs">{order.shippingAddress || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Payment</span>
                              <span className="text-xs capitalize">{order.paymentMethod || "cod"}</span>
                            </div>
                            {order.trackingNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Tracking</span>
                                <span className="text-xs">{order.trackingNumber}</span>
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              {status === "To Pay" && (
                                <>
                                  <Button size="sm" className="rounded-full flex-1 text-xs h-9" onClick={() => handleUpdateStatus(order.id, "To Ship")}>
                                    Accept Order
                                  </Button>
                                  <Button size="sm" variant="outline" className="rounded-full flex-1 text-xs h-9 border-black/[0.06]" onClick={() => handleUpdateStatus(order.id, "Cancelled")}>
                                    Decline
                                  </Button>
                                </>
                              )}
                              {status === "To Ship" && (
                                <Button size="sm" className="rounded-full flex-1 text-xs h-9 gap-1" onClick={() => handleUpdateStatus(order.id, "To Receive")}>
                                  <Truck className="h-3.5 w-3.5" /> Mark as Shipped
                                </Button>
                              )}
                              {status === "To Receive" && (
                                <Button size="sm" className="rounded-full flex-1 text-xs h-9 gap-1" onClick={() => handleUpdateStatus(order.id, "Completed")}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Delivered
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-16">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No orders found</p>
              </div>
            )}
          </>
        )}
      </div>
    </SellerLayout>
  );
}
