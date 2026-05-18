"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Lock,
} from "lucide-react";
import { useUser, useSupabase } from "@/supabase";
import { initiateEmailSignIn } from "@/supabase/auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { isAdmin, isAdminLoading } = useIsAdmin();

  useEffect(() => {
    if (user && !isUserLoading && !isAdminLoading) {
      router.push(isAdmin ? "/admin/dashboard" : "/profile");
    }
  }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await initiateEmailSignIn(supabase, email, password);
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (
        err instanceof TypeError ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror")
      ) {
        setError(
          "Unable to connect. Please check your internet connection and try again.",
        );
      } else if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError(
          "Your email is not yet confirmed. Check your inbox for the verification link.",
        );
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f2f2f0" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a6b40 0%, #29a366 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/assets/vegetables.jpg"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand-icon.png"
              alt="Emoorm"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
            <span
              className="text-2xl font-normal text-white"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Emoorm
            </span>
          </Link>
        </div>
        <div className="relative z-10 p-10">
          <blockquote className="text-white/90 text-lg font-normal leading-relaxed mb-4">
            "Fresh from Oriental Mindoro's farms straight to your table."
          </blockquote>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <ShieldCheck className="h-4 w-4" />
            Secure &amp; trusted marketplace
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {/* Mobile brand */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <Image
            src="/brand-icon.png"
            alt="Emoorm"
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
          />
          <span
            className="text-xl font-normal text-[#1a6b40]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Emoorm
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1
              className="text-2xl font-semibold text-[#111] mb-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="text-sm text-[#777]">
              Sign in to your Emoorm account
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[9px] font-bold">!</span>
              </div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aaa]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                  className="w-full bg-white border border-[#e0e0e0] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#29a366] focus:ring-2 focus:ring-[#29a366]/15 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-xs font-semibold text-[#555]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#29a366] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aaa]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full bg-white border border-[#e0e0e0] rounded-xl pl-11 pr-12 py-3.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#29a366] focus:ring-2 focus:ring-[#29a366]/15 transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
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
              className="w-full text-white font-semibold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              style={{ background: "#29a366" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e0e0e0]" />
            <span className="text-xs text-[#bbb] font-medium">or</span>
            <div className="flex-1 h-px bg-[#e0e0e0]" />
          </div>

          <p className="text-center text-sm text-[#777]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#29a366] font-semibold hover:underline"
            >
              Create one free
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-8 text-xs text-[#bbb]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Protected by 256-bit SSL encryption
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-[#bbb] hover:text-[#555] transition-colors mt-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
