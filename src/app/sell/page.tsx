"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { useUser, useSupabase, useStableMemo, useDoc } from "@/supabase";
import {
  Store,
  Users,
  Truck,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Store,
    title: "Free to open a shop",
    desc: "No monthly fees or listing costs. Keep more of what you earn.",
  },
  {
    icon: Users,
    title: "Reach local buyers",
    desc: "Connect directly with buyers in Oriental Mindoro who want fresh, local products.",
  },
  {
    icon: Truck,
    title: "You control delivery",
    desc: "Set your own delivery area and schedule. No third-party courier required.",
  },
  {
    icon: MessageSquare,
    title: "Direct buyer messaging",
    desc: "Chat with buyers in real time to confirm orders and build relationships.",
  },
  {
    icon: BarChart3,
    title: "Track your performance",
    desc: "See your sales, reviews, and earnings from a simple seller dashboard.",
  },
  {
    icon: Shield,
    title: "Verified & trusted",
    desc: "Government ID verification builds buyer trust and protects the community.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create a seller account",
    desc: "Sign up in minutes with your name and email.",
  },
  {
    n: "2",
    title: "Register your shop",
    desc: "Fill in your store name, location, and upload your valid ID.",
  },
  {
    n: "3",
    title: "List your products",
    desc: "Add photos, prices, and descriptions of what you sell.",
  },
  {
    n: "4",
    title: "Start earning",
    desc: "Buyers find you, place orders, and you deliver.",
  },
];

type DropItem = {
  icon?: React.ElementType;
  n?: string;
  title: string;
  desc?: string;
  href: string;
};
type NavLink = {
  label: string;
  href: string;
  dropdown?: { title?: string; items: DropItem[] }[];
};

const NAV_LINKS: NavLink[] = [
  {
    label: "How it works",
    href: "#how-it-works",
    dropdown: [
      {
        title: "Getting started",
        items: [
          { n: "1", title: "Create a seller account", desc: "Sign up in minutes with your name and email.", href: "#how-it-works" },
          { n: "2", title: "Register your shop", desc: "Set your store name, location, and upload your valid ID.", href: "#how-it-works" },
          { n: "3", title: "List your products", desc: "Add photos, prices, and descriptions of what you sell.", href: "#how-it-works" },
          { n: "4", title: "Start earning", desc: "Buyers find you, place orders, and you deliver directly.", href: "#how-it-works" },
        ],
      },
    ],
  },
  {
    label: "Benefits",
    href: "#benefits",
    dropdown: [
      {
        title: "Why Emoorm",
        items: [
          { icon: Store,         title: "Free to open a shop",    desc: "No monthly fees. Keep more of what you earn.",           href: "#benefits" },
          { icon: Users,         title: "Reach local buyers",     desc: "Connect with buyers across Oriental Mindoro.",            href: "#benefits" },
          { icon: Truck,         title: "You control delivery",   desc: "Set your own area, schedule, and delivery rules.",        href: "#benefits" },
          { icon: MessageSquare, title: "Direct messaging",       desc: "Chat with buyers in real time to confirm orders.",        href: "#benefits" },
          { icon: BarChart3,     title: "Track performance",      desc: "See sales, reviews, and earnings at a glance.",           href: "#benefits" },
          { icon: Shield,        title: "Verified & trusted",     desc: "Gov't ID verification builds buyer confidence.",          href: "#benefits" },
        ],
      },
    ],
  },
  {
    label: "Categories",
    href: "#categories",
    dropdown: [
      {
        title: "What you can sell",
        items: [
          { title: "Vegetables",           href: "/?cat=Vegetables" },
          { title: "Fruits",               href: "/?cat=Fruits" },
          { title: "Seafood",              href: "/?cat=Seafood" },
          { title: "Rice & Grains",        href: "/?cat=Rice+%26+Grains" },
          { title: "Meat & Poultry",       href: "/?cat=Meat+%26+Poultry" },
          { title: "Dairy",                href: "/?cat=Dairy" },
          { title: "Handicrafts",          href: "/?cat=Handicrafts" },
          { title: "Wellness Products",    href: "/?cat=Wellness" },
          { title: "Delicacies",           href: "/?cat=Delicacies" },
          { title: "Beverages",            href: "/?cat=Beverages" },
          { title: "Condiments & Sauces",  href: "/?cat=Condiments" },
          { title: "Seedlings & Plants",   href: "/?cat=Seedlings" },
        ],
      },
    ],
  },
];

function NavTrigger({
  link,
  active,
  onHover,
}: {
  link: NavLink;
  active: boolean;
  onHover: () => void;
}) {
  return (
    <a
      href={link.href}
      onMouseEnter={onHover}
      className={[
        "flex items-center gap-1 px-4 py-2 rounded-lg text-base font-medium transition-colors duration-150",
        active
          ? "text-[#111] bg-[#f2f2f0]"
          : "text-[#555] hover:text-[#111] hover:bg-[#f2f2f0]",
      ].join(" ")}
    >
      {link.label}
      {link.dropdown && (
        <ChevronDown
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: active ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      )}
    </a>
  );
}

function NavExpandedContent({ link }: { link: NavLink | undefined }) {
  if (!link?.dropdown) return null;
  const group = link.dropdown[0];

  return (
    <div className="px-4 md:px-8 py-5 border-t border-black/[0.05]">
      <div className="max-w-[1280px] mx-auto">
        {group.title && (
          <p className="text-[11px] font-semibold text-[#bbb] mb-3 ml-1">
            {group.title}
          </p>
        )}

        {link.label === "How it works" && (
          <div className="grid grid-cols-4 gap-3">
            {group.items.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[#f2f2f0] transition-colors"
              >
                <span
                  className="text-2xl font-black leading-none mt-0.5 shrink-0 w-6 text-center"
                  style={{ color: "#29a366", opacity: 0.22 }}
                >
                  {item.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#111]">{item.title}</p>
                  {item.desc && (
                    <p className="text-[11px] text-[#888] leading-snug mt-0.5">{item.desc}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {link.label === "Benefits" && (
          <div className="grid grid-cols-3 gap-2">
            {group.items.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="px-3 py-2.5 rounded-xl hover:bg-[#f2f2f0] transition-colors"
              >
                <p className="text-sm font-semibold text-[#111] leading-tight">{item.title}</p>
                {item.desc && (
                  <p className="text-[11px] text-[#888] leading-snug mt-0.5">{item.desc}</p>
                )}
              </a>
            ))}
          </div>
        )}

        {link.label === "Categories" && (
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="px-4 py-1.5 rounded-full bg-[#f2f2f0] text-sm text-[#555] font-medium hover:bg-[#29a366]/10 hover:text-[#29a366] transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();

  const storeRef = useStableMemo(
    () => (user ? { table: "stores", id: user.uid } : null),
    [user],
  );
  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  // Open the shared AuthModal with seller intent stored in sessionStorage
  const openAuthModal = (mode: "signin" | "signup") => {
    sessionStorage.setItem("sellerAuthIntent", "true");
    router.push(`?auth=${mode}`);
  };

  // After login from this page, redirect to seller dashboard or registration
  useEffect(() => {
    if (!user) return;
    const intent = sessionStorage.getItem("sellerAuthIntent");
    if (!intent) return;
    sessionStorage.removeItem("sellerAuthIntent");
    supabase
      .from("stores")
      .select("id")
      .eq("id", user.uid)
      .maybeSingle()
      .then(({ data }) => {
        router.push(data ? "/seller/dashboard" : "/seller/register");
      });
  }, [user]);

  const handleCTA = () => {
    if (!user) {
      openAuthModal("signup");
      return;
    }
    router.push(store ? "/seller/dashboard" : "/seller/register");
  };

  const ctaLabel =
    isUserLoading || storeLoading
      ? "Loading…"
      : !user
        ? "Start selling"
        : store
          ? "Go to Dashboard"
          : "Set up your shop";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Top announcement bar ─────────────────────────────── */}
      <div
        className="h-10 flex items-center justify-center px-4 gap-2 text-xs font-medium text-white"
        style={{ background: "#29a366" }}
      >
        <Star className="h-3.5 w-3.5 fill-white text-white shrink-0" />
        <span>Free to join, start your shop. Built for Oriental Mindoro sellers.</span>
      </div>

      {/* ── Nav bar ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-black/[0.06]"
        onMouseLeave={() => setActiveNav(null)}
      >
        <div className="h-16 flex items-center px-4 md:px-8 gap-8 max-w-[1280px] mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <Image src="/brand-icon.png" alt="Emoorm" width={36} height={36} className="rounded-lg" />
            <span style={{ fontFamily: "'Ubuntu', sans-serif", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.06em" }}>
              <span style={{ color: "#29a366" }}>emoorm</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((l) => (
              <NavTrigger
                key={l.label}
                link={l}
                active={activeNav === l.label}
                onHover={() => setActiveNav(l.label)}
              />
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            {!user ? (
              <>
                <button
                  onClick={() => openAuthModal("signin")}
                  className="hidden sm:flex h-10 px-5 items-center rounded-lg border border-black/[0.10] text-base font-semibold text-[#555] hover:bg-[#f2f2f0] transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="h-10 px-5 rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#29a366" }}
                >
                  Start selling
                </button>
              </>
            ) : (
              <button
                onClick={handleCTA}
                disabled={isUserLoading || storeLoading}
                className="h-10 px-5 rounded-lg text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#29a366" }}
              >
                {ctaLabel}
              </button>
            )}
            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-[#f2f2f0] transition-colors ml-1"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-[#555]" /> : <Menu className="h-5 w-5 text-[#555]" />}
            </button>
          </div>
        </div>

        {/* Expandable mega menu */}
        <div style={{ display: "grid", gridTemplateRows: activeNav ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease" }}>
          <div style={{ overflow: "hidden" }}>
            <NavExpandedContent link={NAV_LINKS.find((l) => l.label === activeNav)} />
          </div>
        </div>
      </header>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-black/[0.06] px-4 md:px-8 py-4 flex flex-col gap-1 z-40">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm text-[#555] hover:bg-[#f2f2f0] font-medium transition-colors"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); openAuthModal("signin"); }}
            className="px-3 py-2.5 rounded-xl text-sm text-[#555] hover:bg-[#f2f2f0] font-medium transition-colors text-left"
          >
            Log in
          </button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 md:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left — headline */}
            <div className="flex-1 min-w-0">
              <h1 className="text-6xl md:text-6xl font-black text-[#111] leading-[1.05] mb-5 tracking-tight">
                Start Selling
                <br />
                <span style={{ color: "#29a366" }}>in Emoorm</span>
              </h1>
              <p className="text-base text-[#666] leading-relaxed mb-8 max-w-md">
                Join local farmers, and agri-entrepreneurs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleCTA}
                  disabled={isUserLoading || storeLoading}
                  className="flex items-center justify-center gap-2 h-14 px-10 rounded-full text-white text-base font-bold transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                  style={{ background: "#29a366" }}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {!user && (
                  <button
                    onClick={() => openAuthModal("signin")}
                    className="flex items-center justify-center h-14 px-10 rounded-full border border-black/[0.12] text-base font-semibold text-[#555] hover:bg-[#f2f2f0] transition-colors"
                  >
                    Already a seller? Log in
                  </button>
                )}
              </div>
            </div>

            {/* Right — product image grid */}
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="grid grid-cols-5 grid-rows-2 gap-3" style={{ height: 380 }}>
                <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden shadow-sm">
                  <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" alt="Fresh vegetables" className="h-full w-full object-cover" />
                </div>
                <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-sm">
                  <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80" alt="Fresh fruits" className="h-full w-full object-cover" />
                </div>
                <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-sm">
                  <img src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80" alt="Fresh produce" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section id="benefits" className="py-16 md:py-20 px-4 md:px-8 bg-[#f9fafb]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-[#111] mb-3">Why sell on Emoorm?</h2>
            <p className="text-sm text-[#888] max-w-md mx-auto">
              Built specifically for local sellers in Oriental Mindoro not a one-size-fits-all platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="h-10 w-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#29a366]" strokeWidth={1.8} />
                </div>
                <p className="text-sm font-bold text-[#111] mb-1.5">{title}</p>
                <p className="text-xs text-[#888] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-[#111] mb-3">How it works</h2>
            <p className="text-sm text-[#888]">Set up your shop and start selling in under 10 minutes.</p>
          </div>
          <div className="space-y-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5 bg-white rounded-2xl border border-black/[0.06] px-6 py-5">
                <span className="text-3xl font-black leading-none mt-0.5 shrink-0" style={{ color: "#29a366", opacity: 0.18 }}>
                  {n}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#111] mb-0.5">{title}</p>
                  <p className="text-xs text-[#888] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section id="categories" className="py-16 px-4 md:px-8 bg-[#f9fafb]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-black text-[#111] mb-2">What can you sell?</h2>
          <p className="text-sm text-[#888] mb-8">Anything local, fresh, and made in Oriental Mindoro.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Vegetables","Fruits","Seafood","Rice & Grains","Meat & Poultry",
              "Dairy","Handicrafts","Wellness Products","Delicacies",
              "Beverages","Condiments & Sauces","Seedlings & Plants",
            ].map((cat) => (
              <span key={cat} className="bg-white border border-black/[0.06] rounded-full px-4 py-1.5 text-xs font-medium text-[#555]">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section
        className="py-16 md:py-20 px-4 md:px-8 text-center"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to start selling?</h2>
          <p className="text-sm text-white/70 mb-8 leading-relaxed">
            Join the Emoorm seller community. Free, local, and built for you.
          </p>
          <button
            onClick={handleCTA}
            disabled={isUserLoading || storeLoading}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#065f46] text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </button>
          {!user && (
            <p className="text-xs text-white/40 mt-4">
              Already a seller?{" "}
              <button
                onClick={() => openAuthModal("signin")}
                className="text-white/70 hover:text-white underline underline-offset-2"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
