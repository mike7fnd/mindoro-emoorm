"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCityBySlug, MINDORO_CITIES } from "@/lib/mindoro-cities-data";
import {
  MapPin,
  ChevronLeft,
  Heart,
  Star,
  Clock,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  useSupabase,
  useCollection,
  useStableMemo,
} from "@/supabase";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useUser } from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";

const MindoroStoreMap = dynamic(
  () => import("@/components/mindoro-store-map"),
  { ssr: false }
);

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
  productType?: "normal" | "wholesale";
  minimumBulkQuantity?: number;
  bulkPricePerUnit?: number;
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

// Placeholder images for gallery - in production, these could come from a database
const PLACEHOLDER_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500382017468-f049863256f0?w=400&h=400&fit=crop",
];

export default function ExploreLocationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const city = getCityBySlug(slug);
  const { user } = useUser();
  const supabase = useSupabase();

  const [likedIds, setLikedIds] = useState<string[]>([]);

  const productsQuery = useStableMemo(() => {
    return { table: "facilities", columns: "* , sold" };
  }, []);

  const storesQuery = useStableMemo(() => {
    return { table: "stores" };
  }, []);

  const { data: allProducts, isLoading: isProductsLoading } =
    useCollection<Product>(productsQuery);

  const { data: allStores, isLoading: isStoresLoading } =
    useCollection<StoreItem>(storesQuery);

  // Filter products by city name
  const cityProducts = useMemo(() => {
    if (!allProducts || !city) return [];
    return allProducts
      .filter(p => {
        const productCity = (p.city || p.municipality || "").toLowerCase();
        const cityName = city.displayName.toLowerCase();
        return productCity === cityName || productCity.includes(city.displayName.split(" ")[0].toLowerCase());
      })
      .filter(p => {
        const storeId = p.sellerId || p.storeId;
        const store = allStores?.find(s => s.id === storeId);
        return store?.verified ?? false;
      })
      .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
      .slice(0, 6);
  }, [allProducts, allStores, city]);

  // Filter stores by city name
  const cityStores = useMemo(() => {
    if (!allStores || !city) return [];
    return allStores
      .filter(s => {
        const storeCity = (s.city || "").toLowerCase();
        const cityName = city.displayName.toLowerCase();
        return storeCity === cityName || storeCity.includes(city.displayName.split(" ")[0].toLowerCase());
      })
      .filter(s => s.verified)
      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0));
  }, [allStores, city]);

  const toggleLike = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setLikedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    try {
      const isLiked = likedIds.includes(productId);
      if (isLiked) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("productId", productId)
          .eq("userId", user.uid);
      } else {
        await supabase
          .from("wishlist")
          .insert({ userId: user.uid, productId });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (!city) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 md:px-6 pt-8 md:pt-32 pb-24 max-w-[1480px]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-2">
                Location Not Found
              </h1>
              <p className="text-muted-foreground mb-6">
                Sorry, we couldn't find this location.
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-4 pb-24 max-w-[1480px]">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary font-medium hover:underline mb-6 mt-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="relative h-[300px] md:h-[400px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] mb-8 md:mb-12">
          <Image
            src={city.imageUrl}
            alt={city.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-headline font-normal tracking-[-0.05em] text-white mb-2">
              {city.displayName}
            </h1>
            <p className="text-base md:text-lg text-white/90">
              {city.longDescription}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8 md:space-y-10">
            {/* Overview Section */}
            <section>
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-4">
                About {city.displayName}
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                {city.longDescription}
              </p>
            </section>

            {/* Map Section */}
            <section>
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-4">
                Location Map
              </h2>
              <div className="rounded-[32px] overflow-hidden shadow-md h-[300px] border border-black/[0.02]">
                <MindoroStoreMap
                  stores={cityStores.map(s => ({
                    id: s.id,
                    name: s.name,
                    imageUrl: s.imageUrl,
                    category: s.category,
                    city: s.city,
                    latitude: s.latitude || city.latitude,
                    longitude: s.longitude || city.longitude,
                  }))}
                  isLoading={isStoresLoading}
                />
              </div>
            </section>

            {/* Gallery Section */}
            <section>
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-4">
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PLACEHOLDER_GALLERY_IMAGES.map((imageSrc, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-[24px] overflow-hidden shadow-md border border-black/[0.02] hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <Image
                      src={imageSrc}
                      alt={`${city.displayName} gallery ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  </div>
                ))}
              </div>
            </section>

            {/* Highlights Section */}
            <section>
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-4">
                Top Attractions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {city.touristSpots.slice(0, 4).map((spot, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-[20px] bg-[#f8f8f8] border border-black/[0.05]"
                  >
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                    </div>
                    <div>
                      <h3 className="font-headline font-normal text-base mb-1">
                        {spot}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Discover this popular destination in {city.displayName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Local Products Section */}
            <section>
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em] mb-4">
                Local Specialties
              </h2>
              <div className="flex flex-wrap gap-2">
                {city.localProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    {product}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-8">
            {/* Quick Facts Card */}
            <div className="p-6 rounded-[24px] bg-[#f8f8f8] border border-black/[0.05]">
              <h3 className="text-lg font-headline font-normal tracking-[-0.03em] mb-4">
                Quick Facts
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Coordinates
                  </p>
                  <p className="text-sm font-medium">
                    {city.latitude.toFixed(4)}°N, {city.longitude.toFixed(4)}°E
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Stores
                  </p>
                  <p className="text-sm font-medium">{cityStores.length} verified stores</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Products
                  </p>
                  <p className="text-sm font-medium">{cityProducts.length} local products</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <Link href="/?activeTab=products">
              <button className="w-full px-6 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all shadow-sm">
                Shop Local Products
              </button>
            </Link>
          </div>
        </div>

        {/* Products in This Area */}
        {cityProducts.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em]">
                Products in This Area
              </h2>
              <Link href="/">
                <span className="text-xs text-primary font-medium hover:underline">
                  See all
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {isProductsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-[32px]" />
                      <Skeleton className="h-4 w-3/4 rounded-full" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                  ))
                : cityProducts.map(product => (
                    <div key={product.id} className="flex flex-col gap-2">
                      <Link href={`/book/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] group">
                          <Image
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {product.productType === "wholesale" && (
                            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-amber-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                              Wholesale
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleLike(e, product.id)}
                            className={cn(
                              "absolute top-2 right-2 z-10 p-3 bg-white/20 backdrop-blur-xl rounded-full hover:bg-white/40 transition-all",
                              likedIds.includes(product.id) && "bg-white/40"
                            )}
                          >
                            <Heart
                              className={cn(
                                "h-5 w-5 transition-all",
                                likedIds.includes(product.id)
                                  ? "fill-white text-white scale-110"
                                  : "text-white"
                              )}
                            />
                          </button>
                        </div>
                      </Link>
                      <div className="px-1">
                        <Link href={`/book/${product.id}`}>
                          <h3 className="text-sm font-normal font-headline tracking-[-0.03em] line-clamp-1 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-[11px] font-bold">
                            {product.rating || 5.0}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            · {(product.sold ?? 0)} Sold
                          </span>
                        </div>
                        <p className="text-primary font-bold text-sm mt-0.5">
                          ₱
                          {(
                            product.price ||
                            product.pricePerNight ||
                            0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* Stores in This Area */}
        {cityStores.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-headline font-normal tracking-[-0.05em]">
                Stores in {city.displayName}
              </h2>
              <Link href="/">
                <span className="text-xs text-primary font-medium hover:underline">
                  See all
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isStoresLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-[32px] overflow-hidden border border-black/[0.02] bg-[#f8f8f8]"
                    >
                      <Skeleton className="h-32 w-full" />
                      <div className="p-5 -mt-8 relative">
                        <Skeleton className="h-16 w-16 rounded-full mb-3" />
                        <Skeleton className="h-5 w-40 rounded-full mb-2" />
                        <Skeleton className="h-3 w-full rounded-full mb-2" />
                      </div>
                    </div>
                  ))
                : cityStores.map(store => (
                    <Link key={store.id} href={`/stores/${store.id}`}>
                      <div className="rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all bg-[#f8f8f8]">
                        <div className="relative h-32 bg-muted">
                          {store.coverUrl ? (
                            <Image
                              src={store.coverUrl}
                              alt={store.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                          )}
                        </div>
                        <div className="p-5 -mt-8 relative">
                          <div className="h-16 w-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden mb-3">
                            {store.imageUrl ? (
                              <Image
                                src={store.imageUrl}
                                alt={store.name}
                                width={64}
                                height={64}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary">
                                S
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-headline font-normal tracking-[-0.03em] mb-1">
                            {store.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {store.description || "Local store"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="font-bold">
                                {store.rating || 5.0}
                              </span>
                            </div>
                            <span>{store.followerCount || 0} followers</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
