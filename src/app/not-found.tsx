"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#050505]">
      <Header />

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="h-28 w-28 rounded-full bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-8">
            <SearchX className="h-14 w-14 text-muted-foreground/40" />
          </div>

          <h1 className="text-[7rem] leading-none font-headline tracking-tighter text-black/10 dark:text-white/10 select-none">404</h1>

          <h2 className="text-xl md:text-2xl font-headline tracking-tight text-black dark:text-white -mt-4 mb-3">Page not found</h2>

          <p className="text-sm text-muted-foreground leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 h-12 rounded-full border-black/10 dark:border-white/10 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="flex-1 h-12 rounded-full bg-black hover:bg-primary text-white gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
