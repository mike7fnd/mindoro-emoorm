"use client";

import React, { useState, useEffect } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  Bell,
  Shield,
  Save,
  Camera,
  Globe,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseAuth, useSupabase, useStableMemo, useDoc, updateDocumentNonBlocking } from "@/supabase";
import { uploadImage } from "@/lib/upload-image";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  // Fetch store data
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store, isLoading } = useDoc(storeRef);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General",
    imageUrl: "",
    city: "",
    street: "",
    barangay: "",
    qrphUrl: "",
  });

  // Populate form when store data loads
  useEffect(() => {
    if (store) {
      const s = store as any;
      setForm({
        name: s.name || "",
        description: s.description || "",
        category: s.category || "General",
        imageUrl: s.imageUrl || "",
        city: s.city || "",
        street: s.street || "",
        barangay: s.barangay || "",
        qrphUrl: s.qrphUrl || "",
      });
    }
  }, [store]);
  // QR PH upload
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = React.useRef<HTMLInputElement>(null);
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingQR(true);
    try {
      const url = await uploadImage(supabase, "stores", file, `qrph/${user.uid}`);
      setForm(prev => ({ ...prev, qrphUrl: url }));
    } catch (err) {
      console.error("QR upload error:", err);
      alert("Failed to upload QR PH code.");
    } finally {
      setUploadingQR(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(supabase, "stores", file, `logo/${user.uid}`);
      setForm(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error("Logo upload error:", err);
      alert("Failed to upload shop logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    if (!user) return;
    setSaving(true);

    updateDocumentNonBlocking(supabase, "stores", user.uid, {
      name: form.name,
      description: form.description,
      category: form.category,
      imageUrl: form.imageUrl,
      city: form.city,
      street: form.street,
      barangay: form.barangay,
      qrphUrl: form.qrphUrl,
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="max-w-3xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 w-40 rounded-full mb-2" />
              <Skeleton className="h-4 w-56 rounded-full" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <div className="rounded-[32px] border border-black/[0.02] bg-white p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-48 rounded-full" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">Shop Settings</h1>
            <p className="text-sm text-muted-foreground font-normal">Manage your shop preferences</p>
          </div>
          <Button
            className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Shop Profile */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Shop Profile</h2>
            </div>
            <Separator className="opacity-50" />

            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => logoInputRef.current?.click()}
              title="Upload shop logo"
            >
              <div className="w-20 h-20 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center relative group overflow-hidden">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Shop logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground/40" />
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {uploadingLogo ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </div>
              <div>
                <p className="text-sm font-medium">Shop Logo</p>
                <p className="text-xs text-muted-foreground">{uploadingLogo ? "Uploading..." : "Click to upload • 200×200px"}</p>
              </div>
            </div>

            {/* QR PH Upload */}
            <div
              className="flex items-center gap-4 cursor-pointer mt-4"
              onClick={() => qrInputRef.current?.click()}
              title="Upload QR PH Code"
            >
              <div className="w-20 h-20 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center relative group overflow-hidden">
                {form.qrphUrl ? (
                  <img src={form.qrphUrl} alt="QR PH code" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">QR PH</span>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {uploadingQR ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploadingQR} />
              </div>
              <div>
                <p className="text-sm font-medium">QR PH Code</p>
                <p className="text-xs text-muted-foreground">{uploadingQR ? "Uploading..." : form.qrphUrl ? "Click to change QR code" : "Click to upload QR PH code"}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Shop Name</Label>
              <Input
                className="mt-1.5 rounded-xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Description</Label>
              <Textarea
                className="mt-1.5 rounded-xl min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Home & Living">Home & Living</SelectItem>
                    <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Fruits">Fruits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Business Information</h2>
            </div>
            <Separator className="opacity-50" />

            <div>
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                className="mt-1.5 rounded-xl"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Barangay</Label>
                <Input
                  className="mt-1.5 rounded-xl"
                  value={form.barangay}
                  onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Street</Label>
                <Input
                  className="mt-1.5 rounded-xl"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Notifications</h2>
            </div>
            <Separator className="opacity-50" />

            {[
              { label: "New Orders", desc: "Get notified when a new order is placed", defaultChecked: true },
              { label: "Order Updates", desc: "Receive updates when order status changes", defaultChecked: true },
              { label: "Product Reviews", desc: "Get notified about new product reviews", defaultChecked: true },
              { label: "Marketing Emails", desc: "Receive promotional tips and offers", defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-3 rounded-2xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em]">Privacy & Visibility</h2>
            </div>
            <Separator className="opacity-50" />

            {[
              { label: "Show Address", desc: "Display your business address publicly", defaultChecked: false },
              { label: "Allow Messages", desc: "Let customers message you directly", defaultChecked: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-red-100 dark:border-red-500/10 rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 md:p-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-normal font-headline tracking-[-0.05em] text-red-600">Danger Zone</h2>
            <Separator className="opacity-50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Deactivate Shop</p>
                <p className="text-xs text-muted-foreground">Temporarily hide your shop from customers</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                onClick={() => {
                  if (!user || !confirm("Are you sure you want to deactivate your shop?")) return;
                  updateDocumentNonBlocking(supabase, "stores", user.uid, { status: "inactive", updatedAt: new Date().toISOString() });
                }}
              >
                Deactivate
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Delete Shop</p>
                <p className="text-xs text-muted-foreground">Permanently delete your shop and all data</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
