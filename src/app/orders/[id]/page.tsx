"use client";

import React, { use, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  useUser,
  useSupabase,
  useDoc,
  useStableMemo,
  updateDocumentNonBlocking,
} from "@/supabase";
import { useCollection } from "@/supabase";
import {
  Package,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle2,
  Truck,
  User,
  ShoppingBag,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  userId: string;
  facilityId: string;
  storeId: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  fulfillmentMethod: string;
  status: string;
  shippingAddress: string;
  bookingDate: string;
  createdAt: string;
  numberOfGuests: number;
  gcashProofUrl?: string;
  gcashRef?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  pricePerNight?: number;
  imageUrl: string;
  storeId?: string;
}

interface StoreData {
  id: string;
  name: string;
  sellerId: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  // Fetch the order
  const orderRef = useStableMemo(() => {
    if (!id) return null;
    return { table: "bookings", id };
  }, [id]);
  const { data: order, isLoading: orderLoading } = useDoc<Order>(orderRef);

  // Fetch the product
  const productRef = useStableMemo(() => {
    if (!order?.facilityId) return null;
    return { table: "facilities", id: order.facilityId };
  }, [order?.facilityId]);
  const { data: product } = useDoc<Product>(productRef);

  // Fetch the store
  const storeRef = useStableMemo(() => {
    if (!order?.storeId) return null;
    return { table: "stores", id: order.storeId };
  }, [order?.storeId]);
  const { data: store } = useDoc<StoreData>(storeRef);

  // Fetch buyer info
  const buyerRef = useStableMemo(() => {
    if (!order?.userId) return null;
    return { table: "users", id: order.userId };
  }, [order?.userId]);
  const { data: buyer } = useDoc<any>(buyerRef);

  // Check if current user is the seller of this order
  const isSeller = useMemo(() => {
    if (!user || !store) return false;
    return user.uid === store.sellerId;
  }, [user, store]);

  // Check if current user is the buyer
  const isBuyer = useMemo(() => {
    if (!user || !order) return false;
    return user.uid === order.userId;
  }, [user, order]);

  const handleConfirmPayment = () => {
    if (!order || !isSeller) return;
    updateDocumentNonBlocking(supabase, "bookings", order.id, {
      status: "To Ship",
    });
    window.location.reload();
  };

  const handleMarkShipped = () => {
    if (!order || !isSeller) return;
    updateDocumentNonBlocking(supabase, "bookings", order.id, {
      status: "To Receive",
    });
    window.location.reload();
  };

  const handleMarkCompleted = () => {
    if (!order || !isSeller) return;
    updateDocumentNonBlocking(supabase, "bookings", order.id, {
      status: "Completed",
    });
    window.location.reload();
  };

  const handleCancelOrder = () => {
    if (!order || !isSeller) return;
    updateDocumentNonBlocking(supabase, "bookings", order.id, {
      status: "Cancelled",
    });
    window.location.reload();
  };

  if (orderLoading || isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-2xl">
          <div className="mt-8 md:mt-0 space-y-6">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-40 w-full rounded-[28px]" />
            <Skeleton className="h-32 w-full rounded-[28px]" />
            <Skeleton className="h-24 w-full rounded-[28px]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-2xl">
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-headline font-normal tracking-[-0.03em] mb-2">
              Order Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This order does not exist or has been removed.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="rounded-full px-8 h-12"
            >
              Go Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    "To Pay": "bg-yellow-50 text-yellow-700 border-yellow-200",
    Pending: "bg-orange-50 text-orange-700 border-orange-200",
    "To Ship": "bg-blue-50 text-blue-700 border-blue-200",
    "To Receive": "bg-purple-50 text-purple-700 border-purple-200",
    Completed: "bg-green-50 text-green-700 border-green-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const paymentLabel: Record<string, string> = {
    cod: "Cash on Delivery",
    gcash: "GCash",
    qrph: "QR PH",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-0 md:pt-32 pb-24 max-w-2xl">
        <div className="mt-8 md:mt-0 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-headline font-normal tracking-[-0.03em]">
              Order <span className="text-primary">Details</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {order.id}
            </p>
          </div>

          {/* Status banner */}
          <div
            className={cn(
              "rounded-[20px] p-5 border flex items-center justify-between",
              statusColor[order.status] || "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            <div className="flex items-center gap-3">
              {order.status === "Completed" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
              <div>
                <p className="text-sm font-bold">{order.status}</p>
                <p className="text-xs opacity-70">
                  {order.status === "To Pay"
                    ? "Waiting for payment confirmation"
                    : order.status === "To Ship"
                    ? "Payment confirmed, preparing to ship"
                    : order.status === "To Receive"
                    ? "On the way to buyer"
                    : order.status === "Completed"
                    ? "Order completed"
                    : order.status === "Cancelled"
                    ? "Order was cancelled"
                    : "Processing"}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold border",
                statusColor[order.status]
              )}
            >
              {order.status}
            </Badge>
          </div>

          {/* Product info */}
          <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Product
            </h3>
            <div className="flex gap-4">
              {product?.imageUrl && (
                <div className="h-20 w-20 rounded-[14px] overflow-hidden shrink-0 border border-black/[0.04]">
                  <Image
                    src={product.imageUrl}
                    alt={product.name || "Product"}
                    width={80}
                    height={80}
                    className="object-cover h-full w-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">
                  {product?.name || "Product"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Qty: {order.quantity || order.numberOfGuests || 1}
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  ₱{order.totalPrice?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Order details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment */}
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Payment
              </h3>
              <p className="text-sm">
                {paymentLabel[order.paymentMethod] || order.paymentMethod}
              </p>
              {order.gcashRef && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Ref: {order.gcashRef}
                </p>
              )}
            </div>

            {/* Fulfillment */}
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Fulfillment
              </h3>
              <p className="text-sm capitalize">
                {order.fulfillmentMethod || "—"}
              </p>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Shipping Address
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {order.shippingAddress || "No address provided"}
              </p>
            </div>

            {/* Date */}
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Order Date
              </h3>
              <p className="text-sm">
                {new Date(
                  order.createdAt || order.bookingDate
                ).toLocaleDateString([], {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Buyer info (visible to seller) */}
          {isSeller && buyer && (
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Buyer
              </h3>
              <p className="text-sm font-medium">
                {buyer.firstName} {buyer.lastName}
              </p>
              {buyer.mobile && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {buyer.mobile}
                </p>
              )}
            </div>
          )}

          {/* Store info */}
          {store && (
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Store
              </h3>
              <p className="text-sm font-medium">{store.name}</p>
            </div>
          )}

          {/* GCash proof (if applicable) */}
          {order.gcashProofUrl && (
            <div className="bg-white rounded-[24px] p-5 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" /> GCash Payment
                Proof
              </h3>
              <img
                src={order.gcashProofUrl}
                alt="GCash Proof"
                className="max-w-[240px] rounded-xl border border-black/[0.04]"
              />
              {order.gcashRef && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Reference: {order.gcashRef}
                </p>
              )}
            </div>
          )}

          {/* Seller actions */}
          {isSeller && (
            <div className="bg-white rounded-[24px] p-6 border border-black/[0.04] shadow-sm">
              <h3 className="text-sm font-bold mb-4">Seller Actions</h3>

              {order.status === "To Pay" && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      <strong>
                        {order.paymentMethod === "cod"
                          ? "💵 Cash on Delivery"
                          : order.paymentMethod === "gcash"
                          ? "💳 GCash Payment"
                          : "💳 Payment"}
                      </strong>{" "}
                      — {order.paymentMethod === "cod" ? "Accept this COD order to proceed." : "Confirm once the buyer has paid you."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirmPayment}
                      className="flex-1 rounded-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> {order.paymentMethod === "cod" ? "Accept COD Order" : "Confirm Payment"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelOrder}
                      className="rounded-full h-12 px-6 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {order.status === "To Ship" && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleMarkShipped}
                    className="flex-1 rounded-full h-12 font-bold"
                  >
                    <Truck className="h-4 w-4 mr-2" /> Mark as Shipped
                  </Button>
                </div>
              )}

              {order.status === "To Receive" && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleMarkCompleted}
                    className="flex-1 rounded-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Completed
                  </Button>
                </div>
              )}

              {(order.status === "Completed" ||
                order.status === "Cancelled") && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No actions available for {order.status.toLowerCase()} orders.
                </p>
              )}
            </div>
          )}

          {/* Buyer info message */}
          {isBuyer && order.status === "To Pay" && order.paymentMethod === "cod" && (
            <div className="bg-orange-50 rounded-[24px] p-5 border border-orange-100">
              <p className="text-sm text-orange-800">
                <strong>💵 Cash on Delivery</strong> — Show the QR code to the
                seller when paying. The seller will scan it and confirm your
                payment here.
              </p>
            </div>
          )}

          {/* Back button */}
          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="rounded-full px-8 h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
