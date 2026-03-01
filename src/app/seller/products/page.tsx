"use client";

import React, { useState } from "react";
import { SellerLayout } from "@/components/layout/seller-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Star,
  Filter,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSupabaseAuth, useSupabase, useStableMemo, useDoc, useCollection, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/supabase";

const statusStyle: Record<string, string> = {
  Available: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  active: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  Draft: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  "Out of Stock": "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  out_of_stock: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function SellerProductsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { user } = useSupabaseAuth();
  const supabase = useSupabase();

  // Fetch store data
  const storeRef = useStableMemo(() => {
    if (!user) return null;
    return { table: "stores", id: user.uid };
  }, [user]);
  const { data: store } = useDoc(storeRef);

  // Fetch products (facilities) for this seller
  const productsConfig = useStableMemo(() => {
    if (!user) return null;
    return {
      table: "facilities",
      filters: [{ column: "sellerId", op: "eq" as const, value: user.uid }],
      order: { column: "createdAt", ascending: false },
    };
  }, [user]);
  const { data: products, isLoading } = useCollection(productsConfig);

  const allProducts = products ?? [];

  const getProductStatus = (p: any) => {
    if (p.stock === 0) return "Out of Stock";
    if (p.status === "Draft" || p.status === "draft") return "Draft";
    return "Available";
  };

  const filteredProducts = allProducts.filter((p: any) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const status = getProductStatus(p);
    if (tab === "all") return matchSearch;
    if (tab === "active") return matchSearch && status === "Available";
    if (tab === "draft") return matchSearch && status === "Draft";
    if (tab === "out") return matchSearch && status === "Out of Stock";
    return matchSearch;
  });

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    deleteDocumentNonBlocking(supabase, "facilities", id);
    window.location.reload();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Available" || currentStatus === "active" ? "Draft" : "Available";
    updateDocumentNonBlocking(supabase, "facilities", id, { status: newStatus, updatedAt: new Date().toISOString() });
    window.location.reload();
  };

  const activeCount = allProducts.filter((p: any) => getProductStatus(p) === "Available").length;
  const draftCount = allProducts.filter((p: any) => getProductStatus(p) === "Draft").length;
  const outCount = allProducts.filter((p: any) => getProductStatus(p) === "Out of Stock").length;

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-8 w-full pt-4 md:pt-32 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em] text-black dark:text-white">My Products</h1>
            <p className="text-sm text-muted-foreground font-normal">{allProducts.length} total products</p>
          </div>
          <Link href="/seller/products/add">
            <Button size="icon" className="bg-black hover:bg-primary transition-colors rounded-full h-10 w-10 shadow-sm md:hidden">
              <Plus className="h-5 w-5" />
            </Button>
            <Button className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm gap-2 hidden md:inline-flex">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 rounded-full bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/[0.06]"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full shrink-0 border-black/[0.06] dark:border-white/[0.06]">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 h-auto">
            <TabsTrigger value="all" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-4">
              All ({allProducts.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-4">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="draft" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-4">
              Draft ({draftCount})
            </TabsTrigger>
            <TabsTrigger value="out" className="rounded-full text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm px-4">
              Out of Stock ({outCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product: any) => {
                const status = getProductStatus(product);
                return (
                  <Card key={product.id} className="shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.02] rounded-[32px] bg-white dark:bg-white/[0.03] overflow-hidden group">
                    <div className="aspect-square bg-black/[0.03] dark:bg-white/[0.03] relative flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-md"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/30 backdrop-blur-xl border-none">
                            <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(product.id, status)}>
                              {status === "Available" ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> Publish</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Badge className={`absolute top-3 left-3 rounded-full text-[10px] border-0 capitalize ${statusStyle[status] || statusStyle.Available}`}>
                        {status}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-sm md:text-base truncate min-w-0">{product.name}</h3>
                        <span className="text-xs text-muted-foreground shrink-0">{product.totalSales || 0} sold</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{product.rating || 5.0}</span>
                      </div>
                      <p className="font-headline text-lg mt-2">₱{Number(product.price || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No products found</p>
              </div>
            )}
          </>
        )}
      </div>
    </SellerLayout>
  );
}
