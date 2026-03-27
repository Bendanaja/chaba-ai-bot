"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "ผู้ใช้", icon: Users },
  { href: "/dashboard/transactions", label: "รายการ", icon: Receipt },
  { href: "/dashboard/tasks", label: "งาน", icon: ClipboardList },
  { href: "/dashboard/invoices", label: "ใบเสร็จ", icon: FileText },
];

const settingsNavItems = [
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export function Sidebar({
  className,
  onLogout,
}: {
  className?: string;
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col sidebar-dark petal-overlay text-white",
        className
      )}
    >
      {/* Avatar + user info */}
      <div className="flex flex-col items-center pt-8 pb-6 px-5">
        <div className="avatar-glow mb-3">
          <Avatar size="lg" className="size-16">
            <AvatarImage src="/chaba-mascot.jpg" alt="Chaba mascot" />
            <AvatarFallback className="bg-pink-300 text-white text-lg font-semibold">
              Ch
            </AvatarFallback>
          </Avatar>
        </div>
        <span className="text-base font-semibold tracking-wide brand-gradient-text">
          Chaba AI
        </span>
        <span className="text-[11px] font-light text-white/50 tracking-wide mt-0.5">
          Admin Dashboard
        </span>
      </div>

      {/* Divider */}
      <div className="divider-chaba" />

      {/* Main navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1 chaba-scrollbar overflow-y-auto">
        <p className="px-4 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/40">
          เมนูหลัก
        </p>
        {mainNavItems.map((item, index) => {
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
                  ? "active nav-active-pill text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <item.icon className="nav-icon size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Settings section */}
        <div className="pt-4">
          <p className="px-4 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/40">
            ตั้งค่า
          </p>
          {settingsNavItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item-chaba nav-enter flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "active nav-active-pill text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
              >
                <item.icon className="nav-icon size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Log Out button */}
      <div className="px-3 pb-4 pt-2">
        <div className="divider-chaba mb-3" />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#D63384] hover:bg-[#D63384]/10 transition-all duration-200"
        >
          <LogOut className="size-5 shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
