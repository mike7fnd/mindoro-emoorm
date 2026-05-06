"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Save,
  Gavel,
  CalendarClock,
  ShoppingCart,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useSupabaseAuth,
  useSupabase,
  useStableMemo,
  useDoc,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
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

function AddProductPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store } = useDoc(storeRef);

  // Fetch existing product when editing
  const productRef = useStableMemo(() => {
    if (!editId) return null;
    return { table: "facilities", id: editId };
  }, [editId]);
  const { data: existingProduct, isLoading: productLoading } = useDoc(productRef);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    imageUrl: "",
    isAuction: false,
    startingBid: "",
    auctionEndDate: "",
    productType: "normal", // "normal" or "wholesale"
    minimumBulkQuantity: "", // For wholesale orders
    bulkPricePerUnit: "", // For wholesale pricing
  });
  const [formLoaded, setFormLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("regular"); // "regular", "wholesale", or "bidding"
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Pre-fill form when editing and product data arrives
  useEffect(() => {
    if (isEditing && existingProduct && !formLoaded) {
      const p = existingProduct as any;
      setForm({
        name: p.name || "",
        price: p.price?.toString() || "",
        stock: p.stock?.toString() || "",
        category: p.category || p.type || "",
        description: p.description || "",
        imageUrl: p.imageUrl || "",
        isAuction: p.isAuction || false,
        startingBid: p.startingBid?.toString() || "",
        auctionEndDate: p.auctionEndDate ? p.auctionEndDate.slice(0, 16) : "",
        productType: p.productType || "normal",
        minimumBulkQuantity: p.minimumBulkQuantity?.toString() || "",
        bulkPricePerUnit: p.bulkPricePerUnit?.toString() || "",
      });
      // Set active tab based on product type
      if (p.isAuction) {
        setActiveTab("bidding");
      } else if (p.productType === "wholesale") {
        setActiveTab("wholesale");
      } else {
        setActiveTab("regular");
      }
      setFormLoaded(true);
    }
  }, [isEditing, existingProduct, formLoaded]);

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
    if (!user || !form.name) return;
    
    // Validate based on active tab
    if (activeTab === "regular" && !form.price) return;
    if (activeTab === "wholesale" && (!form.price || !form.minimumBulkQuantity || !form.bulkPricePerUnit)) return;
    if (activeTab === "bidding" && !form.startingBid) return;
    
    setAdding(true);

    const isAuctionMode = activeTab === "bidding";
    const isWholesaleMode = activeTab === "wholesale";

    const productData: Record<string, any> = {
      name: form.name,
      price: isAuctionMode ? 0 : (isWholesaleMode ? Number(form.price) || 0 : Number(form.price) || 0),
      stock: isAuctionMode ? 1 : Number(form.stock) || 0,
      category: form.category || "General",
      description: form.description,
      imageUrl: form.imageUrl || "",
      sellerId: user.uid,
      sellerName: (store as any)?.name || "",
      storeId: user.uid,
      status: "Available",
      rating: 5.0,
      type: form.category || "General",
      sold: isEditing && existingProduct && typeof existingProduct.sold === 'number' ? existingProduct.sold : 0,
      updatedAt: new Date().toISOString(),
      isAuction: isAuctionMode,
      startingBid: isAuctionMode ? Number(form.startingBid) || 0 : 0,
      currentBid: isEditing && existingProduct ? (existingProduct as any).currentBid || 0 : 0,
      currentBidderId: isEditing && existingProduct ? (existingProduct as any).currentBidderId || null : null,
      bidCount: isEditing && existingProduct ? (existingProduct as any).bidCount || 0 : 0,
      auctionEndDate: isAuctionMode && form.auctionEndDate ? new Date(form.auctionEndDate).toISOString() : null,
      productType: isWholesaleMode ? "wholesale" : "normal",
      minimumBulkQuantity: isWholesaleMode ? Number(form.minimumBulkQuantity) || 0 : 0,
      bulkPricePerUnit: isWholesaleMode ? Number(form.bulkPricePerUnit) || 0 : 0,
    };

    if (isEditing && editId) {
      await updateDocumentNonBlocking(supabase, "facilities", editId, productData);
    } else {
      await addDocumentNonBlocking(supabase, "facilities", {
        ...productData,
        createdAt: new Date().toISOString(),
      });
    }
    setAdding(false);
    router.push("/seller/products");
  };

  const isValid = () => {
    if (!form.name.trim() || !form.category.trim()) return false;
    
    if (activeTab === "regular") {
      return form.price.trim() !== "";
    }
    if (activeTab === "wholesale") {
      return form.price.trim() !== "" && form.minimumBulkQuantity.trim() !== "" && form.bulkPricePerUnit.trim() !== "";
    }
    if (activeTab === "bidding") {
      return form.startingBid.trim() !== "";
    }
    return false;
  };

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-6">
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
            <h1 className="text-2xl font-normal font-headline tracking-[-0.05em]">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              {isEditing ? "Update your product details" : "Fill in the details to list a new product"}
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

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" /> Category{" "}
                <span className="text-red-400">*</span>
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

        {/* Product Type Tabs */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-6">
                <p className="text-sm font-bold mb-4 text-muted-foreground">Select Listing Type</p>
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-[#f8f8f8] p-1">
                  <TabsTrigger value="regular" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Regular</span>
                  </TabsTrigger>
                  <TabsTrigger value="wholesale" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Wholesale</span>
                  </TabsTrigger>
                  <TabsTrigger value="bidding" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                    <Gavel className="h-4 w-4" />
                    <span className="hidden sm:inline">Bidding</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Regular Product Tab */}
              <TabsContent value="regular" className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/20 mb-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Regular Product</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Customers buy directly at your set price</p>
                </div>

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
              </TabsContent>

              {/* Wholesale Tab */}
              <TabsContent value="wholesale" className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/20 mb-4">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Wholesale/Bulk Product</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">For bulk buyers with minimum quantity requirements</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Regular Price (₱)
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
                    <p className="text-xs text-muted-foreground">Price per regular unit</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" /> Total Stock
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

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/10">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-3.5 w-3.5" /> Minimum Quantity{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      className="rounded-xl h-12"
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={form.minimumBulkQuantity}
                      onChange={(e) => updateField("minimumBulkQuantity", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Minimum units per order</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Bulk Price/Unit (₱){" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      className="rounded-xl h-12"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.bulkPricePerUnit}
                      onChange={(e) => updateField("bulkPricePerUnit", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Discounted bulk rate</p>
                  </div>
                </div>
              </TabsContent>

              {/* Bidding Tab */}
              <TabsContent value="bidding" className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 dark:border-primary/30 mb-4">
                  <p className="text-sm font-semibold text-primary">Auction / Bidding</p>
                  <p className="text-xs text-primary/80 mt-1">Let buyers place bids. Highest bidder wins</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Starting Bid (₱){" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      className="rounded-xl h-12"
                      placeholder="0.00"
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.startingBid}
                      onChange={(e) => updateField("startingBid", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">The minimum bid amount to start</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5" /> Auction End Date & Time
                    </Label>
                    <Input
                      className="rounded-xl h-12"
                      type="datetime-local"
                      value={form.auctionEndDate}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => updateField("auctionEndDate", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no end date (manual close)</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
            disabled={adding || !isValid()}
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {isEditing ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Package className="h-4 w-4 mr-2" />} {isEditing ? "Save Changes" : "Add Product"}
              </>
            )}
          </Button>
        </div>
      </div>
    </SellerLayout>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    }>
      <AddProductPageInner />
    </Suspense>
  );
}
