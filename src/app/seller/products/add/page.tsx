"use client";

import React, { useState } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Package,
  DollarSign,
  Tag,
  FileText,
  Layers,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useSupabaseAuth,
  useSupabase,
  useStableMemo,
  useDoc,
  addDocumentNonBlocking,
} from "@/supabase";
import { uploadImage } from "@/lib/upload-image";

const categories = [
  "Jewelry",
  "Clothing",
  "Accessories",
  "Home & Living",
  "Food & Beverages",
  "Vegetables",
  "Fruits",
  "Seafood",
  "Handicrafts",
  "Health & Beauty",
  "Electronics",
  "General",
];

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store } = useDoc(storeRef);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    imageUrl: "",
  });
  const [adding, setAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(supabase, "products", file, `${user.uid}/${form.name || "product"}`);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !form.name || !form.price) return;
    setAdding(true);

    const productData = {
      name: form.name,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      category: form.category || "General",
      description: form.description,
      imageUrl: form.imageUrl || "",
      sellerId: user.uid,
      sellerName: (store as any)?.name || "",
      storeId: user.uid,
      status: "Available",
      rating: 5.0,
      type: form.category || "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDocumentNonBlocking(supabase, "facilities", productData);
    setAdding(false);
    router.push("/seller/products");
  };

  const isValid = form.name.trim() !== "" && form.price.trim() !== "";

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-8 w-full pt-4 md:pt-32 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em]">
              Add Product
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              Fill in the details to list a new product
            </p>
          </div>
        </div>

        {/* Image Upload */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden">
          <div
            className="aspect-[16/9] bg-black/[0.03] dark:bg-white/[0.03] relative flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => imageInputRef.current?.click()}
            title="Upload product image"
          >
            {form.imageUrl ? (
              <>
                <img
                  src={form.imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Change Image
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-black/60 transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, imageUrl: "" })); }}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12" />
                    <span className="text-sm font-medium">Click to upload product image</span>
                    <span className="text-xs">JPG, PNG, WebP up to 5MB</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>
        </Card>

        {/* Form */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6 space-y-5">
            {/* Product Name */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Product Name{" "}
                <span className="text-red-400">*</span>
              </Label>
              <Input
                className="rounded-xl h-12"
                placeholder="e.g. Fresh Calamansi"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" /> Price (₱){" "}
                  <span className="text-red-400">*</span>
                </Label>
                <Input
                  className="rounded-xl h-12"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" /> Stock
                </Label>
                <Input
                  className="rounded-xl h-12"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" /> Category
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Description
              </Label>
              <Textarea
                className="rounded-xl min-h-[120px] resize-none"
                placeholder="Describe your product — quality, origin, size, etc."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full h-12 border-black/[0.06] dark:border-white/[0.06]"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-black hover:bg-primary transition-colors rounded-full h-12 shadow-sm"
            onClick={handleSubmit}
            disabled={adding || !isValid}
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" /> Add Product
              </>
            )}
          </Button>
        </div>
      </div>
    </SellerLayout>
  );
}
