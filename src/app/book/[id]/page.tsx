"use client";

import React, { useState, use, useMemo, useRef, useEffect } from "react";
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
  AlertCircle
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
  isAuction?: boolean;
  auctionEndDate?: string;
  startingBid?: number;
  currentBid?: number;
  currentBidderId?: string;
  bidCount?: number;
  storeId?: string;
  sellerId?: string;
  sellerName?: string;
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
  const [addedToCart, setAddedToCart] = useState(false);

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

  // Fetch bookings for this facility to show availability
  const bookingsQuery = useStableMemo(() => {
    if (!id) return null;
    return { table: "bookings", filters: [{ column: "facilityId", op: "eq" as const, value: id }] };
  }, [id]);

  const { data: facilityBookings } = useCollection<Booking>(bookingsQuery);

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
                <span className="text-sm font-medium">Oriental Mindoro</span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                5.0
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 font-bold tracking-tight">15+ Reviews</span>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full bg-[#f8f8f8] p-1 h-14 rounded-full mb-8">
              <TabsTrigger value="details" className="flex-1 rounded-full h-12 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Details</TabsTrigger>
              <TabsTrigger value="availability" className="flex-1 rounded-full h-12 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Order</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 rounded-full h-12 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-10 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Clock className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Unit</span>
                    <span className="text-sm font-medium text-black/80">Per piece / kilo</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-full bg-[#f8f8f8] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase mb-0.5">Stock</span>
                    <span className="text-sm font-medium text-black/80">{facility.capacity} Available</span>
                  </div>
                </div>
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
            </TabsContent>

            <TabsContent value="availability" className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
              {facility.isAuction ? (
                /* Auction Mode */
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/[0.03] space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-normal tracking-tight">Place a Bid</h3>
                    <p className="text-sm text-muted-foreground">This item is available via auction. Place your best bid below.</p>
                  </div>

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
                    {facility.auctionEndDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Ends {new Date(facility.auctionEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {bidPlaced ? (
                    <div className="flex items-center gap-3 p-6 bg-green-50 rounded-[24px] text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm font-medium">Your bid has been placed!</p>
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
                      </div>
                      <button
                        onClick={async () => {
                          if (!user) { router.push("/login"); return; }
                          const amt = parseFloat(bidAmount);
                          if (!amt || amt <= (facility.currentBid || facility.startingBid || 0)) return;
                          await supabase.from("bids").insert({ productId: facility.id, bidderId: user.uid, amount: amt });
                          await supabase.from("facilities").update({ currentBid: amt, currentBidderId: user.uid, bidCount: (facility.bidCount || 0) + 1 }).eq("id", facility.id);
                          setBidPlaced(true);
                        }}
                        className="w-full py-5 rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-sm"
                      >
                        Place Bid
                      </button>
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
                    <button onClick={() => setQuantity(Math.min(facility.capacity || 999, quantity + 1))} className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-bold hover:bg-primary/10 transition-colors">+</button>
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
                      onClick={handleBookingClick}
                      className="flex-1 py-5 rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-sm"
                    >
                      Buy Now
                    </button>
                  </div>

                  {(facility.stock !== undefined || facility.capacity > 0) && (
                    <p className="text-xs text-muted-foreground text-center">{facility.stock || facility.capacity} available in stock</p>
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
                onClick={async () => {
                  if (!user) { router.push("/login"); return; }
                  await supabase.from("cart_items").upsert({ userId: user.uid, productId: facility.id, quantity }, { onConflict: "userId,productId" });
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                className={cn(
                  "px-5 h-[52px] rounded-full font-bold transition-all text-xs tracking-tight",
                  addedToCart ? "bg-green-500 text-white" : "bg-[#f8f8f8] text-black hover:bg-black/10 active:scale-95"
                )}
              >
                {addedToCart ? "✓" : "Cart"}
              </button>
              <button
                onClick={handleBookingClick}
                className="px-8 h-[52px] rounded-full bg-primary text-white font-bold shadow-lg active:scale-95 transition-all text-xs tracking-tight"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

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
