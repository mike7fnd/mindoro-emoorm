"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  MessageSquare,
  Bell,
  LogOut,
  LayoutDashboard,
  Plus,
  Search,
  User,
  Package,
  Heart,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  useDoc,
  useStableMemo,
  useSupabaseAuth,
  useCollection,
  useSupabase,
} from "@/supabase";
import { useLanguage, type Lang } from "@/contexts/language-context";
import Image from "next/image";
import { useIsAdmin } from "@/hooks/use-is-admin";

function HeaderContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const { lang, setLang, t } = useLanguage();
  const [suggestions, setSuggestions] = useState<
    {
      type: "category" | "keyword" | "product" | "popular";
      label: string;
      id?: string;
      category?: string;
    }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const CATEGORIES = [
    "Vegetables",
    "Fruits",
    "Seafood",
    "Meat",
    "Snacks",
    "Rice & Grains",
    "Handicrafts",
    "Wellness",
    "Delicacies",
  ];

  const SLIDING_TEXTS = [
    "Search in Emoorm",
    "Fresh Vegetables",
    "Seafood and Fish",
    "Local Handicrafts",
    "Farm Fresh Fruits",
    "Organic Products",
    "Rice and Grains",
    "Artisan Delicacies",
    "Native Chicken",
    "Wellness Herbs",
  ];

  const POPULAR_SEARCHES = [
    "Fresh Vegetables",
    "Seafood",
    "Native Chicken",
    "Organic Products",
    "Rice and Grains",
    "Local Honey",
    "Handicrafts",
    "Farm Fresh Fruits",
    "Malunggay",
    "Calamansi",
    "Bangus",
    "Longganisa",
  ];

  const AGRI_KEYWORDS = [
    // Vegetables
    "Ampalaya",
    "Sitaw",
    "Kangkong",
    "Pechay",
    "Talong",
    "Okra",
    "Kamote",
    "Kamatis",
    "Sibuyas",
    "Bawang",
    "Luya",
    "Labanos",
    "Patola",
    "Upo",
    "Kalabasa",
    "Repolyo",
    "Spinach",
    "Lettuce",
    "Carrots",
    "Potato",
    "Sweet Potato",
    "Gabi",
    "Singkamas",
    "Malunggay",
    "Alugbati",
    "Saluyot",
    "Paria",
    "Mustasa",
    // Fruits
    "Mango",
    "Saging",
    "Banana",
    "Papaya",
    "Langka",
    "Jackfruit",
    "Rambutan",
    "Lanzones",
    "Mangosteen",
    "Durian",
    "Pineapple",
    "Pinya",
    "Pakwan",
    "Watermelon",
    "Melon",
    "Guyabano",
    "Atis",
    "Chico",
    "Guava",
    "Bayabas",
    "Avocado",
    "Calamansi",
    "Dalandan",
    "Dayap",
    "Kamias",
    "Santol",
    "Pomelo",
    "Suha",
    "Buko",
    "Coconut",
    "Marang",
    "Coconut Sugar",
    "Niyog",
    // Seafood
    "Bangus",
    "Tilapia",
    "Galunggong",
    "Pusit",
    "Squid",
    "Hipon",
    "Shrimp",
    "Talaba",
    "Oyster",
    "Alimango",
    "Crab",
    "Alimasag",
    "Tambakol",
    "Tuna",
    "Tanigue",
    "Lapu-lapu",
    "Maya-maya",
    "Espada",
    "Tuyo",
    "Daing",
    "Dried Fish",
    "Tinapa",
    "Smoked Fish",
    "Bagoong",
    "Patis",
    // Meat & Poultry
    "Manok",
    "Chicken",
    "Baboy",
    "Pork",
    "Baka",
    "Beef",
    "Itik",
    "Duck",
    "Kambing",
    "Goat",
    "Itlog",
    "Egg",
    "Native Chicken",
    "Free Range",
    "Organic Meat",
    // Rice & Grains
    "Bigas",
    "Rice",
    "Palay",
    "Brown Rice",
    "Sinandomeng",
    "Dinorado",
    "Jasmine Rice",
    "Glutinous Rice",
    "Malagkit",
    "Corn",
    "Mais",
    "Mongo",
    "Mung Beans",
    "Munggo",
    "Soy Beans",
    "Peanut",
    "Mani",
    "Adlai",
    "Quinoa",
    "Oats",
    "Wheat",
    "Cassava",
    "Kamoteng Kahoy",
    // Spices & Condiments
    "Peppercorn",
    "Paminta",
    "Laurel",
    "Bay Leaf",
    "Tanglad",
    "Lemongrass",
    "Dahon ng Pandan",
    "Turmeric",
    "Luyang Dilaw",
    "Oregano",
    "Basil",
    "Rosemary",
    "Chili",
    "Sili",
    "Paprika",
    "Vinegar",
    "Suka",
    "Coconut Vinegar",
    "Toyo",
    "Soy Sauce",
    "Fish Sauce",
    // Processed & Delicacies
    "Pastillas",
    "Polvoron",
    "Tablea",
    "Chocolate",
    "Ube Jam",
    "Buko Pie",
    "Bibingka",
    "Puto",
    "Kakanin",
    "Palitaw",
    "Sapin Sapin",
    "Leche Flan",
    "Yema",
    "Barquillos",
    "Otap",
    "Broas",
    "Tocino",
    "Longganisa",
    "Chicharon",
    "Atchara",
    "Pickle",
    "Jam",
    "Honey",
    "Pulot",
    // Wellness & Herbal
    "Lagundi",
    "Sambong",
    "Yerba Buena",
    "Tsaang Gubat",
    "Ampalaya Tea",
    "Moringa",
    "Malunggay Tea",
    "Guyabano Leaves",
    "Herbal Tea",
    "Organic",
    "Aloe Vera",
    "Banaba",
    "Dahon ng Siling Labuyo",
    // Handicrafts & Farming
    "Bamboo",
    "Kawayan",
    "Rattan",
    "Yakan",
    "Woven",
    "Basket",
    "Coconut Shell",
    "Wood Carving",
    "Organic Fertilizer",
    "Vermicompost",
    "Native",
    "Heirloom",
    "Farm Fresh",
    "Harvest",
    "Fresh",
  ];

  useEffect(() => {
    setHeaderSearch(searchParams.get("q") || "");
  }, [searchParams]);

  // Fetch smart suggestions with debounce
  useEffect(() => {
    const term = headerSearch.trim();

    if (!term || term.length < 2) {
      if (isFocused) {
        setSuggestions(
          POPULAR_SEARCHES.map((label) => ({
            type: "popular" as const,
            label,
          })),
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    const termLower = term.toLowerCase();
    const timer = setTimeout(async () => {
      const catMatches = CATEGORIES.filter((c) =>
        c.toLowerCase().includes(termLower),
      ).map((c) => ({ type: "category" as const, label: c }));

      const keywordMatches = AGRI_KEYWORDS.filter(
        (k) =>
          k.toLowerCase().includes(termLower) &&
          !catMatches.some((c) => c.label.toLowerCase() === k.toLowerCase()),
      )
        .slice(0, 5)
        .map((k) => ({ type: "keyword" as const, label: k }));

      const { data: facilities } = await supabase
        .from("facilities")
        .select("id, name, category")
        .ilike("name", `%${term}%`)
        .limit(5);

      const prodMatches = (facilities || []).map((p: any) => ({
        type: "product" as const,
        label: p.name,
        id: p.id,
        category: p.category,
      }));

      setSuggestions([...catMatches, ...keywordMatches, ...prodMatches]);
      setShowSuggestions(true);
    }, 280);
    return () => clearTimeout(timer);
  }, [headerSearch, isFocused]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Animated ticker for search placeholder
  useEffect(() => {
    if (headerSearch) return;
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % SLIDING_TEXTS.length;
      setTickerIdx(idx);
      setTickerKey((k) => k + 1);
    }, 2800);
    return () => clearInterval(id);
  }, [headerSearch]);
  const { user, auth } = useSupabaseAuth();
  const { isAdmin } = useIsAdmin();

  const isBookDetailPage =
    pathname?.startsWith("/book/") && pathname !== "/book";

  // Hide bottom nav when "inside" a chat on mobile
  const isMessagePage =
    pathname === "/messages" || pathname === "/admin/messages";
  const hasActiveChat = searchParams.get("id") || searchParams.get("user");

  // Pages that have a corresponding bottom nav item
  const bottomNavPages = [
    "/",
    "/cart",
    "/notifications",
    "/messages",
    "/profile",
    "/admin/dashboard",
    "/admin/orders",
    "/admin/messages",
    "/admin/settings",
  ];
  const isOnBottomNavPage = bottomNavPages.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p),
  );

  const shouldHideBottomNav =
    isBookDetailPage || (isMessagePage && hasActiveChat) || !isOnBottomNavPage;

  const userProfileRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "users", id: user.uid };
  }, [user]);

  const { data: userProfile } = useDoc(userProfileRef);

  // Unread notifications count
  const unreadQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "notifications",
      filters: [
        { column: "userId", op: "eq" as const, value: user.uid },
        { column: "isRead", op: "eq" as const, value: false },
      ],
    };
  }, [user]);
  const { data: unreadNotifications } = useCollection<{ id: string }>(
    unreadQuery,
  );
  const unreadCount = unreadNotifications?.length || 0;

  const cartQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "cart_items",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
    };
  }, [user]);
  const { data: cartItems } = useCollection<{ id: string }>(cartQuery);
  const cartCount = cartItems?.length ?? 0;

  const recentNotifQuery = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "notifications",
      filters: [{ column: "userId", op: "eq" as const, value: user.uid }],
      order: { column: "timestamp", ascending: false },
      limit: 5,
    };
  }, [user]);
  const { data: recentNotifications } = useCollection<{
    id: string;
    title: string;
    content: string;
    type: string;
    timestamp: string;
    isRead: boolean;
  }>(recentNotifQuery);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      gsap.to(mobileMenuRef.current, {
        right: -300,
        duration: 0.4,
        ease: "power2.inOut",
      });
      gsap.to(mobileOverlayRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => setIsMobileMenuOpen(false),
      });
    } else {
      setIsMobileMenuOpen(true);
      setTimeout(() => {
        gsap.to(mobileMenuRef.current, {
          right: 0,
          duration: 0.4,
          ease: "back.out(1.4)",
        });
        gsap.to(mobileOverlayRef.current, {
          opacity: 1,
          duration: 0.3,
        });
      }, 10);
    }
  };

  const handleHeaderSearch = (value: string) => {
    setHeaderSearch(value);
    setShowSuggestions(false);
    const encoded = encodeURIComponent(value);
    if (pathname === "/") {
      router.replace(`/?q=${encoded}`);
    } else {
      router.push(`/?q=${encoded}`);
    }
  };

  const handleSuggestionClick = (s: (typeof suggestions)[number]) => {
    setShowSuggestions(false);
    setIsFocused(false);
    if (s.type === "category") {
      setHeaderSearch("");
      router.push(`/?cat=${encodeURIComponent(s.label)}`);
    } else {
      setHeaderSearch(s.label);
      router.push(`/?q=${encodeURIComponent(s.label)}`);
    }
  };

  const suggestionGroups = [
    { key: "popular", label: "Popular Searches", Icon: TrendingUp },
    { key: "category", label: "Categories", Icon: Tag },
    { key: "keyword", label: "Related Searches", Icon: Search },
    { key: "product", label: "Products", Icon: Package },
  ] as const;

  // "Sell on Emoorm" smart routing
  const handleSellClick = async () => {
    if (!user) {
      router.push("/sell");
      return;
    }
    const { data } = await supabase
      .from("stores")
      .select("id")
      .eq("id", user.uid)
      .maybeSingle();
    router.push(data ? "/seller/dashboard" : "/seller/register");
  };

  // After login, check for a pending sell intent and redirect
  useEffect(() => {
    if (!user) return;
    const intent = sessionStorage.getItem("postAuthRedirect");
    if (intent !== "seller") return;
    sessionStorage.removeItem("postAuthRedirect");
    supabase
      .from("stores")
      .select("id")
      .eq("id", user.uid)
      .maybeSingle()
      .then(({ data }) => {
        router.push(data ? "/seller/dashboard" : "/seller/register");
      });
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const profilePic =
    userProfile?.profilePictureUrl ||
    user?.photoURL ||
    "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg";

  const displayName =
    (userProfile as any)?.name ||
    (userProfile as any)?.displayName ||
    (userProfile as any)?.username ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Account";

  const isHome = pathname === "/";

  return (
    <>
      {/* Top Bar */}
      <div className={isHome ? "top-bar" : "top-bar static-header"}>
        <div className="top-bar-inner">
          <div className="top-bar-left">
            <Link href="/feedback">{t("topbar.feedback")}</Link>
            <div className="top-bar-divider" />
            <button
              onClick={handleSellClick}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {t("topbar.sell")}
            </button>
            <div className="top-bar-divider" />
            <Link href="/customer-care">{t("topbar.care")}</Link>
          </div>
          <div className="top-bar-right">
            <div
              ref={notifDropdownRef}
              className="top-bar-notif-wrap"
              onMouseEnter={() => setShowNotifDropdown(true)}
              onMouseLeave={() => setShowNotifDropdown(false)}
            >
              <Link
                href="/notifications"
                className="top-bar-notif"
                aria-label="Notifications"
              >
                <Bell className="h-[14px] w-[14px]" />
                {unreadCount > 0 && (
                  <span className="top-bar-notif-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <div className={`top-bar-notif-dropdown${showNotifDropdown ? " open" : ""}`}>
                <div className="top-bar-notif-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="top-bar-notif-unread-pill">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="top-bar-notif-list">
                  {!user ? (
                    <p className="top-bar-notif-empty">
                      Sign in to see notifications
                    </p>
                  ) : !recentNotifications ||
                    recentNotifications.length === 0 ? (
                    <p className="top-bar-notif-empty">
                      No notifications yet
                    </p>
                  ) : (
                    recentNotifications.map((n) => (
                      <Link
                        key={n.id}
                        href="/notifications"
                        className={`top-bar-notif-item${!n.isRead ? " unread" : ""}`}
                      >
                        <div className="top-bar-notif-item-title">
                          {n.title}
                        </div>
                        <div className="top-bar-notif-item-body">
                          {n.content}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/notifications" className="top-bar-notif-footer">
                  View all notifications →
                </Link>
              </div>
            </div>
            <div className="top-bar-divider" />
            <div className="top-bar-lang">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
              >
                <option value="en">English</option>
                <option value="tl">Tagalog</option>
                <option value="ceb">Bisaya</option>
              </select>
            </div>
            <div className="top-bar-divider" />
            {user ? (
              <div
                className="top-bar-profile-wrap"
                style={{ position: "relative" }}
              >
                <Link
                  href={isAdmin ? "/admin/settings" : "/profile"}
                  className="top-bar-profile"
                >
                  <img src={profilePic} alt="profile" />
                  <span>{displayName}</span>
                </Link>
                {!isAdmin && (
                  <div className="top-bar-profile-dropdown">
                    <div className="top-bar-profile-dropdown-inner">
                      <Link
                        href="/profile"
                        className="top-bar-profile-dropdown-item"
                      >
                        <User className="h-3.5 w-3.5" /> {t("nav.profile")}
                      </Link>
                      <Link
                        href="/my-bookings"
                        className="top-bar-profile-dropdown-item"
                      >
                        <Package className="h-3.5 w-3.5" /> {t("nav.orders")}
                      </Link>
                      <Link
                        href="/wishlist"
                        className="top-bar-profile-dropdown-item"
                      >
                        <Heart className="h-3.5 w-3.5" /> {t("nav.wishlist")}
                      </Link>
                      <div className="top-bar-profile-dropdown-divider" />
                      <button
                        onClick={async () => {
                          await auth.signOut();
                          router.push("/login");
                        }}
                        className="top-bar-profile-dropdown-item top-bar-profile-dropdown-logout"
                      >
                        <LogOut className="h-3.5 w-3.5" /> {t("nav.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href="?auth=signin">{t("topbar.signin")}</Link>
                <span style={{ color: "#444" }}>/</span>
                <Link href="?auth=signup">{t("topbar.signup")}</Link>
              </div>
            )}
          </div>
        </div>
        {/* end top-bar-inner */}
      </div>

      <div
        className={
          isHome ? "site-nav has-top-bar" : "site-nav has-top-bar static-header"
        }
      >
        <div className="site-nav-inner">
          <div className="nav-side left-side">
            <div className="brand">
              <Link
                href="/"
                className="logo"
                style={{ display: "flex", alignItems: "center", gap: 3 }}
              >
                <Image
                  src="/brand-icon.png"
                  alt="Emoorm"
                  width={48}
                  height={48}
                  style={{ objectFit: "contain" }}
                />
                <span
                  style={{
                    fontFamily: "'Ubuntu', sans-serif",
                    fontWeight: 700,
                    fontSize: "2.3rem",
                    letterSpacing: "-0.06em",
                  }}
                >
                  emoorm
                </span>
              </Link>
            </div>
          </div>

          {isAdmin ? (
            <nav className="navlinks">
              <Link
                href="/admin/dashboard"
                className={cn(isLinkActive("/admin/dashboard") && "active")}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className={cn(isLinkActive("/admin/orders") && "active")}
              >
                Orders
              </Link>
              <Link
                href="/admin/products"
                className={cn(isLinkActive("/admin/products") && "active")}
              >
                Products
              </Link>
              <Link
                href="/admin/messages"
                className={cn(isLinkActive("/admin/messages") && "active")}
              >
                Messages
              </Link>
            </nav>
          ) : (
            <div className="header-search-wrap" ref={suggestionsRef}>
              <div className="header-search" style={{ position: "relative" }}>
                <div
                  className="header-search-input-wrap"
                  style={{ position: "relative" }}
                >
                  {/* Animated ticker placeholder */}
                  {!headerSearch && (
                    <span
                      key={tickerKey}
                      className={`search-ticker-text${tickerKey > 0 ? " search-ticker-in" : ""}`}
                      aria-hidden="true"
                    >
                      {SLIDING_TEXTS[tickerIdx]}
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder=""
                    className="header-search-input"
                    value={headerSearch}
                    onChange={(e) => {
                      setHeaderSearch(e.target.value);
                    }}
                    onFocus={() => {
                      setIsFocused(true);
                      setShowSuggestions(true);
                    }}
                    onBlur={() =>
                      setTimeout(() => {
                        setIsFocused(false);
                      }, 150)
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleHeaderSearch(headerSearch)
                    }
                    autoComplete="off"
                  />
                </div>
                <button
                  className="header-search-btn"
                  onClick={() => handleHeaderSearch(headerSearch)}
                  aria-label="Search"
                >
                  <Search />
                </button>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="search-suggestions">
                    {!headerSearch && (
                      <p className="search-suggestions-header">
                        Popular Searches
                      </p>
                    )}
                    {suggestionGroups.map((group) => {
                      const items = suggestions.filter(
                        (s) => s.type === group.key,
                      );
                      if (items.length === 0) return null;
                      if (group.key === "popular") {
                        return (
                          <div
                            key="popular"
                            className="search-suggestions-popular"
                          >
                            {items.map((s, i) => (
                              <button
                                key={i}
                                className="search-popular-chip"
                                onClick={() => handleSuggestionClick(s)}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={group.key}
                          className="search-suggestions-group"
                        >
                          <p className="search-suggestions-label">
                            <group.Icon
                              className="search-suggestions-label-icon"
                              strokeWidth={1.8}
                            />
                            {group.label}
                          </p>
                          {items.map((s, i) => (
                            <button
                              key={s.id ?? `${group.key}-${i}`}
                              className="search-suggestion-item"
                              onClick={() => handleSuggestionClick(s)}
                            >
                              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-left">
                                {s.label}
                              </span>
                              {s.type === "category" && (
                                <span className="search-suggestion-tag">
                                  Category
                                </span>
                              )}
                              {s.type === "product" && s.category && (
                                <span className="search-suggestion-tag">
                                  {s.category}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Link
                href="/cart"
                className="header-cart-icon"
                aria-label="Cart"
                style={{ position: "relative" }}
              >
                <ShoppingCart className="h-[28px] w-[28px]" />
                {cartCount > 0 && <span className="cart-badge" />}
              </Link>
            </div>
          )}

          <div className="nav-side right-side" />
        </div>
        {/* end site-nav-inner */}
      </div>

      {!shouldHideBottomNav && (
        <div className="mobile-bottom-nav">
          <div className="mobile-nav-container">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/admin/dashboard") && "active",
                  )}
                >
                  <div className="mobile-nav-icon">
                    <LayoutDashboard
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={
                        isLinkActive("/admin/dashboard")
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </div>
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/orders"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/admin/orders") && "active",
                  )}
                >
                  <div className="mobile-nav-icon">
                    <ShoppingCart
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={
                        isLinkActive("/admin/orders") ? "currentColor" : "none"
                      }
                    />
                  </div>
                  <span>Orders</span>
                </Link>
                <Link
                  href="/admin/messages"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/admin/messages") && "active",
                  )}
                >
                  <div className="mobile-nav-icon">
                    <MessageSquare
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={
                        isLinkActive("/admin/messages")
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </div>
                  <span>Inbox</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/") && "active",
                  )}
                >
                  <div className="mobile-nav-icon">
                    <Home
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={isLinkActive("/") ? "currentColor" : "none"}
                    />
                  </div>
                  <span>Home</span>
                </Link>
                <Link
                  href="/cart"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/cart") && "active",
                  )}
                >
                  <div
                    className="mobile-nav-icon"
                    style={{ position: "relative" }}
                  >
                    <ShoppingCart
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={isLinkActive("/cart") ? "currentColor" : "none"}
                    />
                    {cartCount > 0 && <span className="cart-badge" />}
                  </div>
                  <span>Cart</span>
                </Link>
                <Link
                  href="/notifications"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/notifications") && "active",
                  )}
                >
                  <div className="mobile-nav-icon relative">
                    <Bell
                      className="h-[30px] w-[30px]"
                      strokeWidth={1.2}
                      fill={
                        isLinkActive("/notifications") ? "currentColor" : "none"
                      }
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                </Link>
                {user && (
                  <Link
                    href="/messages"
                    className={cn(
                      "mobile-nav-item",
                      isLinkActive("/messages") && "active",
                    )}
                  >
                    <div className="mobile-nav-icon">
                      <MessageSquare
                        className="h-[30px] w-[30px]"
                        strokeWidth={1.2}
                        fill={
                          isLinkActive("/messages") ? "currentColor" : "none"
                        }
                      />
                    </div>
                    <span>Inbox</span>
                  </Link>
                )}
              </>
            )}
            {user ? (
              isAdmin ? (
                <Link
                  href="/admin/settings"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/admin/settings") && "active",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full overflow-hidden border-2 transition-all",
                      isLinkActive("/admin/settings")
                        ? "border-primary scale-110 shadow-lg"
                        : "border-muted",
                    )}
                  >
                    <Image
                      src={profilePic}
                      alt="PFP"
                      width={32}
                      height={32}
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  </div>
                  <span>Settings</span>
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className={cn(
                    "mobile-nav-item",
                    isLinkActive("/profile") && "active",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full overflow-hidden border-2 transition-all",
                      isLinkActive("/profile")
                        ? "border-primary scale-110 shadow-lg"
                        : "border-muted",
                    )}
                  >
                    <Image
                      src={profilePic}
                      alt="PFP"
                      width={32}
                      height={32}
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  </div>
                  <span>Profile</span>
                </Link>
              )
            ) : (
              <Link href="?auth=signin" className="mobile-nav-item">
                <div className="mobile-nav-icon">
                  <LogOut
                    className="h-[30px] w-[30px] rotate-180"
                    strokeWidth={1.2}
                    fill="none"
                  />
                </div>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        ref={mobileOverlayRef}
        className={cn("mobile-menu-overlay", isMobileMenuOpen && "active")}
        style={{ visibility: isMobileMenuOpen ? "visible" : "hidden" }}
        onClick={toggleMobileMenu}
      />

      <div
        ref={mobileMenuRef}
        className={cn("mobile-menu", isMobileMenuOpen && "active")}
      >
        <h3 className="font-headline italic font-bold text-2xl mb-8 text-primary">
          E-Moorm
        </h3>
        <nav className="flex flex-col gap-3 mb-8">
          {isAdmin ? (
            <>
              <Link
                href="/admin/dashboard"
                className={cn(
                  "mobile-menu-link",
                  isLinkActive("/admin/dashboard") && "active",
                )}
              >
                <LayoutDashboard className="h-5 w-5 mr-2" strokeWidth={1.5} />{" "}
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className={cn(
                  "mobile-menu-link",
                  isLinkActive("/admin/orders") && "active",
                )}
              >
                <ShoppingCart className="h-5 w-5 mr-2" strokeWidth={1.5} />{" "}
                Orders
              </Link>
              <Link
                href="/admin/products"
                className={cn(
                  "mobile-menu-link",
                  isLinkActive("/admin/products") && "active",
                )}
              >
                <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} /> Products
              </Link>
              <Link
                href="/admin/messages"
                className={cn(
                  "mobile-menu-link",
                  isLinkActive("/admin/messages") && "active",
                )}
              >
                <MessageSquare className="h-5 w-5 mr-2" strokeWidth={1.5} />{" "}
                Messages
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={cn(
                  "mobile-menu-link",
                  isLinkActive("/") && "active",
                )}
              >
                <Home className="h-5 w-5 mr-2" strokeWidth={1.5} /> Home
              </Link>
              {!user && (
                <Link
                  href="/book"
                  className={cn(
                    "mobile-menu-link",
                    isLinkActive("/book") && "active",
                  )}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" strokeWidth={1.5} />{" "}
                  Shop
                </Link>
              )}
              {user && (
                <Link
                  href="/messages"
                  className={cn(
                    "mobile-menu-link",
                    isLinkActive("/messages") && "active",
                  )}
                >
                  <MessageSquare className="h-5 w-5 mr-2" strokeWidth={1.5} />{" "}
                  Messages
                </Link>
              )}
            </>
          )}
        </nav>
        {user ? (
          <div className="pt-6 border-t border-black/10">
            <Link
              href={isAdmin ? "/admin/settings" : "/profile"}
              className="mobile-menu-link"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                <Image
                  src={profilePic}
                  alt="PFP"
                  width={24}
                  height={24}
                  className="object-cover h-full w-full"
                  unoptimized
                />
              </div>
              {isAdmin ? "Settings" : "Profile"}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left mobile-menu-link text-destructive"
            >
              <LogOut className="h-5 w-5 mr-2" strokeWidth={1.5} /> Logout
            </button>
          </div>
        ) : (
          <div className="pt-6 border-t border-black/10">
            <Link
              href="?auth=signin"
              className="block w-full p-4 mb-3 text-center bg-black/5 rounded-xl font-bold"
            >
              Login
            </Link>
            <Link
              href="?auth=signup"
              className="block w-full p-4 mb-3 text-center bg-primary text-white rounded-xl font-bold shadow-lg"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export function Header() {
  return (
    <Suspense>
      <HeaderContent />
    </Suspense>
  );
}
