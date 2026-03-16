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
} from "lucide-react";
import {
  useUser,
  useSupabase,
  useStableMemo,
  useCollection,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

export default function AdminProductsPage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAdminLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
  };

  const handleToggleStatus = (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "draft" ? "active" : "draft";
    updateDocumentNonBlocking(supabase, "facilities", productId, { status: newStatus });
    toast({ title: "Status updated", description: `Product ${newStatus === "draft" ? "deactivated" : "activated"}.` });
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
          <Link href="/admin-facilities">
            <Button className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
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
              <p className="text-sm text-muted-foreground">No products found</p>
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
                          {product.category || "Uncategorized"} · Seller: {product.sellerName || product.sellerId?.slice(0, 8) || "N/A"}
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
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-lg font-bold font-headline tracking-[-0.05em]">
                        ₱{Number(product.price || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{product.rating || 0}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock: {product.stock ?? "N/A"} · Views: {product.views || 0}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
