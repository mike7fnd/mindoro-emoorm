
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAILS = ['kioalaquer301@gmail.com', 'mikefernandex227@gmail.com', 'mikefernandez227@gmail.com'];

export default function AdminBookingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const isResortAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isUserLoading && (!user || !isResortAdmin)) {
      router.push("/");
    }
  }, [user, isUserLoading, router, isResortAdmin]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isResortAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookingDate", "desc"));
  }, [firestore, user, isResortAdmin]);

  const { data: bookings } = useCollection(bookingsQuery);

  const updateStatus = (id: string, status: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, "bookings", id), { status });
    toast({
      title: "Booking updated",
      description: `Status changed to ${status}.`
    });
  };

  if (isUserLoading || !user || !isResortAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-0 md:pt-32 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em]">All <span className="text-primary">Reservations</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Manage guest bookings and facility availability.</p>
        </div>

        <Card className="border-none shadow-sm rounded-[25px] overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#fcfcfc]">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="py-8 px-8 tracking-tight text-xs font-bold text-muted-foreground">Booking ID</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Details</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Stay period</TableHead>
                <TableHead className="py-8 tracking-tight text-xs font-bold text-muted-foreground">Status</TableHead>
                <TableHead className="py-8 px-8 text-right tracking-tight text-xs font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((bk) => (
                <TableRow key={bk.id} className="hover:bg-muted/20 border-b last:border-0">
                  <TableCell className="font-bold font-mono text-xs py-8 px-8">{bk.id.slice(0, 10)}</TableCell>
                  <TableCell className="py-8">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium"><User className="h-4 w-4 mr-2 text-primary" /> {bk.numberOfGuests} guests</div>
                      <div className="flex items-center font-black text-lg text-black"><CreditCard className="h-4 w-4 mr-2 text-primary" /> ₱{bk.totalPrice.toLocaleString()}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8">
                    <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> {new Date(bk.startDate).toLocaleDateString()}</div>
                      <div className="ml-5.5 opacity-60">to {new Date(bk.endDate).toLocaleDateString()}</div>
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
                    <div className="flex justify-end gap-3">
                      {bk.status === "Pending" && (
                        <>
                          <Button size="icon" variant="outline" className="rounded-full h-12 w-12 text-green-600 border-none bg-green-50 hover:bg-green-100 shadow-sm transition-all" onClick={() => updateStatus(bk.id, "Confirmed")}>
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="outline" className="rounded-full h-12 w-12 text-red-600 border-none bg-red-50 hover:bg-red-100 shadow-sm transition-all" onClick={() => updateStatus(bk.id, "Cancelled")}>
                            <X className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                      {bk.status === "Confirmed" && (
                        <Button size="sm" variant="outline" className="rounded-full px-8 h-12 shadow-sm border-none bg-primary text-white hover:bg-primary/90 transition-all font-bold" onClick={() => updateStatus(bk.id, "Completed")}>
                          Mark completed
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!bookings || bookings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-muted-foreground italic text-lg">No bookings found in the system.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
