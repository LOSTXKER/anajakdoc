"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          <span className="sr-only">เปลี่ยนธีม</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          สว่าง
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          มืด
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          ตามระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for sidebar
export function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  if (!mounted) {
    return (
      <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full">
        <Sun className="h-4 w-4" />
        <span>ธีม</span>
      </button>
    );
  }

  return (
    <button 
      onClick={cycleTheme}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
      <span>
        {theme === "dark" ? "มืด" : theme === "light" ? "สว่าง" : "ตามระบบ"}
      </span>
    </button>
  );
}
