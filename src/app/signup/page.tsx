"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth, useUser, initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";

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

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        firstName: formData.firstName || user.displayName?.split(" ")[0] || "",
        lastName: formData.lastName || user.displayName?.split(" ")[1] || "",
        email: user.email,
        mobile: formData.mobile || "",
        province: formData.province || "",
        city: formData.city || "",
        barangay: formData.barangay || "",
        street: formData.street || "",
        createdAt: serverTimestamp()
      }, { merge: true });
      
      router.push("/profile");
    }
  }, [user, isUserLoading, router, firestore, formData]);

  useEffect(() => {
    gsap.fromTo(".signup-card", 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces.json')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setProvinces(sorted);
      })
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  useEffect(() => {
    if (formData.provinceCode) {
      fetch(`https://psgc.gitlab.io/api/provinces/${formData.provinceCode}/municipalities.json`)
        .then(res => res.json())
        .then(data => {
          setCities(data);
          setBarangays([]);
        })
        .catch(err => console.error("Error loading cities:", err));
    }
  }, [formData.provinceCode]);

  useEffect(() => {
    if (formData.cityCode) {
      fetch(`https://psgc.gitlab.io/api/municipalities/${formData.cityCode}/barangays.json`)
        .then(res => res.json())
        .then(data => {
          setBarangays(data);
        })
        .catch(err => console.error("Error loading barangays:", err));
    }
  }, [formData.cityCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "province") {
      const selected = provinces.find(p => p.name === value);
      setFormData(prev => ({ 
        ...prev, 
        province: value, 
        provinceCode: selected?.code || "",
        city: "",
        cityCode: "",
        barangay: ""
      }));
    } else if (name === "city") {
      const selected = cities.find(c => c.name === value);
      setFormData(prev => ({ 
        ...prev, 
        city: value, 
        cityCode: selected?.code || "",
        barangay: ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    
    if (err.code === "auth/email-already-in-use") {
      friendlyMessage = "This email is already registered. Try logging in instead.";
    } else if (err.code === "auth/weak-password") {
      friendlyMessage = "The password is too weak. Please use at least 6 characters.";
    } else if (err.message) {
      friendlyMessage = err.message;
    }

    setError(friendlyMessage);
    
    toast({
      variant: "destructive",
      title: "Sign up failed",
      description: friendlyMessage,
    });
  };

  const nextStep = (from: number) => {
    if (from === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.includes('@')) {
        setError('Please complete personal info'); 
        return;
      }
    }
    if (from === 2) {
      if (!formData.mobile || formData.mobile.length < 10 || !formData.province || !formData.city || !formData.barangay) {
        setError('Please complete address'); 
        return;
      }
    }
    setError("");
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setError("");
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password too short");
      return;
    }
    initiateEmailSignUp(auth, formData.email, formData.password).catch(handleAuthError);
  };

  const handleGoogleSignIn = () => {
    setError("");
    initiateGoogleSignIn(auth).catch(handleAuthError);
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9f9]">
      <div className="signup-card bg-white rounded-[25px] p-8 md:p-12 w-full max-w-[560px] shadow-sm border-none">
        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="logo inline-block font-headline italic font-normal text-4xl text-black tracking-[-0.05em]">
            Bella's Paradise
          </Link>
          <p className="subtitle text-muted-foreground text-sm font-normal">Join us for a blissful resort experience.</p>
        </div>

        <div className="progress-container flex justify-center mb-10 gap-4">
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Personal information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">First name</label>
                  <input 
                    type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                    placeholder="Juan" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Last name</label>
                  <input 
                    type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                    placeholder="Dela Cruz" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Email address</label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="juan@example.com" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="button" onClick={() => nextStep(1)} className="w-full bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all shadow-md text-sm tracking-tight">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Contact & Address</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Mobile (+63)</label>
                <input 
                  type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                  placeholder="9123456789" maxLength={10} className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Province</label>
                <select 
                  name="province" value={formData.province} onChange={handleChange}
                  className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>Select province</option>
                  {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">City / Municipality</label>
                  <select 
                    name="city" value={formData.city} onChange={handleChange} disabled={!formData.provinceCode}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none disabled:opacity-50 cursor-pointer"
                  >
                    <option value="" disabled>Select city</option>
                    {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Barangay</label>
                  <select 
                    name="barangay" value={formData.barangay} onChange={handleChange} disabled={!formData.cityCode}
                    className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none disabled:opacity-50 cursor-pointer"
                  >
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-headline font-normal tracking-[-0.05em] mb-4 text-center">Secure your account</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Password</label>
                <input 
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Confirm password</label>
                <input 
                  type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  placeholder="••••••••" className="w-full bg-[#f8f8f8] border-none rounded-full px-6 py-4 text-black outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 bg-muted text-black font-bold py-5 rounded-full hover:bg-muted/80 transition-all text-sm tracking-tight">
                  Back
                </button>
                <button type="submit" className="flex-1 bg-black text-white font-bold py-5 rounded-full hover:bg-primary transition-all shadow-md text-sm tracking-tight">
                  Finish
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="divider flex items-center gap-3 text-[10px] font-bold tracking-tight text-muted-foreground/40 my-8 before:content-[''] before:flex-1 before:h-[1px] before:bg-muted after:content-[''] after:flex-1 after:h-[1px] after:bg-muted">
          or join with
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-[#f8f8f8] border-none text-black font-bold py-5 rounded-full hover:bg-muted transition-all flex items-center justify-center gap-2 text-sm tracking-tight mb-8"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="login-link text-center text-sm text-muted-foreground">
          Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
        </p>

        <Link href="/" className="back-to-home flex items-center justify-center gap-2 text-xs font-bold tracking-tight text-muted-foreground/60 hover:text-black transition-all mt-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}