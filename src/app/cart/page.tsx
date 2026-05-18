"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  Check,
  ChevronRight,
} from "lucide-react";
import { FirstTimeIntro } from "@/components/first-time-intro";
import { useUser, useSupabase, useCollection, useStableMemo } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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
    return {
      table: "cart_items",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: cartData, isLoading: cartLoading } =
    useCollection<CartItem>(cartQuery);

  const productsQuery = useStableMemo(() => ({ table: "facilities" }), []);
  const { data: productsData } = useCollection<Product>(productsQuery);

  const storesQuery = useStableMemo(() => ({ table: "stores" }), []);
  const { data: storesData } = useCollection<StoreData>(storesQuery);

  const cartItems = useMemo(() => {
    if (!cartData || !productsData) return [];
    return cartData
      .map((c) => {
        const product = productsData.find((p) => p.id === c.productId);
        return product ? { ...c, product } : null;
      })
      .filter(Boolean) as (CartItem & { product: Product })[];
  }, [cartData, productsData]);

  const groupedByStore = useMemo(() => {
    const groups: Record<
      string,
      { storeName: string; items: typeof cartItems }
    > = {};
    cartItems.forEach((item) => {
      const key =
        item.product.storeId || item.product.sellerId || "independent";
      if (!groups[key]) {
        const store = storesData?.find((s) => s.id === item.product.storeId);
        groups[key] = {
          storeName:
            store?.name || item.product.sellerName || "Independent Seller",
          items: [],
        };
      }
      groups[key].items.push(item);
    });
    return groups;
  }, [cartItems, storesData]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedIds((prev) => {
        const validIds = new Set(cartItems.map((i) => i.id));
        if (prev.size === 0) return validIds;
        const next = new Set<string>();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
    }
  }, [cartItems]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      const allSelected =
        cartItems.length > 0 && cartItems.every((i) => prev.has(i.id));
      return allSelected
        ? new Set<string>()
        : new Set(cartItems.map((i) => i.id));
    });
  }, [cartItems]);

  const selectedItems = useMemo(
    () => cartItems.filter((i) => selectedIds.has(i.id)),
    [cartItems, selectedIds],
  );
  const totalPrice = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum +
          (item.product.price || item.product.pricePerNight || 0) *
            item.quantity,
        0,
      ),
    [selectedItems],
  );

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await supabase.from("cart_items").delete().eq("id", cartItemId);
    } else {
      await supabase
        .from("cart_items")
        .update({ quantity, updatedAt: new Date().toISOString() })
        .eq("id", cartItemId);
    }
  };

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
  };

  if (isUserLoading)
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "#f2f2f0" }}
      >
        <Header />
        <main className="flex-grow pt-6">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-40 space-y-4">
            <div className="bg-white rounded-[5px] border border-black/[0.06] px-6 py-5">
              <Skeleton className="h-6 w-28 rounded mb-1.5" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[5px] border border-black/[0.06] p-4 flex gap-4"
              >
                <Skeleton className="h-20 w-20 rounded-[5px] shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );

  if (!user)
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "#f2f2f0" }}
      >
        <Header />
        <main className="flex-grow pt-6">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-24">
            <div className="bg-white rounded-[5px] border border-black/[0.06] py-20 flex flex-col items-center text-center gap-4">
              <ShoppingCart
                className="h-14 w-14 text-[#ddd]"
                strokeWidth={1.5}
              />
              <div>
                <h2 className="text-lg font-semibold text-[#111] mb-1">
                  Your Cart
                </h2>
                <p className="text-sm text-[#888]">
                  Sign in to start shopping.
                </p>
              </div>
              <Link href="/login">
                <button
                  className="h-10 px-8 rounded-[5px] text-white text-sm font-semibold"
                  style={{ background: "#29a366" }}
                >
                  Sign In
                </button>
              </Link>
            </div>
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
      <main className="flex-grow pt-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-40 space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-[#999]">
            <Link href="/" className="hover:text-[#29a366] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-[#555]">My Cart</span>
          </nav>

          {/* Header */}
          <div className="bg-white rounded-[5px] border border-black/[0.06] px-6 py-5 flex items-center gap-3">
            {cartItems.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center justify-center h-5 w-5 rounded border-2 transition-all shrink-0"
                style={
                  cartItems.every((i) => selectedIds.has(i.id))
                    ? { background: "#29a366", borderColor: "#29a366" }
                    : { borderColor: "rgba(0,0,0,0.2)" }
                }
              >
                {cartItems.every((i) => selectedIds.has(i.id)) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-[#111]">My Cart</h1>
              <p className="text-sm text-[#888]">
                {selectedIds.size}/{cartItems.length} item
                {cartItems.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>

          {cartLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[5px] border border-black/[0.06] p-4 flex gap-4"
                >
                  <Skeleton className="h-20 w-20 rounded-[5px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-[5px] border border-black/[0.06] py-20 flex flex-col items-center text-center gap-4">
              <ShoppingCart
                className="h-14 w-14 text-[#ddd]"
                strokeWidth={1.5}
              />
              <p className="text-sm text-[#888]">Your cart is empty.</p>
              <Link href="/">
                <button
                  className="h-10 px-8 rounded-[5px] text-white text-sm font-semibold"
                  style={{ background: "#29a366" }}
                >
                  Browse Products
                </button>
              </Link>
            </div>
          ) : (
            <div className="max-w-3xl space-y-3">
              {Object.entries(groupedByStore).map(([storeKey, group]) => {
                const groupItemIds = group.items.map((i) => i.id);
                const allGroupSelected = groupItemIds.every((id) =>
                  selectedIds.has(id),
                );
                return (
                  <div
                    key={storeKey}
                    className="bg-white rounded-[5px] border border-black/[0.06] overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.05]">
                      <button
                        onClick={() => toggleStoreGroup(groupItemIds)}
                        className="flex items-center justify-center h-5 w-5 rounded border-2 transition-all shrink-0"
                        style={
                          allGroupSelected
                            ? { background: "#29a366", borderColor: "#29a366" }
                            : { borderColor: "rgba(0,0,0,0.2)" }
                        }
                      >
                        {allGroupSelected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <Store className="h-4 w-4 text-[#bbb]" />
                      <span className="text-sm font-semibold text-[#333]">
                        {group.storeName}
                      </span>
                    </div>

                    <div className="divide-y divide-black/[0.04]">
                      {group.items.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`flex gap-4 p-4 transition-all ${isSelected ? "" : "opacity-50"}`}
                          >
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="flex items-center justify-center h-5 w-5 rounded border-2 transition-all shrink-0 mt-2"
                              style={
                                isSelected
                                  ? {
                                      background: "#29a366",
                                      borderColor: "#29a366",
                                    }
                                  : { borderColor: "rgba(0,0,0,0.2)" }
                              }
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </button>
                            <Link href={`/book/${item.product.id}`}>
                              <div className="h-20 w-20 rounded-[5px] overflow-hidden shrink-0 border border-black/[0.06]">
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  width={80}
                                  height={80}
                                  className="object-cover h-full w-full"
                                />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/book/${item.product.id}`}>
                                <h3 className="text-sm font-medium text-[#111] line-clamp-2 hover:text-[#29a366] transition-colors">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <p
                                className="text-sm font-semibold mt-1"
                                style={{ color: "#29a366" }}
                              >
                                ₱
                                {(
                                  item.product.price ||
                                  item.product.pricePerNight ||
                                  0
                                ).toLocaleString()}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-0 bg-[#f2f2f0] rounded-[5px] border border-black/[0.08]">
                                  <button
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity - 1)
                                    }
                                    className="p-1.5 hover:text-[#29a366] transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold text-[#111]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    className="p-1.5 hover:text-[#29a366] transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-1.5 text-[#ccc] hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-[#111]">
                                ₱
                                {(
                                  (item.product.price ||
                                    item.product.pricePerNight ||
                                    0) * item.quantity
                                ).toLocaleString()}
                              </p>
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

      {/* Checkout bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/[0.06] shadow-lg p-4 pb-[calc(var(--bottom-nav-height)+16px)] md:pb-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="flex items-center justify-center h-5 w-5 rounded border-2 transition-all shrink-0"
                style={
                  cartItems.every((i) => selectedIds.has(i.id))
                    ? { background: "#29a366", borderColor: "#29a366" }
                    : { borderColor: "rgba(0,0,0,0.2)" }
                }
              >
                {cartItems.every((i) => selectedIds.has(i.id)) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>
              <div>
                <p className="text-xs text-[#888]">
                  Total ({selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""})
                </p>
                <p className="text-xl font-bold" style={{ color: "#29a366" }}>
                  ₱{totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedItems.length === 0) return;
                localStorage.setItem(
                  "checkout_selected_ids",
                  JSON.stringify(Array.from(selectedIds)),
                );
                router.push("/checkout");
              }}
              disabled={selectedItems.length === 0}
              className="h-11 px-8 rounded-[5px] text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: "#29a366" }}
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </div>
      )}

      <FirstTimeIntro
        storageKey="cart"
        title="Your Cart"
        description="Review items you've added, adjust quantities, and proceed to checkout when you're ready."
        icon={<ShoppingCart className="h-7 w-7" />}
      />
      <Footer />
    </div>
  );
}
