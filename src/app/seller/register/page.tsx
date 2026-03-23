"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Phone, MapPin, FileText, Upload, Tag, CheckCircle2, PartyPopper, AlertTriangle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useSupabaseAuth, useSupabase, useStableMemo, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/supabase";
import { uploadImage } from "@/lib/upload-image";

export default function ShopRegistrationPage() {
  const [form, setForm] = useState({
    storeName: "",
    description: "",
    sold: 0,
    // Shop Address
    address: "",
    city: "",
    barangay: "",
    // Owner Info
    ownerName: "",
    email: "",
    contact: "",
    // Valid ID
    governmentIdType: "",
    governmentIdFront: "",
    governmentIdBack: "",
    // Face Verification
    selfieImage: "",
    // Other
    category: "",
    logo: "",
    // Store Profile Image
    storeProfileImage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  // ID clarity checking state
  const [idClarityStatus, setIdClarityStatus] = useState<Record<string, 'checking' | 'clear' | 'blurry' | null>>({
    governmentIdFront: null,
    governmentIdBack: null,
    selfieImage: null,
  });
  // Store the actual File objects for Supabase upload
  const [idFiles, setIdFiles] = useState<Record<string, File | null>>({
    governmentIdFront: null,
    governmentIdBack: null,
    selfieImage: null,
  });

  const idFieldsRequiringClarity = ['governmentIdFront', 'governmentIdBack', 'selfieImage'];
  const allIdsClear = idFieldsRequiringClarity.every(
    (field) => idClarityStatus[field] === 'clear'
  );

  /** Check if an uploaded image is clear enough using the blur-detection API */
  async function checkImageClarity(file: File, fieldName: string) {
    setIdClarityStatus((prev) => ({ ...prev, [fieldName]: 'checking' }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/check-image-clarity', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.isClear) {
        setIdClarityStatus((prev) => ({ ...prev, [fieldName]: 'clear' }));
      } else {
        setIdClarityStatus((prev) => ({ ...prev, [fieldName]: 'blurry' }));
        // Reset the preview so user must re-upload
        setForm((prev) => ({ ...prev, [fieldName]: '' }));
        setIdFiles((prev) => ({ ...prev, [fieldName]: null }));
      }
    } catch {
      // On error, allow submission (don't block)
      setIdClarityStatus((prev) => ({ ...prev, [fieldName]: 'clear' }));
    }
  }

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({ ...prev, [name]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);

      // For ID / selfie fields, run clarity check and store the File
      if (idFieldsRequiringClarity.includes(name)) {
        setIdFiles((prev) => ({ ...prev, [name]: file }));
        checkImageClarity(file, name);
      }
    }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!allIdsClear) return; // Block if any ID is blurry / still checking
    setSubmitting(true);

    try {
      // Upload ID images to Supabase Storage
      const prefix = `seller-ids/${user.uid}`;
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        idFiles.governmentIdFront
          ? uploadImage(supabase, 'stores', idFiles.governmentIdFront, `${prefix}/id-front`)
          : Promise.resolve(''),
        idFiles.governmentIdBack
          ? uploadImage(supabase, 'stores', idFiles.governmentIdBack, `${prefix}/id-back`)
          : Promise.resolve(''),
        idFiles.selfieImage
          ? uploadImage(supabase, 'stores', idFiles.selfieImage, `${prefix}/selfie`)
          : Promise.resolve(''),
      ]);

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
        governmentIdType: form.governmentIdType,
        governmentIdFront: frontUrl,
        governmentIdBack: backUrl,
        selfieImage: selfieUrl,
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
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#050505]">
      <Header />
      <main className="flex-grow container mx-auto px-6 md:px-8 pt-8 md:pt-32 pb-24 max-w-2xl">
        {registered ? (
          <div className="flex flex-col items-center justify-center text-center py-24 animate-in fade-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <PartyPopper className="h-8 w-8 text-primary mb-4 animate-bounce" />
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white mb-2">You&apos;re All Set!</h1>
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
        ) : null}
        {!registered && (
          <React.Fragment>
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
              <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">Register Your Shop</h1>
              <p className="text-sm text-muted-foreground mt-2">Fill in the details below to set up your seller account and start listing products.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shop Profile */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3">Shop Profile</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] mb-8">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Shop Name</span>
                    <input
                      id="storeName"
                      name="storeName"
                      value={form.storeName}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="My Awesome Shop"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Description</span>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4 resize-none"
                      placeholder="Tell buyers about your store..."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5">
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Store Profile Image</span>
                    <input
                      name="storeProfileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary"
                      required
                    />
                    {form.storeProfileImage && (
                      <img src={form.storeProfileImage} alt="Store Profile Preview" className="h-10 rounded-md ml-2" />
                    )}
                  </div>
                </div>
              </section>

              {/* Shop Address */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3">Shop Address</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] mb-8">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Municipality</span>
                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary appearance-none cursor-pointer ml-4"
                      required
                    >
                      <option value="">Select Municipality</option>
                      <option value="Baco">Baco</option>
                      <option value="Bansud">Bansud</option>
                      <option value="Bongabong">Bongabong</option>
                      <option value="Bulalacao">Bulalacao</option>
                      <option value="Calapan City">Calapan City</option>
                      <option value="Gloria">Gloria</option>
                      <option value="Mansalay">Mansalay</option>
                      <option value="Naujan">Naujan</option>
                      <option value="Pinamalayan">Pinamalayan</option>
                      <option value="Pola">Pola</option>
                      <option value="Puerto Galera">Puerto Galera</option>
                      <option value="Roxas">Roxas</option>
                      <option value="San Teodoro">San Teodoro</option>
                      <option value="Socorro">Socorro</option>
                      <option value="Victoria">Victoria</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Barangay</span>
                    <input
                      name="barangay"
                      value={form.barangay}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="Barangay name"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between px-6 py-5">
                    <span className="text-sm text-black/80 dark:text-white/80">Detailed Address</span>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="Street, Building, etc."
                      required
                    />
                  </div>
                  {/* TODO: Integrate PH address API for barangay autocomplete */}
                  <div className="px-6 pb-4 text-xs text-muted-foreground">Province: Oriental Mindoro, Region: MIMAROPA (locked)</div>
                </div>
              </section>

              {/* Owner Information */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3">Owner Information</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] mb-8">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Owner Name</span>
                    <input
                      name="ownerName"
                      value={form.ownerName}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80">Email</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between px-6 py-5">
                    <span className="text-sm text-black/80 dark:text-white/80">Phone Number</span>
                    <input
                      name="contact"
                      value={form.contact}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30 ml-4"
                      placeholder="09XXXXXXXXX"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Valid ID Section */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3">Valid Government ID</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] mb-8">
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">ID Type</span>
                    <select
                      name="governmentIdType"
                      value={form.governmentIdType}
                      onChange={handleChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Valid PH ID</option>
                      <option value="PHILHEALTH">PhilHealth ID</option>
                      <option value="SSS">SSS ID</option>
                      <option value="UMID">UMID</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVER">Driver's License</option>
                      <option value="PRC">PRC ID</option>
                      <option value="POSTAL">Postal ID</option>
                      <option value="VOTERS">Voter's ID</option>
                      <option value="NATIONAL">National ID</option>
                      <option value="TIN">TIN ID</option>
                      <option value="PWD">PWD ID</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-black/[0.03] dark:border-white/[0.05]">
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Upload ID (Front)</span>
                    <input
                      name="governmentIdFront"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary"
                      required
                    />
                    {form.governmentIdFront && (
                      <img src={form.governmentIdFront} alt="ID Front Preview" className="h-10 rounded-md ml-2" />
                    )}
                    {idClarityStatus.governmentIdFront === 'checking' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...
                      </span>
                    )}
                    {idClarityStatus.governmentIdFront === 'clear' && (
                      <span className="flex items-center gap-1 text-xs text-green-600 ml-2 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                      </span>
                    )}
                    {idClarityStatus.governmentIdFront === 'blurry' && (
                      <span className="flex items-center gap-1 text-xs text-red-500 ml-2 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" /> Blurry — re-upload
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 px-6 py-5">
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Upload ID (Back)</span>
                    <input
                      name="governmentIdBack"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary"
                      required
                    />
                    {form.governmentIdBack && (
                      <img src={form.governmentIdBack} alt="ID Back Preview" className="h-10 rounded-md ml-2" />
                    )}
                    {idClarityStatus.governmentIdBack === 'checking' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...
                      </span>
                    )}
                    {idClarityStatus.governmentIdBack === 'clear' && (
                      <span className="flex items-center gap-1 text-xs text-green-600 ml-2 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                      </span>
                    )}
                    {idClarityStatus.governmentIdBack === 'blurry' && (
                      <span className="flex items-center gap-1 text-xs text-red-500 ml-2 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" /> Blurry — re-upload
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Face Verification (Selfie) */}
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3">Face Verification (Selfie)</h2>
                <div className="bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] mb-8">
                  <div className="flex items-center gap-4 px-6 py-5">
                    <span className="text-sm text-black/80 dark:text-white/80 shrink-0 w-28">Selfie</span>
                    <input
                      name="selfieImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 text-right text-sm bg-transparent outline-none border-none text-primary"
                      required
                    />
                    {form.selfieImage && (
                      <img src={form.selfieImage} alt="Selfie Preview" className="h-10 rounded-md ml-2" />
                    )}
                    {idClarityStatus.selfieImage === 'checking' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...
                      </span>
                    )}
                    {idClarityStatus.selfieImage === 'clear' && (
                      <span className="flex items-center gap-1 text-xs text-green-600 ml-2 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                      </span>
                    )}
                    {idClarityStatus.selfieImage === 'blurry' && (
                      <span className="flex items-center gap-1 text-xs text-red-500 ml-2 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" /> Blurry — re-upload
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="pt-2">
                {!allIdsClear && (form.governmentIdFront || form.governmentIdBack || form.selfieImage) && (
                  <p className="text-xs text-red-500 text-center mb-3 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Please upload clear, non-blurry images for all ID fields before submitting.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={submitting || !allIdsClear}
                  className="w-full h-14 rounded-full bg-black hover:bg-primary text-white text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? "Setting up your shop..." : "Start Selling"}
                </Button>
              </div>
            </form>
          </React.Fragment>
        )}
      </main>
      <Footer />
    </div>
  );
}
