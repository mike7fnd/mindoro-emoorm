
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useUser, useCollection, useStableMemo } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CreditCard, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-is-admin";

export default function AdminBookingsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { isAdmin: isResortAdmin, isAdminLoading } = useIsAdmin();

  useEffect(() => {
    if (!isAdminLoading && !isResortAdmin) {
      router.push("/");
    }
  }, [isResortAdmin, isAdminLoading, router]);

  const bookingsQuery = useStableMemo(() => {
    if (!user || !isResortAdmin) return null;
    return {
      table: "bookings",
      order: { column: "bookingDate", ascending: false }
    };
  }, [user, isResortAdmin]);

  const { data: bookings } = useCollection(bookingsQuery);



  if (isUserLoading || !user || !isResortAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-0 md:pt-32 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em]">All <span className="text-primary">Orders</span></h1>
          <p className="text-sm text-muted-foreground mt-1">View buyer orders and fulfillment. <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Only sellers can update order status.</span></p>
        </div>

        <Card className="border-none shadow-sm rounded-[25px] overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#fcfcfc]">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="py-8 px-8 tracking-tight text-xs font-bold text-muted-foreground">Order ID</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Details</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Order date</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Status</TableHead>
                <TableHead className="py-8 px-8 text-right tracking-tight text-xs font-bold text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((bk) => (
                <TableRow key={bk.id} className="hover:bg-muted/20 border-b last:border-0">
                  <TableCell className="font-bold font-mono text-xs py-8 px-8">{bk.id.slice(0, 10)}</TableCell>
                  <TableCell className="py-8">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium"><User className="h-4 w-4 mr-2 text-primary" /> {bk.numberOfGuests || 1} items</div>
                      <div className="flex items-center font-black text-lg text-black"><CreditCard className="h-4 w-4 mr-2 text-primary" /> ₱{bk.totalPrice.toLocaleString()}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8">
                    <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> {new Date(bk.startDate || bk.bookingDate).toLocaleDateString()}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8">
                    <Badge variant="outline" className={cn(
                      "rounded-full px-5 py-1.5 text-[10px] font-bold",
                      bk.status === "Confirmed" && "bg-blue-50 text-blue-600 border-blue-200",
                      bk.status === "Pending" && "bg-orange-50 text-orange-600 border-orange-200",
                      bk.status === "Completed" && "bg-green-50 text-green-600 border-green-200",
                      bk.status === "Cancelled" && "bg-red-50 text-red-600 border-red-200",
                    )}>
                      {bk.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-8 px-8 text-right">
                    <span className="text-xs text-muted-foreground">View only</span>
                  </TableCell>
                </TableRow>
              ))}
              {(!bookings || bookings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-muted-foreground italic text-lg">No orders found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
