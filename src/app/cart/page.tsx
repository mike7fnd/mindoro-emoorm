"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShoppingCart, Trash2, Plus, Minus, Store, MoreVertical, Heart, Share2, Archive, Tag, HelpCircle, Check } from "lucide-react";
import { FirstTimeIntro } from "@/components/first-time-intro";
import { useUser, useSupabase, useCollection, useStableMemo } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  pricePerNight?: number;
  imageUrl: string;
  stock: number;
  storeId?: string;
  sellerId?: string;
  sellerName?: string;
}

interface StoreData {
  id: string;
  name: string;
}

export default function CartPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  const cartQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "cart_items", filters: [{ column: "userId", op: "eq" as const, value: user.uid }] };
  }, [user]);

  const { data: cartData, isLoading: cartLoading } = useCollection<CartItem>(cartQuery);

  const productsQuery = useStableMemo(() => {
    return { table: "facilities" };
  }, []);

  const { data: productsData } = useCollection<Product>(productsQuery);

  const storesQuery = useStableMemo(() => {
    return { table: "stores" };
  }, []);

  const { data: storesData } = useCollection<StoreData>(storesQuery);

  const cartItems = useMemo(() => {
    if (!cartData || !productsData) return [];
    return cartData.map(c => {
      const product = productsData.find(p => p.id === c.productId);
      return product ? { ...c, product } : null;
    }).filter(Boolean) as (CartItem & { product: Product })[];
  }, [cartData, productsData]);

  // Group by store/seller
  const groupedByStore = useMemo(() => {
    const groups: Record<string, { storeName: string; items: typeof cartItems }> = {};
    cartItems.forEach(item => {
      const key = item.product.storeId || item.product.sellerId || "independent";
      if (!groups[key]) {
        const store = storesData?.find(s => s.id === item.product.storeId);
        groups[key] = { storeName: store?.name || item.product.sellerName || "Independent Seller", items: [] };
      }
      groups[key].items.push(item);
    });
    return groups;
  }, [cartItems, storesData]);

  // --- Selection state ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-select all items when cart loads / changes
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedIds((prev) => {
        // Keep existing selections that are still valid, add new items
        const validIds = new Set(cartItems.map((i) => i.id));
        const next = new Set<string>();
        // If no previous selection, select all
        if (prev.size === 0) {
          return validIds;
        }
        prev.forEach((id) => { if (validIds.has(id)) next.add(id); });
        return next;
      });
    }
  }, [cartItems]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleStoreGroup = useCallback((itemIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = itemIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        itemIds.forEach((id) => next.delete(id));
      } else {
        itemIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = cartItems.length > 0 && cartItems.every((i) => prev.has(i.id));
      return allSelected ? new Set<string>() : new Set(cartItems.map((i) => i.id));
    });
  }, [cartItems]);

  const selectedItems = useMemo(() => cartItems.filter((i) => selectedIds.has(i.id)), [cartItems, selectedIds]);

  const totalPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.product.price || item.product.pricePerNight || 0) * item.quantity, 0);
  }, [selectedItems]);

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await supabase.from("cart_items").delete().eq("id", cartItemId);
    } else {
      await supabase.from("cart_items").update({ quantity, updatedAt: new Date().toISOString() }).eq("id", cartItemId);
    }
  };

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
  };

  if (isUserLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-0 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
        <div className="p-6 md:p-8">
          <Skeleton className="h-7 w-32 rounded-full mb-2" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="px-6 md:px-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-[25px] border border-black/[0.02]">
              <Skeleton className="h-24 w-24 rounded-[20px] shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-[1480px]">
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-headline font-normal tracking-[-0.03em] mb-2">Your Cart</h2>
            <p className="text-muted-foreground mb-6">Sign in to start shopping.</p>
            <Link href="/login">
              <Button className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">Sign In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-0 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
        <div className="p-6 md:p-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {cartItems.length > 0 && (
              <button
                onClick={toggleAll}
                className={`flex items-center justify-center h-6 w-6 rounded-lg border-2 transition-all shrink-0 ${cartItems.length > 0 && cartItems.every((i) => selectedIds.has(i.id))
                    ? "bg-primary border-primary text-white"
                    : "border-black/20 dark:border-white/20 hover:border-primary/50"
                  }`}
              >
                {cartItems.length > 0 && cartItems.every((i) => selectedIds.has(i.id)) && <Check className="h-3.5 w-3.5" />}
              </button>
            )}
            <div>
              <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] dark:text-white">
                My Cart
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">{selectedIds.size}/{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} selected</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted/50 rounded-full transition-colors outline-none mt-0.5">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/30 backdrop-blur-xl dark:bg-black/30">
              <DropdownMenuLabel className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Cart Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
              <DropdownMenuItem
                className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3"
                onClick={() => router.push('/my-bookings')}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">My Orders</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">Move All to Wishlist</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Archive className="h-4 w-4" />
                <span className="text-sm font-medium">Save for Later</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors gap-3">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share Cart</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10" />
              <DropdownMenuItem
                className="rounded-xl px-4 py-3 cursor-pointer focus:bg-red-50 focus:text-red-600 transition-colors gap-3 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-bold">Clear Cart</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-6 md:px-8">
          {cartLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-[25px] border border-black/[0.02]">
                  <Skeleton className="h-24 w-24 rounded-[20px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty.</p>
              <Link href="/">
                <Button className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="max-w-3xl">
              {Object.entries(groupedByStore).map(([storeKey, group]) => {
                const groupItemIds = group.items.map((i) => i.id);
                const allGroupSelected = groupItemIds.every((id) => selectedIds.has(id));
                return (
                  <div key={storeKey} className="mb-6">
                    <div className="flex items-center gap-3 mb-4 px-1">
                      <button
                        onClick={() => toggleStoreGroup(groupItemIds)}
                        className={`flex items-center justify-center h-5 w-5 rounded-md border-2 transition-all shrink-0 ${allGroupSelected
                            ? "bg-primary border-primary text-white"
                            : "border-black/20 dark:border-white/20 hover:border-primary/50"
                          }`}
                      >
                        {allGroupSelected && <Check className="h-3 w-3" />}
                      </button>
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{group.storeName}</span>
                    </div>
                    <div className="space-y-4">
                      {group.items.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <div key={item.id} className={`flex gap-4 p-4 rounded-[25px] transition-all ${isSelected ? "bg-[#f8f8f8]" : "bg-[#f8f8f8]/50 opacity-60"
                            }`}>
                            <button
                              onClick={() => toggleItem(item.id)}
                              className={`flex items-center justify-center h-5 w-5 rounded-md border-2 transition-all shrink-0 mt-2 ${isSelected
                                  ? "bg-primary border-primary text-white"
                                  : "border-black/20 dark:border-white/20 hover:border-primary/50"
                                }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                            <Link href={`/book/${item.product.id}`}>
                              <div className="h-24 w-24 rounded-[15px] overflow-hidden shrink-0">
                                <Image src={item.product.imageUrl} alt={item.product.name} width={96} height={96} className="object-cover h-full w-full" />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/book/${item.product.id}`}>
                                <h3 className="text-base font-headline font-normal tracking-[-0.03em] line-clamp-1 hover:text-primary transition-colors">{item.product.name}</h3>
                              </Link>
                              <p className="text-primary font-bold text-base mt-1">₱{(item.product.price || item.product.pricePerNight || 0).toLocaleString()}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-0 bg-white rounded-full shadow-sm">
                                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:text-primary transition-colors">
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:text-primary transition-colors">
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">₱{((item.product.price || item.product.pricePerNight || 0) * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Fixed checkout bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 shadow-2xl p-4 md:pb-4 pb-[calc(var(--bottom-nav-height)+16px)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className={`flex items-center justify-center h-5 w-5 rounded-md border-2 transition-all shrink-0 ${cartItems.every((i) => selectedIds.has(i.id))
                    ? "bg-primary border-primary text-white"
                    : "border-black/20 hover:border-primary/50"
                  }`}
              >
                {cartItems.every((i) => selectedIds.has(i.id)) && <Check className="h-3 w-3" />}
              </button>
              <div>
                <p className="text-xs text-muted-foreground">Total ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</p>
                <p className="text-2xl font-bold text-primary">₱{totalPrice.toLocaleString()}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (selectedItems.length === 0) return;
                localStorage.setItem("checkout_selected_ids", JSON.stringify(Array.from(selectedIds)));
                router.push("/checkout");
              }}
              disabled={selectedItems.length === 0}
              className="rounded-full px-10 py-6 bg-black text-white font-bold text-sm h-14 hover:bg-primary transition-all disabled:opacity-40"
            >
              Checkout ({selectedItems.length})
            </Button>
          </div>
        </div>
      )}
      <FirstTimeIntro
        storageKey="cart"
        title="Your Cart"
        description="Review items you've added, adjust quantities, and proceed to checkout when you're ready. Items are grouped by store for easy ordering."
        icon={<ShoppingCart className="h-7 w-7" />}
      />
      <Footer />
    </div>
  );
}
