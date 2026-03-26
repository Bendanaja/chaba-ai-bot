"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar className="fixed inset-y-0 left-0 z-30" />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col md:ml-[260px]">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
              <Sidebar className="h-full w-full" />
            </SheetContent>
          </Sheet>

          <span className="text-base font-semibold text-primary">
            {"\u{1F33A}"} Chaba AI
          </span>

          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-5" />
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
