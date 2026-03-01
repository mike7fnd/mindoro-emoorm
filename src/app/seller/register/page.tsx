"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Phone, MapPin, FileText, Upload, Tag, CheckCircle2, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { useSupabaseAuth, useSupabase, useStableMemo, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/supabase";

export default function ShopRegistrationPage() {
  const [form, setForm] = useState({
    storeName: "",
    ownerName: "",
    email: "",
    contact: "",
    address: "",
    category: "",
    description: "",
    logo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  // If user already has a store, redirect to dashboard
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: existingStore } = useDoc(storeRef);

  useEffect(() => {
    if (existingStore) {
      router.replace("/seller/dashboard");
    }
  }, [existingStore, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const fireConfetti = useCallback(() => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#ff577f', '#ff884b', '#ffd384', '#fff9b0', '#7c73e6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#ff577f', '#ff884b', '#ffd384', '#fff9b0', '#7c73e6'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Big center burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ff577f', '#ff884b', '#ffd384', '#fff9b0', '#7c73e6'],
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    // Save store data to Supabase (stores table)
    const storeData = {
      id: user.uid,
      "ownerId": user.uid,
      name: form.storeName,
      description: form.description,
      "imageUrl": form.logo || '',
      category: form.category,
      city: form.address,
      street: form.address,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(supabase, "stores", storeData);

    // Update user profile: mark as seller
    updateDocumentNonBlocking(supabase, "users", user.uid, {
      isSeller: true,
      role: 'seller',
    });

    setTimeout(() => {
      setSubmitting(false);
      setRegistered(true);
      fireConfetti();
      setTimeout(() => {
        router.push("/seller/dashboard");
      }, 3000);
    }, 1200);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#050505]">
      <Header />

      <main className="flex-grow container mx-auto px-4 md:px-8 pt-8 md:pt-32 pb-24 max-w-2xl">
        {registered ? (
          <div className="flex flex-col items-center justify-center text-center py-24 animate-in fade-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <PartyPopper className="h-8 w-8 text-primary mb-4 animate-bounce" />
            <h1 className="text-2xl md:text-3xl font-headline tracking-tight text-black dark:text-white mb-2">You&apos;re All Set!</h1>
            <p className="text-sm text-muted-foreground max-w-sm">Your shop has been registered successfully. Redirecting you to your seller dashboard...</p>
            <div className="mt-8">
              <div className="h-1 w-48 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_forwards]" style={{ animation: 'progress 3s ease-in-out forwards' }} />
              </div>
            </div>
            <style jsx>{`
              @keyframes progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {/* Header */}
            <div className="mb-10">
              <h1 className="text-2xl md:text-3xl font-headline tracking-tight text-black dark:text-white">Register Your Shop</h1>
              <p className="text-sm text-muted-foreground mt-2">Fill in the details below to set up your seller account and start listing products.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Store Info */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-1 mb-4">Store Information</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[24px] overflow-hidden border border-black/[0.03] dark:border-white/[0.05]">
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Store Name</span>
                    <input
                      name="storeName"
                      value={form.storeName}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30"
                      placeholder="My Awesome Shop"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Category</span>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="fashion">Fashion & Apparel</option>
                      <option value="electronics">Electronics</option>
                      <option value="food">Food & Beverages</option>
                      <option value="beauty">Beauty & Health</option>
                      <option value="home">Home & Living</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-start gap-4 px-6 py-5">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Description</span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 resize-none"
                      placeholder="Tell buyers about your store..."
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Owner & Contact */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-1 mb-4">Owner & Contact</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[24px] overflow-hidden border border-black/[0.03] dark:border-white/[0.05]">
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Owner Name</span>
                    <input
                      name="ownerName"
                      value={form.ownerName}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Email</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Mobile</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-sm text-muted-foreground/40">+63</span>
                      <input
                        name="contact"
                        value={form.contact}
                        onChange={handleChange}
                        className="text-right text-sm bg-transparent outline-none border-none text-primary max-w-[120px]"
                        placeholder="912 345 6789"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Address</span>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30"
                      placeholder="City, Province"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Store Logo */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-1 mb-4">Store Logo</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[24px] overflow-hidden border border-black/[0.03] dark:border-white/[0.05]">
                  <div className="flex items-center gap-4 px-6 py-5">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Logo URL</span>
                    <input
                      name="logo"
                      value={form.logo}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-full bg-black hover:bg-primary text-white text-base shadow-xl active:scale-[0.98] transition-all"
                >
                  {submitting ? "Setting up your shop..." : "Start Selling"}
                </Button>
              </div>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
