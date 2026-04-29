
"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  useUser,
  useSupabase,
  useCollection,
  useStableMemo
} from "@/supabase";
import {
  Calendar,
  ChevronRight,
  Search,
  Users,
  ArrowLeft,
  MapPin,
  Clock,
  Filter,
  MoreVertical,
  Package,
  Star
} from "lucide-react";
import { FirstTimeIntro } from "@/components/first-time-intro";
import { ReviewModal } from "@/components/review-modal";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  facilityId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  numberOfGuests: number;
}

interface Facility {
  id: string;
  name: string;
  imageUrl: string;
  storeId?: string;
}

interface BookingWithStore extends Booking {
  storeId?: string;
}

const STATUS_FILTERS = [
  "All",
  "To Pay",
  "Pending",
  "Confirmed",
  "To Ship",
  "To Receive",
  "To Pickup",
  "Completed"
];

export default function MyBookingsPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    bookingId?: string;
    facilityId?: string;
    facilityName?: string;
    storeId?: string;
    storeName?: string;
    reviewType?: "product" | "seller";
  }>({
    open: false,
  });WithStore>(bookingsQuery);

  const facilitiesQuery = useStableMemo(() => {
    return { table: "facilities" };
  }, []);

  const { data: facilities } = useCollection<Facility>(facilitiesQuery);

  const storesQuery = useStableMemo(() => {
    return { table: "stores" };
  }, []);

  const { data: stores } = useCollection(storser.uid }],
      order: { column: "bookingDate", ascending: false }
    };
  }, [user]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);

  const facilitiesQuery = useStableMemo(() => {
    return { table: "facilities" };
  }, []);

  const { data: facilities } = useCollection<Facility>(facilitiesQuery);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter(bk => {
      const facility = facilities?.find(f => f.id === bk.facilityId);
      const matchesSearch = facility?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = activeStatus === "All" || bk.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, facilities, searchTerm, activeStatus]);

  if (isUserLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto pt-0 md:pt-32 pb-24 px-6">
        <div className="mt-8 md:mt-0 mb-10">
          <Skeleton className="h-8 w-48 rounded-full mb-4" />
        </div>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[30px] overflow-hidden border border-black/[0.05] flex flex-col sm:flex-row">
              <Skeleton className="w-full sm:w-48 h-48 shrink-0" />
              <div className="flex-1 p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto pt-0 md:pt-32 pb-24 px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 mt-8 md:mt-0">
          <div className="flex-1 flex flex-col gap-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] dark:text-white">My Orders</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{filteredBookings.length} order{filteredBookings.length !== 1 ? 's' : ''}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none flex items-center">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/30 backdrop-blur-xl dark:bg-black/30">
                  <DropdownMenuLabel className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Order Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
                  <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                    Deselect All
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                    Remove Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
                  <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-red-50 focus:text-red-600 transition-colors gap-3 text-red-600">
                    Clear Orders
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full bg-[#f8f8f8] rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                activeStatus === status
                  ? "bg-black text-white"
                  : "bg-[#f8f8f8] text-muted-foreground hover:bg-muted"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {isBookingsLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[30px] overflow-hidden border border-black/[0.05] flex flex-col sm:flex-row">
                  <Skeleton className="w-full sm:w-48 h-48 shrink-0" />
                  <div className="flex-1 p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((bk) => {
              const facility = facilities?.find(f => f.id === bk.facilityId);
              const store = stores?.find(s => s.id === bk.storeId);
              const isCompleted = bk.status === "Completed";

              return (
                <div key={bk.id} className="bg-white rounded-[30px] overflow-hidden border border-black/[0.05] hover:shadow-xl hover:shadow-black/[0.02] transition-all group">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 bg-muted overflow-hidden">
                      <Image
                        src={facility?.imageUrl || "https://picsum.photos/seed/product/400/300"}
                        alt={facility?.name || "Product"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-bold border-none",
                          bk.status === "Confirmed" && "bg-blue-500 text-white",
                          bk.status === "Pending" && "bg-orange-500 text-white",
                          bk.status === "Completed" && "bg-green-500 text-white",
                          bk.status === "Cancelled" && "bg-red-500 text-white",
                        )}>
                          {bk.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-normal font-headline tracking-tight mb-1">{facility?.name || "Loading..."}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                            <MapPin className="h-3 w-3" /> Oriental Mindoro
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total</p>
                          <p className="text-lg font-medium text-black">₱{bk.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/[0.03]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-tight">Order Date</p>
                            <p className="text-xs font-medium">
                              {new Date(bk.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(bk.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-tight">Qty</p>
                            <p className="text-xs font-medium">{bk.numberOfGuests} Items</p>
                          </div>
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-black/[0.03]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              setReviewModal({
                                open: true,
                                bookingId: bk.id,
                                facilityId: bk.facilityId,
                                facilityName: facility?.name,
                                reviewType: "product",
                              })
                            }
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate Product
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              setReviewModal({
                                open: true,
                                bookingId: bk.id,
                                storeId: bk.storeId,
                                storeName: store?.name,
                                reviewType: "seller",
                              })
                            }
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate Seller
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
              <div className="h-20 w-20 rounded-full border-2 border-black/10 flex items-center justify-center mb-6">
                <Calendar className="h-10 w-10 text-black/20" />
              </div>
              <p className="text-sm font-headline italic">No matching orders found.</p>
              <Button asChild variant="link" className="mt-2 text-primary">
                <Link href="/book">Browse products</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <FirstTimeIntro
        storageKey="my-bookings"
        title="My Orders"
        description="Track all your orders in one place. Filter by status, search by product name, and tap any order to view its details."
        icon={<Package className="h-7 w-7" />}
      />

      {reviewModal.open && user && reviewModal.reviewType && (
        <ReviewModal
          open={reviewModal.open}
          onOpenChange={(open) => setReviewModal({ ...reviewModal, open })}
          userId={user.uid}
          bookingId={reviewModal.bookingId || ""}
          facilityId={reviewModal.facilityId}
          facilityName={reviewModal.facilityName}
          storeId={reviewModal.storeId}
          storeName={reviewModal.storeName}
          reviewType={reviewModal.reviewType}
        />
      )}

      <Footer />
    </div>
  );
}
