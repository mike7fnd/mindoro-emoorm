"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Edit,
  Star,
  Plus,
  Archive,
  ToggleLeft,
  ToggleRight,
  X,
  AlertTriangle,
  Save,
} from "lucide-react";
import {
  useUser,
  useSupabase,
  useStableMemo,
  useCollection,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  "Vegetables", "Fruits", "Seafood", "Meat", "Snacks",
  "Rice & Grains", "Beverages", "Condiments", "Other",
];

const EMPTY_FORM = {
  name: "",
  category: "Vegetables",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  status: "active",
};

export default function AdminProductsPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAdminLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, isAdminLoading, router]);

  const productsConfig = useStableMemo(() => {
    if (!user || !isAdmin) return null;
    return {
      table: "facilities",
      order: { column: "createdAt", ascending: false },
    };
  }, [user, isAdmin]);
  const { data: allProducts, isLoading } = useCollection(productsConfig);

  if (isAdminLoading || !isAdmin) return null;

  const filteredProducts = (allProducts ?? []).filter((p: any) => {
    const matchesSearch =
      !searchQuery ||
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.status !== "draft" && p.status !== "inactive") ||
      (statusFilter === "draft" && p.status === "draft") ||
      (statusFilter === "out-of-stock" && (p.stock === 0 || p.sold === true));
    return matchesSearch && matchesStatus;
  });

  const totalProducts = allProducts?.length ?? 0;
  const activeProducts = allProducts?.filter((p: any) => p.status !== "draft" && p.status !== "inactive").length ?? 0;
  const draftProducts = allProducts?.filter((p: any) => p.status === "draft").length ?? 0;

  const handleDeleteProduct = (productId: string) => {
    deleteDocumentNonBlocking(supabase, "facilities", productId);
    toast({ title: "Product deleted", description: "The product has been removed." });
    setDeleteTarget(null);
  };

  const handleToggleStatus = (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "draft" ? "active" : "draft";
    updateDocumentNonBlocking(supabase, "facilities", productId, { status: newStatus });
    toast({ title: "Status updated", description: `Product ${newStatus === "draft" ? "deactivated" : "activated"}.` });
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setEditDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      category: product.category || product.type || "Other",
      description: product.description || "",
      price: Number(product.price || product.pricePerNight || 0),
      stock: Number(product.stock || product.capacity || 0),
      imageUrl: product.imageUrl || product.images?.[0] || "",
      status: product.status || "active",
    });
    setEditDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Missing info", description: "Please provide a product name." });
      return;
    }
    const id = editingProduct?.id || crypto.randomUUID();
    const data: any = {
      id,
      name: formData.name,
      category: formData.category,
      type: formData.category,
      description: formData.description,
      price: formData.price,
      pricePerNight: formData.price,
      stock: formData.stock,
      capacity: formData.stock,
      imageUrl: formData.imageUrl || "https://placehold.co/400x300/f8f8f8/ccc?text=No+Image",
      status: formData.status,
    };
    if (!editingProduct) {
      data.createdAt = new Date().toISOString();
    }
    setDocumentNonBlocking(supabase, "facilities", data);
    toast({
      title: editingProduct ? "Product updated" : "Product created",
      description: `${formData.name} has been ${editingProduct ? "updated" : "created"}.`,
    });
    setEditDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full pt-6 md:pt-32 pb-24 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">
              Product Management
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              {totalProducts} total products · {activeProducts} active · {draftProducts} drafts
            </p>
          </div>
          <Button
            className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm gap-2"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-full pl-11 pr-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "draft", label: "Draft" },
              { key: "out-of-stock", label: "Sold Out" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full px-5 h-11 text-xs font-bold shrink-0",
                  statusFilter === f.key
                    ? "bg-black text-white hover:bg-primary"
                    : "border-black/[0.06]"
                )}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[32px] border border-black/[0.02] bg-white dark:bg-white/[0.03] p-4">
                <Skeleton className="h-48 w-full rounded-2xl mb-4" />
                <Skeleton className="h-4 w-3/4 rounded-full mb-2" />
                <Skeleton className="h-3 w-1/2 rounded-full mb-4" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03]">
            <CardContent className="py-20 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No products found</p>
              <Button className="rounded-full" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" /> Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => {
              const imageUrl =
                product.imageUrl ||
                product.images?.[0] ||
                "https://placehold.co/400x300/f8f8f8/ccc?text=No+Image";
              return (
                <Card
                  key={product.id}
                  className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={product.name || "Product"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-bold backdrop-blur-sm",
                          product.status === "draft"
                            ? "bg-orange-50/90 text-orange-600"
                            : product.sold || product.stock === 0
                            ? "bg-red-50/90 text-red-600"
                            : "bg-green-50/90 text-green-600"
                        )}
                      >
                        {product.status === "draft" ? "Draft" : product.sold || product.stock === 0 ? "Sold Out" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{product.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {product.category || product.type || "Uncategorized"} · Stock: {product.stock ?? product.capacity ?? "N/A"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-xl border-none"
                        >
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" /> Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer"
                            onClick={() => router.push(`/book/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" /> View Product
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer"
                            onClick={() => handleToggleStatus(product.id, product.status || "active")}
                          >
                            {product.status === "draft" ? (
                              <><ToggleRight className="h-4 w-4" /> Activate</>
                            ) : (
                              <><ToggleLeft className="h-4 w-4" /> Deactivate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-xl gap-3 px-3 py-2.5 cursor-pointer text-red-600"
                            onClick={() => setDeleteTarget({ id: product.id, name: product.name || "this product" })}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-lg font-bold font-headline tracking-[-0.05em]">
                        ₱{Number(product.price || product.pricePerNight || 0).toLocaleString()}
                      </p>
                      {product.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{product.rating}</span>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Product
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full bg-red-600 hover:bg-red-700"
                onClick={() => deleteTarget && handleDeleteProduct(deleteTarget.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline tracking-[-0.03em]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update the product details below." : "Fill in the details for the new product."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-2xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground">Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-tight text-muted-foreground">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-tight text-muted-foreground">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[#f8f8f8] dark:bg-white/[0.05] border-none rounded-full px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {formData.imageUrl && (
                  <div className="mt-2 h-32 w-full rounded-2xl overflow-hidden bg-muted">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      width={400}
                      height={128}
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-full h-12 bg-black hover:bg-primary gap-2"
                  onClick={handleSaveProduct}
                >
                  <Save className="h-4 w-4" />
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
