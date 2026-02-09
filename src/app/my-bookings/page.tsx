
"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { 
  Calendar, 
  ChevronRight, 
  Search, 
  Users, 
  ArrowLeft,
  MapPin,
  Clock,
  Filter
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
}

const STATUS_FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function MyBookingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "bookings"), 
      where("userId", "==", user.uid),
      orderBy("bookingDate", "desc")
    );
  }, [firestore, user]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "facilities");
  }, [firestore]);

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

  if (isUserLoading) return null;
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 w-full max-w-4xl mx-auto pt-0 md:pt-32 pb-24 px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 mt-8 md:mt-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-all">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-normal font-headline tracking-[-0.05em]">My <span className="text-primary">Bookings</span></h1>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search stays..."
              className="w-full bg-[#f8f8f8] rounded-full py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
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
            <div className="py-20 text-center text-muted-foreground italic">Fetching your escape history...</div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((bk) => {
              const facility = facilities?.find(f => f.id === bk.facilityId);
              return (
                <div key={bk.id} className="bg-white rounded-[30px] overflow-hidden border border-black/[0.05] hover:shadow-xl hover:shadow-black/[0.02] transition-all group">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 bg-muted overflow-hidden">
                      <Image 
                        src={facility?.imageUrl || "https://picsum.photos/seed/resort/400/300"} 
                        alt={facility?.name || "Resort"} 
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
                            <MapPin className="h-3 w-3" /> Bongabong, Mindoro
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total Paid</p>
                          <p className="text-lg font-medium text-black">₱{bk.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/[0.03]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-tight">Stay Period</p>
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
                            <p className="text-[10px] font-bold text-muted-foreground tracking-tight">Guests</p>
                            <p className="text-xs font-medium">{bk.numberOfGuests} Persons</p>
                          </div>
                        </div>
                      </div>
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
              <p className="text-sm font-headline italic">No matching bookings found.</p>
              <Button asChild variant="link" className="mt-2 text-primary">
                <Link href="/book">Discover new paradises</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
