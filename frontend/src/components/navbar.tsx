"use client";

import { CustomConnectButton } from "@/components/custom-connect-button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-stone-800 dark:bg-stone-950/95 dark:supports-[backdrop-filter]:bg-stone-950/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              Genuine Trade
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <CustomConnectButton />
          </div>
        </div>
      </nav>
      <Separator className="bg-stone-200 dark:bg-stone-800" />
    </>
  );
}
