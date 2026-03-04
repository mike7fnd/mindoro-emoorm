"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface FirstTimeIntroProps {
  storageKey: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FirstTimeIntro({
  storageKey,
  title,
  description,
  icon,
}: FirstTimeIntroProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `intro_seen_${storageKey}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(`intro_seen_${storageKey}`, "true");
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleDismiss();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] px-6 pb-8 pt-4 max-w-lg mx-auto [&>button]:hidden"
      >
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="items-center text-center space-y-3">
          {icon && (
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-1">
              {icon}
            </div>
          )}
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {title}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {description}
          </SheetDescription>
        </SheetHeader>

        <Button
          onClick={handleDismiss}
          className="w-full mt-6 rounded-full h-12 text-base font-medium"
        >
          Got it
        </Button>
      </SheetContent>
    </Sheet>
  );
}
