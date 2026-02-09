"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Heart, ArrowRight, Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
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
  status: string;
}

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [likedRooms, setLikedRooms] = useState<number[]>([]);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  // Search/Filter states for logged-in view
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  const toggleLike = (id: number) => {
    setLikedRooms((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConsent = (choice: "accepted" | "declined") => {
    localStorage.setItem("cookieConsent", choice);
    setShowCookieConsent(false);
  };

  // Facilities fetching for logged-in view
  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "facilities");
  }, [firestore, user]);

  const { data: facilitiesData, isLoading: isFacilitiesLoading } = useCollection<Facility>(facilitiesQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const filteredFacilities = useMemo(() => {
    if (!facilitiesData) return [];
    return facilitiesData.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (f.type || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter ? f.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [facilitiesData, searchTerm, typeFilter]);

  const toggleLoggedLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const rooms = [
    {
      id: 1,
      name: "Kubo",
      sub: "Kubo Nature",
      image: "https://picsum.photos/seed/kubo1/800/600",
    },
    {
      id: 2,
      name: "Cabana",
      sub: "2 Guests · 35 ft",
      image: "https://picsum.photos/seed/cabana1/800/600",
    },
    {
      id: 3,
      name: "Kubo sa Ilog",
      sub: "10 Guests · 35 ft",
      image: "https://picsum.photos/seed/kubo2/800/600",
    },
    {
      id: 4,
      name: "Function Hall",
      sub: "20 Guests · 60 ft",
      image: "https://picsum.photos/seed/hall1/800/600",
    },
    {
      id: 5,
      name: "A-House",
      sub: "4 Guests · 60 ft",
      image: "https://picsum.photos/seed/ahouse1/800/600",
    },
    {
      id: 6,
      name: "Tents",
      sub: "4 Guests · 8 ft",
      image: "https://picsum.photos/seed/tent1/800/600",
    },
  ];

  const feedbacks = [
    {
      name: "Maria & Carlo S.",
      location: "Kubo sa Ilog",
      date: "Oct 2025",
      text: "Hello Po. Super ganda po ng place, relaxing po. Tsaka pool saktong sakto po sa mga kids.",
      avatar: "https://i.pravatar.cc/150?u=maria",
      stars: 5,
    },
    {
      name: "Krizzel F.",
      location: "A-House",
      date: "Sept 2025",
      text: "Hello Po. Super ganda po ng place, relaxing po. Tsaka pool saktong sakto po sa mga kids.",
      avatar: "https://i.pravatar.cc/150?u=krizzel",
      stars: 5,
      featured: true,
    },
    {
      name: "Paolo & Friends",
      location: "Cabana",
      date: "Nov 2025",
      text: "Unreal vibe and super clean. Nature all around — easily the best resort experience!",
      avatar: "https://i.pravatar.cc/150?u=paolo",
      stars: 5,
    },
  ];

  if (isUserLoading) return null;

  // LOGGED IN VIEW: DISCOVERY / BOOK PAGE CONTENT
  if (user) {
    const firstName = userProfile?.firstName || user.displayName?.split(" ")[0] || "Guest";
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[1480px]">
          <div className="mb-10 mt-8 md:mt-0">
            <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em] leading-tight">
              Hi, {firstName}! <br />
              <span className="text-muted-foreground">explore our accomodations.</span>
            </h1>
          </div>

          <section className="mb-10">
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-12">
            {isFacilitiesLoading ? (
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
                      onClick={(e) => toggleLoggedLike(e, facility.id)}
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
      </div>
    );
  }

  // GUEST VIEW: ORIGINAL LANDING PAGE
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-grow page-content">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] md:h-[85vh] min-h-[450px] overflow-hidden rounded-b-[25px]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(34, 26, 20, 0.4), rgba(21, 17, 14, 0.2)), url("https://picsum.photos/seed/bellahero/1920/1080")',
            }}
          />
          <div className="relative h-full container mx-auto max-w-[1480px] flex flex-col justify-end pb-16 md:pb-24 px-6">
            <p className="text-white text-2xl md:text-4xl font-normal lowercase tracking-widest mb-[-5px] md:mb-[-10px] opacity-90">
              any season at
            </p>
            <h1 className="font-headline italic text-white text-5xl md:text-9xl font-normal drop-shadow-lg">
              Bella's Paradise
            </h1>
          </div>
        </section>

        {/* Promo Tiles */}
        <section className="container mx-auto max-w-[1480px] px-4 md:px-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 py-8 md:py-12">
          {["Stay", "Relax", "Relapse"].map((caption, i) => (
            <div
              key={i}
              className={cn(
                "relative aspect-[9/13] rounded-[25px] overflow-hidden shadow-sm border border-black/5 group cursor-pointer",
                i === 2 && "col-span-2 md:col-span-1 aspect-[16/9] md:aspect-[9/13]"
              )}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url("https://picsum.photos/seed/tile${i}/800/1200")`,
                }}
              />
              <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 text-white font-normal text-2xl md:text-3xl">
                {caption}
              </div>
            </div>
          ))}
        </section>

        {/* Quote Band */}
        <section className="bg-white py-10 md:py-16 px-6">
          <div className="container mx-auto max-w-[1480px] text-center">
            <p className="text-lg md:text-2xl font-normal italic leading-relaxed text-gray-800 max-w-4xl mx-auto">
              "Experience the nature and the freshwater around you at Bella's
              Paradise Resort, where every stay is a journey into
              sophistication, comfort, and unforgettable memories."
            </p>
          </div>
        </section>

        {/* Accommodations Grid */}
        <section className="container mx-auto max-w-[1480px] px-4 md:px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4 md:gap-6">
            <h2 className="bg-black text-white px-6 md:px-8 py-2 md:py-3 rounded-full text-lg md:text-xl font-normal">
              What We Have Here?
            </h2>
            <Link
              href="/book"
              className="text-base md:text-xl font-normal hover:text-primary transition-colors flex items-center gap-2"
            >
              Explore more accommodations <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="relative aspect-[3/4] md:aspect-[4/3] rounded-[25px] overflow-hidden shadow-sm group"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                  style={{ backgroundImage: `url("${room.image}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:opacity-80" />
                
                <button
                  onClick={() => toggleLike(room.id)}
                  className="absolute top-2 right-2 z-10 p-2 md:p-3 bg-black/20 backdrop-blur-md rounded-full transition-all"
                  aria-label="Like accommodation"
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 md:h-6 md:w-6 transition-colors",
                      likedRooms.includes(room.id)
                        ? "fill-white text-white"
                        : "text-white"
                    )}
                  />
                </button>

                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-white pr-4">
                  <h3 className="text-xl md:text-3xl font-normal leading-tight">{room.name}</h3>
                  <p className="text-[10px] md:text-sm opacity-80 font-extralight line-clamp-1">
                    {room.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feedback Section */}
        <section className="container mx-auto max-w-[1480px] px-4 md:px-6 py-12 md:py-16">
          <h2 className="bg-black text-white px-6 md:px-8 py-2 md:py-3 rounded-full text-lg md:text-xl font-normal inline-block mb-8 md:mb-12">
            What Guests Are Saying
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
            {feedbacks.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "bg-white/80 backdrop-blur-md border border-black/5 rounded-[25px] p-6 md:p-8 shadow-sm transition-transform",
                  f.featured && "md:p-12 md:shadow-md bg-white scale-100 md:scale-105"
                )}
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className={cn(
                    "rounded-full overflow-hidden border-2 border-primary",
                    f.featured ? "h-16 w-16 md:h-20 md:w-20 border-4" : "h-12 w-12 md:h-14 md:w-14"
                  )}>
                    <img src={f.avatar} alt={f.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex text-primary">
                    {Array.from({ length: f.stars }).map((_, s) => (
                      <Star key={s} className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className={cn(
                  "italic text-gray-700 leading-relaxed mb-6 md:mb-8",
                  f.featured ? "text-lg md:text-xl" : "text-sm md:text-base"
                )}>
                  "{f.text}"
                </p>
                <div className="mt-auto">
                  <p className="font-bold text-gray-900 text-sm md:text-base">{f.name}</p>
                  <p className="text-[10px] md:text-sm text-gray-500">{f.location} · {f.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instagram Strip */}
        <section className="w-full overflow-x-auto scrollbar-hide py-8 md:py-12">
          <div className="flex gap-3 md:gap-4 px-4 md:px-6 min-w-max">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border border-black/5 shadow-sm">
                <img 
                  src={`https://picsum.photos/seed/ig${i}/200/200`} 
                  alt="Resort Instagram Post" 
                  className="h-full w-full object-cover transition-transform duration-300 cursor-pointer" 
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Cookie Consent Popup */}
      {showCookieConsent && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-4 md:p-6 bg-white/60 md:bg-white/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[25px] border border-black/5 shadow-lg p-6 md:p-8 max-w-md w-full text-center mb-20 md:mb-0">
            <h3 className="text-xl md:text-2xl font-normal mb-3 md:mb-4">Cookie Consent</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 leading-relaxed">
              We use cookies to enhance your experience. By continuing to browse, you agree to our use of cookies.
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
              <Button 
                onClick={() => handleConsent("accepted")}
                className="rounded-full px-8 py-4 md:py-6 bg-primary hover:bg-primary/90 text-white font-bold h-12 md:h-14"
              >
                Accept
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleConsent("declined")}
                className="rounded-full px-8 py-4 md:py-6 h-12 md:h-14"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
