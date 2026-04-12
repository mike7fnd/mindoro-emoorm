"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, RotateCw, Loader2 } from "lucide-react";
import { useUser, useSupabase } from "@/supabase";
import { initiateEmailSignUp } from "@/supabase/auth";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    province: "",
    provinceCode: "",
    city: "",
    cityCode: "",
    barangay: "",
    street: "",
    password: "",
    confirmPassword: "",
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  const supabase = useSupabase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading && !showEmailConfirm) {
      router.push("/profile");
    }
  }, [user, isUserLoading, router, showEmailConfirm]);

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data.sort((a: any, b: any) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.provinceCode) {
      fetch(`https://psgc.gitlab.io/api/provinces/${formData.provinceCode}/municipalities.json`)
        .then(res => res.json())
        .then(data => { setCities(data); setBarangays([]); })
        .catch(() => {});
    }
  }, [formData.provinceCode]);

  useEffect(() => {
    if (formData.cityCode) {
      fetch(`https://psgc.gitlab.io/api/municipalities/${formData.cityCode}/barangays.json`)
        .then(res => res.json())
        .then(data => setBarangays(data))
        .catch(() => {});
    }
  }, [formData.cityCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "province") {
      const selected = provinces.find(p => p.name === value);
      setFormData(prev => ({ ...prev, province: value, provinceCode: selected?.code || "", city: "", cityCode: "", barangay: "" }));
    } else if (name === "city") {
      const selected = cities.find(c => c.name === value);
      setFormData(prev => ({ ...prev, city: value, cityCode: selected?.code || "", barangay: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = (from: number) => {
    if (from === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.includes('@')) {
        setError('Please fill in your name and a valid email.');
        return;
      }
    }
    if (from === 2) {
      if (!formData.mobile || formData.mobile.length < 10 || !formData.province || !formData.city || !formData.barangay) {
        setError('Please complete your address.');
        return;
      }
    }
    setError("");
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => { setError(""); setStep(prev => prev - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await initiateEmailSignUp(supabase, formData.email, formData.password);

      // Save profile data for after email confirmation
      localStorage.setItem("pendingProfile", JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        province: formData.province,
        city: formData.city,
        barangay: formData.barangay,
        street: formData.street,
      }));

      if (result.needsConfirmation) {
        router.push("/confirm-email");
        return;
      }

      // Email confirmation disabled — create profile now
      if (result.user) {
        const { error: upsertError } = await supabase.from("users").upsert({
          id: result.user.id,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile || "",
          province: formData.province || "",
          city: formData.city || "",
          barangay: formData.barangay || "",
          street: formData.street || "",
          role: "buyer",
          createdAt: new Date().toISOString(),
        }, { onConflict: "id" });
        if (upsertError) console.error("[Signup] Profile save error:", upsertError.message);
        localStorage.removeItem("pendingProfile");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await initiateEmailSignUp(supabase, formData.email, formData.password);
    } catch {
      // ignore — user already exists, resend may not work perfectly
    } finally {
      setResending(false);
    }
  };

  if (isUserLoading) return null;

  // Email confirmation screen
  if (showEmailConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9f9]">
        <div className="bg-white rounded-[25px] p-8 md:p-12 w-full max-w-[480px] shadow-sm border-none text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-headline tracking-[-0.05em] mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-2">We sent a confirmation link to</p>
          <p className="text-sm font-bold text-black mb-6">{formData.email}</p>
          <p className="text-xs text-muted-foreground mb-8">
            Click the link in the email to verify your account, then come back to sign in.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-[#f8f8f8] text-black font-bold py-4 rounded-full hover:bg-muted transition-all flex items-center justify-center gap-2 text-sm tracking-tight mb-4 disabled:opacity-60"
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            {resending ? "Resending..." : "Resend confirmation email"}
          </button>

          <Link href="/login" className="inline-block text-sm text-primary font-bold hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9f9]">
      <div className="bg-white rounded-[25px] p-8 md:p-12 w-full max-w-[560px] shadow-sm border-none">
        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="inline-block font-headline italic font-normal text-4xl text-black tracking-[-0.05em]">
            E-Moorm
          </Link>
          <p className="text-muted-foreground text-sm font-normal">Join the local marketplace of Oriental Mindoro.</p>
        </div>

        <div className="flex justify-center mb-10 gap-4">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === num
                  ? 'bg-primary text-white scale-110 shadow-md'
                  : step > num
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {num}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Personal information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">First name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                    placeholder="Juan" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Last name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                    placeholder="Dela Cruz" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Email address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="juan@example.com" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="button" onClick={() => nextStep(1)} className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all shadow-md text-sm tracking-tight">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Contact & Address</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Mobile Number</label>
                <div className="flex items-center bg-[#f8f8f8] rounded-full focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="pl-6 pr-2 text-sm font-bold text-muted-foreground select-none">+63</span>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData(prev => ({ ...prev, mobile: v })); }}
                    placeholder="9123456789" maxLength={10} className="flex-1 bg-transparent border-none rounded-r-full py-4 pr-6 text-black outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Province</label>
                <select name="province" value={formData.province} onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20">
                  <option value="" disabled>Select province</option>
                  {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">City / Municipality</label>
                  <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.provinceCode}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none disabled:opacity-50 cursor-pointer">
                    <option value="" disabled>Select city</option>
                    {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Barangay</label>
                  <select name="barangay" value={formData.barangay} onChange={handleChange} disabled={!formData.cityCode}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none disabled:opacity-50 cursor-pointer">
                    <option value="" disabled>Select barangay</option>
                    {barangays.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 bg-muted text-black font-bold py-5 rounded-full hover:bg-muted/80 transition-all text-sm tracking-tight">
                  Back
                </button>
                <button type="button" onClick={() => nextStep(2)} className="flex-1 bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all shadow-md text-sm tracking-tight">
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Secure your account</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••" disabled={loading} className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Confirm password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  placeholder="••••••••" disabled={loading} className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} disabled={loading} className="flex-1 bg-muted text-black font-bold py-5 rounded-full hover:bg-muted/80 transition-all text-sm tracking-tight disabled:opacity-50">
                  Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all shadow-md text-sm tracking-tight disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold tracking-tight text-muted-foreground/60 hover:text-black transition-all mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
