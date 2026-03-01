"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MapPin, CreditCard, CheckCircle2, ArrowLeft, ArrowRight, Store, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useSupabase, useCollection, useStableMemo, useDoc, addDocumentNonBlocking } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

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
}

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    mobile: "",
    province: "Oriental Mindoro",
    city: "",
    barangay: "",
    street: "",
  });

  const cartQuery = useStableMemo(() => {
    if (!user) return null;
    return { table: "cart_items", filters: [{ column: "userId", op: "eq", value: user.uid }] };
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

  // Populate shipping from user profile
  React.useEffect(() => {
    if (userProfile) {
      setShippingAddress(prev => ({
        fullName: prev.fullName || `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
        mobile: prev.mobile || userProfile.mobile || "",
        province: prev.province || userProfile.province || "Oriental Mindoro",
        city: prev.city || userProfile.city || "",
        barangay: prev.barangay || userProfile.barangay || "",
        street: prev.street || userProfile.street || "",
      }));
    }
  }, [userProfile]);

  const cartItems = useMemo(() => {
    if (!cartData || !productsData) return [];
    return cartData.map(c => {
      const product = productsData.find(p => p.id === c.productId);
      return product ? { ...c, product } : null;
    }).filter(Boolean) as (CartItem & { product: Product })[];
  }, [cartData, productsData]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price || item.product.pricePerNight || 0) * item.quantity, 0);
  }, [cartItems]);

  const shippingFee = 50;
  const grandTotal = totalPrice + shippingFee;

  const formattedAddress = [shippingAddress.street, shippingAddress.barangay, shippingAddress.city, shippingAddress.province].filter(Boolean).join(", ");

  const canProceed = () => {
    if (step === 1) return shippingAddress.fullName && shippingAddress.mobile && shippingAddress.city;
    if (step === 2) return paymentMethod;
    return true;
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

  if (isUserLoading) return null;
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

  const steps = [
    { num: 1 as Step, label: "Shipping", icon: MapPin },
    { num: 2 as Step, label: "Payment", icon: CreditCard },
    { num: 3 as Step, label: "Review", icon: Package },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 pt-0 md:pt-32 pb-24 max-w-[700px]">
        <button onClick={() => step > 1 ? setStep((step - 1) as Step) : router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-black transition-colors mt-4 md:mt-0 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-3xl font-headline font-normal tracking-[-0.05em] mb-8">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                step >= s.num ? "bg-primary text-white" : "bg-[#f8f8f8] text-muted-foreground"
              )}>
                <s.icon className="h-4 w-4" />
                <span className="hidden md:inline">{s.label}</span>
                <span className="md:hidden">{s.num}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("flex-1 h-[2px]", step > s.num ? "bg-primary" : "bg-muted")} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-headline font-normal tracking-[-0.03em]">Shipping Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <input
                  type="text" value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</label>
                <input
                  type="tel" value={shippingAddress.mobile}
                  onChange={(e) => setShippingAddress(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="09XX XXX XXXX"
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Province</label>
                <input
                  type="text" value={shippingAddress.province} readOnly
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-muted-foreground outline-none cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">City/Municipality</label>
                  <input
                    type="text" value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(p => ({ ...p, city: e.target.value }))}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Barangay</label>
                  <input
                    type="text" value={shippingAddress.barangay}
                    onChange={(e) => setShippingAddress(p => ({ ...p, barangay: e.target.value }))}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Street / House No.</label>
                <input
                  type="text" value={shippingAddress.street}
                  onChange={(e) => setShippingAddress(p => ({ ...p, street: e.target.value }))}
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-headline font-normal tracking-[-0.03em]">Payment Method</h2>
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
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-headline font-normal tracking-[-0.03em]">Order Review</h2>

            {/* Shipping Summary */}
            <div className="p-5 rounded-[20px] bg-[#f8f8f8]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Shipping to</span>
              </div>
              <p className="text-sm">{shippingAddress.fullName}</p>
              <p className="text-xs text-muted-foreground">{formattedAddress}</p>
              <p className="text-xs text-muted-foreground">{shippingAddress.mobile}</p>
            </div>

            {/* Payment Summary */}
            <div className="p-5 rounded-[20px] bg-[#f8f8f8]">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Payment</span>
              </div>
              <p className="text-sm">{paymentMethod === "cod" ? "Cash on Delivery" : "GCash"}</p>
            </div>

            {/* Items Summary */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 p-4 rounded-[20px] bg-[#f8f8f8]">
                  <div className="h-16 w-16 rounded-[12px] overflow-hidden shrink-0">
                    <Image src={item.product.imageUrl} alt={item.product.name} width={64} height={64} className="object-cover h-full w-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium line-clamp-1">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0">₱{((item.product.price || item.product.pricePerNight || 0) * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-5 rounded-[20px] bg-[#f8f8f8] space-y-2">
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
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <Button
              onClick={() => setStep((step - 1) as Step)}
              variant="outline"
              className="flex-1 rounded-full py-6 h-14"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canProceed()}
              className="flex-1 rounded-full py-6 bg-black text-white font-bold h-14 hover:bg-primary transition-all disabled:opacity-50"
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="flex-1 rounded-full py-6 bg-primary text-white font-bold h-14 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
