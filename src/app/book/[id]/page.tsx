"use client";

import React, { useState, use, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import {
  Heart,
  MapPin,
  Star,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Wifi,
  Wind,
  Waves,
  Dog,
  Car,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Wallet,
  Smartphone,
  Info,
  X,
  Zap,
  Utensils,
  Sun,
  Tv,
  MessageSquare,
  AlertCircle,
  Gavel,
  Timer,
  TrendingUp,
  Users,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useSupabase, useDoc, useStableMemo, useUser, addDocumentNonBlocking, useCollection } from "@/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, differenceInDays, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "react-day-picker";
import { gsap } from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  price?: number;
  description: string;
  imageUrl: string;
  status: string;
  amenities?: string[];
  stock?: number;
  sold?: number;
  isAuction?: boolean;
  auctionEndDate?: string;
  startingBid?: number;
  currentBid?: number;
  currentBidderId?: string;
  bidCount?: number;
  storeId?: string;
  sellerId?: string;
  sellerName?: string;
  category?: string;
}

interface StoreInfo {
  id: string;
  name?: string;
  city?: string;
  rating?: number;
  followerCount?: number;
  offersDelivery?: boolean;
  offersPickup?: boolean;
}

interface Bid {
  id: string;
  productId: string;
  bidderId: string;
  amount: number;
  createdAt: string;
}

interface Booking {
  id: string;
  facilityId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const getAmenityIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('organic')) return CheckCircle2;
  if (l.includes('fresh') || l.includes('daily')) return Zap;
  if (l.includes('local') || l.includes('sourced')) return MapPin;
  if (l.includes('farm') || l.includes('direct')) return Sun;
  if (l.includes('handmade') || l.includes('homemade')) return Coffee;
  if (l.includes('free range')) return Dog;
  if (l.includes('natural')) return Waves;
  if (l.includes('halal') || l.includes('vegan')) return Utensils;
  if (l.includes('packed') || l.includes('sealed')) return Wind;
  if (l.includes('frozen')) return Wifi;
  return CheckCircle2;
};

const MOCK_REVIEWS = [
  {
    name: "Maria S.",
    date: "Oct 2025",
    text: "Super fresh po yung mga gulay! Galing pa sa farm dito sa Mindoro. Will definitely order again.",
    avatar: "https://i.pravatar.cc/150?u=maria",
    stars: 5,
  },
  {
    name: "Krizzel F.",
    date: "Sept 2025",
    text: "Ang sarap ng dried fish! Authentic Mindoro quality. Fast delivery and well-packed.",
    avatar: "https://i.pravatar.cc/150?u=krizzel",
    stars: 5,
  },
  {
    name: "Paolo R.",
    date: "Nov 2025",
    text: "Great quality products at very reasonable prices. Supporting local sellers feels good!",
    avatar: "https://i.pravatar.cc/150?u=paolo",
    stars: 5,
  },
];

export default function FacilityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const supabase = useSupabase();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'onsite' | 'gcash'>('onsite');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [bidAmount, setBidAmount] = useState("");
  const [bidPlaced, setBidPlaced] = useState(false);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState("");
  const [quickSheet, setQuickSheet] = useState<{ open: boolean; intent: 'cart' | 'buy' }>({ open: false, intent: 'cart' });
  const [sheetQty, setSheetQty] = useState(1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const currentDragX = useRef<number>(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const facilityRef = useStableMemo(() => {
    if (!id) return null;
    return { table: "facilities", id };
  }, [id]);

  const { data: facility, isLoading } = useDoc<Facility>(facilityRef);

  // Fetch store/seller info
  const storeRef = useStableMemo(() => {
    if (!facility?.storeId) return null;
    return { table: "stores", id: facility.storeId };
  }, [facility?.storeId]);
  const { data: store } = useDoc<StoreInfo>(storeRef);

  // Fetch bookings for this facility to show availability
  const bookingsQuery = useStableMemo(() => {
    if (!id) return null;
    return { table: "bookings", filters: [{ column: "facilityId", op: "eq" as const, value: id }] };
  }, [id]);

  const { data: facilityBookings } = useCollection<Booking>(bookingsQuery);

  // Fetch bids for this product (auction mode)
  const bidsQuery = useStableMemo(() => {
    if (!id) return null;
    return {
      table: "bids",
      filters: [{ column: "productId", op: "eq" as const, value: id }],
      order: { column: "amount", ascending: false },
      limit: 20,
    };
  }, [id]);
  const { data: bids } = useCollection<Bid>(bidsQuery);

  // Fetch bidder names for display
  const bidderIds = useMemo(() => {
    if (!bids) return [];
    return [...new Set(bids.map(b => b.bidderId))];
  }, [bids]);

  const biddersQuery = useStableMemo(() => {
    if (bidderIds.length === 0) return null;
    return {
      table: "users",
      filters: [{ column: "id", op: "in" as const, value: bidderIds }],
    };
  }, [bidderIds]);
  const { data: bidderUsers } = useCollection<{ id: string; firstName?: string; lastName?: string }>(biddersQuery);

  const bidderNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    bidderUsers?.forEach(u => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Anonymous';
      // Mask for privacy: show first 2 chars + ***
      map[u.id] = name.length > 2 ? name.slice(0, 2) + '***' : name;
    });
    return map;
  }, [bidderUsers]);

  // Auction countdown timer
  useEffect(() => {
    if (!facility?.isAuction || !facility.auctionEndDate) {
      setAuctionTimeLeft("");
      return;
    }
    const endDate = new Date(facility.auctionEndDate).getTime();
    const update = () => {
      const now = Date.now();
      const diff = endDate - now;
      if (diff <= 0) {
        setAuctionTimeLeft("Auction ended");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      if (days > 0) {
        setAuctionTimeLeft(`${days}d ${hours}h ${mins}m`);
      } else {
        setAuctionTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [facility?.isAuction, facility?.auctionEndDate]);

  // Fetch all products for "You might also like" section
  const allProductsQuery = useStableMemo(() => {
    return { table: "facilities", columns: "* , sold" };
  }, []);
  const { data: allProducts } = useCollection<Facility & { sold?: number; totalSales?: number }>(allProductsQuery);

  const relatedProducts = useMemo(() => {
    if (!allProducts || !facility) return [];
    const category = facility.type || "";
    const storeId = facility.storeId || "";
    const sellerId = facility.sellerId || "";

    // Score each product by relevance
    const scored = allProducts
      .filter(p => p.id !== facility.id)
      .map(p => {
        let score = 0;
        if (category && (p.type || "") === category) score += 3;
        if (storeId && p.storeId === storeId) score += 2;
        if (sellerId && p.sellerId === sellerId) score += 1;
        return { ...p, score };
      })
      .filter(p => p.score > 0 || allProducts.length <= 20) // fallback: show any if few products
      .sort((a, b) => b.score - a.score);

    // If not enough related, pad with random other products
    if (scored.length < 6) {
      const ids = new Set(scored.map(p => p.id));
      const others = allProducts
        .filter(p => p.id !== facility.id && !ids.has(p.id))
        .sort(() => Math.random() - 0.5);
      scored.push(...others.map(p => ({ ...p, score: 0 })));
    }

    return scored.slice(0, 10);
  }, [allProducts, facility]);

  const reservedDates = useMemo(() => {
    if (!facilityBookings) return [];
    const dates: Date[] = [];
    facilityBookings.forEach(b => {
      if (b.status === "Confirmed" || b.status === "Pending") {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        let curr = new Date(start);
        while (curr <= end) {
          dates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }
      }
    });
    return dates;
  }, [facilityBookings]);

  const images = useMemo(() => {
    if (!facility) return [];
    return [
      facility.imageUrl,
      `https://picsum.photos/seed/${id}2/800/600`,
      `https://picsum.photos/seed/${id}3/800/600`,
      `https://picsum.photos/seed/${id}4/800/600`,
      `https://picsum.photos/seed/${id}5/800/600`,
    ];
  }, [facility, id]);

  useEffect(() => {
    if (images.length > 0 && !isAnimating.current) {
      images.forEach((_, i) => {
        const slide = document.getElementById(`slide-${i}`);
        if (slide) {
          if (i === currentIndex) {
            gsap.set(slide, {
              x: 0, rotation: 0, scale: 1, opacity: 1, zIndex: 50, display: 'block', y: 0
            });
          } else {
            const nextIdx = (currentIndex + 1) % images.length;
            const prevIdx = (currentIndex - 1 + images.length) % images.length;

            if (i === nextIdx || i === prevIdx) {
              gsap.set(slide, {
                x: 0, rotation: 0, scale: 0.92, opacity: 0.4, zIndex: 40, display: 'block', y: 15
              });
            } else {
              gsap.set(slide, { display: 'none', opacity: 0, zIndex: 10 });
            }
          }
        }
      });
    }
  }, [currentIndex, images]);

  const handleStart = (clientX: number) => {
    if (isAnimating.current) return;
    dragStartX.current = clientX;
    currentDragX.current = 0;
  };

  const handleMove = (clientX: number) => {
    if (dragStartX.current === null || isAnimating.current) return;

    const deltaX = clientX - dragStartX.current;
    currentDragX.current = deltaX;

    const currentSlide = document.getElementById(`slide-${currentIndex}`);
    const nextIdx = deltaX < 0
      ? (currentIndex + 1) % images.length
      : (currentIndex - 1 + images.length) % images.length;
    const nextSlide = document.getElementById(`slide-${nextIdx}`);

    if (currentSlide) {
      gsap.set(currentSlide, {
        x: deltaX,
        rotation: deltaX * 0.06,
        scale: 1 - Math.min(Math.abs(deltaX) * 0.0002, 0.05),
        zIndex: 100
      });

      if (nextSlide) {
        const progress = Math.min(Math.abs(deltaX) / 250, 1);
        gsap.set(nextSlide, {
          display: 'block',
          scale: 0.92 + (progress * 0.08),
          opacity: 0.4 + (progress * 0.6),
          y: 15 - (progress * 15),
          zIndex: 50
        });
      }
    }
  };

  const handleEnd = () => {
    if (dragStartX.current === null || isAnimating.current) return;

    const deltaX = currentDragX.current;
    const threshold = 100;
    const currentSlide = document.getElementById(`slide-${currentIndex}`);
    const nextIdx = deltaX < 0
      ? (currentIndex + 1) % images.length
      : (currentIndex - 1 + images.length) % images.length;
    const nextSlide = document.getElementById(`slide-${nextIdx}`);

    if (!currentSlide) return;

    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      completeSwipe(direction, currentSlide, nextSlide, nextIdx);
    } else {
      isAnimating.current = true;
      const tl = gsap.timeline({ onComplete: () => { isAnimating.current = false; } });
      tl.to(currentSlide, { x: 0, rotation: 0, scale: 1, duration: 0.5, ease: "elastic.out(1, 0.75)" });
      if (nextSlide) {
        tl.to(nextSlide, { scale: 0.92, opacity: 0.4, y: 15, duration: 0.4, ease: "power2.out" }, 0);
      }
    }

    dragStartX.current = null;
    currentDragX.current = 0;
  };

  const completeSwipe = (direction: 'left' | 'right', currentSlide: HTMLElement, nextSlide: HTMLElement | null, nextIdx: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const screenWidth = window.innerWidth;
    const exitX = direction === 'left' ? -screenWidth : screenWidth;

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentIndex(nextIdx);
        isAnimating.current = false;
      }
    });

    tl.to(currentSlide, {
      x: exitX,
      rotation: exitX * 0.06,
      opacity: 0,
      duration: 0.6,
      ease: "power2.in"
    }, 0);

    if (nextSlide) {
      tl.to(nextSlide, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.4)"
      }, 0.1);
    }
  };

  const nights = useMemo(() => {
    if (date?.from && date?.to) {
      return differenceInDays(date.to, date.from);
    }
    return 0;
  }, [date]);

  const totalPrice = useMemo(() => {
    if (facility && nights > 0) {
      return facility.pricePerNight * nights;
    }
    return 0;
  }, [facility, nights]);

  const handleBookingClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!facility) return;
    setShowCheckout(true);
  };

  const confirmBooking = () => {
    if (!facility || !user) return;
    const bookingData = {
      userId: user.uid,
      facilityId: facility.id,
      productId: facility.id,
      quantity,
      totalPrice: (facility.price || facility.pricePerNight || 0) * quantity,
      paymentMethod,
      status: "Pending",
      bookingDate: new Date().toISOString(),
      storeId: facility.storeId || null,
      shippingAddress: null,
      trackingNumber: null
    };
    addDocumentNonBlocking(supabase, "bookings", bookingData);
    // Notify buyer
    supabase.from("notifications").insert({
      userId: user.uid,
      title: "Order placed!",
      content: `Your order for "${facility.name}" (x${quantity}) has been placed. Total: ₱${((facility.price || facility.pricePerNight || 0) * quantity).toLocaleString()}`,
      type: "order",
      timestamp: new Date().toISOString(),
      isRead: false,
    });
    // Notify seller
    if (facility.sellerId) {
      supabase.from("notifications").insert({
        userId: facility.sellerId,
        title: "New order received!",
        content: `Someone ordered "${facility.name}" (x${quantity}) — ₱${((facility.price || facility.pricePerNight || 0) * quantity).toLocaleString()}`,
        type: "order",
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    }
    setShowCheckout(false);
    setShowSuccess(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e03d8f', '#ff8fb1', '#ffffff']
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground italic animate-pulse">Loading product...</p>
        </main>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow flex flex-col items-center justify-center gap-4">
          <p className="text-xl font-headline italic text-muted-foreground">Product not found.</p>
          <button onClick={() => router.push('/')} className="text-primary font-bold tracking-tight flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Return to discovery
          </button>
        </main>
      </div>
    );
  }

  // Check if the seller is verified (unless the current user owns this product)
  const isOwnProduct = user?.uid === facility.sellerId || user?.uid === facility.storeId;
  const sellerIsVerified = store?.verified ?? false;
  
  // If seller is not verified and user is not the owner, show not available message
  if (!sellerIsVerified && !isOwnProduct && store !== undefined) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-orange-600" />
          <p className="text-xl font-headline text-muted-foreground">This product is currently unavailable.</p>
          <p className="text-sm text-muted-foreground max-w-md text-center">The seller hasn't been verified yet. Please check back later when the seller completes their verification.</p>
          <button onClick={() => router.push('/')} className="text-primary font-bold tracking-tight flex items-center gap-2 mt-4">
            <ArrowLeft className="h-4 w-4" /> Return to discovery
          </button>
        </main>
      </div>
    );
  }

  const availableStock = facility?.stock ?? facility?.capacity ?? 0;
  const soldCount = facility?.sold ?? 0;
  const productCategory = facility?.type || facility?.category || "Product";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow container mx-auto px-4 pt-4 md:pt-12 pb-48 max-w-[700px]">
        <div
          ref={swipeContainerRef}
          className="relative aspect-[1/1.1] md:aspect-video mb-8 bg-transparent cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              id={`slide-${idx}`}
              className="absolute inset-0 shadow-sm rounded-[30px] overflow-hidden"
              style={{ display: idx === currentIndex ? 'block' : 'none' }}
            >
              <Image
                src={img}
                alt={`${facility.name} view ${idx + 1}`}
                fill
                className="object-cover pointer-events-none"
                priority={idx === 0}
              />
            </div>
          ))}

          <div className="absolute top-4 left-0 right-0 z-[110] flex gap-1.5 px-6">
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  i === currentIndex ? "bg-white shadow-sm" : "bg-white/30"
                )}
              />
            ))}
          </div>

          <button
            onClick={() => router.back()}
            className="absolute top-2 left-2 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/30 transition-all border border-white/20 z-[120]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-2 right-2 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/30 transition-all border border-white/20 z-[120]"
          >
            <Heart className={cn("h-6 w-6 transition-all", isLiked && "fill-white scale-110")} />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-2">
          <div className="flex justify-between items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-normal font-headline tracking-[-0.05em] text-black">
                {facility.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{store?.city || "Oriental Mindoro"}</span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {store?.rating ? store.rating.toFixed(1) : "New"}
              </div>
              {soldCount > 0 && (
                <span className="text-[10px] text-muted-foreground mt-1 font-bold tracking-tight">{soldCount} sold</span>
              )}
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-[#f8f8f8] p-1 h-14 rounded-full mb-8">
              <TabsTrigger value="details" className="flex-1 rounded-full h-12 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Details</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 rounded-full h-12 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-10 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Clock className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Category</span>
                    <span className="text-sm font-medium text-black/80">{productCategory}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Stock</span>
                    <span className={cn("text-sm font-medium", availableStock > 0 ? "text-black/80" : "text-red-500")}>
                      {availableStock > 0 ? `${availableStock} Available` : "Out of stock"}
                    </span>
                  </div>
                </div>
                {soldCount > 0 && (
                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Sold</span>
                      <span className="text-sm font-medium text-black/80">{soldCount} units</span>
                    </div>
                  </div>
                )}
                {facility.status && (
                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Info className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Status</span>
                      <span className="text-sm font-medium text-black/80 capitalize">{facility.status}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-black/[0.05]" />

              <div className="space-y-4">
                <h3 className="text-xl font-headline font-normal tracking-tight">About this product</h3>
                <p className="text-muted-foreground text-base leading-relaxed opacity-80">
                  {facility.description}
                </p>
              </div>

              {facility.amenities && facility.amenities.length > 0 && (
                <>
                  <Separator className="bg-black/[0.05]" />
                  <div className="space-y-6">
                    <h3 className="text-xl font-headline font-normal tracking-tight">Product highlights</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {facility.amenities.map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity);
                        return (
                          <div key={idx} className="flex items-center gap-4 group">
                            <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-black/80">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Seller / Store Info */}
              {store && (
                <>
                  <Separator className="bg-black/[0.05]" />
                  <div className="space-y-4">
                    <h3 className="text-xl font-headline font-normal tracking-tight">Sold by</h3>
                    <Link href={`/stores/${facility.storeId}`} className="flex items-center gap-4 p-5 bg-[#f8f8f8] rounded-[24px] hover:bg-black/[0.04] transition-colors group">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{store.name || "Store"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {store.city && <span>{store.city}</span>}
                          {store.followerCount != null && store.followerCount > 0 && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span>{store.followerCount} followers</span>
                            </>
                          )}
                          {(store.offersDelivery || store.offersPickup) && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span>{[store.offersDelivery && "Delivery", store.offersPickup && "Pickup"].filter(Boolean).join(" · ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="availability" className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
              {facility.isAuction ? (
                /* Auction Mode */
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03] space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-primary" />
                      <h3 className="text-2xl font-headline font-normal tracking-tight">Place a Bid</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">This item is available via auction. Place your best bid below.</p>
                  </div>

                  {/* Countdown Timer */}
                  {auctionTimeLeft && (
                    <div className={cn(
                      "flex items-center justify-center gap-3 p-4 rounded-[20px] text-sm font-bold",
                      auctionTimeLeft === "Auction ended" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    )}>
                      <Timer className="h-4 w-4" />
                      {auctionTimeLeft === "Auction ended" ? "This auction has ended" : `Ends in ${auctionTimeLeft}`}
                    </div>
                  )}

                  <div className="p-6 bg-primary/5 rounded-[24px] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Current Bid</p>
                        <p className="text-2xl font-bold text-primary">₱{(facility.currentBid || facility.startingBid || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Total Bids</p>
                        <p className="text-lg font-bold">{facility.bidCount || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" />
                        <span>Starting: ₱{(facility.startingBid || 0).toLocaleString()}</span>
                      </div>
                      {facility.auctionEndDate && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>Ends {new Date(facility.auctionEndDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {facility.currentBidderId === user?.uid && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        You are the highest bidder!
                      </div>
                    )}
                  </div>

                  {auctionTimeLeft === "Auction ended" ? (
                    <div className="flex items-center gap-3 p-6 bg-red-50 rounded-[24px] text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-bold">Auction has ended</p>
                        <p className="text-xs opacity-80">No more bids can be placed on this item.</p>
                      </div>
                    </div>
                  ) : bidPlaced ? (
                    <div className="flex items-center gap-3 p-6 bg-green-50 rounded-[24px] text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-bold">Your bid has been placed!</p>
                        <p className="text-xs opacity-80">You’ll be notified if you’re outbid.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Bid (₱)</label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Min ₱${((facility.currentBid || facility.startingBid || 0) + 1).toLocaleString()}`}
                          className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg font-bold"
                        />
                        {bidAmount && parseFloat(bidAmount) <= (facility.currentBid || facility.startingBid || 0) && (
                          <p className="text-xs text-red-500 ml-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Bid must be higher than the current bid
                          </p>
                        )}
                      </div>
                      <button
                        disabled={bidSubmitting}
                        onClick={async () => {
                          if (!user) { router.push("/login"); return; }
                          const amt = parseFloat(bidAmount);
                          if (!amt || amt <= (facility.currentBid || facility.startingBid || 0)) return;
                          setBidSubmitting(true);
                          try {
                            // Insert bid record
                            await supabase.from("bids").insert({
                              productId: facility.id,
                              bidderId: user.uid,
                              amount: amt,
                            });
                            // Update product with new highest bid
                            await supabase.from("facilities").update({
                              currentBid: amt,
                              currentBidderId: user.uid,
                              bidCount: (facility.bidCount || 0) + 1,
                            }).eq("id", facility.id);
                            // Notify the seller about the new bid
                            if (facility.sellerId) {
                              await supabase.from("notifications").insert({
                                userId: facility.sellerId,
                                title: "New bid on your item!",
                                content: `Someone placed a ₱${amt.toLocaleString()} bid on "${facility.name}".`,
                                type: "bid",
                                timestamp: new Date().toISOString(),
                                isRead: false,
                              });
                            }
                            setBidPlaced(true);
                            setBidAmount("");
                            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#e03d8f', '#ff8fb1'] });
                            // Reset after 5s so user can bid again
                            setTimeout(() => setBidPlaced(false), 5000);
                          } catch (err) {
                            console.error("Bid error:", err);
                          } finally {
                            setBidSubmitting(false);
                          }
                        }}
                        className="w-full py-5 rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-sm disabled:opacity-50"
                      >
                        {bidSubmitting ? "Placing Bid..." : "Place Bid"}
                      </button>
                    </div>
                  )}

                  {/* Bid History */}
                  {bids && bids.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-black/[0.05]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-bold">Bid History</h4>
                        </div>
                        <span className="text-xs text-muted-foreground">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {bids.map((bid, idx) => (
                          <div key={bid.id} className={cn(
                            "flex items-center justify-between p-4 rounded-[16px] text-sm",
                            idx === 0 ? "bg-primary/5 border border-primary/10" : "bg-[#f8f8f8]"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                idx === 0 ? "bg-primary text-white" : "bg-black/10 text-black/50"
                              )}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-sm">
                                  {bid.bidderId === user?.uid ? "You" : (bidderNameMap[bid.bidderId] || "Bidder")}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(bid.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("font-bold", idx === 0 ? "text-primary" : "text-black/80")}>
                                ₱{bid.amount.toLocaleString()}
                              </p>
                              {idx === 0 && <span className="text-[9px] text-primary font-bold uppercase">Highest</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Purchase Mode */
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03] space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-normal tracking-tight">Select Quantity</h3>
                    <p className="text-sm text-muted-foreground">Choose your desired quantity and add to cart or buy directly.</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 p-6 bg-[#f8f8f8] rounded-[24px]">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-bold hover:bg-primary/10 transition-colors">−</button>
                    <span className="text-3xl font-bold w-16 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(availableStock || 999, quantity + 1))} className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-bold hover:bg-primary/10 transition-colors">+</button>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[24px] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Price per unit</p>
                        <p className="text-sm font-bold">₱{(facility.price || facility.pricePerNight || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Quantity</p>
                        <p className="text-sm font-bold text-primary">{quantity}</p>
                      </div>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between text-base font-bold pt-2">
                      <span>Total</span>
                      <span className="text-primary">₱{((facility.price || facility.pricePerNight || 0) * quantity).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!user) { router.push("/login"); return; }
                        await supabase.from("cart_items").upsert({ userId: user.uid, productId: facility.id, quantity }, { onConflict: "userId,productId" });
                        setAddedToCart(true);
                        setTimeout(() => setAddedToCart(false), 2000);
                      }}
                      className={cn(
                        "flex-1 py-5 rounded-full font-bold shadow-sm text-sm transition-all active:scale-95",
                        addedToCart ? "bg-green-500 text-white" : "bg-[#f8f8f8] text-black hover:bg-black/10"
                      )}
                    >
                      {addedToCart ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button
                      onClick={() => {
                        if (!user) { router.push("/login"); return; }
                        setSheetQty(quantity);
                        setQuickSheet({ open: true, intent: 'buy' });
                      }}
                      className="flex-1 py-5 rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-sm"
                    >
                      Buy Now
                    </button>
                  </div>

                  {(facility.stock !== undefined || facility.capacity > 0) && (
                    <p className="text-xs text-muted-foreground text-center">{availableStock} available in stock</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-headline font-normal tracking-tight">Buyer Reviews</h3>
                  <div className="flex items-center gap-2 bg-[#f8f8f8] px-4 py-2 rounded-full">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-bold">5.0 Overall</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {MOCK_REVIEWS.map((review, i) => (
                    <div key={i} className="p-6 bg-[#fcfcfc] border border-black/[0.03] rounded-[24px] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                            <img src={review.avatar} alt={review.name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{review.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex text-primary">
                          {Array.from({ length: review.stars }).map((_, s) => (
                            <Star key={s} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">"{review.text}"</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full h-14 rounded-full border-black/5 font-bold hover:bg-black/5 gap-2">
                  <MessageSquare className="h-4 w-4" /> Load more reviews
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── You Might Also Like ──────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 mb-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xl font-headline font-normal tracking-[-0.04em]">You might also like</h2>
              <span className="text-xs text-muted-foreground font-medium">{relatedProducts.length} items</span>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 min-w-max pb-2">
                {relatedProducts.map(product => (
                  <Link key={product.id} href={`/book/${product.id}`} className="w-[170px] md:w-[210px] shrink-0 flex flex-col gap-1.5 group">
                    <div className="relative aspect-square overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] bg-[#f8f8f8]">
                      <Image
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.isAuction && (
                        <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                          Auction
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="text-sm font-normal font-headline tracking-[-0.03em] line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-[11px] font-bold">5.0</span>
                        <span className="text-[11px] text-muted-foreground">· {product.type || "Product"}</span>
                      </div>
                      <p className="text-primary font-bold text-sm mt-0.5">
                        {product.isAuction
                          ? `₱${(product.currentBid || product.startingBid || 0).toLocaleString()}`
                          : `₱${(product.price || product.pricePerNight || 0).toLocaleString()}`
                        }
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-black/[0.05] p-4 pb-[max(env(safe-area-inset-bottom),16px)] animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container max-w-[700px] mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight">
                {facility.isAuction
                  ? `₱${(facility.currentBid || facility.startingBid || 0).toLocaleString()}`
                  : `₱${((facility.price || facility.pricePerNight || 0) * quantity).toLocaleString()}`
                }
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {facility.isAuction ? "current bid" : quantity > 1 ? `${quantity} items` : "/unit"}
              </span>
            </div>
            {!facility.isAuction && (
              <button
                className="text-[10px] font-bold text-primary tracking-tight hover:underline text-left mt-0.5"
                onClick={() => {
                  const availabilityTab = document.querySelector('[value="availability"]') as HTMLElement;
                  availabilityTab?.click();
                  availabilityTab?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {quantity > 1 ? `${quantity} × ₱${(facility.price || facility.pricePerNight || 0).toLocaleString()}` : "Select quantity"}
              </button>
            )}
          </div>

          {facility.isAuction ? (
            <button
              onClick={() => {
                const availabilityTab = document.querySelector('[value="availability"]') as HTMLElement;
                availabilityTab?.click();
                availabilityTab?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-10 h-[52px] rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-xs tracking-tight shrink-0"
            >
              Place Bid
            </button>
          ) : (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  if (!user) { router.push("/login"); return; }
                  setSheetQty(quantity);
                  setQuickSheet({ open: true, intent: 'cart' });
                }}
                className="px-5 h-[52px] rounded-full font-bold transition-all text-xs tracking-tight bg-[#f8f8f8] text-black hover:bg-black/10 active:scale-95"
              >
                Cart
              </button>
              <button
                onClick={() => {
                  if (!user) { router.push("/login"); return; }
                  setSheetQty(quantity);
                  setQuickSheet({ open: true, intent: 'buy' });
                }}
                className="px-8 h-[52px] rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-xs tracking-tight"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Selection Bottom Sheet ─────────────────────────── */}
      <Sheet open={quickSheet.open} onOpenChange={(v) => setQuickSheet(prev => ({ ...prev, open: v }))}>
        <SheetContent side="bottom" className="rounded-t-[32px] px-0 pb-0 pt-0 border-none outline-none max-w-lg mx-auto [&>button]:hidden">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="px-6 pb-8 space-y-6">
            {/* Product snapshot */}
            <div className="flex gap-4">
              <div className="h-24 w-24 rounded-[20px] overflow-hidden bg-[#f8f8f8] shrink-0 border border-black/[0.03]">
                <Image
                  src={facility.imageUrl || "/placeholder.svg"}
                  alt={facility.name}
                  width={96}
                  height={96}
                  className="object-cover h-full w-full"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-base font-bold truncate">{facility.name}</h3>
                <p className="text-lg font-bold text-primary mt-0.5">
                  ₱{(facility.price || facility.pricePerNight || 0).toLocaleString()}
                </p>
                <p className={cn("text-xs mt-1", availableStock > 0 ? "text-muted-foreground" : "text-red-500 font-bold")}>
                  {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
                </p>
              </div>
            </div>

            <Separator className="bg-black/[0.05]" />

            {/* Variation / Category */}
            {(facility.type || facility.category) && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Variation</p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-4 py-2.5 rounded-full bg-black text-white text-xs font-bold">
                    {facility.type || facility.category}
                  </div>
                </div>
              </div>
            )}

            {/* Amenities / Highlights as selectable tags */}
            {facility.amenities && facility.amenities.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities.map((tag, i) => (
                    <span key={i} className="px-3 py-2 rounded-full bg-[#f8f8f8] text-xs font-medium text-black/70 border border-black/[0.04]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-black/[0.05]" />

            {/* Quantity selector */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quantity</p>
              <div className="flex items-center justify-between bg-[#f8f8f8] rounded-full p-2">
                <button
                  onClick={() => setSheetQty(Math.max(1, sheetQty - 1))}
                  className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xl font-bold w-16 text-center">{sheetQty}</span>
                <button
                  onClick={() => setSheetQty(Math.min(availableStock || 999, sheetQty + 1))}
                  className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground font-medium">Total</span>
              <span className="text-xl font-bold text-primary">
                ₱{((facility.price || facility.pricePerNight || 0) * sheetQty).toLocaleString()}
              </span>
            </div>

            {/* Confirm Action */}
            {quickSheet.intent === 'cart' ? (
              <button
                disabled={availableStock <= 0}
                onClick={async () => {
                  if (!user) { router.push("/login"); return; }
                  setQuantity(sheetQty);
                  await supabase.from("cart_items").upsert(
                    { userId: user.uid, productId: facility.id, quantity: sheetQty },
                    { onConflict: "userId,productId" }
                  );
                  setQuickSheet({ open: false, intent: 'cart' });
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2500);
                }}
                className="w-full py-4 rounded-full bg-black text-white font-bold shadow-lg active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" />
                {addedToCart ? "✓ Added to Cart!" : "Add to Cart"}
              </button>
            ) : (
              <button
                disabled={availableStock <= 0}
                onClick={async () => {
                  if (!user) { router.push("/login"); return; }
                  setQuantity(sheetQty);
                  // Add to cart then redirect to checkout page
                  const { data: cartRow } = await supabase.from("cart_items").upsert(
                    { userId: user.uid, productId: facility.id, quantity: sheetQty },
                    { onConflict: "userId,productId" }
                  ).select("id").single();
                  if (cartRow?.id) {
                    localStorage.setItem("checkout_selected_ids", JSON.stringify([cartRow.id]));
                  }
                  setQuickSheet({ open: false, intent: 'buy' });
                  router.push("/checkout");
                }}
                className="w-full py-4 rounded-full bg-primary text-white font-bold shadow-lg active:scale-[0.98] transition-all text-sm disabled:opacity-40"
              >
                Buy Now · ₱{((facility.price || facility.pricePerNight || 0) * sheetQty).toLocaleString()}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showCheckout} onOpenChange={setShowCheckout}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-[40px] p-0 border-none outline-none">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-normal font-headline tracking-[-0.05em]">Order <span className="text-primary">Overview</span></h2>
                <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="bg-muted/30 rounded-[30px] p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-muted-foreground mb-1">Product</h4>
                      <p className="font-bold text-lg">{facility.name}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold tracking-tight text-muted-foreground mb-1">Total</h4>
                      <p className="font-black text-xl text-primary">₱{((facility.price || facility.pricePerNight || 0) * quantity).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center pt-2 border-t border-black/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">₱{(facility.price || facility.pricePerNight || 0).toLocaleString()} × {quantity}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-xs font-bold text-muted-foreground">{quantity} {quantity === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold tracking-tight text-muted-foreground ml-2">Select payment method</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setPaymentMethod('onsite')}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all",
                        paymentMethod === 'onsite' ? "border-primary bg-primary/5" : "border-black/5 bg-white hover:border-black/10"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", paymentMethod === 'onsite' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">Pay on site</p>
                        <p className="text-[10px] text-muted-foreground font-medium tracking-tighter">Settle payment upon delivery</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('gcash')}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all",
                        paymentMethod === 'gcash' ? "border-primary bg-primary/5" : "border-black/5 bg-white hover:border-black/10"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", paymentMethod === 'gcash' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">GCash transfer</p>
                        <p className="text-[10px] text-muted-foreground font-medium tracking-tighter">Fast & digital payment</p>
                      </div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'gcash' && (
                  <div className="p-6 bg-[#f2f2f2] rounded-[30px] flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <p className="text-[10px] font-bold tracking-tight mb-4">Scan to pay</p>
                    <div className="bg-white p-4 rounded-3xl shadow-sm mb-4 border border-black/5">
                      <img src="https://picsum.photos/seed/gcashqr/300/300" alt="GCash QR" className="w-40 h-40 object-contain" data-ai-hint="gcash qr" />
                    </div>
                    <div className="flex items-start gap-2 max-w-[240px] opacity-60">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium leading-relaxed">Please save a screenshot of your receipt for verification upon delivery.</p>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={confirmBooking}
                    className="w-full py-5 rounded-full bg-black text-white font-bold shadow-xl active:scale-95 transition-all text-sm tracking-tight"
                  >
                    Order now
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium italic">By clicking "Order Now", you agree to our marketplace policies.</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {showSuccess && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-white/40 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-[400px] w-full p-12 text-center animate-in zoom-in duration-700">
            <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-normal font-headline tracking-[-0.05em] mb-4">Order placed!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-10">
              Your order for {facility.name} is being processed. Check your profile for status updates.
            </p>
            <div className="flex flex-col gap-4">
              <button onClick={() => router.push('/profile')} className="bg-black text-white py-5 rounded-full font-bold shadow-md active:scale-95 transition-all text-xs tracking-tight w-full">
                View my orders
              </button>
              <button onClick={() => setShowSuccess(false)} className="text-primary font-bold text-xs tracking-tight hover:underline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
