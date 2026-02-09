"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  useUser, 
  useFirestore, 
  useDoc,
  useMemoFirebase,
  useFirebase,
  updateDocumentNonBlocking
} from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { 
  User, 
  MapPin, 
  Smartphone,
  Save,
  Moon,
  Sun,
  Globe,
  Lock,
  ChevronRight,
  Shield,
  ArrowLeft,
  Mail,
  Bell
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfileSidebar } from "@/app/profile/page";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userProfileRef);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    profilePictureUrl: "",
    province: "",
    city: "",
    barangay: "",
    street: ""
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        mobile: profile.mobile || "",
        profilePictureUrl: profile.profilePictureUrl || "",
        province: profile.province || "",
        city: profile.city || "",
        barangay: profile.barangay || "",
        street: profile.street || ""
      });
    }
  }, [profile]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    fetch('https://psgc.gitlab.io/api/provinces.json')
      .then(res => res.json())
      .then(data => {
        setProvinces(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      })
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    const theme = checked ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", checked);
  };

  const handleUpdateProfile = () => {
    if (!firestore || !user) return;
    
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      ...formData,
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Settings Saved",
      description: "Your resort profile has been updated.",
    });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isUserLoading) return null;
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const sectionHeaderClass = "text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 ml-6 mb-3";
  const groupedContainerClass = "bg-white dark:bg-white/[0.03] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02]";
  const rowClass = "flex items-center justify-between px-6 py-5 transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]";
  const rowLabelClass = "text-sm font-bold text-black/80 dark:text-white/80 shrink-0";
  const rowInputClass = "flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary placeholder:text-muted-foreground/30";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white dark:bg-[#050505] transition-colors">
        <ProfileSidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <div className="md:hidden">
            <Header />
          </div>

          <main className="flex-grow container mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-32 max-w-2xl">
            <div className="mb-12">
              <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] mb-1.5 text-black dark:text-white">Settings</h1>
              <p className="text-sm text-muted-foreground font-medium opacity-60">Personalize your resort experience.</p>
            </div>

            <div className="space-y-12">
              {/* Personal Section */}
              <div>
                <h3 className={sectionHeaderClass}>Personal Profile</h3>
                <div className={groupedContainerClass}>
                  <div className={rowClass}>
                    <span className={rowLabelClass}>First Name</span>
                    <input 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className={rowInputClass}
                      placeholder="Required"
                    />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Last Name</span>
                    <input 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className={rowInputClass}
                      placeholder="Required"
                    />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Avatar URL</span>
                    <input 
                      value={formData.profilePictureUrl}
                      onChange={e => setFormData({...formData, profilePictureUrl: e.target.value})}
                      className={rowInputClass}
                      placeholder="https://..."
                    />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Mobile</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-sm font-bold text-muted-foreground/40">+63</span>
                      <input 
                        value={formData.mobile}
                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                        className="text-right text-sm font-medium bg-transparent outline-none border-none text-primary max-w-[120px]"
                        placeholder="912 345 6789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h3 className={sectionHeaderClass}>Resort Address</h3>
                <div className={groupedContainerClass}>
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Province</span>
                    <select 
                      value={formData.province}
                      onChange={e => setFormData({...formData, province: e.target.value})}
                      className="flex-1 text-right text-sm font-medium bg-transparent outline-none border-none text-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select</option>
                      {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>City</span>
                    <input 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className={rowInputClass}
                      placeholder="Bongabong"
                    />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Barangay</span>
                    <input 
                      value={formData.barangay}
                      onChange={e => setFormData({...formData, barangay: e.target.value})}
                      className={rowInputClass}
                      placeholder="Hagan"
                    />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <span className={rowLabelClass}>Street</span>
                    <input 
                      value={formData.street}
                      onChange={e => setFormData({...formData, street: e.target.value})}
                      className={rowInputClass}
                      placeholder="Balahid"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className={sectionHeaderClass}>Accessibility</h3>
                <div className={groupedContainerClass}>
                  <div className={rowClass}>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-black flex items-center justify-center text-white">
                        <Moon className="h-4 w-4" />
                      </div>
                      <span className={rowLabelClass}>Dark Mode</span>
                    </div>
                    <Switch checked={isDarkMode} onCheckedChange={handleDarkModeToggle} className="scale-90" />
                  </div>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                        <Globe className="h-4 w-4" />
                      </div>
                      <span className={rowLabelClass}>Language</span>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[100px] border-none bg-transparent shadow-none focus:ring-0 h-auto p-0 text-right text-sm font-medium text-primary flex justify-end gap-1">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-[#111]">
                        <SelectItem value="English" className="rounded-xl">English</SelectItem>
                        <SelectItem value="Filipino" className="rounded-xl">Filipino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className={sectionHeaderClass}>Security</h3>
                <div className={groupedContainerClass}>
                  <button className={cn(rowClass, "w-full text-left")}>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-red-500 flex items-center justify-center text-white">
                        <Lock className="h-4 w-4" />
                      </div>
                      <span className={rowLabelClass}>Change Password</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </button>
                  <Separator className="bg-black/[0.03] mx-6 w-auto" />
                  <div className={rowClass}>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center text-white">
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className={rowLabelClass}>Two-Factor</span>
                    </div>
                    <Badge variant="secondary" className="bg-muted text-[9px] font-bold rounded-full px-2 py-0.5 border-none opacity-50">Disabled</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={handleUpdateProfile}
                  className="w-full h-16 rounded-full bg-black hover:bg-primary text-white font-bold text-lg shadow-xl active:scale-[0.98] transition-all gap-3"
                >
                  <Save className="h-5 w-5" /> Save Changes
                </Button>
              </div>
            </div>
          </main>
          
          <div className="md:hidden">
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
