"use client";

import React from "react";
import { useUser, useCollection, useStableMemo } from "@/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Star, ShoppingCart, Heart } from "lucide-react";
import { FirstTimeIntro } from "@/components/first-time-intro";


const MyWishlistPage = () => {
  const { user, isUserLoading } = useUser();
  const supabase = require('@/supabase').useSupabase();

  const wishlistQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "wishlist", filters: [{ column: "userId", op: "eq", value: user.uid }] };
  }, [user]);
  const { data: wishlistData, isLoading: wishlistLoading } = useCollection(wishlistQuery);

  const facilitiesQuery = useStableMemo(() => {
    return { table: "facilities" };
  }, []);
  const { data: facilities } = useCollection(facilitiesQuery);

  const wishlistProducts = React.useMemo(() => {
    if (!wishlistData || !facilities) return [];
    return (wishlistData as any[]).map((w: any) => {
      const product = facilities.find((f: any) => f.id === w.productId);
      return product ? { ...product, wishlistId: w.id } : null;
    }).filter(Boolean);
  }, [wishlistData, facilities]);

  const removeFromWishlist = async (wishlistId: string) => {
    await supabase.from("wishlist").delete().eq("id", wishlistId);
    window.location.reload();
  };

  const addToCart = async (productId: string) => {
    if (!user) return;
    await supabase.from("cart_items").upsert({ userId: user.uid, productId, quantity: 1 }, { onConflict: "userId,productId" });
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow container mx-auto px-0 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
          <div className="p-6 md:p-8">
            <div className="h-7 w-32 rounded-full mb-2 bg-gray-200 animate-pulse" />
            <div className="h-4 w-20 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="px-6 md:px-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-[25px] border border-black/[0.02]">
                <div className="h-24 w-24 rounded-[20px] shrink-0 bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-gray-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-[1480px]">
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-headline font-normal tracking-[-0.03em] mb-2">My Wishlist</h2>
            <p className="text-muted-foreground mb-6">Sign in to view your wishlist.</p>
            <Link href="/login">
              <Button className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">Sign In</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow container mx-auto px-0 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
        <div className="p-6 md:p-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] dark:text-white">
              My Wishlist
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="px-6 md:px-8">
        {wishlistLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-[25px] border border-black/[0.02]">
                <div className="h-24 w-24 rounded-[20px] shrink-0 bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-gray-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Link href="/">
              <Button className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="space-y-4">
              {wishlistProducts.map((product: any) => (
                <div key={product.id} className="flex gap-4 p-4 rounded-[25px] bg-[#f8f8f8]">
                  <Link href={`/book/${product.id}`}>
                    <div className="h-24 w-24 rounded-[15px] overflow-hidden shrink-0">
                      <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} width={96} height={96} className="object-cover h-full w-full" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/book/${product.id}`}>
                      <h3 className="text-base font-headline font-normal tracking-[-0.03em] line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-primary font-bold text-base mt-1">₱{(product.price || product.pricePerNight || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Button onClick={() => addToCart(product.id)} className="rounded-full px-6 py-2 bg-black text-white font-bold text-xs h-8 hover:bg-primary transition-all gap-1">
                        <ShoppingCart className="h-4 w-4" /> Add to Cart
                      </Button>
                      <button onClick={() => removeFromWishlist(product.wishlistId)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>
      <FirstTimeIntro
        storageKey="wishlist"
        title="Your Wishlist"
        description="Save products you love and come back to them anytime. Tap the cart icon to quickly add items to your shopping cart."
        icon={<Heart className="h-7 w-7" />}
      />
    </div>
  );
};

export default MyWishlistPage;
