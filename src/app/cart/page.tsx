"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShoppingCart, Trash2, Plus, Minus, Store } from "lucide-react";
import { useUser, useSupabase, useCollection, useStableMemo } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    return { table: "cart_items", filters: [{ column: "userId", op: "eq", value: user.uid }] };
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

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price || item.product.pricePerNight || 0) * item.quantity, 0);
  }, [cartItems]);

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

  if (isUserLoading) return null;

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
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
        <div className="mb-10 mt-8 md:mt-0">
          <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em] leading-tight">
            My Cart
          </h1>
          <p className="text-muted-foreground mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
        </div>

        {cartLoading ? (
          <div className="text-center py-20 text-muted-foreground italic">Loading cart...</div>
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
            {Object.entries(groupedByStore).map(([storeKey, group]) => (
              <div key={storeKey} className="mb-6">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{group.storeName}</span>
                </div>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-[25px] bg-[#f8f8f8]">
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Fixed checkout bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 shadow-2xl p-4 md:pb-4 pb-[calc(var(--bottom-nav-height)+16px)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total ({cartItems.length} items)</p>
              <p className="text-2xl font-bold text-primary">₱{totalPrice.toLocaleString()}</p>
            </div>
            <Button
              onClick={() => router.push("/checkout")}
              className="rounded-full px-10 py-6 bg-black text-white font-bold text-sm h-14 hover:bg-primary transition-all"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
