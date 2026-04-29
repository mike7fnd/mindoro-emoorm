"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Heart, Star, Search, Store, Tag, Map, Sparkles, MapPin, Clock, ChevronRight, Flame, Leaf, Fish, Drumstick, Cookie, Wheat, Wine, Droplets, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";

const MindoroStoreMap = dynamic(() => import("@/components/mindoro-store-map"), { ssr: false });
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser, useSupabase, useCollection, useStableMemo, useDoc } from "@/supabase";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Filter } from "lucide-react";
import gsap from "gsap";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";


interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  description: string;
  imageUrl: string;
  rating?: number;
  status: string;
  sellerId?: string;
  sellerName?: string;
  storeId?: string;
  isAuction?: boolean;
  auctionEndDate?: string;
  currentBid?: number;
  startingBid?: number;
  bidCount?: number;
  type?: string;
  pricePerNight?: number;
  sold?: number;
}

interface StoreItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  coverUrl?: string;
  category: string;
  city: string;
  rating: number;
  totalSales: number;
  followerCount: number;
  ownerId: string;
  latitude?: number;
  longitude?: number;
}

type BrowseTab = "products" | "stores" | "map";

const municipalities = [
  "All",
  "Baco", "Bansud", "Bongabong", "Bulalacao", "Calapan City", "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas", "San Teodoro", "Socorro", "Victoria"
];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();

  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [activeTab, setActiveTab] = useState<BrowseTab>("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const tabIconsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tabPillRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const sentinel = stickyRef.current;
      if (!sentinel) return;
      const rect = sentinel.getBoundingClientRect();
      setIsSticky(rect.top <= 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP animations for sticky transition
  useEffect(() => {
    if (!stickyContainerRef.current || !tabPillRef.current) return;

    if (isSticky) {
      // Animate container bg + shadow in
      gsap.to(stickyContainerRef.current, {
        backgroundColor: 'rgba(255,255,255,1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        duration: 0.3,
        ease: 'power2.out'
      });
      // Animate tab pill bg
      gsap.to(tabPillRef.current, {
        backgroundColor: '#f0f0f0',
        borderRadius: '9999px',
        padding: '4px',
        duration: 0.3,
        ease: 'power2.out'
      });
      // Shrink icons
      tabIconsRef.current.forEach(el => {
        if (el) {
          gsap.to(el, {
            height: 0,
            width: 0,
            opacity: 0,
            marginBottom: 0,
            duration: 0.25,
            ease: 'power2.inOut'
          });
        }
      });
    } else {
      // Animate container bg out
      gsap.to(stickyContainerRef.current, {
        backgroundColor: 'rgba(255,255,255,0)',
        boxShadow: '0 0px 0px rgba(0,0,0,0)',
        duration: 0.3,
        ease: 'power2.out'
      });
      // Reset tab pill
      gsap.to(tabPillRef.current, {
        backgroundColor: 'transparent',
        padding: '0px',
        duration: 0.3,
        ease: 'power2.out'
      });
      // Expand icons
      tabIconsRef.current.forEach(el => {
        if (el) {
          gsap.to(el, {
            height: 24,
            width: 24,
            opacity: 1,
            marginBottom: 2,
            duration: 0.25,
            ease: 'power2.inOut'
          });
        }
      });
    }
  }, [isSticky]);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleConsent = (choice: "accepted" | "declined") => {
    localStorage.setItem("cookieConsent", choice);
    setShowCookieConsent(false);
  };

  const productsQuery = useStableMemo(() => {
    return { table: "facilities", columns: "* , sold" };
  }, []);

  const storesQuery = useStableMemo(() => {
    return { table: "stores" };
  }, []);

  const { data: productsData, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);
  const { data: storesData, isLoading: isStoresLoading } = useCollection<StoreItem>(storesQuery);

  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const wishlistQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "wishlist", filters: [{ column: "userId", op: "eq", value: user.uid }] };
  }, [user]);

  const { data: wishlistData } = useCollection<{ id: string; productId: string }>(wishlistQuery);

  const wishlistProductIds = useMemo(() => {
    if (!wishlistData) return [];
    return wishlistData.map(w => w.productId);
  }, [wishlistData]);

  const categories = ["All", "Vegetables", "Fruits", "Seafood", "Meat", "Snacks", "Rice & Grains", "Handicrafts", "Wellness", "Delicacies"];

  const [municipality, setMunicipality] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [auctionOnly, setAuctionOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.category || f.type || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter ? (f.category || f.type) === categoryFilter : true;
      const matchesMunicipality = municipality === "All" || (f.city || f.municipality || "").toLowerCase() === municipality.toLowerCase();
      const matchesMinPrice = !minPrice || (f.price || f.pricePerNight || 0) >= minPrice;
      const matchesMaxPrice = !maxPrice || (f.price || f.pricePerNight || 0) <= maxPrice;
      const matchesAuction = !auctionOnly || !!f.isAuction;
      
      // Check if seller is verified - only show products from verified sellers
      const sellerId = f.sellerId || f.storeId;
      const sellerStore = storesData?.find((s: any) => s.id === sellerId);
      const isVerified = sellerStore?.verified ?? false;
      
      return matchesSearch && matchesCategory && matchesMunicipality && matchesMinPrice && matchesMaxPrice && matchesAuction && isVerified;
    });
  }, [productsData, searchTerm, categoryFilter, municipality, minPrice, maxPrice, auctionOnly, storesData]);

  const filteredStores = useMemo(() => {
    if (!storesData) return [];
    if (!searchTerm && municipality === "All") return storesData.filter(s => s.verified);
    return storesData.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMunicipality = municipality === "All" || (s.city || "").toLowerCase() === municipality.toLowerCase();
      return matchesSearch && matchesMunicipality && s.verified;
    });
  }, [storesData, searchTerm, municipality]);

  // ── Sections for home feed ───────────────────────────────────────────
  const suggestedProducts = useMemo(() => {
    if (!productsData) return [];
    return [...productsData]
      .filter(p => {
        const sellerId = p.sellerId || p.storeId;
        const sellerStore = storesData?.find((s: any) => s.id === sellerId);
        const isVerified = sellerStore?.verified ?? false;
        return isVerified && ((p.rating ?? 0) >= 4 || (p.sold ?? 0) > 0);
      })
      .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
      .slice(0, 8);
  }, [productsData, storesData]);

  const newArrivals = useMemo(() => {
    if (!productsData) return [];
    return [...productsData]
      .filter(p => {
        const sellerId = p.sellerId || p.storeId;
        const sellerStore = storesData?.find((s: any) => s.id === sellerId);
        const isVerified = sellerStore?.verified ?? false;
        return isVerified;
      })
      .reverse()
      .slice(0, 8);
  }, [productsData, storesData]);

  const popularStores = useMemo(() => {
    if (!storesData) return [];
    return [...storesData]
      .filter(s => s.verified)
      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
      .slice(0, 6);
  }, [storesData]);

  const categoryIcons: Record<string, React.ReactNode> = {
    "Vegetables": <Leaf className="h-5 w-5" />,
    "Fruits": <Flame className="h-5 w-5" />,
    "Seafood": <Fish className="h-5 w-5" />,
    "Meat": <Drumstick className="h-5 w-5" />,
    "Snacks": <Cookie className="h-5 w-5" />,
    "Rice & Grains": <Wheat className="h-5 w-5" />,
    "Beverages": <Wine className="h-5 w-5" />,
    "Condiments": <Droplets className="h-5 w-5" />,
    "Handicrafts": <ShoppingBag className="h-5 w-5" />,
    "Wellness": <Sparkles className="h-5 w-5" />,
    "Delicacies": <Cookie className="h-5 w-5" />,
  };

  const [selectedCategory, setSelectedCategory] = useState("");

  const toggleLike = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const isLiked = wishlistProductIds.includes(productId);
    if (isLiked) {
      const item = wishlistData?.find(w => w.productId === productId);
      if (item) {
        await supabase.from("wishlist").delete().eq("id", item.id);
      }
    } else {
      await supabase.from("wishlist").insert({ userId: user.uid, productId });
    }
    setLikedIds(prev => prev.includes(productId) ? prev.filter(i => i !== productId) : [...prev, productId]);
  };

  const isItemLiked = (id: string) => wishlistProductIds.includes(id) || likedIds.includes(id);



  const openFilter = () => {
    setShowFilter(true);
  };
  const closeFilter = () => {
    setShowFilter(false);
  };

  const filterPillRef = useRef<HTMLButtonElement | null>(null);

  const filterContent = (
    <>
      {/* Municipality Filter */}
      <div className="mb-4">
        <label className="block text-xs font-bold mb-2">Municipality</label>
        <select
          value={municipality}
          onChange={e => setMunicipality(e.target.value)}
          className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
        >
          {municipalities.map(m => (
            <option key={m} value={m}>{m === "All" ? "All Municipalities" : m}</option>
          ))}
        </select>
      </div>
      {/* Category Filter (for products) */}
      {activeTab === "products" && (
        <div className="mb-4">
          <label className="block text-xs font-bold mb-2">Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
          >
            <option value="">All Categories</option>
            {categories.filter(c => c !== "All").map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}
      {/* Price Range Filter */}
      {activeTab === "products" && (
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold mb-2">Min Price</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
              value={minPrice || ""}
              onChange={e => setMinPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold mb-2">Max Price</label>
            <input
              type="number"
              min={0}
              placeholder="Any"
              className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
              value={maxPrice || ""}
              onChange={e => setMaxPrice(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      )}
      {/* Auction Only Filter */}
      {activeTab === "products" && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="auctionOnly"
            checked={auctionOnly}
            onChange={e => setAuctionOnly(e.target.checked)}
            className="accent-primary h-4 w-4 rounded"
          />
          <label htmlFor="auctionOnly">Auction items only</label>
        </div>
      )}
      <button
        className="w-full bg-primary text-white py-4 rounded-full mt-4 shadow-md text-sm tracking-tight font-bold"
        onClick={closeFilter}
      >
        Apply Filters
      </button>
    </>
  );

  if (isUserLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="absolute top-0 left-0 w-full h-[160px] bg-gradient-to-b from-green-700/75 via-green-600/25 via-50% to-transparent pointer-events-none z-0" />
      <main className="flex-grow container mx-auto px-6 pt-0 md:pt-32 pb-24 max-w-[1480px]">
        <div className="mt-8 md:mt-0 space-y-4 mb-10">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-5 w-72 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-full mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-[32px]" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );

  const firstName = user ? (userProfile?.firstName || user.displayName?.split(" ")[0] || "Shopper") : null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      {/* Green gradient from top */}
      <div className="absolute top-0 left-0 w-full h-[160px] bg-gradient-to-b from-green-700/75 via-green-600/25 via-50% to-transparent pointer-events-none z-0" />
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[1480px] relative z-10">
        <div className="mb-10 mt-8 md:mt-0">
          <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em] leading-tight text-green-800">
            {firstName ? `Hi, ${firstName}!` : "E-Moorm"} <br />
            <span className="text-black">discover local products.</span>
          </h1>
        </div>

        {/* Sentinel for sticky detection */}
        <div ref={stickyRef} className="h-0" />

        {/* Sticky Search + Tabs container */}
        <div
          ref={stickyContainerRef}
          className="sticky top-0 z-30 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-2"
          style={{ backgroundColor: 'rgba(255,255,255,0)' }}
        >
          {/* Search Bar */}
          <section className="mb-3">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={activeTab === "stores" ? "Search stores..." : "Search products..."}
                  className="w-full bg-white rounded-full py-5 pl-14 pr-6 text-sm md:text-base outline-none shadow-sm border-none font-medium transition-all focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Mobile filter pill */}
                {isMobile && (
                  <button
                    ref={filterPillRef}
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2 rounded-full bg-[#f4f4f4] hover:bg-primary/10 transition-all text-primary font-medium z-20"
                    onClick={openFilter}
                    aria-label="Open filters"
                  >
                    <Filter className="h-5 w-5" />
                    Filter
                  </button>
                )}
              </div>
              {/* Desktop filter icon */}
              {!isMobile && (
                <button
                  type="button"
                  className="flex items-center justify-center h-[52px] w-[52px] rounded-full bg-white shadow-sm border border-black/10 hover:bg-primary/10 transition-all"
                  onClick={openFilter}
                  aria-label="Open filters"
                >
                  <Filter className="h-6 w-6 text-primary" />
                </button>
              )}
            </div>
          </section>

          {/* Browse Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BrowseTab)} className="w-full">
            <div className="flex justify-center">
              <TabsList className="w-full bg-[#f4f4f4] p-1.5 h-14 rounded-full">
                {([
                  { key: "products" as BrowseTab, label: "Products", icon: Tag },
                  { key: "stores" as BrowseTab, label: "Stores", icon: Store },
                  { key: "map" as BrowseTab, label: "Map", icon: Map },
                ]).map(({ key, label, icon: Icon }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex-1 rounded-full h-11 text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

        <section className="mb-10">
          {isMobile ? (
            <Sheet open={showFilter} onOpenChange={setShowFilter}>
              <SheetContent side="bottom" className="rounded-t-[32px] px-6 pb-8 pt-2 border-none bg-white max-h-[85dvh] overflow-y-auto">
                <div className="mx-auto mt-2 mb-4 h-1 w-10 rounded-full bg-muted" />
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-xl font-headline tracking-[-0.03em]">Filter Options</SheetTitle>
                </SheetHeader>
                {filterContent}
              </SheetContent>
            </Sheet>
          ) : (
            showFilter && (
              <div
                className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all p-8"
                onClick={closeFilter}
              >
                <div
                  className="bg-white rounded-[32px] shadow-2xl w-full max-w-[420px] p-8 relative"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
                    onClick={closeFilter}
                  >
                    ✕
                  </button>
                  <h3 className="text-xl mb-6 font-headline tracking-[-0.03em]">Filter Options</h3>
                  {filterContent}
                </div>
              </div>
            )
          )}
        </section>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-10 animate-[fadeSlideIn_0.3s_ease-out]">

            {/* ── Category Filter Chips ─────────────────────────────────── */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2 pb-1 min-w-max">
                <button
                  onClick={() => { setSelectedCategory(""); setCategoryFilter(""); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                    !selectedCategory
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-black/70 border-black/10 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  <Tag className="h-4 w-4" />
                  All
                </button>
                {categories.filter(c => c !== "All").map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      const next = selectedCategory === cat ? "" : cat;
                      setSelectedCategory(next);
                      setCategoryFilter(next);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                      selectedCategory === cat
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-black/70 border-black/10 hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    {categoryIcons[cat] || <Tag className="h-4 w-4" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Suggested For You ─────────────────────────────────────── */}
            {!selectedCategory && !searchTerm && suggestedProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">Suggested for You</h2>
                  </div>
                  <button
                    onClick={() => { setSelectedCategory(""); setCategoryFilter(""); }}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-4 min-w-max pb-2">
                    {suggestedProducts.map(product => (
                      <div key={product.id} className="w-[170px] md:w-[210px] shrink-0 flex flex-col gap-1.5">
                        <Link href={`/book/${product.id}`}>
                          <div className="relative aspect-square overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02]">
                            <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                            <button
                              onClick={(e) => toggleLike(e, product.id)}
                              className={cn(
                                "absolute top-2 right-2 z-10 p-3 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 transition-all",
                                isItemLiked(product.id) && "bg-white/40"
                              )}
                            >
                              <Heart className={cn("h-5 w-5 transition-all", isItemLiked(product.id) ? "fill-white text-white scale-110" : "text-white")} />
                            </button>
                          </div>
                        </Link>
                        <div className="px-1">
                          <Link href={`/book/${product.id}`}>
                            <h3 className="text-sm font-normal font-headline tracking-[-0.03em] line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-[11px] font-bold">{product.rating || 5.0}</span>
                            <span className="text-[11px] text-muted-foreground">· {(product.sold ?? product.totalSales ?? 0)} Sold</span>
                          </div>
                          <p className="text-primary font-bold text-sm mt-0.5">₱{(product.price || product.pricePerNight || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Stores Near You ───────────────────────────────────────── */}
            {!selectedCategory && !searchTerm && popularStores.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">Stores Near You</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("stores")}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-6 min-w-max pb-2">
                    {popularStores.map(store => (
                      <Link key={store.id} href={`/stores/${store.id}`} className="flex flex-col items-center w-[120px] shrink-0 group">
                        <div className="h-[120px] w-[120px] rounded-full border-2 border-black/[0.06] bg-[#f5f5f5] shadow-sm overflow-hidden group-hover:shadow-md group-hover:border-primary/20 transition-all relative">
                          {store.imageUrl ? (
                            <Image src={store.imageUrl} alt={store.name} fill sizes="120px" className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <span className="text-2xl font-bold text-primary/70">{store.name?.charAt(0)?.toUpperCase() || "S"}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-medium line-clamp-1 mt-2 text-center w-full">{store.name}</h4>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-[10px] font-semibold">{store.rating || 5.0}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5 text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="text-[10px] line-clamp-1">{store.city || "Mindoro"}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── New Arrivals ──────────────────────────────────────────── */}
            {!selectedCategory && !searchTerm && newArrivals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">New Arrivals</h2>
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-4 min-w-max pb-2">
                    {newArrivals.map(product => (
                      <div key={product.id} className="w-[170px] md:w-[210px] shrink-0 flex flex-col gap-1.5">
                        <Link href={`/book/${product.id}`}>
                          <div className="relative aspect-square overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02]">
                            <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                            <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                              New
                            </div>
                            <button
                              onClick={(e) => toggleLike(e, product.id)}
                              className={cn(
                                "absolute top-2 right-2 z-10 p-3 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 transition-all",
                                isItemLiked(product.id) && "bg-white/40"
                              )}
                            >
                              <Heart className={cn("h-5 w-5 transition-all", isItemLiked(product.id) ? "fill-white text-white scale-110" : "text-white")} />
                            </button>
                          </div>
                        </Link>
                        <div className="px-1">
                          <Link href={`/book/${product.id}`}>
                            <h3 className="text-sm font-normal font-headline tracking-[-0.03em] line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-[11px] font-bold">{product.rating || 5.0}</span>
                            <span className="text-[11px] text-muted-foreground">· {(product.sold ?? product.totalSales ?? 0)} Sold</span>
                          </div>
                          <p className="text-primary font-bold text-sm mt-0.5">₱{(product.price || product.pricePerNight || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── All Products / Filtered Results ──────────────────────── */}
            <section>
              {(selectedCategory || searchTerm) && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">
                    {selectedCategory || "Search Results"}
                  </h2>
                  <span className="text-xs text-muted-foreground">{filteredProducts.length} items</span>
                </div>
              )}
              {!selectedCategory && !searchTerm && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">All Products</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{filteredProducts.length} items</span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-12">
                {isProductsLoading ? (
                  <>{Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-[32px]" />
                      <Skeleton className="h-4 w-3/4 rounded-full" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                  ))}</>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-muted-foreground italic">No products found.</div>
                ) : filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col gap-1.5 md:gap-2">
                    <Link href={`/book/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02]">
                        <Image
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          data-ai-hint="local product food"
                        />
                        {product.isAuction && (
                          <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                            Auction
                          </div>
                        )}
                        <button
                          onClick={(e) => toggleLike(e, product.id)}
                          className={cn(
                            "absolute top-2 right-2 z-10 p-3 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 transition-all",
                            isItemLiked(product.id) && "bg-white/40"
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5 transition-all",
                              isItemLiked(product.id) ? "fill-white text-white scale-110" : "text-white"
                            )}
                          />
                        </button>
                      </div>
                    </Link>
                    <div className="px-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <Link href={`/book/${product.id}`}>
                          <h3 className="text-lg md:text-xl font-normal font-headline tracking-[-0.05em] line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span className="text-xs font-bold">{product.rating || 5.0}</span>
                          <span className="mx-1 text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground font-medium">{(product.sold ?? product.totalSales ?? 0)} Sold</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <span>{product.city || product.municipality || "Unknown Location"}</span>
                        </div>
                        <p className="text-primary font-bold text-base">
                          {product.isAuction
                            ? `₱${(product.currentBid || product.startingBid || 0).toLocaleString()}`
                            : `₱${(product.price || product.pricePerNight || 0).toLocaleString()}`
                          }
                        </p>
                      </div>
                      {product.isAuction && product.bidCount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">{product.bidCount} bid{product.bidCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeSlideIn_0.3s_ease-out]">
            {isStoresLoading ? (
              <>{Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[32px] overflow-hidden border border-black/[0.02] bg-[#f8f8f8]">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-5 -mt-8 relative">
                    <Skeleton className="h-16 w-16 rounded-full mb-3" />
                    <Skeleton className="h-5 w-40 rounded-full mb-2" />
                    <Skeleton className="h-3 w-full rounded-full mb-2" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-3 w-12 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}</>
            ) : filteredStores.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">No stores found. Be the first to open a store!</div>
            ) : filteredStores.map((store) => (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <div className="rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all bg-[#f8f8f8]">
                  <div className="relative h-32 bg-muted">
                    {store.coverUrl ? (
                      <Image src={store.coverUrl} alt={store.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                  <div className="p-5 -mt-8 relative">
                    <div className="h-16 w-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden mb-3">
                      {store.imageUrl ? (
                        <Image src={store.imageUrl} alt={store.name} width={64} height={64} className="object-cover h-full w-full" />
                      ) : (
                        <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-headline font-normal tracking-[-0.03em] mb-1">{store.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{store.description || "Local store from Oriental Mindoro"}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="font-bold">{store.rating || 5.0}</span>
                      </div>
                      <span>{store.city || "Oriental Mindoro"}</span>
                      <span>{store.followerCount || 0} followers</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="mb-6">
              <h2 className="text-xl font-headline font-normal tracking-[-0.04em] mb-1">Discover Stores in Mindoro</h2>
              <p className="text-sm text-muted-foreground">Explore local shops pinned on the map. Tap a marker to see shop details.</p>
            </div>
            <MindoroStoreMap
              stores={(storesData || []).map(s => ({
                id: s.id,
                name: s.name,
                imageUrl: s.imageUrl,
                category: s.category,
                city: s.city,
                latitude: s.latitude || 0,
                longitude: s.longitude || 0,
              }))}
              isLoading={isStoresLoading}
            />
          </TabsContent>
        </Tabs>
        </div>
      </main>
      <Footer />

      {showCookieConsent && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-4 md:p-6 bg-white/60 md:bg-white/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[25px] border border-black/5 shadow-lg p-6 md:p-8 max-w-md w-full text-center mb-20 md:mb-0">
            <h3 className="text-xl md:text-2xl font-normal mb-3 md:mb-4">Cookie Consent</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 leading-relaxed">
              We use cookies to enhance your shopping experience. By continuing to browse, you agree to our use of cookies.
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
