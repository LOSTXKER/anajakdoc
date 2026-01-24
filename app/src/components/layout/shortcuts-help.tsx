"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, Command, Search, Plus, X, HelpCircle } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: React.ElementType;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "ทั่วไป",
    shortcuts: [
      { keys: ["?"], description: "เปิดหน้าช่วยเหลือ Shortcuts", icon: HelpCircle },
      { keys: ["⌘", "K"], description: "เปิด Command Palette / ค้นหา", icon: Search },
      { keys: ["Esc"], description: "ปิด Modal / Dialog", icon: X },
    ],
  },
  {
    title: "เอกสาร",
    shortcuts: [
      { keys: ["N"], description: "สร้างกล่องใหม่ (ใน /documents)", icon: Plus },
      { keys: ["⌘", "Enter"], description: "ส่งฟอร์ม / บันทึก" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "ไปหน้า Dashboard" },
      { keys: ["G", "E"], description: "ไปหน้าเอกสาร" },
      { keys: ["G", "S"], description: "ไปหน้าตั้งค่า" },
    ],
  },
];

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="text-muted-foreground mx-0.5">+</span>}
          <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-sm">
            {key === "⌘" ? (
              <Command className="h-3 w-3" />
            ) : (
              key
            )}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // ? key opens shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }

      // Navigation shortcuts (g + key)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        // Wait for next key
        const handleSecondKey = (e2: KeyboardEvent) => {
          window.removeEventListener("keydown", handleSecondKey);
          
          if (e2.key === "d") {
            e2.preventDefault();
            window.location.href = "/dashboard";
          } else if (e2.key === "e") {
            e2.preventDefault();
            window.location.href = "/documents";
          } else if (e2.key === "s") {
            e2.preventDefault();
            window.location.href = "/settings";
          }
        };
        
        setTimeout(() => {
          window.addEventListener("keydown", handleSecondKey, { once: true });
          // Timeout for second key
          setTimeout(() => {
            window.removeEventListener("keydown", handleSecondKey);
          }, 1000);
        }, 0);
      }

      // N key for new document (only on documents page)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && window.location.pathname === "/documents") {
        e.preventDefault();
        window.location.href = "/documents/new";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            คีย์ลัด (Keyboard Shortcuts)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm flex items-center gap-2">
                      {shortcut.icon && (
                        <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {shortcut.description}
                    </span>
                    <KeyCombo keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            กด <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">?</kbd> อีกครั้งเพื่อปิด
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
