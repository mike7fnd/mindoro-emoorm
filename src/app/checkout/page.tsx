"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MapPin, CreditCard, CheckCircle2, ArrowLeft, ArrowRight, Store, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useSupabase, useCollection, useStableMemo, useDoc, addDocumentNonBlocking } from "@/supabase";
import type { FilterOp } from "@/supabase/use-collection";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
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

interface UserProfile {
  firstName: string;
  lastName: string;
  mobile: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  addresses?: Array<{
    label: string;
    fullName: string;
    mobile: string;
    province: string;
    city: string;
    barangay: string;
    street: string;
  }>;
}

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  // Address book
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number>(0);
  const [newAddress, setNewAddress] = useState({
    label: "",
    fullName: "",
    mobile: "",
    province: "Oriental Mindoro",
    city: "",
    barangay: "",
    street: "",
  });
  const [showAddAddress, setShowAddAddress] = useState(false);

  const cartQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "cart_items", filters: [{ column: "userId", op: 'eq' as FilterOp, value: user.uid }] };
  }, [user]);

  const { data: cartData } = useCollection<CartItem>(cartQuery);

  const productsQuery = useStableMemo(() => {
    return { table: "facilities" };
  }, []);

  const { data: productsData } = useCollection<Product>(productsQuery);

  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Address book logic
  const [addressBook, setAddressBook] = useState<UserProfile["addresses"]>([]);
  React.useEffect(() => {
    if (userProfile) {
      // Use addresses array if exists, else fallback to profile address
      if (userProfile.addresses && userProfile.addresses.length > 0) {
        setAddressBook(userProfile.addresses);
      } else {
        setAddressBook([
          {
            label: "Default",
            fullName: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
            mobile: userProfile.mobile || "",
            province: userProfile.province || "Oriental Mindoro",
            city: userProfile.city || "",
            barangay: userProfile.barangay || "",
            street: userProfile.street || "",
          },
        ]);
      }
    }
  }, [userProfile]);

  // Group cart items by storeId
  const cartItems = useMemo(() => {
    if (!cartData || !productsData) return [];
    return cartData.map(c => {
      const product = productsData.find(p => p.id === c.productId);
      return product ? { ...c, product } : null;
    }).filter(Boolean) as (CartItem & { product: Product })[];
  }, [cartData, productsData]);

  // Group items by storeId
  const itemsByStore = useMemo(() => {
    const groups: Record<string, { storeId: string; items: (CartItem & { product: Product })[] }> = {};
    for (const item of cartItems) {
      const storeId = item.product.storeId || 'unknown';
      if (!groups[storeId]) {
        groups[storeId] = { storeId, items: [] };
      }
      groups[storeId].items.push(item);
    }
    return Object.values(groups);
  }, [cartItems]);

  // Fetch all unique storeIds
  const storeIds = useMemo(() => itemsByStore.map(g => g.storeId).filter(id => id !== 'unknown'), [itemsByStore]);

  // Fetch store data for all storeIds
  const storesQuery = useStableMemo(() => {
    if (!storeIds.length) return null;
    return { table: "stores", filters: [{ column: "id", op: "in" as FilterOp, value: `(${storeIds.join(",")})` }] };
  }, [storeIds]);
  const { data: storesData } = useCollection<any>(storesQuery);

  // Helper to get store name by id
  const getStoreName = (storeId: string) => {
    if (!storesData) return "Shop";
    const store = storesData.find((s: any) => s.id === storeId);
    return store?.name || "Shop";
  };

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price || item.product.pricePerNight || 0) * item.quantity, 0);
  }, [cartItems]);

  const shippingFee = 50;
  const grandTotal = totalPrice + shippingFee;

  const selectedAddress = (addressBook && addressBook[selectedAddressIdx]) || newAddress;
  const formattedAddress = [selectedAddress.street, selectedAddress.barangay, selectedAddress.city, selectedAddress.province].filter(Boolean).join(", ");

  const canPlaceOrder = () => {
    return selectedAddress.fullName && selectedAddress.mobile && selectedAddress.city && paymentMethod;
  };

  const handlePlaceOrder = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      // Create order for each cart item
      for (const item of cartItems) {
        const orderData = {
          userId: user.uid,
          facilityId: item.product.id,
          storeId: item.product.storeId || null,
          quantity: item.quantity,
          totalPrice: (item.product.price || item.product.pricePerNight || 0) * item.quantity,
          paymentMethod,
          status: "To Pay",
          shippingAddress: formattedAddress,
          bookingDate: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          numberOfGuests: item.quantity,
          createdAt: new Date().toISOString(),
        };
        await addDocumentNonBlocking(supabase, "bookings", orderData);
      }
      // Clear cart
      for (const item of cartItems) {
        await supabase.from("cart_items").delete().eq("id", item.id);
      }
      setOrderSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error("Order error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save new address to address book
  const handleSaveNewAddress = async () => {
    if (!userProfile) return;
    const updatedAddresses = [...(addressBook || []), newAddress];
    await supabase.from("users").update({ addresses: updatedAddresses }).eq("id", userProfile.id);
    setAddressBook(updatedAddresses);
    setShowAddAddress(false);
    setNewAddress({
      label: "",
      fullName: "",
      mobile: "",
      province: "Oriental Mindoro",
      city: "",
      barangay: "",
      street: "",
    });
    setSelectedAddressIdx(updatedAddresses.length - 1);
  };

  if (isUserLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-[600px]">
        <div className="mt-8 md:mt-0 mb-8">
          <Skeleton className="h-7 w-32 rounded-full mb-2" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-[25px] border border-black/[0.02]">
              <Skeleton className="h-20 w-20 rounded-[16px] shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-[25px] border border-black/[0.02] p-6 space-y-4">
          <Skeleton className="h-5 w-32 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-full mt-4" />
        </div>
      </main>
      <Footer />
    </div>
  );
  if (!user) { router.push("/login"); return null; }

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-[600px]">
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-headline font-normal tracking-[-0.03em] mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-8">Your order has been placed successfully. You can track it in My Orders.</p>
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/my-bookings")} className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">View Orders</Button>
              <Button onClick={() => router.push("/")} variant="outline" className="rounded-full px-8 py-5 h-12">Continue Shopping</Button>
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
      <main className="flex-grow container mx-auto px-0 md:px-6 pt-0 md:pt-32 pb-40 max-w-[1480px]">
        <div className="p-6 md:p-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] dark:text-white mb-1">Checkout</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-8">
          {/* Info Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Address Book Section */}
            <div>
              <h2 className="text-xl font-headline font-normal tracking-[-0.03em] mb-2">Shipping Address</h2>
              {addressBook && addressBook.length > 0 && (
                <div className="space-y-2 mb-4">
                  {addressBook.map((addr, idx) => (
                    <div key={idx} className={cn("p-4 rounded-xl border flex items-center gap-4 cursor-pointer", selectedAddressIdx === idx ? "border-primary bg-primary/5" : "border-black/10 bg-[#f8f8f8]")}
                      onClick={() => { setSelectedAddressIdx(idx); setShowAddAddress(false); }}>
                      <input type="radio" checked={selectedAddressIdx === idx} onChange={() => setSelectedAddressIdx(idx)} className="accent-primary" />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{addr.label || "Address"}</div>
                        <div className="text-xs">{addr.fullName} | {addr.mobile}</div>
                        <div className="text-xs text-muted-foreground">{[addr.street, addr.barangay, addr.city, addr.province].filter(Boolean).join(", ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="rounded-full mb-2" onClick={() => { setShowAddAddress(true); setSelectedAddressIdx(-1); }}>+ Add New Address</Button>
              {showAddAddress && (
                <div className="p-4 rounded-xl border border-primary bg-primary/5 space-y-2 mt-2">
                  <input type="text" placeholder="Label (e.g. Home, Office)" value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="Mobile" value={newAddress.mobile} onChange={e => setNewAddress({ ...newAddress, mobile: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="Province" value={newAddress.province} onChange={e => setNewAddress({ ...newAddress, province: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="Barangay" value={newAddress.barangay} onChange={e => setNewAddress({ ...newAddress, barangay: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <input type="text" placeholder="Street / House No." value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full rounded px-3 py-2 mb-1" />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleSaveNewAddress} className="flex-1 rounded-full bg-primary text-white">Save Address</Button>
                    <Button variant="outline" onClick={() => setShowAddAddress(false)} className="flex-1 rounded-full">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
            {/* Payment Method Section */}
            <div>
              <h2 className="text-xl font-headline font-normal tracking-[-0.03em] mb-2">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
                  { value: "gcash", label: "GCash", desc: "Pay via GCash mobile wallet" },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-[20px] text-left transition-all",
                      paymentMethod === method.value
                        ? "bg-primary/5 border-2 border-primary"
                        : "bg-[#f8f8f8] border-2 border-transparent hover:bg-black/5"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      paymentMethod === method.value ? "border-primary" : "border-muted-foreground/30"
                    )}>
                      {paymentMethod === method.value && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Order Review Section */}
          <div className="md:col-span-1 space-y-8">
            <div className="rounded-2xl border border-black/10 bg-[#f8f8f8] p-6">
              <h2 className="text-xl font-headline font-normal tracking-[-0.03em] mb-2">Order Summary</h2>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Shipping to</span>
              </div>
              <p className="text-sm">{selectedAddress.fullName}</p>
              <p className="text-xs text-muted-foreground">{formattedAddress}</p>
              <p className="text-xs text-muted-foreground">{selectedAddress.mobile}</p>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Payment</span>
              </div>
              <p className="text-sm mb-4">{paymentMethod === "cod" ? "Cash on Delivery" : "GCash"}</p>
              <div className="space-y-5 mb-4">
                {itemsByStore.map(storeGroup => (
                  <div key={storeGroup.storeId} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold">{getStoreName(storeGroup.storeId)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs h-7"
                        onClick={() => router.push(`/messages?id=${storeGroup.storeId}`)}
                      >
                        Message Seller
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {storeGroup.items.map(item => (
                        <div key={item.id} className="flex gap-3 p-2 rounded-[12px] bg-white">
                          <div className="h-12 w-12 rounded-[8px] overflow-hidden shrink-0">
                            <Image src={item.product.imageUrl} alt={item.product.name} width={48} height={48} className="object-cover h-full w-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-medium line-clamp-1">{item.product.name}</h3>
                            <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-xs font-bold shrink-0">₱{((item.product.price || item.product.pricePerNight || 0) * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₱{shippingFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-black/5 pt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">₱{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Fixed checkout bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 shadow-2xl p-4 md:pb-4 pb-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total ({cartItems.length} items)</p>
              <p className="text-2xl font-bold text-primary">₱{grandTotal.toLocaleString()}</p>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing || !canPlaceOrder()}
              className="rounded-full px-10 py-6 bg-black text-white font-bold text-sm h-14 hover:bg-primary transition-all disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
