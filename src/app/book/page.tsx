"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Search, Heart, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Image from "next/image";

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  imageUrl: string;
  rating?: number;
  reviews?: number;
  status: string;
}

export default function BookPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  
  // Modal states
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("welcome_book_seen");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcomeModal = () => {
    setShowWelcome(false);
    localStorage.setItem("welcome_book_seen", "true");
  };

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "facilities");
  }, [firestore]);

  const { data: facilitiesData, isLoading: isLoading } = useCollection<Facility>(facilitiesQuery);

  const filteredFacilities = useMemo(() => {
    if (!facilitiesData) return [];
    return facilitiesData.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (f.type || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter ? f.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [facilitiesData, searchTerm, typeFilter]);

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[1480px]">
        {/* Search & Filter Bar */}
        <section className="mb-10 mt-8 md:mt-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search destination..." 
                className="w-full bg-white rounded-full py-5 pl-14 pr-6 text-sm md:text-base outline-none shadow-sm border-none font-medium transition-all focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {["All", "Kubo", "Cabana", "Room", "Hall", "House"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type === "All" ? "" : type)}
                  className={cn(
                    "px-8 py-4 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    (type === "All" && typeFilter === "") || typeFilter === type 
                      ? "bg-black text-white shadow-sm" 
                      : "bg-[#f8f8f8] text-black shadow-none"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 md:gap-x-10 md:gap-y-12">
          {isLoading ? (
            <div className="col-span-full text-center py-20 text-muted-foreground italic">Finding our paradises...</div>
          ) : filteredFacilities.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground italic">No facilities found.</div>
          ) : filteredFacilities.map((facility) => (
            <div key={facility.id} className="flex flex-col gap-1.5 md:gap-2">
              <Link href={`/book/${facility.id}`}>
                <div className="relative aspect-square overflow-hidden rounded-[25px] shadow-sm">
                  <Image 
                    src={facility.imageUrl} 
                    alt={facility.name}
                    fill
                    className="object-cover"
                    data-ai-hint="resort facility"
                  />
                  <button 
                    onClick={(e) => toggleLike(e, facility.id)}
                    className={cn(
                      "absolute top-2 right-2 z-10 p-3 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 transition-all",
                      likedIds.includes(facility.id) && "bg-white/40"
                    )}
                  >
                    <Heart 
                      className={cn(
                        "h-5 w-5 transition-all",
                        likedIds.includes(facility.id) ? "fill-white text-white scale-110" : "text-white"
                      )} 
                    />
                  </button>
                </div>
              </Link>
              
              <div className="px-1">
                <div className="flex justify-between items-center mb-0.5">
                  <Link href={`/book/${facility.id}`}>
                    <h3 className="text-lg md:text-xl font-normal font-headline tracking-[-0.05em] line-clamp-1 hover:text-primary transition-colors">{facility.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-xs font-bold">{facility.rating || 5.0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-muted">
                        <img src={`https://i.pravatar.cc/100?u=${facility.id}${i}`} alt="User" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    <div className="h-7 w-7 rounded-full border-2 border-white bg-primary/10 text-primary text-[8px] flex items-center justify-center font-bold">15+</div>
                  </div>
                  <p className="text-primary font-bold text-base">₱{(facility.pricePerNight || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />

      {/* Onboarding Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-500">
          <div className="relative h-full w-full max-w-[500px] md:h-[800px] md:rounded-[25px] overflow-hidden shadow-lg bg-black">
            <div className="absolute inset-0">
              <Image 
                src="https://picsum.photos/seed/welcome/1000/1500" 
                alt="Welcome" 
                fill 
                className="object-cover opacity-80"
                data-ai-hint="welcome resort"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-normal font-headline text-white tracking-[-0.05em] leading-tight mb-4">
                Explore new places <br /> <span className="text-primary italic">without fear</span>
              </h2>
              <p className="text-white/60 text-sm md:text-base font-light mb-12 max-w-sm mx-auto md:mx-0">
                Plan trips, explore destinations, and book unforgettable experiences with Bella's Paradise.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={closeWelcomeModal}
                  className="flex-1 py-5 rounded-full bg-white/10 backdrop-blur-xl text-white font-bold text-sm tracking-tight hover:bg-white/20 transition-all"
                >
                  Skip
                </button>
                <button 
                  onClick={closeWelcomeModal}
                  className="flex-[2] py-5 rounded-full bg-white text-black font-bold text-sm tracking-tight shadow-lg hover:bg-primary hover:text-white transition-all"
                >
                  Next
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-10">
                <div className="h-1.5 w-8 rounded-full bg-primary" />
                <div className="h-1.5 w-2 rounded-full bg-white/30" />
                <div className="h-1.5 w-2 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
