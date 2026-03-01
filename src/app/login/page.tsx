"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useUser, initiateEmailSignIn, initiateGoogleSignIn, useSupabase } from "@/supabase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/profile");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(".login-card", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 })
      .fromTo(".logo", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8 }, "-=0.6")
      .fromTo(".form-group, .checkbox-group, .forgot-link, .login-btn, .divider, .signup-link, .back-to-home, .google-btn", {
        y: 15,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.5
      }, "-=0.5");
  }, []);

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    let friendlyMessage = "An unexpected error occurred. Please try again.";

    if (err.code === "auth/invalid-credential") {
      friendlyMessage = "Incorrect email or password. Please check your credentials and try again.";
    } else if (err.code === "auth/user-not-found") {
      friendlyMessage = "No account found with this email.";
    } else if (err.code === "auth/wrong-password") {
      friendlyMessage = "Incorrect password.";
    } else if (err.code === "auth/email-already-in-use") {
      friendlyMessage = "This email is already in use by another account.";    } else if (err.message?.includes("Email not confirmed")) {
      friendlyMessage = "Your email is not yet confirmed. Please check your inbox for the verification link.";    } else if (err.message) {
      friendlyMessage = err.message;
    }

    setError(friendlyMessage);

    toast({
      variant: "destructive",
      title: "Sign In Failed",
      description: friendlyMessage,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    initiateEmailSignIn(supabase, email, password).catch(handleAuthError);
  };

  const handleGoogleSignIn = () => {
    setError("");
    initiateGoogleSignIn(supabase).catch(handleAuthError);
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f9f9f9]">
      <div className="login-card bg-white rounded-[25px] p-8 md:p-12 w-full max-w-[480px] shadow-sm border-none">
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <Link href="/" className="logo inline-block font-headline italic font-normal text-4xl text-black tracking-[-0.05em]">
              E-Moorm
            </Link>
            <p className="login-subtitle text-muted-foreground text-sm font-normal">Welcome back! Sign in to your marketplace.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="form-group space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          <div className="form-group space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="checkbox-group flex items-center gap-2 text-xs text-muted-foreground cursor-pointer font-medium">
              <input type="checkbox" className="accent-primary w-4 h-4 rounded" />
              Remember me
            </label>
            <Link href="/forgot-password" title="Forgot password" className="forgot-link text-xs text-primary font-bold hover:underline transition-all">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="login-btn bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all transform active:scale-[0.98] shadow-md text-sm uppercase tracking-widest mt-2"
          >
            Log In
          </button>
        </form>

        <div className="divider flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 my-6 before:content-[''] before:flex-1 before:h-[1px] before:bg-muted after:content-[''] after:flex-1 after:h-[1px] after:bg-muted">
          or continue with
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="google-btn w-full bg-[#f8f8f8] border-none text-black font-bold py-5 rounded-full hover:bg-muted transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="signup-link text-center text-sm text-muted-foreground mt-8">
          Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Create one</Link>
        </p>

        <Link href="/" className="back-to-home flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-black transition-all mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
