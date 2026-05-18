"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { useUser, useSupabase, useStableMemo, useDoc } from "@/supabase";
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
  initiateGoogleSignIn,
} from "@/supabase/auth";
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
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  ChevronDown,
} from "lucide-react";

/* ─── shared input styles ─────────────────────────────────────────── */
const inp = [
  "w-full bg-[#f7f7f5] border border-black/[0.08] rounded-xl",
  "pl-10 pr-4 py-3 text-sm text-[#111] placeholder:text-[#aaa]",
  "outline-none focus:border-[#29a366] focus:ring-2 focus:ring-[#29a366]/10",
  "transition-all disabled:opacity-50",
].join(" ");

const inpNoIcon = [
  "w-full bg-[#f7f7f5] border border-black/[0.08] rounded-xl",
  "px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa]",
  "outline-none focus:border-[#29a366] focus:ring-2 focus:ring-[#29a366]/10",
  "transition-all disabled:opacity-50",
].join(" ");

/* ─── Auth Dropdown (expands from navbar) ───────────────────────────── */
type ModalMode = "signin" | "signup";

function AuthDropdown({
  open,
  mode,
  onClose,
  onModeChange,
}: {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
  onModeChange: (m: ModalMode) => void;
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const { user } = useUser();
  const initialUser = useRef(user);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  /* redirect after sign-in */
  useEffect(() => {
    if (user && !initialUser.current) {
      onClose();
      router.push("/seller/dashboard");
    }
  }, [user]);

  /* reset form on tab switch */
  useEffect(() => {
    setError("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setShowPw(false);
  }, [mode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await initiateEmailSignIn(supabase, email, password);
    } catch (err: any) {
      const m: string = err?.message || "";
      if (m.includes("Invalid login credentials"))
        setError("Incorrect email or password.");
      else if (m.includes("Email not confirmed"))
        setError("Please verify your email first.");
      else setError(m || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      localStorage.setItem("sellerSignupIntent", "true");
      localStorage.setItem(
        "pendingProfile",
        JSON.stringify({ firstName, lastName, email }),
      );
      const result = await initiateEmailSignUp(supabase, email, password);
      if (result.needsConfirmation) {
        setSentEmail(email);
        setEmailSent(true);
        return;
      }
      if (result.user) {
        await supabase.from("users").upsert(
          {
            id: result.user.id,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            email,
            role: "buyer",
            createdAt: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
        localStorage.removeItem("pendingProfile");
        onClose();
        router.push("/seller/register");
      }
    } catch (err: any) {
      const m: string = err?.message || "";
      if (m.includes("already registered"))
        setError("This email is already registered. Try signing in.");
      else setError(m || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    localStorage.setItem("sellerSignupIntent", "true");
    try {
      await initiateGoogleSignIn(supabase);
    } catch {
      setGoogleLoading(false);
    }
  };

  /* Panel — absolutely positioned below the nav actions wrapper */
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 360,
        zIndex: 200,
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0px)" : "translateY(-10px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)" }}
      >
        {/* Tab switcher */}
        <div className="flex border-b border-black/[0.06]">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={[
                "flex-1 py-3 text-sm font-semibold transition-all",
                mode === m
                  ? "text-[#29a366] border-b-2 border-[#29a366]"
                  : "text-[#999] hover:text-[#555]",
              ].join(" ")}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Email confirmation */}
          {emailSent ? (
            <div className="flex flex-col items-center text-center gap-4 py-3">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#29a366" }}
              >
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#111] mb-1">Check your inbox</p>
                <p className="text-sm text-[#777] leading-relaxed">
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-[#333]">{sentEmail}</span>
                  . Click it to activate your account, then sign in.
                </p>
              </div>
              <button
                onClick={() => {
                  setEmailSent(false);
                  onModeChange("signin");
                }}
                className="w-full h-11 rounded-xl text-white text-sm font-bold"
                style={{ background: "#29a366" }}
              >
                Go to Sign In
              </button>
            </div>
          ) : mode === "signin" ? (
            /* Sign In form */
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                  Email
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    autoComplete="email"
                    className={inp}
                    required
                  />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                  Password
                </p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    className={inp}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555] transition-colors"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#29a366" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
              <p className="text-center text-xs text-[#aaa]">
                No account yet?{" "}
                <button
                  type="button"
                  onClick={() => onModeChange("signup")}
                  className="text-[#29a366] font-semibold hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            /* Sign Up form */
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                    First name
                  </p>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      disabled={loading}
                      className={inp}
                      required
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                    Last name
                  </p>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    disabled={loading}
                    className={inpNoIcon}
                    required
                  />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                  Email
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    autoComplete="email"
                    className={inp}
                    required
                  />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#888] mb-1.5 ">
                  Password
                </p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    autoComplete="new-password"
                    className={inp}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555] transition-colors"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#29a366" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-[#aaa]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => onModeChange("signin")}
                  className="text-[#29a366] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Google — shown on both tabs */}
          {!emailSent && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/[0.07]" />
                <span className="text-[11px] text-[#bbb] font-medium">or</span>
                <div className="flex-1 h-px bg-black/[0.07]" />
              </div>
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full h-11 rounded-xl border border-black/[0.1] bg-white flex items-center justify-center gap-2.5 text-sm font-semibold text-[#333] hover:bg-[#f7f7f5] transition-all disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#888]" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </button>
            </>
          )}

          <p className="text-center text-[10px] text-[#ccc] leading-relaxed pb-1">
            By continuing, you agree to Emoorm's{" "}
            <Link href="/terms" className="hover:underline text-[#aaa]">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="hover:underline text-[#aaa]">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

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

/* ─── Nav trigger — label + chevron, no floating panel ──────────── */
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

/* ─── Expanded content that lives inside the navbar ─────────────── */
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
                  <p className="text-sm font-semibold text-[#111]">
                    {item.title}
                  </p>
                  {item.desc && (
                    <p className="text-[11px] text-[#888] leading-snug mt-0.5">
                      {item.desc}
                    </p>
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
                <p className="text-sm font-semibold text-[#111] leading-tight">
                  {item.title}
                </p>
                {item.desc && (
                  <p className="text-[11px] text-[#888] leading-snug mt-0.5">
                    {item.desc}
                  </p>
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
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<ModalMode>("signup");
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();

  const storeRef = useStableMemo(
    () => (user ? { table: "stores", id: user.uid } : null),
    [user],
  );
  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  const openAuth = (mode: ModalMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleCTA = () => {
    if (!user) {
      openAuth("signup");
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
        <span>
          Free to join, start your shop. Built for Oriental Mindoro sellers.
        </span>
      </div>

      {/* ── Nav bar — expands on hover ────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-black/[0.06]"
        onMouseLeave={() => setActiveNav(null)}
      >
        {/* Main nav row */}
        <div className="h-16 flex items-center px-4 md:px-8 gap-8 max-w-[1280px] mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <Image
              src="/brand-icon.png"
              alt="Emoorm"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span
              style={{
                fontFamily: "'Ubuntu', sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                letterSpacing: "-0.06em",
              }}
            >
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
          <div className="ml-auto flex items-center gap-3 relative">
            <AuthDropdown
              open={authOpen && !user}
              mode={authMode}
              onClose={() => setAuthOpen(false)}
              onModeChange={setAuthMode}
            />
            {!user ? (
              <>
                <button
                  onClick={() => openAuth("signin")}
                  className="hidden sm:flex h-10 px-5 items-center rounded-lg border border-black/[0.10] text-base font-semibold text-[#555] hover:bg-[#f2f2f0] transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth("signup")}
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
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[#555]" />
              ) : (
                <Menu className="h-5 w-5 text-[#555]" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable mega menu — smooth grid-template-rows animation */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: activeNav ? "1fr" : "0fr",
            transition: "grid-template-rows 220ms ease",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <NavExpandedContent
              link={NAV_LINKS.find((l) => l.label === activeNav)}
            />
          </div>
        </div>
      </header>

      {/* Dim backdrop when auth dropdown is open */}
      {authOpen && !user && (
        <div
          onClick={() => setAuthOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            top: 66,
            background: "rgba(0,0,0,0.35)",
            zIndex: 49,
          }}
        />
      )}

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
            onClick={() => {
              setMobileMenuOpen(false);
              openAuth("signin");
            }}
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
                  onClick={() => openAuth("signin")}
                  className="flex items-center justify-center h-14 px-10 rounded-full border border-black/[0.12] text-base font-semibold text-[#555] hover:bg-[#f2f2f0] transition-colors"
                >
                  Already a seller? Log in
                </button>
              )}
            </div>
          </div>

          {/* Right — product image grid (3 images, dynamic sizes) */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div
              className="grid grid-cols-5 grid-rows-2 gap-3"
              style={{ height: 380 }}
            >
              {/* Big — left, full height */}
              <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80"
                  alt="Fresh vegetables"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Medium — top right */}
              <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80"
                  alt="Fresh fruits"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Small — bottom right */}
              <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80"
                  alt="Fresh produce"
                  className="h-full w-full object-cover"
                />
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
            <h2 className="text-2xl md:text-3xl font-black text-[#111] mb-3">
              Why sell on Emoorm?
            </h2>
            <p className="text-sm text-[#888] max-w-md mx-auto">
              Built specifically for local sellers in Oriental Mindoro not a
              one-size-fits-all platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-black/[0.06] p-6"
              >
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
            <h2 className="text-2xl md:text-3xl font-black text-[#111] mb-3">
              How it works
            </h2>
            <p className="text-sm text-[#888]">
              Set up your shop and start selling in under 10 minutes.
            </p>
          </div>
          <div className="space-y-3">
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex items-start gap-5 bg-white rounded-2xl border border-black/[0.06] px-6 py-5"
              >
                <span
                  className="text-3xl font-black leading-none mt-0.5 shrink-0"
                  style={{ color: "#29a366", opacity: 0.18 }}
                >
                  {n}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#111] mb-0.5">
                    {title}
                  </p>
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
          <h2 className="text-xl font-black text-[#111] mb-2">
            What can you sell?
          </h2>
          <p className="text-sm text-[#888] mb-8">
            Anything local, fresh, and made in Oriental Mindoro.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Vegetables",
              "Fruits",
              "Seafood",
              "Rice & Grains",
              "Meat & Poultry",
              "Dairy",
              "Handicrafts",
              "Wellness Products",
              "Delicacies",
              "Beverages",
              "Condiments & Sauces",
              "Seedlings & Plants",
            ].map((cat) => (
              <span
                key={cat}
                className="bg-white border border-black/[0.06] rounded-full px-4 py-1.5 text-xs font-medium text-[#555]"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section
        className="py-16 md:py-20 px-4 md:px-8 text-center"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        }}
      >
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Ready to start selling?
          </h2>
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
                onClick={() => openAuth("signin")}
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
