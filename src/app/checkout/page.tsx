"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MapPin, CreditCard, CheckCircle2, ArrowLeft, ArrowRight, Store, Package, Upload, Clock, QrCode, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";
import { useUser, useSupabase, useCollection, useStableMemo, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/supabase";
import { sendOrderAutoMessage, sendGcashProofMessage } from "@/lib/auto-message";
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
  const [codOrderIds, setCodOrderIds] = useState<string[]>([]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<string>("delivery");
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimeout, setQRTimeout] = useState(600); // 10 min in seconds
  const [qrProof, setQRProof] = useState<File | null>(null);
  const [qrProofUrl, setQRProofUrl] = useState<string>("");
  const [qrRef, setQRRef] = useState("");
  const [qrUploading, setQRUploading] = useState(false);
  const [gcashStep, setGcashStep] = useState<"scan" | "proof">("scan");
  // Timer effect
  React.useEffect(() => {
    if (!showQRModal || qrTimeout <= 0) return;
    const timer = setInterval(() => setQRTimeout(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [showQRModal, qrTimeout]);
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

  // Get selected item IDs from localStorage (set by cart page)
  const [checkoutSelectedIds, setCheckoutSelectedIds] = useState<string[] | null>(null);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("checkout_selected_ids");
      if (raw) {
        setCheckoutSelectedIds(JSON.parse(raw));
      }
    } catch { }
  }, []);

  // Group cart items by storeId — filtered to selected items only
  const cartItems = useMemo(() => {
    if (!cartData || !productsData) return [];
    const all = cartData.map(c => {
      const product = productsData.find(p => p.id === c.productId);
      return product ? { ...c, product } : null;
    }).filter(Boolean) as (CartItem & { product: Product })[];
    // If we have a selection, filter to only those items
    if (checkoutSelectedIds && checkoutSelectedIds.length > 0) {
      const idSet = new Set(checkoutSelectedIds);
      return all.filter(item => idSet.has(item.id));
    }
    return all;
  }, [cartData, productsData, checkoutSelectedIds]);

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

  // Determine fulfillment options available across all stores in cart
  const fulfillmentAvailability = useMemo(() => {
    if (!storesData || storesData.length === 0) return { delivery: true, pickup: true };
    // All stores must offer delivery for delivery to be available
    // All stores must offer pickup for pickup to be available
    let allOfferDelivery = true;
    let allOfferPickup = true;
    for (const group of itemsByStore) {
      const store = storesData.find((s: any) => s.id === group.storeId);
      if (store) {
        if (store.offersDelivery === false) allOfferDelivery = false;
        if (store.offersPickup === false) allOfferPickup = false;
      }
    }
    // Fallback: if somehow both are false, allow both (safety net)
    if (!allOfferDelivery && !allOfferPickup) return { delivery: true, pickup: true };
    return { delivery: allOfferDelivery, pickup: allOfferPickup };
  }, [storesData, itemsByStore]);

  // Auto-select a valid fulfillment method when availability changes
  React.useEffect(() => {
    if (!fulfillmentAvailability.delivery && fulfillmentMethod === "delivery") {
      setFulfillmentMethod("pickup");
    } else if (!fulfillmentAvailability.pickup && fulfillmentMethod === "pickup") {
      setFulfillmentMethod("delivery");
    }
  }, [fulfillmentAvailability, fulfillmentMethod]);

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

    // If GCash selected, show QR modal instead of placing order directly
    if (paymentMethod === "gcash") {
      setShowQRModal(true);
      setGcashStep("scan");
      setQRTimeout(600);
      setQRProof(null);
      setQRProofUrl("");
      setQRRef("");
      return;
    }

    setIsProcessing(true);
    try {
      const createdIds: string[] = [];
      // Create order for each cart item
      for (const item of cartItems) {
        const orderData = {
          userId: user.uid,
          facilityId: item.product.id,
          storeId: item.product.storeId || null,
          quantity: item.quantity,
          totalPrice: (item.product.price || item.product.pricePerNight || 0) * item.quantity,
          paymentMethod,
          fulfillmentMethod,
          status: "To Pay",
          shippingAddress: formattedAddress,
          bookingDate: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          numberOfGuests: item.quantity,
          createdAt: new Date().toISOString(),
        };
        const bookingId = await addDocumentNonBlocking(supabase, "bookings", orderData);
        if (bookingId?.id) createdIds.push(bookingId.id);
        // Auto-message seller after order placed
        if (item.product.storeId && storesData) {
          const store = storesData.find((s: any) => s.id === item.product.storeId);
          if (store && store.sellerId) {
            sendOrderAutoMessage({
              buyerId: user.uid,
              sellerId: store.sellerId,
              storeName: store.name,
              orderId: bookingId?.id || ""
            });
          }
        }
      }
      // Clear cart
      for (const item of cartItems) {
        await supabase.from("cart_items").delete().eq("id", item.id);
      }
      localStorage.removeItem("checkout_selected_ids");
      if (paymentMethod === "cod" && createdIds.length > 0) {
        setCodOrderIds(createdIds);
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

  // Handle GCash order submit (after proof upload)
  const handleGcashSubmit = async () => {
    if (!user || !qrProofUrl || !qrRef) return;
    setIsProcessing(true);
    try {
      const orderIds: string[] = [];
      for (const item of cartItems) {
        const orderData = {
          userId: user.uid,
          facilityId: item.product.id,
          storeId: item.product.storeId || null,
          quantity: item.quantity,
          totalPrice: (item.product.price || item.product.pricePerNight || 0) * item.quantity,
          paymentMethod: "gcash",
          status: "To Pay",
          fulfillmentMethod,
          shippingAddress: formattedAddress,
          bookingDate: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          numberOfGuests: item.quantity,
          createdAt: new Date().toISOString(),
          gcashProofUrl: qrProofUrl,
          gcashRef: qrRef,
        };
        const bookingId = await addDocumentNonBlocking(supabase, "bookings", orderData);
        if (bookingId?.id) orderIds.push(bookingId.id);
        // Send proof + details to seller via message
        if (item.product.storeId && storesData) {
          const store = storesData.find((s: any) => s.id === item.product.storeId);
          if (store && store.sellerId) {
            sendGcashProofMessage({
              buyerId: user.uid,
              sellerId: store.sellerId,
              storeName: store.name,
              orderId: bookingId?.id || "",
              gcashRef: qrRef,
              gcashProofUrl: qrProofUrl,
              amount: (item.product.price || item.product.pricePerNight || 0) * item.quantity,
              date: new Date().toLocaleString(),
            });
          }
        }
      }
      for (const item of cartItems) {
        await supabase.from("cart_items").delete().eq("id", item.id);
      }
      setShowQRModal(false);
      localStorage.removeItem("checkout_selected_ids");
      setOrderSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error("GCash Order error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle QR proof upload
  const handleQRProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setQRUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `gcash-proofs/${user.uid}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("products").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path);
      setQRProofUrl(urlData.publicUrl);
      setQRProof(file);
    } catch (err) {
      alert("Failed to upload payment proof.");
    } finally {
      setQRUploading(false);
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

  // Download QR as image
  const handleDownloadQR = useCallback((orderId: string) => {
    const canvas = document.getElementById(`cod-qr-${orderId}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${orderId.slice(0, 8)}-qr.png`;
    a.click();
  }, []);

  if (orderSuccess) {
    // COD success with QR codes
    if (codOrderIds.length > 0) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      return (
        <div className="flex min-h-screen flex-col bg-white">
          <Header />
          <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-[600px]">
            <div className="text-center py-12">
              <div className="h-20 w-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-headline font-normal tracking-[-0.03em] mb-2">Order Placed!</h2>
              <p className="text-muted-foreground mb-2">Cash on Delivery selected. Show this QR code to the seller when paying.</p>
              <p className="text-xs text-muted-foreground mb-8">The seller can scan this QR to view your order and confirm your payment.</p>

              <div className="space-y-6">
                {codOrderIds.map((orderId, idx) => (
                  <div key={orderId} className="bg-[#f8f8f8] rounded-[28px] p-6 border border-black/[0.04]">
                    {codOrderIds.length > 1 && (
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Order {idx + 1} of {codOrderIds.length}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground mb-4">ID: {orderId.slice(0, 12)}...</p>
                    <div className="bg-white rounded-2xl p-5 inline-block border-2 border-primary/10 mb-4">
                      <QRCodeCanvas
                        id={`cod-qr-${orderId}`}
                        value={`${baseUrl}/orders/${orderId}`}
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadQR(orderId)}
                        className="rounded-full px-5 h-10 text-sm gap-2"
                      >
                        <Download className="h-4 w-4" /> Save QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-3 justify-center mt-8">
                <Button onClick={() => router.push("/my-bookings")} className="rounded-full px-8 py-5 bg-primary text-white font-bold h-12">View Orders</Button>
                <Button onClick={() => router.push("/")} variant="outline" className="rounded-full px-8 py-5 h-12">Continue Shopping</Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // Default success (non-COD)
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

  // GCash / QR Payment Modal
  const qrStore = storesData && itemsByStore.length === 1 ? storesData.find((s: any) => s.id === itemsByStore[0].storeId) : null;
  const qrphUrl = qrStore?.qrphUrl;

  const QRModal = showQRModal && (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] p-6 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button className="absolute top-4 right-4 text-muted-foreground hover:text-black text-2xl leading-none" onClick={() => setShowQRModal(false)}>&times;</button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-headline font-normal tracking-[-0.03em]">Pay via GCash</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Time remaining: <span className="font-bold text-black">{Math.floor(qrTimeout / 60)}:{(qrTimeout % 60).toString().padStart(2, '0')}</span></span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-[#f8f8f8] rounded-2xl p-4 mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
          <p className="text-3xl font-bold text-primary font-headline">₱{grandTotal.toLocaleString()}</p>
        </div>

        {gcashStep === "scan" ? (
          <>
            {/* QR Code display */}
            <div className="text-center mb-4">
              <p className="text-sm font-medium mb-3">Scan this QR code with your GCash app</p>
              {qrphUrl ? (
                <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 inline-block">
                  <img src={qrphUrl} alt="GCash QR Code" className="w-52 h-52 object-contain mx-auto" />
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center bg-gray-100 rounded-2xl mx-auto text-sm text-muted-foreground border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <QrCode className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p>No QR code uploaded<br />by seller</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700"><strong>Steps:</strong> 1. Open GCash app → 2. Scan QR code → 3. Pay ₱{grandTotal.toLocaleString()} → 4. Take a screenshot → 5. Click button below</p>
            </div>
            <Button
              onClick={() => setGcashStep("proof")}
              className="w-full rounded-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Upload className="h-4 w-4 mr-2" /> I&apos;ve Paid — Send Proof
            </Button>
          </>
        ) : (
          <>
            {/* Proof upload step */}
            <p className="text-sm font-medium mb-3">Upload your GCash payment proof</p>

            <div className="space-y-4">
              {/* Proof image upload */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Screenshot</label>
                {qrProofUrl ? (
                  <div className="relative">
                    <img src={qrProofUrl} alt="Payment Proof" className="w-full max-h-48 object-contain border-2 border-green-200 rounded-2xl bg-green-50 p-2" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <Upload className="h-8 w-8 text-blue-400 mb-2" />
                    <span className="text-sm text-muted-foreground">{qrUploading ? "Uploading..." : "Tap to upload screenshot"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleQRProofUpload} disabled={qrUploading} />
                  </label>
                )}
                {qrProofUrl && (
                  <label className="text-xs text-blue-600 cursor-pointer mt-1 inline-block hover:underline">
                    Change image
                    <input type="file" accept="image/*" className="hidden" onChange={handleQRProofUpload} disabled={qrUploading} />
                  </label>
                )}
              </div>

              {/* Reference number */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">GCash Reference Number</label>
                <input
                  type="text"
                  className="w-full border-2 border-black/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono tracking-wider"
                  value={qrRef}
                  onChange={e => setQRRef(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                />
              </div>

              {/* Info box */}
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-700"><strong>Note:</strong> Your payment proof and reference number will be sent to the seller for verification. The seller will confirm your payment once verified.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGcashStep("scan")}
                  className="flex-1 rounded-full h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGcashSubmit}
                  disabled={!qrProofUrl || !qrRef || qrTimeout <= 0 || qrUploading || isProcessing}
                  className="flex-1 rounded-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {isProcessing ? "Submitting..." : "Send Proof & Place Order"}
                </Button>
              </div>
            </div>
          </>
        )}

        {qrTimeout <= 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-red-500 font-medium">⏰ Time expired. Please close and try again.</p>
          </div>
        )}
      </div>
    </div>
  );

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
            {/* Fulfillment Method Section */}
            <div>
              <h2 className="text-xl font-headline font-normal tracking-[-0.03em] mb-2">Delivery or Pickup</h2>
              <div className="space-y-3">
                {[
                  { value: "delivery", label: "Delivery", desc: "Order will be delivered to your address", available: fulfillmentAvailability.delivery },
                  { value: "pickup", label: "Pickup", desc: "You will pick up the order at the shop", available: fulfillmentAvailability.pickup },
                ].filter(m => m.available).map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setFulfillmentMethod(method.value)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-[20px] text-left transition-all",
                      fulfillmentMethod === method.value
                        ? "bg-primary/5 border-2 border-primary"
                        : "bg-[#f8f8f8] border-2 border-transparent hover:bg-black/5"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      fulfillmentMethod === method.value ? "border-primary" : "border-muted-foreground/30"
                    )}>
                      {fulfillmentMethod === method.value && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </button>
                ))}
                {!fulfillmentAvailability.delivery && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded-xl p-3">This seller only offers pickup — delivery is not available.</p>
                )}
                {!fulfillmentAvailability.pickup && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3">This seller only offers delivery — pickup is not available.</p>
                )}
              </div>
            </div>
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
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}</span>
              </div>
              <p className="text-sm mb-1">{fulfillmentMethod === "pickup" ? "You will pick up the order at the shop." : "Order will be delivered to your address."}</p>
              <div className="flex items-center gap-2 mt-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Payment</span>
              </div>
              <p className="text-sm mb-4">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "gcash" ? "GCash" : "QR PH"}</p>
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
      {QRModal}
      <Footer />
    </div>
  );
}
