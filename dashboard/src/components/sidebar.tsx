"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Sparkles,
  FileText,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 / Users", icon: Users },
  { href: "/dashboard/transactions", label: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 / Transactions", icon: Receipt },
  { href: "/dashboard/invoices", label: "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 / Invoices", icon: FileText },
  { href: "/dashboard/tasks", label: "\u0E07\u0E32\u0E19 / Tasks", icon: Sparkles },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col glass-sidebar petal-overlay text-white",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="avatar-glow">
          <Avatar size="lg">
            <AvatarImage src="/chaba-mascot.jpg" alt="Chaba mascot" />
            <AvatarFallback className="bg-pink-300 text-white text-sm font-semibold">
              Ch
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-wide brand-gradient-text">
            Chaba AI
          </span>
          <span className="text-[10px] font-light text-white/50 tracking-widest uppercase">
            Admin Dashboard
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-chaba" />

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-3 space-y-1">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item-chaba nav-enter flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "active nav-active-glass text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <item.icon className="nav-icon size-5 shrink-0" />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-chaba-gold animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="divider-chaba" />
      <div className="px-5 py-4 flex items-center gap-2">
        <span className="text-[11px] text-white/30 font-light">
          Powered by
        </span>
        <span className="text-[11px] gold-shimmer font-medium">
          Chaba AI
        </span>
      </div>
    </aside>
  );
}
