"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Receipt, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 / Users", icon: Users },
  { href: "/dashboard/transactions", label: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 / Transactions", icon: Receipt },
  { href: "/dashboard/tasks", label: "\u0E07\u0E32\u0E19 / Tasks", icon: Sparkles },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col bg-gradient-to-b from-[#B5246B] to-[#4834D4] text-white",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-8">
        <Avatar size="lg">
          <AvatarImage src="/chaba-mascot.jpg" alt="Chaba mascot" />
          <AvatarFallback className="bg-pink-300 text-white text-sm font-semibold">
            Ch
          </AvatarFallback>
        </Avatar>
        <span className="text-lg font-semibold tracking-wide">
          {"\u{1F33A}"} Chaba AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 text-xs text-white/40">
        Powered by Chaba AI
      </div>
    </aside>
  );
}
