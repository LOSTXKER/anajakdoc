"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Plus,
  CheckSquare,
  User,
} from "lucide-react";

const navItems = [
  { 
    icon: LayoutDashboard, 
    label: "หน้าหลัก", 
    href: "/dashboard",
    activeMatch: ["/dashboard"],
  },
  { 
    icon: Package, 
    label: "เอกสาร", 
    href: "/documents",
    activeMatch: ["/documents"],
  },
  { 
    icon: Plus, 
    label: "สร้าง", 
    href: "/documents/new",
    isCenter: true,
    activeMatch: ["/documents/new"],
  },
  { 
    icon: CheckSquare, 
    label: "งาน", 
    href: "/wht-tracking",
    activeMatch: ["/wht-tracking", "/export", "/reports"],
  },
  { 
    icon: User, 
    label: "โปรไฟล์", 
    href: "/settings",
    activeMatch: ["/settings", "/profile"],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) => {
    return item.activeMatch.some(match => 
      pathname === match || pathname.startsWith(`${match}/`)
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center -mt-4"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-colors">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                active && "text-primary"
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
