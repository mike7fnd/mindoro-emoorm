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
  Link2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useSupabaseAuth,
  useSupabase,
  useStableMemo,
  useDoc,
  addDocumentNonBlocking,
} from "@/supabase";

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

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
              Add <span className="text-primary">Product</span>
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              Fill in the details to list a new product
            </p>
          </div>
        </div>

        {/* Image Preview */}
        <Card className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="aspect-[16/9] bg-black/[0.03] dark:bg-white/[0.03] relative flex items-center justify-center overflow-hidden">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                <ImageIcon className="h-16 w-16" />
                <span className="text-sm">Product image preview</span>
              </div>
            )}
          </div>
        </Card>

        {/* Form */}
        <Card className="border-none shadow-sm rounded-[25px] bg-white dark:bg-white/[0.03]">
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

            {/* Image URL */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5" /> Image URL
              </Label>
              <Input
                className="rounded-xl h-12"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground/60">
                Paste a direct link to your product image
              </p>
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
