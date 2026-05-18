"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/contexts/language-context";
import { Heart, Star, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useSupabase, useCollection, useStableMemo } from "@/supabase";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Filter } from "lucide-react";
import gsap from "gsap";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  city?: string;
  municipality?: string;
  totalSales?: number;
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
  verified?: boolean;
}

type BrowseTab = "products" | "stores" | "map";

const municipalities = [
  "All",
  "Baco",
  "Bansud",
  "Bongabong",
  "Bulalacao",
  "Calapan City",
  "Gloria",
  "Mansalay",
  "Naujan",
  "Pinamalayan",
  "Pola",
  "Puerto Galera",
  "Roxas",
  "San Teodoro",
  "Socorro",
  "Victoria",
];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const { t } = useLanguage();

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("emoorm_welcome_seen");
      if (!seen) {
        setShowWelcome(true);
        localStorage.setItem("emoorm_welcome_seen", "1");
      }
    }
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab] = useState<BrowseTab>("products");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("cat") || "",
  );
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    const cat = searchParams.get("cat") || "";
    setCategoryFilter(cat);
    setSelectedCategory(cat);
  }, [searchParams]);
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP animations for sticky transition
  useEffect(() => {
    if (!stickyContainerRef.current || !tabPillRef.current) return;

    if (isSticky) {
      // Animate container bg + shadow in
      gsap.to(stickyContainerRef.current, {
        backgroundColor: "rgba(255,255,255,1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        duration: 0.3,
        ease: "power2.out",
      });
      // Animate tab pill bg
      gsap.to(tabPillRef.current, {
        backgroundColor: "#f0f0f0",
        borderRadius: "9999px",
        padding: "4px",
        duration: 0.3,
        ease: "power2.out",
      });
      // Shrink icons
      tabIconsRef.current.forEach((el) => {
        if (el) {
          gsap.to(el, {
            height: 0,
            width: 0,
            opacity: 0,
            marginBottom: 0,
            duration: 0.25,
            ease: "power2.inOut",
          });
        }
      });
    } else {
      // Animate container bg out
      gsap.to(stickyContainerRef.current, {
        backgroundColor: "rgba(255,255,255,0)",
        boxShadow: "0 0px 0px rgba(0,0,0,0)",
        duration: 0.3,
        ease: "power2.out",
      });
      // Reset tab pill
      gsap.to(tabPillRef.current, {
        backgroundColor: "transparent",
        padding: "0px",
        duration: 0.3,
        ease: "power2.out",
      });
      // Expand icons
      tabIconsRef.current.forEach((el) => {
        if (el) {
          gsap.to(el, {
            height: 24,
            width: 24,
            opacity: 1,
            marginBottom: 2,
            duration: 0.25,
            ease: "power2.inOut",
          });
        }
      });
    }
  }, [isSticky]);

  const productsQuery = useStableMemo(() => {
    return { table: "facilities", columns: "* , sold" };
  }, []);

  const storesQuery = useStableMemo(() => {
    return { table: "stores" };
  }, []);

  const { data: productsData, isLoading: isProductsLoading } =
    useCollection<Product>(productsQuery);
  const { data: storesData } = useCollection<StoreItem>(storesQuery);

  const wishlistQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "wishlist",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);

  const { data: wishlistData } = useCollection<{
    id: string;
    productId: string;
  }>(wishlistQuery);

  const wishlistProductIds = useMemo(() => {
    if (!wishlistData) return [];
    return wishlistData.map((w) => w.productId);
  }, [wishlistData]);

  const categories = [
    "All",
    "Vegetables",
    "Fruits",
    "Seafood",
    "Meat",
    "Snacks",
    "Rice & Grains",
    "Handicrafts",
    "Wellness",
    "Delicacies",
  ];

  const [municipality, setMunicipality] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [auctionOnly, setAuctionOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevant");

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.category || f.type || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter
        ? (f.category || f.type) === categoryFilter
        : true;
      const matchesMunicipality =
        municipality === "All" ||
        (f.city || f.municipality || "").toLowerCase() ===
          municipality.toLowerCase();
      const matchesMinPrice =
        !minPrice || (f.price || f.pricePerNight || 0) >= minPrice;
      const matchesMaxPrice =
        !maxPrice || (f.price || f.pricePerNight || 0) <= maxPrice;
      const matchesAuction = !auctionOnly || !!f.isAuction;

      // Check if seller is verified - only show products from verified sellers
      const sellerId = f.sellerId || f.storeId;
      const sellerStore = storesData?.find((s: any) => s.id === sellerId);
      const isVerified = sellerStore?.verified ?? false;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMunicipality &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesAuction &&
        isVerified
      );
    });
  }, [
    productsData,
    searchTerm,
    categoryFilter,
    municipality,
    minPrice,
    maxPrice,
    auctionOnly,
    storesData,
  ]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortBy) {
      case "price_asc":
        return arr.sort(
          (a, b) =>
            (a.price || a.pricePerNight || 0) -
            (b.price || b.pricePerNight || 0),
        );
      case "price_desc":
        return arr.sort(
          (a, b) =>
            (b.price || b.pricePerNight || 0) -
            (a.price || a.pricePerNight || 0),
        );
      case "rating":
        return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "sold":
        return arr.sort(
          (a, b) =>
            (b.sold || b.totalSales || 0) - (a.sold || a.totalSales || 0),
        );
      default:
        return arr;
    }
  }, [filteredProducts, sortBy]);

  // ── Sections for home feed ───────────────────────────────────────────
  const suggestedProducts = useMemo(() => {
    if (!productsData) return [];
    return [...productsData]
      .filter((p) => {
        const sellerId = p.sellerId || p.storeId;
        const sellerStore = storesData?.find((s: any) => s.id === sellerId);
        const isVerified = sellerStore?.verified ?? false;
        return isVerified && ((p.rating ?? 0) >= 4 || (p.sold ?? 0) > 0);
      })
      .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
      .slice(0, 6);
  }, [productsData, storesData]);

  const newArrivals = useMemo(() => {
    if (!productsData) return [];
    return [...productsData]
      .filter((p) => {
        const sellerId = p.sellerId || p.storeId;
        const sellerStore = storesData?.find((s: any) => s.id === sellerId);
        const isVerified = sellerStore?.verified ?? false;
        return isVerified;
      })
      .reverse()
      .slice(0, 6);
  }, [productsData, storesData]);

  const popularStores = useMemo(() => {
    if (!storesData) return [];
    return [...storesData]
      .filter((s) => s.verified)
      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
      .slice(0, 6);
  }, [storesData]);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("cat") || "",
  );

  const isResultsMode = !!searchTerm || !!categoryFilter;

  const navigateCategory = (cat: string) => {
    const next = selectedCategory === cat ? "" : cat;
    const params = new URLSearchParams();
    if (next) params.set("cat", next);
    if (searchTerm) params.set("q", searchTerm);
    router.push(`/?${params.toString()}`);
  };

  const toggleLike = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const isLiked = wishlistProductIds.includes(productId);
    if (isLiked) {
      const item = wishlistData?.find((w) => w.productId === productId);
      if (item) {
        await supabase.from("wishlist").delete().eq("id", item.id);
      }
    } else {
      await supabase.from("wishlist").insert({ userId: user.uid, productId });
    }
    setLikedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((i) => i !== productId)
        : [...prev, productId],
    );
  };

  const isItemLiked = (id: string) =>
    wishlistProductIds.includes(id) || likedIds.includes(id);

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
          onChange={(e) => setMunicipality(e.target.value)}
          className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
        >
          {municipalities.map((m) => (
            <option key={m} value={m}>
              {m === "All" ? "All Municipalities" : m}
            </option>
          ))}
        </select>
      </div>
      {/* Category Filter (for products) */}
      {activeTab === "products" && (
        <div className="mb-4">
          <label className="block text-xs font-bold mb-2">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#f8f8f8] rounded-full py-4 px-6 text-sm outline-none border-none font-medium"
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => c !== "All")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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
              onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
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
              onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
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
            onChange={(e) => setAuctionOnly(e.target.checked)}
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

  if (isUserLoading)
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "#f2f2f0" }}
      >
        <Header />

        {/* Banner skeleton */}
        <div
          className="hidden md:block"
          style={{
            paddingTop: "calc(var(--nav-height) + var(--top-bar-height))",
          }}
        >
          <div className="max-w-[1280px] mx-auto px-8 flex gap-0.5">
            <Skeleton className="flex-[2] h-[360px] rounded-none" />
            <div className="flex-1 flex flex-col gap-0.5">
              <Skeleton className="flex-1 rounded-none" />
              <Skeleton className="flex-1 rounded-none" />
            </div>
          </div>
        </div>

        <main className="flex-grow mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-24 w-full max-w-[1280px]">
          {/* Shop by Category skeleton */}
          <section className="mb-8 md:mb-10">
            <Skeleton className="h-6 w-44 rounded-full mb-4" />
            <div className="flex gap-3 overflow-hidden md:w-full">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 w-[100px] shrink-0 md:flex-1 md:w-auto"
                >
                  <Skeleton className="aspect-square w-full rounded-xl" />
                </div>
              ))}
            </div>
          </section>

          {/* Section heading */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-[5px]" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "#f2f2f0" }}
    >
      <Header />

      {/* Welcome sticker overlay — first visit only */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setShowWelcome(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#444] hover:text-[#111] transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <Image
              src="/assets/stickers/welcome-sticker.png"
              alt="Welcome to Emoorm"
              width={560}
              height={560}
              className="object-contain drop-shadow-2xl select-none"
              priority
            />
          </div>
        </div>
      )}

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      {!isResultsMode && (
        <div
          className="hidden md:block"
          style={{
            paddingTop: "calc(var(--nav-height) + var(--top-bar-height))",
          }}
        >
          <div className="max-w-[1280px] mx-auto px-8 flex gap-0.5">
            <div className="flex-[2] relative h-[360px] overflow-hidden rounded-l-[5px]">
              <Image
                src="/assets/banners/discover-mindoro.png"
                alt="Discover Mindoro"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="relative flex-1 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80"
                  alt="Tropical fruits"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
              <div className="relative flex-1 overflow-hidden rounded-br-[5px]">
                <Image
                  src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80"
                  alt="Local seafood market"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <main
        className={cn(
          "flex-grow mx-auto px-4 md:px-8 pb-24 w-full max-w-[1280px] relative z-10",
          isResultsMode ? "pt-4 md:pt-[130px]" : "pt-6 md:pt-8",
        )}
      >
        {/* ── Shop by Category (home only) ─────────────────────────────── */}
        {!isResultsMode &&
          (() => {
            const categoryImages: Record<string, string> = {
              Vegetables: "/assets/vegetables.jpg",
              Fruits: "/assets/fruits.jpg",
              Seafood: "/assets/seafood.jpg",
              Meat: "/assets/meat.jpg",
              Snacks: "/assets/snacks.jpg",
              "Rice & Grains": "/assets/rice and grains.jpg",
              Handicrafts: "/assets/handicrafts.jpg",
              Wellness: "/assets/wellness.jpg",
              Delicacies: "/assets/delicacies.jpg",
            };
            return (
              <section className="mb-8 md:mb-10">
                <div
                  className="sticky z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 flex items-center gap-4 mb-3"
                  style={{
                    top: "calc(var(--nav-height) + var(--top-bar-height))",
                    backgroundColor: "#f2f2f0",
                  }}
                >
                  <div className="flex-1 h-px bg-primary/40" />
                  <h2 className="text-xl font-headline font-normal tracking-[-0.04em] text-center shrink-0">
                    {t("home.shopByCategory")}
                  </h2>
                  <div className="flex-1 h-px bg-primary/40" />
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
                  <div className="flex gap-3 min-w-max md:min-w-0 md:gap-3 md:w-full">
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => {
                        const active = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => navigateCategory(cat)}
                            className="flex flex-col items-center gap-1.5 w-[100px] shrink-0 md:w-auto md:flex-1"
                          >
                            <div
                              className={cn(
                                "relative w-full aspect-square rounded-xl overflow-hidden transition-all",
                                active
                                  ? "ring-2 ring-primary ring-offset-2"
                                  : "",
                              )}
                            >
                              <Image
                                src={
                                  categoryImages[cat] ||
                                  "/assets/vegetables.jpg"
                                }
                                alt={cat}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-[12px] md:text-[13px] font-medium text-center leading-tight text-foreground">
                              {cat}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </section>
            );
          })()}

        {/* Sentinel for sticky detection */}
        <div ref={stickyRef} className="h-0" />

        {/* Sticky Search + Tabs container */}
        <div
          ref={stickyContainerRef}
          className="sticky top-0 z-30 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-2"
          style={{ backgroundColor: "rgba(255,255,255,0)" }}
        >
          {/* Search Bar — hidden on desktop (moved to header) */}
          <section className="mb-3 md:hidden">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search in Emoorm"
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

          <div className="w-full">
            <section className="mb-10">
              {isMobile ? (
                <Sheet open={showFilter} onOpenChange={setShowFilter}>
                  <SheetContent
                    side="bottom"
                    className="rounded-t-[32px] px-6 pb-8 pt-2 border-none bg-white max-h-[85dvh] overflow-y-auto"
                  >
                    <div className="mx-auto mt-2 mb-4 h-1 w-10 rounded-full bg-muted" />
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-xl font-headline tracking-[-0.03em]">
                        Filter Options
                      </SheetTitle>
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
                        onClick={closeFilter}
                      >
                        ✕
                      </button>
                      <h3 className="text-xl mb-6 font-headline tracking-[-0.03em]">
                        Filter Options
                      </h3>
                      {filterContent}
                    </div>
                  </div>
                )
              )}
            </section>

            <div className="space-y-10 animate-[fadeSlideIn_0.3s_ease-out]">
              {/* ── Suggested For You ─────────────────────────────────────── */}
              {!selectedCategory &&
                !searchTerm &&
                suggestedProducts.length > 0 && (
                  <section>
                    <div
                      className="sticky z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 flex items-center gap-4 mb-3"
                      style={{
                        top: "calc(var(--nav-height) + var(--top-bar-height))",
                        backgroundColor: "#f2f2f0",
                      }}
                    >
                      <div className="flex-1 h-px bg-primary/40" />
                      <h2 className="text-xl font-headline font-normal tracking-[-0.04em] text-center shrink-0">
                        {t("home.suggestedForYou")}
                      </h2>
                      <div className="flex-1 h-px bg-primary/40" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {suggestedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-[5px] overflow-hidden border border-black/[0.06] flex flex-col"
                        >
                          <Link
                            href={`/book/${product.id}`}
                            className="relative block aspect-square overflow-hidden"
                          >
                            <Image
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-2">
                            <Link href={`/book/${product.id}`}>
                              <h3 className="text-sm font-normal leading-snug line-clamp-2 hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="text-[17px] text-primary font-normal leading-none">
                              ₱
                              {(
                                product.price ||
                                product.pricePerNight ||
                                0
                              ).toLocaleString()}
                            </p>
                            {(product.city || product.municipality) && (
                              <span className="text-xs text-[#999] truncate -mt-1">
                                {product.city || product.municipality}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3"
                                    style={{
                                      fill:
                                        i < Math.round(product.rating ?? 0)
                                          ? "#f59e0b"
                                          : "#e5e7eb",
                                      color:
                                        i < Math.round(product.rating ?? 0)
                                          ? "#f59e0b"
                                          : "#e5e7eb",
                                    }}
                                  />
                                ))}
                              </div>
                              {product.rating ? (
                                <span className="text-[11px] text-[#bbb]">
                                  (
                                  {(
                                    product.sold ??
                                    product.totalSales ??
                                    0
                                  ).toLocaleString()}
                                  )
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#ccc]">
                                  No ratings
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* ── Stores Near You ───────────────────────────────────────── */}
              {!selectedCategory && !searchTerm && popularStores.length > 0 && (
                <section>
                  <div
                    className="sticky z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 flex items-center gap-4 mb-3"
                    style={{
                      top: "calc(var(--nav-height) + var(--top-bar-height))",
                      backgroundColor: "#f2f2f0",
                    }}
                  >
                    <div className="flex-1 h-px bg-primary/40" />
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em] text-center shrink-0">
                      {t("home.storesNearYou")}
                    </h2>
                    <div className="flex-1 h-px bg-primary/40" />
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {popularStores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.id}`}
                        className="flex flex-col items-center group"
                      >
                        <div className="w-full aspect-square rounded-full border-2 border-black/[0.06] bg-[#f5f5f5] overflow-hidden group-hover:border-primary/30 transition-all relative">
                          {store.imageUrl ? (
                            <Image
                              src={store.imageUrl}
                              alt={store.name}
                              fill
                              sizes="160px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <span className="text-2xl font-bold text-primary/70">
                                {store.name?.charAt(0)?.toUpperCase() || "S"}
                              </span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-medium line-clamp-1 mt-2 text-center w-full">
                          {store.name}
                        </h4>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-[10px] font-semibold">
                            {store.rating || 5.0}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5 text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="text-[10px] line-clamp-1">
                            {store.city || "Mindoro"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ── New Arrivals ──────────────────────────────────────────── */}
              {!selectedCategory && !searchTerm && newArrivals.length > 0 && (
                <section>
                  <div
                    className="sticky z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 flex items-center gap-4 mb-3"
                    style={{
                      top: "calc(var(--nav-height) + var(--top-bar-height))",
                      backgroundColor: "#f2f2f0",
                    }}
                  >
                    <div className="flex-1 h-px bg-primary/40" />
                    <h2 className="text-xl font-headline font-normal tracking-[-0.04em] text-center shrink-0">
                      {t("home.newArrivals")}
                    </h2>
                    <div className="flex-1 h-px bg-primary/40" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {newArrivals.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-[5px] overflow-hidden border border-black/[0.06] flex flex-col"
                      >
                        <Link
                          href={`/book/${product.id}`}
                          className="relative block aspect-square overflow-hidden"
                        >
                          <Image
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </Link>
                        <div className="p-3 flex flex-col gap-2">
                          <Link href={`/book/${product.id}`}>
                            <div className="flex items-start gap-1.5">
                              <span className="shrink-0 text-[10px] font-bold rounded-[3px] px-1.5 py-0.5 bg-orange-500 text-white mt-[2px]">
                                New
                              </span>
                              <h3 className="text-sm font-normal leading-snug line-clamp-2 hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                            </div>
                          </Link>
                          <p className="text-[17px] text-primary font-normal leading-none">
                            ₱
                            {(
                              product.price ||
                              product.pricePerNight ||
                              0
                            ).toLocaleString()}
                          </p>
                          {(product.city || product.municipality) && (
                            <span className="text-xs text-[#999] truncate -mt-1">
                              {product.city || product.municipality}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3"
                                  style={{
                                    fill:
                                      i < Math.round(product.rating ?? 0)
                                        ? "#f59e0b"
                                        : "#e5e7eb",
                                    color:
                                      i < Math.round(product.rating ?? 0)
                                        ? "#f59e0b"
                                        : "#e5e7eb",
                                  }}
                                />
                              ))}
                            </div>
                            {product.rating ? (
                              <span className="text-[11px] text-[#bbb]">
                                (
                                {(
                                  product.sold ??
                                  product.totalSales ??
                                  0
                                ).toLocaleString()}
                                )
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#ccc]">
                                No ratings
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── All Products / Filtered Results ──────────────────────── */}
              <section>
                {!isResultsMode && (
                  <div
                    className="sticky z-20 -mx-4 px-4 md:-mx-6 md:px-6 py-3 mb-3"
                    style={{
                      top: "calc(var(--nav-height) + var(--top-bar-height))",
                      backgroundColor: "#f2f2f0",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-primary/40" />
                      <h2 className="text-xl font-headline font-normal tracking-[-0.04em] text-center shrink-0">
                        {t("home.discoverProducts")}
                      </h2>
                      <div className="flex-1 h-px bg-primary/40" />
                    </div>
                  </div>
                )}

                {isResultsMode ? (
                  /* ── Results: sidebar + main ───────────────────────── */
                  <div className="flex gap-5 items-start">
                    {/* Filter Sidebar (desktop only) */}
                    <div className="hidden md:block w-[220px] shrink-0">
                      <div
                        className="bg-white rounded-[5px] border border-black/[0.06] p-5 sticky"
                        style={{
                          top: "calc(var(--nav-height) + var(--top-bar-height) + 16px)",
                        }}
                      >
                        <p className="text-sm font-semibold text-[#111] mb-4">
                          {t("filter.filters")}
                        </p>

                        {/* Category */}
                        <div className="mb-4">
                          <p className="text-[11px] font-semibold text-[#999] mb-2">
                            Category
                          </p>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => setCategoryFilter("")}
                              className={cn(
                                "text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                                !categoryFilter
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-[#555] hover:bg-[#f5f5f5]",
                              )}
                            >
                              All
                            </button>
                            {categories
                              .filter((c) => c !== "All")
                              .map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => setCategoryFilter(cat)}
                                  className={cn(
                                    "text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                                    categoryFilter === cat
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-[#555] hover:bg-[#f5f5f5]",
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Price range */}
                        <div className="mb-4 border-t border-black/[0.06] pt-4">
                          <p className="text-[11px] font-semibold text-[#999] mb-2">
                            Price Range
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0}
                              placeholder="Min"
                              value={minPrice || ""}
                              onChange={(e) =>
                                setMinPrice(Number(e.target.value) || 0)
                              }
                              className="w-full text-sm border border-black/10 rounded-md px-2 py-1.5 outline-none focus:border-primary"
                            />
                            <input
                              type="number"
                              min={0}
                              placeholder="Max"
                              value={maxPrice || ""}
                              onChange={(e) =>
                                setMaxPrice(Number(e.target.value) || 0)
                              }
                              className="w-full text-sm border border-black/10 rounded-md px-2 py-1.5 outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Municipality */}
                        <div className="mb-4 border-t border-black/[0.06] pt-4">
                          <p className="text-[11px] font-semibold text-[#999] mb-2">
                            Municipality
                          </p>
                          <select
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            className="w-full text-sm border border-black/10 rounded-md px-2 py-1.5 outline-none focus:border-primary bg-white"
                          >
                            {municipalities.map((m) => (
                              <option key={m} value={m}>
                                {m === "All" ? "All Municipalities" : m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Auction only */}
                        <div className="border-t border-black/[0.06] pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={auctionOnly}
                              onChange={(e) => setAuctionOnly(e.target.checked)}
                              className="accent-primary h-4 w-4 rounded"
                            />
                            <span className="text-sm text-[#555]">
                              Auction only
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Sort bar */}
                      <div className="flex items-center justify-between mb-4 bg-white rounded-[5px] border border-black/[0.06] px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-[#333]">
                          <Search className="h-4 w-4 text-[#29a366] shrink-0" />
                          {t("home.searchResultsFor")} &ldquo;
                          {searchTerm || categoryFilter}&rdquo;
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#555] whitespace-nowrap hidden sm:block">
                            {t("sort.label")}
                          </span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm border border-black/10 rounded-md px-3 py-1.5 outline-none focus:border-primary bg-white"
                          >
                            <option value="relevant">
                              {t("sort.relevant")}
                            </option>
                            <option value="price_asc">
                              {t("sort.priceAsc")}
                            </option>
                            <option value="price_desc">
                              {t("sort.priceDesc")}
                            </option>
                            <option value="rating">{t("sort.rating")}</option>
                            <option value="sold">{t("sort.sold")}</option>
                          </select>
                        </div>
                      </div>

                      {/* Product grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {isProductsLoading ? (
                          <>
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                className="bg-white rounded-[5px] overflow-hidden"
                              >
                                <Skeleton className="aspect-square w-full rounded-none" />
                                <div className="p-2.5 space-y-1.5">
                                  <Skeleton className="h-3 w-3/4 rounded-full" />
                                  <Skeleton className="h-3 w-1/2 rounded-full" />
                                  <Skeleton className="h-3.5 w-1/3 rounded-full" />
                                </div>
                              </div>
                            ))}
                          </>
                        ) : sortedProducts.length === 0 ? (
                          <div className="col-span-full text-center py-20 text-muted-foreground italic">
                            {t("home.noProducts")}
                          </div>
                        ) : (
                          sortedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="bg-white rounded-[5px] overflow-hidden border border-black/[0.06] flex flex-col"
                            >
                              <Link
                                href={`/book/${product.id}`}
                                className="relative block aspect-square overflow-hidden"
                              >
                                <Image
                                  src={product.imageUrl || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </Link>
                              <div className="p-3 flex flex-col gap-2">
                                <Link href={`/book/${product.id}`}>
                                  <div className="flex items-start gap-1.5">
                                    {product.isAuction && (
                                      <span className="shrink-0 text-[10px] font-bold rounded-[3px] px-1.5 py-0.5 bg-orange-500 text-white mt-[2px]">
                                        Auction
                                      </span>
                                    )}
                                    <h3 className="text-sm font-normal leading-snug line-clamp-2 hover:text-primary transition-colors">
                                      {product.name}
                                    </h3>
                                  </div>
                                </Link>
                                <p className="text-[17px] text-primary font-normal leading-none">
                                  {product.isAuction
                                    ? `₱${(product.currentBid || product.startingBid || 0).toLocaleString()}`
                                    : `₱${(product.price || product.pricePerNight || 0).toLocaleString()}`}
                                </p>
                                {(product.city || product.municipality) && (
                                  <span className="text-xs text-[#999] truncate -mt-1">
                                    {product.city || product.municipality}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className="h-3 w-3"
                                        style={{
                                          fill:
                                            i < Math.round(product.rating ?? 0)
                                              ? "#f59e0b"
                                              : "#e5e7eb",
                                          color:
                                            i < Math.round(product.rating ?? 0)
                                              ? "#f59e0b"
                                              : "#e5e7eb",
                                        }}
                                      />
                                    ))}
                                  </div>
                                  {product.rating ? (
                                    <span className="text-[11px] text-[#bbb]">
                                      (
                                      {(
                                        product.sold ??
                                        product.totalSales ??
                                        0
                                      ).toLocaleString()}
                                      )
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#ccc]">
                                      No ratings
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Home: normal 6-col grid ───────────────────────── */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {isProductsLoading ? (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-[5px] overflow-hidden"
                          >
                            <Skeleton className="aspect-square w-full rounded-none" />
                            <div className="p-2.5 space-y-1.5">
                              <Skeleton className="h-3 w-3/4 rounded-full" />
                              <Skeleton className="h-3 w-1/2 rounded-full" />
                              <Skeleton className="h-3.5 w-1/3 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : filteredProducts.length === 0 ? (
                      <div className="col-span-full text-center py-20 text-muted-foreground italic">
                        {t("home.noProducts")}
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-[5px] overflow-hidden border border-black/[0.06] flex flex-col"
                        >
                          <Link
                            href={`/book/${product.id}`}
                            className="relative block aspect-square overflow-hidden"
                          >
                            <Image
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <div className="p-3 flex flex-col gap-2">
                            <Link href={`/book/${product.id}`}>
                              <div className="flex items-start gap-1.5">
                                {product.isAuction && (
                                  <span className="shrink-0 text-[10px] font-bold rounded-[3px] px-1.5 py-0.5 bg-orange-500 text-white mt-[2px]">
                                    Auction
                                  </span>
                                )}
                                <h3 className="text-sm font-normal leading-snug line-clamp-2 hover:text-primary transition-colors">
                                  {product.name}
                                </h3>
                              </div>
                            </Link>
                            <p className="text-[17px] text-primary font-normal leading-none">
                              {product.isAuction
                                ? `₱${(product.currentBid || product.startingBid || 0).toLocaleString()}`
                                : `₱${(product.price || product.pricePerNight || 0).toLocaleString()}`}
                            </p>
                            {(product.city || product.municipality) && (
                              <span className="text-xs text-[#999] truncate -mt-1">
                                {product.city || product.municipality}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3"
                                    style={{
                                      fill:
                                        i < Math.round(product.rating ?? 0)
                                          ? "#f59e0b"
                                          : "#e5e7eb",
                                      color:
                                        i < Math.round(product.rating ?? 0)
                                          ? "#f59e0b"
                                          : "#e5e7eb",
                                    }}
                                  />
                                ))}
                              </div>
                              {product.rating ? (
                                <span className="text-[11px] text-[#bbb]">
                                  (
                                  {(
                                    product.sold ??
                                    product.totalSales ??
                                    0
                                  ).toLocaleString()}
                                  )
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#ccc]">
                                  No ratings
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
