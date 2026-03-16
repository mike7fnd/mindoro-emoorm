"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUser, useSupabase } from "@/supabase";
import { initiateEmailSignIn } from "@/supabase/auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { isAdmin, isAdminLoading } = useIsAdmin();

  useEffect(() => {
    if (user && !isUserLoading && !isAdminLoading) {
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/profile");
      }
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
      // Auth state change will redirect via useEffect
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message?.includes("Invalid login credentials")) {
        setError("Incorrect email or password.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Your email is not yet confirmed. Check your inbox for the verification link.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f9f9f9]">
      <div className="bg-white rounded-[25px] p-8 md:p-12 w-full max-w-[480px] shadow-sm border-none">
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block font-headline italic font-normal text-4xl text-black tracking-[-0.05em]">
              E-Moorm
            </Link>
            <p className="text-muted-foreground text-sm font-normal">Welcome back! Sign in to your marketplace.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all transform active:scale-[0.98] shadow-md text-sm tracking-tight mt-2 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don&apos;t have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Create one</Link>
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold tracking-tight text-muted-foreground/60 hover:text-black transition-all mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
