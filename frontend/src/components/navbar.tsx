"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const handleConnectWallet = () => {
    // TODO: Implement wallet connection logic
    console.log("Connect wallet clicked");
  };

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
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </nav>
      <Separator className="bg-stone-200 dark:bg-stone-800" />
    </>
  );
}
