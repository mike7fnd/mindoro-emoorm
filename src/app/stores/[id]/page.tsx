"use client";

import React, { use, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Star, MapPin, Heart, ArrowLeft, Store as StoreIcon, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoc, useCollection, useStableMemo, useUser, useSupabase } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StoreData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  coverUrl?: string;
  category: string;
  city: string;
  barangay?: string;
  street?: string;
  province: string;
  rating: number;
  totalSales: number;
  followerCount: number;
  ownerId: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  pricePerNight?: number;
  imageUrl: string;
  rating?: number;
  category?: string;
  type?: string;
  stock: number;
  isAuction?: boolean;
  currentBid?: number;
  startingBid?: number;
}

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();

  const storeRef = useStableMemo(() => {
    return { table: "stores", id };
  }, [id]);

  const { data: store, isLoading: storeLoading } = useDoc<StoreData>(storeRef);

  const productsQuery = useStableMemo(() => {
    return { table: "facilities", filters: [{ column: "storeId", op: "eq", value: id }] };
  }, [id]);

  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  // Check if current user follows this store
  const followQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "store_followers", filters: [{ column: "storeId", op: "eq", value: id }, { column: "userId", op: "eq", value: user.uid }] };
  }, [user, id]);

  const { data: followData } = useCollection<{ id: string }>(followQuery);
  const isFollowing = (followData?.length || 0) > 0;

  const handleFollow = async () => {
    if (!user) { router.push("/login"); return; }
    if (isFollowing && followData?.[0]) {
      await supabase.from("store_followers").delete().eq("id", followData[0].id);
    } else {
      await supabase.from("store_followers").insert({ storeId: id, userId: user.uid });
    }
  };

  if (storeLoading) return null;
  if (!store) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-32 pb-24 text-center">
        <p className="text-muted-foreground">Store not found.</p>
        <Link href="/stores" className="text-primary font-bold mt-4 inline-block">Browse stores</Link>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[1480px]">
        {/* Back Button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-black transition-colors mt-4 md:mt-0 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Store Header */}
        <div className="rounded-[25px] overflow-hidden shadow-sm bg-[#f8f8f8] mb-8">
          <div className="relative h-48 md:h-64 bg-muted">
            {store.coverUrl ? (
              <Image src={store.coverUrl} alt={store.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
          </div>
          <div className="p-6 md:p-8 -mt-12 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden shrink-0">
                {store.imageUrl ? (
                  <Image src={store.imageUrl} alt={store.name} width={96} height={96} className="object-cover h-full w-full" />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <StoreIcon className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-headline font-normal tracking-[-0.03em] mb-1">{store.name}</h1>
                <p className="text-sm text-muted-foreground mb-3">{store.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-bold">{store.rating || 5.0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{[store.barangay, store.city, store.province].filter(Boolean).join(", ") || "Oriental Mindoro"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{store.followerCount || 0} followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{store.totalSales || 0} sold</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleFollow}
                className={cn(
                  "rounded-full px-8 py-5 font-bold text-sm h-12 shrink-0",
                  isFollowing
                    ? "bg-[#f8f8f8] text-black hover:bg-black/10 border border-black/10"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </div>

        {/* Store Products */}
        <h2 className="text-xl font-headline font-normal tracking-[-0.03em] mb-6">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 md:gap-y-12">
          {productsLoading ? (
            <div className="col-span-full text-center py-20 text-muted-foreground italic">Loading products...</div>
          ) : !products || products.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground italic">This store hasn&apos;t listed any products yet.</div>
          ) : products.map((product) => (
            <div key={product.id} className="flex flex-col gap-1.5 md:gap-2">
              <Link href={`/book/${product.id}`}>
                <div className="relative aspect-square overflow-hidden rounded-[25px] shadow-sm">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  {product.isAuction && (
                    <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Auction</div>
                  )}
                </div>
              </Link>
              <div className="px-1">
                <div className="flex justify-between items-center mb-0.5">
                  <Link href={`/book/${product.id}`}>
                    <h3 className="text-lg font-normal font-headline tracking-[-0.05em] line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-xs font-bold">{product.rating || 5.0}</span>
                  </div>
                </div>
                <p className="text-primary font-bold text-base">
                  {product.isAuction
                    ? `₱${(product.currentBid || product.startingBid || 0).toLocaleString()}`
                    : `₱${(product.price || product.pricePerNight || 0).toLocaleString()}`
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
