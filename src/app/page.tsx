"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Heart, Star, Search, Store, Tag, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser, useSupabase, useCollection, useStableMemo, useDoc } from "@/supabase";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Filter } from "lucide-react";
import gsap from "gsap";

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
}

type BrowseTab = "products" | "stores" | "deals";

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
  const isMobile = useIsMobile();

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
    return { table: "facilities" };
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
      return matchesSearch && matchesCategory && matchesMunicipality && matchesMinPrice && matchesMaxPrice && matchesAuction;
    });
  }, [productsData, searchTerm, categoryFilter, municipality, minPrice, maxPrice, auctionOnly]);

  const dealProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter(f => f.isAuction || (f.price && f.pricePerNight && f.price < f.pricePerNight));
  }, [productsData]);

  const filteredStores = useMemo(() => {
    if (!storesData) return [];
    if (!searchTerm && municipality === "All") return storesData;
    return storesData.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMunicipality = municipality === "All" || (s.city || "").toLowerCase() === municipality.toLowerCase();
      return matchesSearch && matchesMunicipality;
    });
  }, [storesData, searchTerm, municipality]);

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

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 120 });
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const idx = ["products", "stores", "deals"].indexOf(activeTab);
    const btn = tabRefs.current[idx];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const parentRect = btn.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setIndicatorStyle({ left: rect.left - parentRect.left, width: rect.width });
      }
    }
  }, [activeTab]);

  const openFilter = () => {
    setShowFilter(true);
    if (isMobile && filterPillRef.current && filterCardRef.current) {
      const pillRect = filterPillRef.current.getBoundingClientRect();
      const card = filterCardRef.current;
      gsap.set(card, {
        x: pillRect.left,
        y: pillRect.top,
        width: pillRect.width,
        height: pillRect.height,
        opacity: 0.7,
        borderRadius: 999,
        scale: 1,
      });
      gsap.to(card, {
        x: 0,
        y: 0,
        width: '100vw',
        height: 'auto',
        opacity: 1,
        borderRadius: 32,
        scale: 1,
        duration: 0.55,
        ease: "power3.out"
      });
    }
  };
  const closeFilter = () => {
    setShowFilter(false);
  };

  const filterPillRef = useRef<HTMLButtonElement | null>(null);
  const filterCardRef = useRef<HTMLDivElement | null>(null);

  if (isUserLoading) return null;

  const firstName = user ? (userProfile?.firstName || user.displayName?.split(" ")[0] || "Shopper") : null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[1480px]">
        <div className="mb-10 mt-8 md:mt-0">
          <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em] leading-tight">
            {firstName ? `Hi, ${firstName}!` : "E-Moorm"} <br />
            <span className="text-muted-foreground">discover local products.</span>
          </h1>
        </div>

        {/* Browse Tabs - Centered Slider Style with Mobile Support and Aligned Indicator */}
        <div className="relative w-full overflow-x-auto scrollbar-hide mb-6">
          <div className="flex gap-2 min-w-[340px] md:min-w-0 px-1 relative justify-center md:justify-center">
            {([
              { key: "products" as BrowseTab, label: "Products", icon: Tag },
              { key: "stores" as BrowseTab, label: "Stores", icon: Store },
              { key: "deals" as BrowseTab, label: "Deals", icon: TrendingDown },
            ]).map(({ key, label, icon: Icon }, idx) => (
              <button
                key={key}
                ref={el => tabRefs.current[idx] = el}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap relative z-10",
                  activeTab === key
                    ? "text-primary"
                    : "text-black/70 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            {/* Slider Indicator */}
            <div
              ref={indicatorRef}
              className="absolute bottom-0 h-1 rounded-full bg-primary transition-all duration-300 z-0"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          </div>
        </div>

        <section className="mb-10">
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
          {/* Filter Popover/Modal/Card */}
          {showFilter && (
            <div
              className={cn(
                "fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all",
                isMobile ? "p-0" : "p-8"
              )}
              onClick={closeFilter}
            >
              <div
                ref={filterCardRef}
                className={cn(
                  "bg-white rounded-[32px] shadow-2xl w-full max-w-[420px] p-8 relative",
                  isMobile && "rounded-[32px] h-auto max-w-[95vw] p-6"
                )}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
                  onClick={closeFilter}
                >
                  ✕
                </button>
                <h3 className="text-xl mb-6">Filter Options</h3>
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
                  className="w-full bg-primary text-white py-4 rounded-full mt-4 shadow-md text-sm tracking-tight"
                  onClick={closeFilter}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-12">
            {isProductsLoading ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">Finding local products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">No products found.</div>
            ) : filteredProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-1.5 md:gap-2">
                <Link href={`/book/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-[25px] shadow-sm">
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
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-xs font-bold">{product.rating || 5.0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-muted">
                          <img src={`https://i.pravatar.cc/100?u=${product.id}${i}`} alt="Buyer" className="h-full w-full object-cover" />
                        </div>
                      ))}
                      <div className="h-7 w-7 rounded-full border-2 border-white bg-primary/10 text-primary text-[8px] flex items-center justify-center font-bold">15+</div>
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
        )}

        {/* Stores Tab */}
        {activeTab === "stores" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isStoresLoading ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">Finding local stores...</div>
            ) : filteredStores.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">No stores found. Be the first to open a store!</div>
            ) : filteredStores.map((store) => (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <div className="rounded-[25px] overflow-hidden shadow-sm hover:shadow-md transition-all bg-[#f8f8f8]">
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
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === "deals" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-12">
            {isProductsLoading ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">Finding deals...</div>
            ) : dealProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground italic">No deals available right now. Check back soon!</div>
            ) : dealProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-1.5 md:gap-2">
                <Link href={`/book/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-[25px] shadow-sm">
                    <Image
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      data-ai-hint="local product deal"
                    />
                    <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {product.isAuction ? "Auction" : "Sale"}
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
                  <h3 className="text-lg font-normal font-headline tracking-[-0.05em] line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-xs font-bold">{product.rating || 5.0}</span>
                    </div>
                    <p className="text-primary font-bold text-base">₱{(product.price || product.currentBid || product.startingBid || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
