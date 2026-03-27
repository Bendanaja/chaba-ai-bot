"use client";

import { useRouter } from "next/navigation";
import { Menu, Bell, Search } from "lucide-react";
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
        <Sidebar
          className="fixed inset-y-0 left-0 z-30"
          onLogout={handleLogout}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 md:ml-[260px] main-gradient-bg">
        {/* Mobile top bar */}
        <header className="mobile-header-glass flex items-center justify-between px-4 py-3 md:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="size-5 text-chaba-pink" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
              <Sidebar className="h-full w-full" onLogout={handleLogout} />
            </SheetContent>
          </Sheet>

          <span className="text-base font-semibold bg-gradient-to-r from-chaba-pink to-chaba-purple bg-clip-text text-transparent">
            Chaba AI
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-chaba-pink transition-colors"
          >
            <Bell className="size-5" />
          </Button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-8 pt-6 pb-2">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E]">
              สวัสดี 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา..."
                className="search-input w-56 pl-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-chaba-pink transition-colors relative"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#D63384]" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden chaba-scrollbar p-4 md:px-8 md:py-4">
          <div className="page-enter min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
