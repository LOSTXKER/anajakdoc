"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MessageCircle,
  History,
  Keyboard,
  GitBranch,
  Bell,
  Smartphone,
} from "lucide-react";

// Feature updates - update this list when new features are released
const FEATURE_UPDATES = [
  {
    version: "2.0",
    date: "2026-01",
    features: [
      {
        icon: MessageCircle,
        title: "ระบบ Comment ใหม่",
        description: "ตอบกลับ comment ได้ และ @mention ผู้ใช้",
      },
      {
        icon: History,
        title: "ประวัติกิจกรรม",
        description: "ดู timeline ทุกการเปลี่ยนแปลงของกล่องเอกสาร",
      },
      {
        icon: Keyboard,
        title: "Keyboard Shortcuts",
        description: "กด ? เพื่อดู shortcuts ทั้งหมด",
      },
      {
        icon: GitBranch,
        title: "Approval Workflow",
        description: "กำหนด workflow อนุมัติแบบ custom ได้เอง",
      },
      {
        icon: Bell,
        title: "Notification Center",
        description: "หน้ารวมการแจ้งเตือนพร้อม filter",
      },
      {
        icon: Smartphone,
        title: "Thai OCR Enhancement",
        description: "รองรับ PromptPay Slip, e-Tax Invoice, บัตรประชาชน",
      },
    ],
  },
];

const STORAGE_KEY = "anajakdoc_whats_new_seen";

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const latestVersion = FEATURE_UPDATES[0].version;

  useEffect(() => {
    // Check if user has seen this version
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (seenVersion !== latestVersion) {
      // Show modal after a short delay
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [latestVersion]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, latestVersion);
    setOpen(false);
  };

  const currentUpdate = FEATURE_UPDATES[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            มีอะไรใหม่
            <Badge variant="secondary">v{currentUpdate.version}</Badge>
          </DialogTitle>
          <DialogDescription>
            อัปเดตล่าสุด {currentUpdate.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentUpdate.features.map((feature, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>เข้าใจแล้ว</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
