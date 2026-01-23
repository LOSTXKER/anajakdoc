"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Package,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Search,
  Plus,
  Receipt,
  Download,
  BarChart3,
  Building2,
  Calendar,
  Tags,
} from "lucide-react";

const navigationItems = [
  {
    group: "หน้าหลัก",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Package, label: "เอกสาร", href: "/documents" },
      { icon: Search, label: "ค้นหา", href: "/search" },
    ],
  },
  {
    group: "งานบัญชี",
    items: [
      { icon: Receipt, label: "ติดตาม WHT", href: "/wht-tracking" },
      { icon: Download, label: "Export", href: "/export" },
      { icon: BarChart3, label: "รายงาน", href: "/reports" },
    ],
  },
  {
    group: "ตั้งค่า",
    items: [
      { icon: Building2, label: "องค์กร", href: "/settings" },
      { icon: Users, label: "สมาชิก", href: "/settings/members" },
      { icon: Tags, label: "หมวดหมู่", href: "/settings/categories" },
      { icon: Calendar, label: "งวดบัญชี", href: "/settings/fiscal-periods" },
    ],
  },
];

const quickActions = [
  { icon: Plus, label: "สร้างกล่องใหม่", href: "/documents/new" },
  { icon: FileText, label: "สร้างรายจ่าย", href: "/documents/new?type=expense" },
  { icon: FileText, label: "สร้างรายรับ", href: "/documents/new?type=income" },
];

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">ค้นหา...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ค้นหาหน้าหรือคำสั่ง..." />
        <CommandList>
          <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
          
          {/* Quick Actions */}
          <CommandGroup heading="ทำงานด่วน">
            {quickActions.map((action) => (
              <CommandItem
                key={action.href}
                onSelect={() => handleSelect(action.href)}
                className="gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Navigation */}
          {navigationItems.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
